#!/usr/bin/env python3
"""
Flask command to initialize pipeline stages for existing applications.
Run with: flask init-pipeline-stages
"""

import click
from flask import current_app
from extensions import db
from models import Application

def init_pipeline_stages():
    """Initialize pipeline stages for existing applications"""
    # Get all applications that don't have a pipeline stage set
    applications = Application.query.filter(
        db.or_(
            Application.pipeline_stage.is_(None),
            Application.pipeline_stage == ""
        )
    ).all()

    click.echo(f"Found {len(applications)} applications without pipeline stages")

    for application in applications:
        application.pipeline_stage = "applied"
        click.echo(f"Setting pipeline stage to 'applied' for application {application.id}")

    # Commit all changes
    db.session.commit()
    click.echo(f"Successfully initialized {len(applications)} applications with 'applied' stage")

@current_app.cli.command("init-pipeline-stages")
def init_pipeline_stages_command():
    """Initialize pipeline stages for existing applications"""
    init_pipeline_stages()