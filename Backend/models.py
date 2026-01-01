"""
Database Models
Defines the structure for storing analysis history
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class AnalysisResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    job_role = db.Column(db.String(100))  # Extracted or inputs
    match_score = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Store lists as comma-separated strings for simplicity in SQLite
    matched_skills = db.Column(db.Text) 
    missing_skills = db.Column(db.Text)
    experience_level = db.Column(db.String(50))
    tone = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'job_role': self.job_role,
            'match_score': self.match_score,
            'timestamp': self.timestamp.isoformat(),
            'experience_level': self.experience_level,
            'tone': self.tone,
            'matched_skills': self.matched_skills.split(',') if self.matched_skills else [],
            'missing_skills': self.missing_skills.split(',') if self.missing_skills else []
        }
