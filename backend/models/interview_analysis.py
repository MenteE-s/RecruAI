from datetime import datetime

from backend.extensions import db


class InterviewAnalysis(db.Model):
    __tablename__ = "interview_analyses"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)

    # Performance scores (0-100 scale)
    overall_score = db.Column(db.Float, nullable=True)  # Overall interview performance
    communication_score = db.Column(db.Float, nullable=True)  # Communication skills
    technical_score = db.Column(db.Float, nullable=True)  # Technical knowledge
    problem_solving_score = db.Column(db.Float, nullable=True)  # Problem-solving ability
    cultural_fit_score = db.Column(db.Float, nullable=True)  # Cultural fit assessment

    # Qualitative feedback
    strengths = db.Column(db.Text, nullable=True)  # JSON array of strengths
    improvements = db.Column(db.Text, nullable=True)  # JSON array of areas for improvement
    detailed_feedback = db.Column(db.Text, nullable=True)  # Detailed interviewer feedback
    ai_analysis_summary = db.Column(db.Text, nullable=True)  # AI-generated analysis summary

    # Interview metrics
    actual_duration_minutes = db.Column(db.Integer, nullable=True)  # Actual interview duration
    average_response_time_seconds = db.Column(db.Float, nullable=True)  # Average response time
    question_count = db.Column(db.Integer, nullable=True)  # Number of questions asked

    # Metadata
    analyzed_by = db.Column(db.String(100), nullable=True)  # Who performed the analysis (AI/Human name)
    analysis_method = db.Column(db.String(50), nullable=True)  # 'ai', 'human', 'hybrid'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interview = db.relationship("Interview", backref="analysis")

    def __repr__(self):
        return f"<InterviewAnalysis {self.interview_id}>"

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "overall_score": self.overall_score,
            "communication_score": self.communication_score,
            "technical_score": self.technical_score,
            "problem_solving_score": self.problem_solving_score,
            "cultural_fit_score": self.cultural_fit_score,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "improvements": json.loads(self.improvements) if self.improvements else [],
            "detailed_feedback": self.detailed_feedback,
            "ai_analysis_summary": self.ai_analysis_summary,
            "actual_duration_minutes": self.actual_duration_minutes,
            "average_response_time_seconds": self.average_response_time_seconds,
            "question_count": self.question_count,
            "analyzed_by": self.analyzed_by,
            "analysis_method": self.analysis_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }