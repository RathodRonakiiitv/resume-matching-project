"""
Resume Job Matcher Backend
"""
from dotenv import load_dotenv
load_dotenv()   # MUST be first

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2

from matcher import ResumeJobMatcher
from models import db, AnalysisResult

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resumes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

matcher = ResumeJobMatcher()


def extract_text_from_pdf(pdf_file):
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception:
        return ""


@app.route('/api/analyze', methods=['POST'])
def analyze_resume():

    # 1. GET FILE
    if not request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file_key = next(iter(request.files))
    uploaded_file = request.files[file_key]

    # 2. GET JOB DESCRIPTION
    job_text = request.form.get('job_description', '').strip()
    if not job_text:
        return jsonify({'error': 'Missing job description'}), 400

    # 3. READ RESUME TEXT
    if uploaded_file.filename.endswith('.pdf'):
        resume_text = extract_text_from_pdf(uploaded_file)
    else:
        resume_text = uploaded_file.read().decode('utf-8', errors='ignore')

    if not resume_text.strip():
        return jsonify({
            'error': 'Could not read resume text (scanned image?)'
        }), 400

    # 4. ANALYZE
    try:
        results = matcher.analyze(resume_text, job_text)

        # Save history
        scan = AnalysisResult(
            filename=uploaded_file.filename,
            match_score=results['matchScore'],
            matched_skills=",".join(results['matchedSkills']),
            missing_skills=",".join(results['missingSkills'])
        )
        db.session.add(scan)
        db.session.commit()

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    scans = AnalysisResult.query.order_by(
        AnalysisResult.timestamp.desc()
    ).limit(10).all()

    return jsonify([scan.to_dict() for scan in scans]), 200


if __name__ == '__main__':
    print("🚀 Server running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
