"""
Resume Job Matcher Core Logic
ML/NLP implementation for resume analysis
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
import re
from collections import Counter
import sys
import os

# --- RENDER/PRODUCTION PATH FIX ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from skills_data import TECH_SKILLS, SKILL_CATEGORIES

# Ensure NLTK data exists with extra robustness for Render
def setup_nltk():
    for resource in ['punkt', 'stopwords', 'punkt_tab']:
        try:
            nltk.data.find(f'tokenizers/{resource}' if 'punkt' in resource else f'corpora/{resource}')
        except LookupError:
            nltk.download(resource)

setup_nltk()


class ResumeJobMatcher:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=1
        )
    
    def preprocess_text(self, text):
        """Clean and preprocess text"""
        text = text.lower()
        # Keep + and # for C++, C#
        text = re.sub(r'[^a-zA-Z0-9\s\+\#\.]', ' ', text)
        text = ' '.join(text.split())
        return text
    
    def analyze_structure(self, text):
        """Check for critical resume sections"""
        text_lower = text.lower()
        sections = {
            'Contact Info': ['email', 'phone', 'github', 'linkedin', 'address'],
            'Education': ['education', 'university', 'college', 'degree', 'bachelor', 'master', 'phd'],
            'Experience': ['experience', 'work history', 'employment', 'internship', 'role'],
            'Projects': ['projects', 'personal projects', 'portfolio', 'open source'],
            'Skills': ['skills', 'technologies', 'technical stack', 'expertise']
        }
        
        found_sections = []
        missing_sections = []
        
        for section, keywords in sections.items():
            if any(k in text_lower for k in keywords):
                found_sections.append(section)
            else:
                missing_sections.append(section)
                
        score = (len(found_sections) / len(sections)) * 100
        return score, found_sections, missing_sections

    def extract_keywords(self, text, top_n=20):
        preprocessed = self.preprocess_text(text)
        try:
            tfidf_matrix = self.vectorizer.fit_transform([preprocessed])
            feature_names = self.vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            top_indices = scores.argsort()[-top_n:][::-1]
            keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
            return keywords
        except:
            return []

    def calculate_similarity(self, resume_text, job_text):
        try:
            preprocessed_resume = self.preprocess_text(resume_text)
            preprocessed_job = self.preprocess_text(job_text)
            tfidf_matrix = self.vectorizer.fit_transform([preprocessed_resume, preprocessed_job])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity * 100)
        except Exception:
            return 0.0

    def extract_skills(self, text):
        preprocessed = self.preprocess_text(text)
        found_skills = []
        for skill in TECH_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, preprocessed):
                found_skills.append(skill.title())
        return list(set(found_skills))

    def match_skills(self, resume_text, job_text):
        resume_skills = set(self.extract_skills(resume_text))
        job_skills = set(self.extract_skills(job_text))
        matched_skills = list(resume_skills.intersection(job_skills))
        missing_skills = list(job_skills - resume_skills)
        return matched_skills, missing_skills

    def categorize_skills(self, skills):
        categorized = {cat: [] for cat in SKILL_CATEGORIES.keys()}
        for skill in skills:
            skill_lower = skill.lower()
            found = False
            for cat, cat_skills in SKILL_CATEGORIES.items():
                if skill_lower in cat_skills:
                    categorized[cat].append(skill)
                    found = True
                    break
            if not found:
                if 'Other' not in categorized: categorized['Other'] = []
                categorized['Other'].append(skill)
        return {k: v for k, v in categorized.items() if v}

    def analyze_bullet_points(self, text):
        tips = []
        sentences = nltk.sent_tokenize(text)
        action_verbs = ['led', 'managed', 'developed', 'created', 'designed', 'implemented', 'increased', 'reduced', 'saved']
        
        has_metrics = len(re.findall(r'\d+%', text)) > 0 or len(re.findall(r'\$\d+', text)) > 0
        if not has_metrics:
            tips.append("Quantify your achievements with numbers (e.g., 'Increased efficiency by 20%').")
            
        verb_count = sum(1 for sent in sentences if any(verb in sent.lower() for verb in action_verbs))
        if verb_count < len(sentences) * 0.5:
            tips.append("Use more strong action verbs at the start of your bullet points.")
            
        return tips

    def estimate_experience(self, text):
        senior_keywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'director', 'vp']
        junior_keywords = ['junior', 'entry', 'intern', 'associate', 'fresher', 'student']
        
        text_lower = text.lower()
        senior_score = sum(1 for k in senior_keywords if k in text_lower)
        junior_score = sum(1 for k in junior_keywords if k in text_lower)
        
        if senior_score > junior_score: return "Senior"
        if junior_score > senior_score: return "Junior/Entry"
        return "Mid-Level"

    def analyze_tone(self, text):
        professional_words = ['delivered', 'collaborated', 'optimized', 'facilitated', 'streamlined']
        casual_words = ['did', 'got', 'stuff', 'things', 'maybe', 'think']
        
        text_lower = text.lower()
        prof_count = sum(text_lower.count(w) for w in professional_words)
        casual_count = sum(text_lower.count(w) for w in casual_words)
        
        if casual_count > prof_count: return "Casual (Needs improvement)"
        return "Professional"

    def generate_interview_questions(self, missing_skills, matched_skills):
        questions = []
        if matched_skills:
            questions.append(f"Can you describe a challenging project where you utilized {matched_skills[0]}?")
        if missing_skills:
            questions.append(f"How would you approach learning and implementing {missing_skills[0]} in a high-pressure environment?")
        questions.append("Tell me about a time you had to troubleshoot a complex technical issue.")
        return questions

    def analyze(self, resume_text, job_text):
        """Complete advanced analysis of resume vs job description"""
        resume_keywords = self.extract_keywords(resume_text)
        job_keywords = self.extract_keywords(job_text)
        
        matched_skills, missing_skills = self.match_skills(resume_text, job_text)
        overall_similarity = self.calculate_similarity(resume_text, job_text)
        
        # Structural Analysis
        structure_score, found_sections, missing_sections = self.analyze_structure(resume_text)
        
        # Experience and Tone
        exp_level = self.estimate_experience(resume_text)
        tone = self.analyze_tone(resume_text)
        
        # Categorized Skills
        matched_categorized = self.categorize_skills(matched_skills)
        missing_categorized = self.categorize_skills(missing_skills)
        
        # Actionable Insights
        bullet_tips = self.analyze_bullet_points(resume_text)
        interview_q = self.generate_interview_questions(missing_skills, matched_skills)
        
        # Weighted Scoring
        job_skills_count = len(self.extract_skills(job_text))
        skill_match_score = (len(matched_skills) / job_skills_count * 100) if job_skills_count > 0 else 0
        
        final_score = (
            skill_match_score * 0.5 +
            overall_similarity * 0.3 +
            structure_score * 0.2
        )
        
        recommendations = []
        if missing_skills:
            recommendations.append(f"Focus on learning: {', '.join(missing_skills[:3])}")
        recommendations.extend(bullet_tips)
        if missing_sections:
            recommendations.append(f"Consider adding these missing sections: {', '.join(missing_sections)}")
        
        return {
            'matchScore': round(final_score, 2),
            'structureScore': round(structure_score, 2),
            'matchedSkills': sorted(matched_skills),
            'missingSkills': sorted(missing_skills),
            'matchedCategorized': matched_categorized,
            'missingCategorized': missing_categorized,
            'experienceLevel': exp_level,
            'tone': tone,
            'recommendations': recommendations,
            'interviewQuestions': interview_q,
            'missingSections': missing_sections
        }
