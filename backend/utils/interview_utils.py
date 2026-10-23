"""
Interview utilities for managing interview lifecycle and status updates
"""

from datetime import datetime, timezone, timedelta
import logging

from sqlalchemy import text

from ..extensions import db
from ..models import Interview, Application, InterviewDecisionHistory

logger = logging.getLogger(__name__)


def _update_expired_interviews_postgres(limit: int, now: datetime) -> int:
    """Bulk-complete ended interviews in one bounded statement.

    ``scheduled_at <= now`` alone is not enough: a 5-hour interview is not over
    an hour after it starts. The database computes the end time so the worker
    does not have to load a million rows. ``FOR UPDATE SKIP LOCKED`` prevents two
    scheduler processes from selecting the same batch.
    """
    ids = db.session.execute(
        text(
            """
            SELECT id
              FROM interviews
             WHERE status IN ('scheduled', 'in_progress')
               AND scheduled_at + make_interval(mins => COALESCE(duration_minutes, 60)) <= :now
             ORDER BY scheduled_at ASC
             LIMIT :limit
             FOR UPDATE SKIP LOCKED
            """
        ),
        {"now": now, "limit": limit},
    ).scalars().all()
    if not ids:
        db.session.rollback()
        return 0

    result = db.session.execute(
        text(
            """
            UPDATE interviews
               SET status = 'completed',
                   completed_at = :now,
                   round_status = 'completed',
                   updated_at = :now
             WHERE id = ANY(:ids)
            """
        ),
        {"now": now, "ids": list(ids)},
    )
    db.session.commit()
    return int(result.rowcount or 0)


def _update_expired_interviews_fallback(limit: int, now: datetime) -> int:
    """ORM path for non-PostgreSQL development databases."""
    rows = (
        Interview.query
        .filter(
            Interview.status.in_(["scheduled", "in_progress"]),
            Interview.scheduled_at <= now,
        )
        .order_by(Interview.scheduled_at.asc())
        .limit(limit)
        .all()
    )
    updated = 0
    for interview in rows:
        if interview.scheduled_at + timedelta(minutes=interview.duration_minutes or 60) <= now:
            interview.status = "completed"
            interview.completed_at = now
            interview.round_status = "completed"
            updated += 1
    if updated:
        db.session.commit()
    else:
        db.session.rollback()
    return updated


def update_expired_interviews(limit: int = 1000):
    """Complete interviews whose scheduled end time has passed.

    Returns the number of rows updated. Safe to call repeatedly and safe to run
    from more than one worker: the PostgreSQL path locks each selected batch and
    only transitions rows still in ``scheduled``/``in_progress``.
    """
    limit = max(1, min(int(limit or 1000), 5000))
    now = datetime.utcnow()
    try:
        if db.engine.dialect.name == "postgresql":
            updated = _update_expired_interviews_postgres(limit, now)
        else:
            updated = _update_expired_interviews_fallback(limit, now)
        if updated:
            logger.info("completed %s expired interviews", updated)
        return updated
    except Exception:
        db.session.rollback()
        logger.exception("failed to update expired interviews")
        raise


def is_overdue(interview, now=None):
    """True when a scheduled/in-progress interview's end time has passed.

    DB datetimes are naive UTC: the comparison stays naive-naive.
    """
    if not interview or not interview.scheduled_at:
        return False
    if interview.status not in ('scheduled', 'in_progress'):
        return False
    now = now or datetime.utcnow()
    duration = interview.duration_minutes or 60
    return now >= interview.scheduled_at + timedelta(minutes=duration)


def complete_overdue_interview(interview):
    """Transition a single overdue interview to completed (no commit).

    Returns True when transitioned. Idempotent: callers commit. This is the
    safety net behind the (currently disabled) background scheduler, applied
    lazily on reads so stuck interviews can't stay 'in_progress' forever.
    """
    if not is_overdue(interview):
        return False
    now = datetime.utcnow()
    interview.status = 'completed'
    interview.completed_at = now
    interview.round_status = 'completed'
    return True


def complete_overdue_interviews(interviews):
    """Transition all overdue interviews in an iterable. Returns count (no commit)."""
    count = 0
    try:
        for interview in interviews or []:
            if complete_overdue_interview(interview):
                count += 1
    except TypeError:
        pass
    return count


