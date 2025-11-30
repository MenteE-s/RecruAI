"""
Interview utilities for managing interview lifecycle and status updates
"""

from datetime import datetime, timezone, timedelta
from backend.extensions import db
from backend.models import Interview


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
    Update interview decision and related fields

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

        # Initialize round fields if this is the first decision
        if interview.current_round is None:
            interview.current_round = 1
        if interview.max_rounds is None:
            interview.max_rounds = 3  # Default to 3 rounds

        # Set completed_at if not already set
        if interview.completed_at is None:
            interview.completed_at = datetime.utcnow()

        # Update round status based on decision
        if decision == 'passed':
            interview.round_status = 'passed'
        elif decision == 'failed':
            interview.round_status = 'failed'
        elif decision in ['second_round', 'third_round']:
            interview.round_status = 'passed'  # Passed current round, moving to next
            interview.current_round += 1

        # Update feedback and rating if provided
        if feedback is not None:
            interview.feedback = feedback
        if rating is not None:
            interview.rating = rating

        interview.updated_at = datetime.utcnow()
        db.session.commit()

        return True, f"Interview decision updated to {decision}"

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