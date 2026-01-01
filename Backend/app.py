"""
Resume Job Matcher Backend API
Flask server with ML/NLP endpoints + Database History
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import os
import sys

# --- RENDER/PRODUCTION PATH FIX ---
# This ensures that when running from the root directory, 
# 'Backend' is added to the python path so local imports work.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from matcher import ResumeJobMatcher
from skills_data import TECH_SKILLS
from models import db, AnalysisResult

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resumes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create DB tables
with app.app_context():
    db.create_all()

# Initialize matcher
matcher = ResumeJobMatcher()

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        # Return empty string or handle error gracefully
        return ""

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    """Main endpoint for single resume analysis"""
    try:
        if 'resume_file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
            
        resume_file = request.files['resume_file']
        job_text = request.form.get('job_description', '')
        
        if resume_file.filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        else:
            resume_text = resume_file.read().decode('utf-8')
            
        if not resume_text or not job_text:
            return jsonify({'error': 'Missing text content'}), 400
        
        # Perform Analysis
        results = matcher.analyze(resume_text, job_text)
        
        # Save to History
        try:
            new_scan = AnalysisResult(
                filename=resume_file.filename,
                job_role="Software Engineer", # You can extract this from JD later
                match_score=results['matchScore'],
                matched_skills=",".join(results['matchedSkills']),
                missing_skills=",".join(results['missingSkills']),
                experience_level=results.get('experienceLevel'),
                tone=results.get('tone')
            )
            db.session.add(new_scan)
            db.session.commit()

        except Exception as db_err:
            print(f"Database Error: {db_err}")

        return jsonify(results), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rank', methods=['POST'])
def rank_resumes():
    """
    Bulk Analysis Endpoint
    Accepts multiple resumes and one JD. Returns ranked list.
    """
    try:
        if 'resumes' not in request.files:
            return jsonify({'error': 'No resumes uploaded'}), 400
            
        files = request.files.getlist('resumes')
        job_text = request.form.get('job_description', '')
        
        ranked_results = []
        
        for file in files:
            # Extract Text
            if file.filename.endswith('.pdf'):
                text = extract_text_from_pdf(file)
            else:
                text = file.read().decode('utf-8')
            
            if text:
                # Analyze
                analysis = matcher.analyze(text, job_text)
                ranked_results.append({
                    'filename': file.filename,
                    'score': analysis['matchScore'],
                    'missing_skills_count': len(analysis['missingSkills']),
                    'matched_skills_count': len(analysis['matchedSkills'])
                })
        
        # Sort by Score (Descending)
        ranked_results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({'ranking': ranked_results}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Fetch past analysis results"""
    try:
        scans = AnalysisResult.query.order_by(AnalysisResult.timestamp.desc()).limit(10).all()
        return jsonify([scan.to_dict() for scan in scans]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills_list():
    return jsonify({'skills': sorted([skill.title() for skill in TECH_SKILLS])}), 200

@app.route("/", methods=["GET"])
def home():
    return {
        "status": "Resume Intelligence API is running",
        "endpoints": [
            "/api/analyze (POST)",
            "/api/rank (POST)",
            "/api/history (GET)",
            "/api/skills (GET)"
        ]
    }


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)