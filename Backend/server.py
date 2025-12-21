import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader  # Library to read PDFs
import io
from dotenv import load_dotenv

load_dotenv()


app = Flask(__name__)
CORS(app)

# ==========================================
# PASTE YOUR GROQ KEY HERE
# ==========================================
import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


client = Groq(api_key=GROQ_API_KEY)

def extract_text_from_pdf(file_storage):
    """
    Extracts text from a PDF file stream.
    """
    try:
        # Create a PDF reader object from the file bytes
        reader = PdfReader(file_storage)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def clean_json(text):
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            if "{" in part and "}" in part:
                text = part
                if text.startswith("json"):
                    text = text[4:]
                break
    return text.strip()

@app.route('/api/analyze', methods=['POST'])
def analyze():
    # 1. Handle File Upload (Multipart/Form-Data)
    job_description = request.form.get('job_description', '')
    resume_file = request.files.get('resume')

    if not resume_file or not job_description:
        return jsonify({"error": "Missing resume file or job description"}), 400

    # 2. Extract Text based on file type
    filename = resume_file.filename.lower()
    resume_text = ""

    if filename.endswith('.pdf'):
        print(f"📄 Processing PDF: {filename}")
        resume_text = extract_text_from_pdf(resume_file)
    elif filename.endswith('.txt'):
        print(f"📄 Processing TXT: {filename}")
        resume_text = resume_file.read().decode('utf-8')
    else:
        return jsonify({"error": "Unsupported file type. Use PDF or TXT"}), 400

    if not resume_text.strip():
        return jsonify({"error": "Could not extract text from this file"}), 400

    # 3. Send to AI (Llama 3.3)
    model_name = "llama-3.3-70b-versatile" 
    
    prompt = f"""
    You are an expert ATS (Applicant Tracking System).
    
    JOB DESCRIPTION:
    {job_description}

    RESUME CONTENT:
    {resume_text}
    
    TASK:
    Analyze the resume. Return ONLY valid JSON:
    {{
        "candidate_info": {{
            "name": "Extract Name",
            "email": "Extract Email",
            "phone": "Extract Phone",
            "experience_level": "Junior/Mid/Senior",
            "detected_job_title": "Current Role"
        }},
        "match_analysis": {{
            "ats_score": <integer 0-100>,
            "industry_match": "High/Medium/Low",
            "matched_skills": ["skill1", "skill2"],
            "missing_skills": ["skill1", "skill2"]
        }},
        "quality_check": {{
            "grammar_score": <integer 0-100>,
            "formatting_issues": ["issue1"]
        }},
        "improvements": ["suggestion1", "suggestion2"]
    }}
    """

    print(f"🔄 Analyzing {filename} with Groq...")

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a JSON-only output API."},
                {"role": "user", "content": prompt}
            ],
            model=model_name,
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        response_text = chat_completion.choices[0].message.content
        cleaned_text = clean_json(response_text)
        return jsonify(json.loads(cleaned_text))

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Server running on http://localhost:5000")
    app.run(port=5000, debug=True)