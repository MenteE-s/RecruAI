"""
Background task scheduler for interview status updates
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit


scheduler = BackgroundScheduler()


def init_scheduler(app):
    """Initialize and start the background scheduler with app context"""
    def update_interviews_with_context():
        """Wrapper function to run interview updates within app context"""
        with app.app_context():
            try:
                from backend.utils.interview_utils import update_expired_interviews
                update_expired_interviews()
            except Exception as e:
                print(f"Error in scheduled interview update: {e}")

    # Add job to check for expired interviews every 5 minutes
    scheduler.add_job(
        func=update_interviews_with_context,
        trigger=IntervalTrigger(minutes=5),
        id='update_expired_interviews',
        name='Update expired interviews to completed status',
        replace_existing=True
    )

    # Start the scheduler
    scheduler.start()

    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())

    print("Background scheduler initialized with interview status update job")


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        print("Background scheduler shut down")