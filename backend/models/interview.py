from datetime import datetime, timezone

from backend.extensions import db


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)  # Interview duration in minutes
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)  # Associated job post

    # Interview details
    interview_type = db.Column(db.String(50), default="text")  # 'text', 'ai_video', 'human_video'
    location = db.Column(db.String(255), nullable=True)  # Physical location or meeting link
    meeting_link = db.Column(db.String(500), nullable=True)  # Zoom/Google Meet link (for legacy support)
    room_id = db.Column(db.String(100), nullable=True)  # Custom interview room ID
    room_password = db.Column(db.String(50), nullable=True)  # Room access password

    # Status and feedback
    status = db.Column(db.String(50), default="scheduled")  # 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
    feedback = db.Column(db.Text, nullable=True)  # Interview feedback/notes
    rating = db.Column(db.Integer, nullable=True)  # 1-5 rating

    # Multi-round interview system - temporarily commented out for database compatibility
    # current_round = db.Column(db.Integer, default=1)  # Current interview round (1, 2, 3)
    # max_rounds = db.Column(db.Integer, default=3)  # Maximum rounds allowed
    # round_status = db.Column(db.String(20), default="pending")  # 'pending', 'passed', 'failed', 'in_progress'
    # final_decision = db.Column(db.String(20), nullable=True)  # 'passed', 'failed', 'second_round', 'third_round'
    # completed_at = db.Column(db.DateTime, nullable=True)  # When interview was completed

    # Analysis and results - temporarily commented out for database compatibility
    # analysis_data = db.Column(db.Text, nullable=True)  # JSON string with AI analysis
    # strengths = db.Column(db.Text, nullable=True)  # JSON array of strengths
    # improvements = db.Column(db.Text, nullable=True)  # JSON array of areas for improvement

    # Interviewers (JSON array of user IDs or names)
    interviewers = db.Column(db.Text, nullable=True)

    # AI Interview Agent (optional - for AI-powered interviews)
    ai_agent_id = db.Column(db.Integer, db.ForeignKey("ai_agents.id"), nullable=True)
    ai_agent = db.relationship("AIAgent", backref="interviews")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="interviews")
    organization = db.relationship("Organization", backref="interviews")
    post = db.relationship("Post", backref="interviews")

    def __repr__(self):
        return f"<Interview {self.title}>"

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            # Use UTC-aware timestamp and ISO string to avoid local tz issues
            "scheduled_at": int(self.scheduled_at.replace(tzinfo=timezone.utc).timestamp() * 1000) if self.scheduled_at else None,
            # Provide ISO string in UTC (append 'Z') for timezone-aware clients
            "scheduled_at_iso": (self.scheduled_at.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')) if self.scheduled_at else None,
            "duration_minutes": self.duration_minutes,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "post_id": self.post_id,
            "interview_type": self.interview_type,
            "location": self.location,
            "meeting_link": self.meeting_link,
            "room_id": self.room_id,
            "room_password": self.room_password,
            "status": self.status,
            "feedback": self.feedback,
            "rating": self.rating,
            "interviewers": json.loads(self.interviewers) if self.interviewers else [],
            "ai_agent_id": self.ai_agent_id,
            "ai_agent": self.ai_agent.to_dict() if self.ai_agent else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # Multi-round fields temporarily disabled for database compatibility
            "current_round": 1,
            "max_rounds": 3,
            "round_status": 'pending',
            "final_decision": None,
            "completed_at": None,
            "analysis_data": None,
            "strengths": [],
            "improvements": [],
            "organization": self.organization.name if self.organization else None,
            "post_title": self.post.title if self.post else None,
            # "analysis": self.analysis.to_dict() if self.analysis else None,  # Temporarily disabled
            "analysis": None,
        }