def update_interview_decision(interview_id, decision, feedback=None, rating=None):
    """
    Update interview decision and related fields.

    Multi-round logic:
    - 'passed': Candidate passed final round, hiring process complete
    - 'failed': Candidate did not pass, process ends
    - 'second_round': Candidate passed round 1, schedule round 2
    - 'third_round': Candidate passed round 2, schedule round 3

    Args:
        interview_id: Interview ID
        decision: 'passed', 'failed', 'second_round', 'third_round'
        feedback: Optional feedback text
        rating: Optional rating (1-5)
    """
    try:
        interview = Interview.query.get(interview_id)
        if not interview:
            return False, "Interview not found"

        # Organizations can make decisions on interviews regardless of current status
        # This allows decisions to be made on scheduled, completed, or cancelled interviews

        # Update decision
        interview.final_decision = decision

        # Record decision in history before updating current state
        decision_history = InterviewDecisionHistory(
            interview_id=interview_id,
            round_number=interview.current_round or 1,
            decision=decision,
            feedback=feedback,
            rating=rating,
            decided_at=datetime.utcnow()
        )
        db.session.add(decision_history)

        # Emit Kafka event for interview decision
        try:
            from .kafka_service import KafkaService
            kafka = KafkaService()
            kafka.emit_event('interview_decision', {
                'interview_id': interview.id,
                'decision': decision,
                'round': interview.current_round or 1,
                'user_id': interview.user_id,
                'organization_id': interview.organization_id,
                'feedback': feedback,
                'rating': rating
            })
        except Exception as e:
            print(f"Failed to emit Kafka message: {e}")

        # Initialize round fields if this is the first decision
        if interview.current_round is None:
            interview.current_round = 1
        if interview.max_rounds is None:
            interview.max_rounds = 3  # Default to 3 rounds

        # Set completed_at if not already set
        if interview.completed_at is None:
            interview.completed_at = datetime.utcnow()

        # Update round status and current_round based on decision
        if decision == 'passed':
            # Final pass - candidate is hired
            interview.round_status = 'passed'
            interview.status = 'completed'
        elif decision == 'failed':
            # Candidate did not pass
            interview.round_status = 'failed'
            interview.status = 'completed'
        elif decision == 'second_round':
            # Passed round 1, moving to round 2
            interview.round_status = 'passed'
            interview.current_round = 2
            # Reset status to scheduled for the next round
            interview.status = 'scheduled'
            interview.completed_at = None  # Clear so it can be scheduled again

            # Add round transition message to conversation
            from ..models import ConversationMessage, AIInterviewAgent
            
            # Resolve agent ID
            agent_id = interview.ai_agent_id
            if not agent_id and interview.organization_id:
                # Try to get organization default agent
                default_agent = AIInterviewAgent.query.filter_by(
                    organization_id=interview.organization_id, 
                    is_active=True
                ).first()
                if default_agent:
                    agent_id = default_agent.id
            
            if agent_id:
                round_transition = ConversationMessage(
                    interview_id=interview_id,
                    sender_type='agent',
                    sender_agent_id=agent_id,
                    content=f"--- ROUND 1 COMPLETED: Candidate advanced to Round 2 ---\n\nWelcome to Round 2! Based on your performance in Round 1, you've been selected to continue the interview process. Let's dive deeper into your experience and skills.",
                    created_at=datetime.utcnow()
                )
                db.session.add(round_transition)
            else:
                print(f"Warning: Could not add transition message for interview {interview_id} - no agent found")
        elif decision == 'third_round':
            # Passed round 2, moving to round 3
            interview.round_status = 'passed'
            interview.current_round = 3
            # Reset status to scheduled for the next round
            interview.status = 'scheduled'
            interview.completed_at = None  # Clear so it can be scheduled again

            # Add round transition message to conversation
            from ..models import ConversationMessage, AIInterviewAgent
            
            # Resolve agent ID
            agent_id = interview.ai_agent_id
            if not agent_id and interview.organization_id:
                # Try to get organization default agent
                default_agent = AIInterviewAgent.query.filter_by(
                    organization_id=interview.organization_id, 
                    is_active=True
                ).first()
                if default_agent:
                    agent_id = default_agent.id
            
            if agent_id:
                round_transition = ConversationMessage(
                    interview_id=interview_id,
                    sender_type='agent',
                    sender_agent_id=agent_id,
                    content=f"--- ROUND 2 COMPLETED: Candidate advanced to Round 3 ---\n\nCongratulations on advancing to Round 3! This is the final round of our interview process. Let's explore your technical expertise and problem-solving abilities in more detail.",
                    created_at=datetime.utcnow()
                )
                db.session.add(round_transition)
            else:
                print(f"Warning: Could not add transition message for interview {interview_id} - no agent found")

        # Update feedback and rating if provided
        if feedback is not None:
            interview.feedback = feedback
        if rating is not None:
            interview.rating = rating

        interview.updated_at = datetime.utcnow()
        db.session.commit()

        # If candidate passed the final interview, update the application status
        if decision == 'passed' and interview.post_id:
            # Find the application for this user and post
            application = Application.query.filter_by(
                user_id=interview.user_id,
                post_id=interview.post_id
            ).first()
            print(f"Application for user {interview.user_id}, post {interview.post_id}: {'found' if application else 'not found'}")
            
            if not application:
                # Create application if it doesn't exist
                application = Application(
                    user_id=interview.user_id,
                    post_id=interview.post_id,
                    pipeline_stage='applied'
                )
                db.session.add(application)
                db.session.commit()
            
            if application:
                application.pipeline_stage = 'hired'
                application.status = 'accepted'
                db.session.commit()

            # Update user's employment status
            user = interview.user
            if user:
                user.employment_status = 'hired'
                user.current_position = interview.post.title if interview.post else interview.title
                user.current_company = interview.organization.name if interview.organization else None
                user.current_company_id = interview.organization_id
                user.hired_date = datetime.utcnow()
                db.session.commit()

        # Build appropriate message
        success_msg = ""
        if decision in ['second_round', 'third_round']:
            round_num = 2 if decision == 'second_round' else 3
            success_msg = f"Candidate advanced to round {round_num}. Please schedule the next interview."
        elif decision == 'passed':
            success_msg = "Candidate has passed! Ready for offer."
        else:
            success_msg = "Interview decision recorded."

        # Emit Kafka event for the decision
        try:
            from .kafka_service import emit_event
            emit_event(
                topic='interview_decisions',
                event_type='decision_updated',
                data={
                    'interview_id': interview.id,
                    'decision': decision,
                    'candidate_id': interview.user_id,
                    'organization_id': interview.organization_id,
                    'round': interview.current_round,
                    'status': interview.status
                },
                key=str(interview.id)
            )
        except Exception as kafka_err:
            print(f"Non-critical: Failed to emit Kafka event: {kafka_err}")

        return True, success_msg

    except Exception as e:
        db.session.rollback()
        return False, f"Error updating interview decision: {str(e)}"


def get_interview_status_summary(organization_id=None):
    """
    Get summary of interview statuses for reporting

    Args:
        organization_id: Optional organization filter
    """
    try:
        query = Interview.query
        if organization_id:
            query = query.filter_by(organization_id=organization_id)

        total = query.count()
        scheduled = query.filter_by(status='scheduled').count()
        in_progress = query.filter_by(status='in_progress').count()
        completed = query.filter_by(status='completed').count()
        cancelled = query.filter_by(status='cancelled').count()
        no_show = query.filter_by(status='no_show').count()

        # Decision breakdown for completed interviews
        passed = query.filter_by(final_decision='passed').count()
        failed = query.filter_by(final_decision='failed').count()
        second_round = query.filter_by(final_decision='second_round').count()
        third_round = query.filter_by(final_decision='third_round').count()

        return {
            'total': total,
            'by_status': {
                'scheduled': scheduled,
                'in_progress': in_progress,
                'completed': completed,
                'cancelled': cancelled,
                'no_show': no_show
            },
            'by_decision': {
                'passed': passed,
                'failed': failed,
                'second_round': second_round,
                'third_round': third_round
            }
        }

    except Exception as e:
        print(f"Error getting interview status summary: {e}")
        return None