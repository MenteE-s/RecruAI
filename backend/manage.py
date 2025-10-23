"""Convenience script to run Flask CLI when working inside the repository.

Usage (PowerShell):
    python backend\manage.py run
    python backend\manage.py db init
    python backend\manage.py db migrate -m "msg"
    python backend\manage.py db upgrade
"""
from flask.cli import main


if __name__ == "__main__":
    # delegate to flask.cli.main which respects FLASK_APP when set
    main()
