"""
Resume Job Matcher Backend - Final Fix
"""
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
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            extract = page.extract_text()
            if extract:
                text += extract + "\n"
        return text
    except Exception:
        return ""

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    print("\n--- DEBUG: REQUEST RECEIVED ---")
    
    # 1. FIND THE FILE (Check all possible keys)
    uploaded_file = None
    if request.files:
        # Take the first file found, regardless of its key name (resume_file, resume, file, etc.)
        first_key = next(iter(request.files))
        uploaded_file = request.files[first_key]
        print(f"Found file under key: '{first_key}'")
    
    if not uploaded_file:
        print("ERROR: No files attached to request")
        return jsonify({'error': 'No file uploaded'}), 400

    # 2. GET JOB DESC
    job_text = request.form.get('job_description', '')
    if not job_text:
        print("ERROR: No job description text")
        return jsonify({'error': 'Missing job description'}), 400

    # 3. PROCESS TEXT
    try:
        if uploaded_file.filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(uploaded_file)
        else:
            resume_text = uploaded_file.read().decode('utf-8', errors='ignore')

        if not resume_text.strip():
            print("ERROR: Empty text extracted from PDF")
            return jsonify({'error': 'Could not read text from file. Is it an image scan?'}), 400

        # 4. ANALYZE
        results = matcher.analyze(resume_text, job_text)
        
        # Save History
        try:
            new_scan = AnalysisResult(
                filename=uploaded_file.filename,
                match_score=results['matchScore'],
                matched_skills=",".join(results['matchedSkills']),
                missing_skills=",".join(results['missingSkills'])
            )
            db.session.add(new_scan)
            db.session.commit()
        except Exception as e:
            print(f"DB Error (ignored): {e}")

        return jsonify(results), 200

    except Exception as e:
        print(f"SERVER CRASH: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        scans = AnalysisResult.query.order_by(AnalysisResult.timestamp.desc()).limit(10).all()
        return jsonify([scan.to_dict() for scan in scans]), 200
    except:
        return jsonify([]), 200

if __name__ == '__main__':
    print("Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)