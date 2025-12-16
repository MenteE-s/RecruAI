
from backend.extensions import db
from datetime import datetime, timezone


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)  # Interview duration in minutes
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)  # Associated job post

    def __init__(self, candidate_id=None, **kwargs):
        if candidate_id is not None:
            kwargs['user_id'] = candidate_id
        kwargs.pop('candidate_id', None)
        super().__init__(**kwargs)

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

    # Multi-round interview system
    current_round = db.Column(db.Integer, default=1)  # Current interview round (1, 2, 3)
    max_rounds = db.Column(db.Integer, default=3)  # Maximum rounds allowed
    round_status = db.Column(db.String(20), default="pending")  # 'pending', 'passed', 'failed', 'in_progress'
    final_decision = db.Column(db.String(20), nullable=True)  # 'passed', 'failed', 'second_round', 'third_round'
    completed_at = db.Column(db.DateTime, nullable=True)  # When interview was completed

    # Analysis and results
    analysis_data = db.Column(db.Text, nullable=True)  # JSON string with AI analysis
    strengths = db.Column(db.Text, nullable=True)  # JSON array of strengths
    improvements = db.Column(db.Text, nullable=True)  # JSON array of areas for improvement

    # Interviewers (JSON array of user IDs or names)
    interviewers = db.Column(db.Text, nullable=True)

    # AI Interview Agent (optional - for AI-powered interviews)
    ai_agent_id = db.Column(db.Integer, db.ForeignKey("ai_interview_agents.id"), nullable=True)
    ai_agent = db.relationship("AIInterviewAgent", backref="interviews")

    # Practice AI Agent (optional - for practice interviews)
    practice_ai_agent_id = db.Column(db.Integer, db.ForeignKey("practice_ai_agents.id"), nullable=True)
    practice_ai_agent = db.relationship("PracticeAIAgent", backref="practice_interviews")

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
            "practice_ai_agent_id": self.practice_ai_agent_id,
            "practice_ai_agent": self.practice_ai_agent.to_dict() if self.practice_ai_agent else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # Multi-round fields
            "current_round": self.current_round,
            "max_rounds": self.max_rounds,
            "round_status": self.round_status,
            "final_decision": self.final_decision,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "decision_history": [dh.to_dict() for dh in self.decision_history] if self.decision_history else [],
            "analysis_data": self.analysis_data,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "improvements": json.loads(self.improvements) if self.improvements else [],
            "organization": self.organization.name if self.organization else None,
            "post_title": self.post.title if self.post else None,
            "user_name": self.user.name if self.user else None,
            # "analysis": self.analysis.to_dict() if self.analysis else None,  # Temporarily disabled
            "analysis": None,
        }