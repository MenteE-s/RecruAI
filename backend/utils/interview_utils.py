"""
Interview utilities for managing interview lifecycle and status updates
"""

from datetime import datetime, timezone, timedelta
from ..extensions import db
from ..models import Interview, Application, InterviewDecisionHistory


def update_expired_interviews():
    """
    Check for interviews that have expired and update their status to 'completed'.
    This should be called periodically (e.g., every 5 minutes) via a background task.
    """
    try:
        current_time = datetime.utcnow()

        # Find interviews that are scheduled or in_progress and have expired
        expired_interviews = Interview.query.filter(
            Interview.status.in_(['scheduled', 'in_progress']),
            Interview.scheduled_at <= current_time
        ).all()

        updated_count = 0
        for interview in expired_interviews:
            # Calculate if interview time has actually expired (scheduled_time + duration)
            interview_end_time = interview.scheduled_at.replace(tzinfo=timezone.utc) + \
                               timedelta(minutes=interview.duration_minutes)

            if current_time >= interview_end_time:
                # Update interview status
                interview.status = 'completed'
                interview.completed_at = current_time
                interview.round_status = 'completed'
                updated_count += 1

                print(f"Updated interview {interview.id} status to completed (expired)")

        if updated_count > 0:
            db.session.commit()
            print(f"Updated {updated_count} expired interviews to completed status")

        return updated_count

    except Exception as e:
        print(f"Error updating expired interviews: {e}")
        db.session.rollback()
        return 0


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
            from ..models import ConversationMessage
            round_transition = ConversationMessage(
                interview_id=interview_id,
                sender_type='agent',
                sender_agent_id=interview.ai_agent_id,
                content=f"--- ROUND 1 COMPLETED: Candidate advanced to Round 2 ---\n\nWelcome to Round 2! Based on your performance in Round 1, you've been selected to continue the interview process. Let's dive deeper into your experience and skills.",
                created_at=datetime.utcnow()
            )
            db.session.add(round_transition)
        elif decision == 'third_round':
            # Passed round 2, moving to round 3
            interview.round_status = 'passed'
            interview.current_round = 3
            # Reset status to scheduled for the next round
            interview.status = 'scheduled'
            interview.completed_at = None  # Clear so it can be scheduled again

            # Add round transition message to conversation
            from ..models import ConversationMessage
            round_transition = ConversationMessage(
                interview_id=interview_id,
                sender_type='agent',
                sender_agent_id=interview.ai_agent_id,
                content=f"--- ROUND 2 COMPLETED: Candidate advanced to Round 3 ---\n\nCongratulations on advancing to Round 3! This is the final round of our interview process. Let's explore your technical expertise and problem-solving abilities in more detail.",
                created_at=datetime.utcnow()
            )
            db.session.add(round_transition)

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

        # Build appropriate message
        if decision in ['second_round', 'third_round']:
            round_num = 2 if decision == 'second_round' else 3
            return True, f"Candidate advanced to round {round_num}. Please schedule the next interview."
        elif decision == 'passed':
            return True, "Candidate has passed! Ready for offer."
        else:
            return True, "Interview decision recorded."

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