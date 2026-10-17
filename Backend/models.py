"""
Database Models
Defines the structure for storing analysis history
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import inspect

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


def migrate_schema():
    """Add columns introduced after an existing SQLite database was created.

    ``db.create_all()`` creates missing tables, but it does not update tables
    that already exist. Keep this migration safe to run on every app startup.
    """
    engine = db.engine
    if engine.dialect.name != 'sqlite':
        return

    table_name = AnalysisResult.__tablename__
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
    new_columns = {
        'experience_level': 'VARCHAR(50)',
        'tone': 'VARCHAR(50)',
    }

    with engine.begin() as connection:
        for column_name, column_type in new_columns.items():
            if column_name not in existing_columns:
                connection.exec_driver_sql(
                    f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}'
                )
