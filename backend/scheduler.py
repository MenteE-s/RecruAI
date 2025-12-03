"""
Background task scheduler for interview status updates
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from backend.utils.interview_utils import update_expired_interviews
import atexit


scheduler = BackgroundScheduler()


def init_scheduler():
    """Initialize and start the background scheduler"""
    # Add job to check for expired interviews every 5 minutes
    scheduler.add_job(
        func=update_expired_interviews,
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