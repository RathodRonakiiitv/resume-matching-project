"""
Resume Job Matcher Backend API
Flask server with ML/NLP endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
from matcher import ResumeJobMatcher
from skills_data import TECH_SKILLS

app = Flask(__name__)
CORS(app)

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
        raise Exception(f"PDF parsing error: {str(e)}")


@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    """Main endpoint for resume analysis"""
    try:
        # Check if file upload or text input
        if 'resume_file' in request.files:
            resume_file = request.files['resume_file']
            
            if resume_file.filename.endswith('.pdf'):
                resume_text = extract_text_from_pdf(resume_file)
            else:
                resume_text = resume_file.read().decode('utf-8')
        else:
            data = request.get_json()
            resume_text = data.get('resume_text', '')
        
        # Get job description
        if request.content_type == 'application/json':
            data = request.get_json()
            job_text = data.get('job_description', '')
        else:
            job_text = request.form.get('job_description', '')
        
        # Validate inputs
        if not resume_text or not job_text:
            return jsonify({
                'error': 'Both resume and job description are required'
            }), 400
        
        # Perform analysis
        results = matcher.analyze(resume_text, job_text)
        
        return jsonify(results), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Resume Job Matcher API is running'
    }), 200


@app.route('/api/skills', methods=['GET'])
def get_skills_list():
    """Get list of recognized skills"""
    return jsonify({
        'skills': sorted([skill.title() for skill in TECH_SKILLS])
    }), 200


if __name__ == '__main__':
    print("=" * 50)
    print("Resume-Job Skill Matcher API")
    print("=" * 50)
    print("\nAvailable endpoints:")
    print("  POST http://localhost:5000/api/analyze")
    print("  GET  http://localhost:5000/api/health")
    print("  GET  http://localhost:5000/api/skills")
    print("\nServer starting on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)