"""
Resume Job Matcher Backend API
Flask server with ML/NLP scoring + Groq AI suggestions
"""

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import os
import json
import sys

# --- RENDER/PRODUCTION PATH FIX ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from matcher import ResumeJobMatcher
from skills_data import TECH_SKILLS
from models import db, AnalysisResult

from groq import Groq


# -------------------- APP SETUP --------------------

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resumes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

matcher = ResumeJobMatcher()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# -------------------- HELPERS --------------------

def extract_text_from_pdf(pdf_file):
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
        return text
    except Exception:
        return ""


def generate_ai_recommendations(resume_text, job_text, analysis):
    """
    Uses Groq ONLY for resume suggestions
    """
    prompt = f"""
You are a professional resume coach.

Using the resume, job description, and analysis results,
give 4–6 concise, actionable resume improvement suggestions.

Focus on:
- Missing skills
- Missing sections
- Keyword optimization
- ATS friendliness

Return ONLY a JSON array of strings.

ANALYSIS:
Match Score: {analysis['matchScore']}
Matched Skills: {analysis['matchedSkills']}
Missing Skills: {analysis['missingSkills']}
Missing Sections: {analysis.get('missingSections', [])}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_text}
"""

    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        temperature=0.4,
        messages=[{"role": "user", "content": prompt}]
    )

    return json.loads(response.choices[0].message.content)


# -------------------- ROUTES --------------------

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    try:
        if 'resume_file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        resume_file = request.files['resume_file']
        job_text = request.form.get('job_description', '').strip()

        if resume_file.filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        else:
            resume_text = resume_file.read().decode('utf-8', errors='ignore')

        if not resume_text or not job_text:
            return jsonify({'error': 'Missing text content'}), 400

        # -------- ML ANALYSIS --------
        results = matcher.analyze(resume_text, job_text)

        # -------- GROQ SUGGESTIONS --------
        try:
            ai_recs = generate_ai_recommendations(
                resume_text, job_text, results
            )
            results['recommendations'] = ai_recs
        except Exception as e:
            print("Groq error:", e)

        # -------- SAVE HISTORY --------
        try:
            scan = AnalysisResult(
                filename=resume_file.filename,
                job_role="Software Engineer",
                match_score=results['matchScore'],
                matched_skills=",".join(results['matchedSkills']),
                missing_skills=",".join(results['missingSkills'])
            )
            db.session.add(scan)
            db.session.commit()
        except Exception as db_err:
            print("DB Error:", db_err)

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/rank', methods=['POST'])
def rank_resumes():
    try:
        if 'resumes' not in request.files:
            return jsonify({'error': 'No resumes uploaded'}), 400

        files = request.files.getlist('resumes')
        job_text = request.form.get('job_description', '')

        ranked_results = []

        for file in files:
            if file.filename.endswith('.pdf'):
                text = extract_text_from_pdf(file)
            else:
                text = file.read().decode('utf-8', errors='ignore')

            if text:
                analysis = matcher.analyze(text, job_text)
                ranked_results.append({
                    'filename': file.filename,
                    'score': analysis['matchScore'],
                    'matched_skills_count': len(analysis['matchedSkills']),
                    'missing_skills_count': len(analysis['missingSkills'])
                })

        ranked_results.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'ranking': ranked_results}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        scans = AnalysisResult.query.order_by(
            AnalysisResult.timestamp.desc()
        ).limit(10).all()

        return jsonify([scan.to_dict() for scan in scans]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/skills', methods=['GET'])
def get_skills_list():
    return jsonify({
        'skills': sorted([skill.title() for skill in TECH_SKILLS])
    }), 200


# -------------------- RUN --------------------

if __name__ == '__main__':
    print("🚀 Server running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
