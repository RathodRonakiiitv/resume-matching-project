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
from skills_data import TECH_SKILLS

# Ensure NLTK data exists
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')


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
        text = re.sub(r'[^a-zA-Z0-9\s\+\#\.]', ' ', text)
        text = ' '.join(text.split())
        return text
    
    def analyze_structure(self, text):
        """Check for critical resume sections"""
        text_lower = text.lower()
        sections = {
            'Contact Info': ['email', 'phone', 'github', 'linkedin'],
            'Education': ['education', 'university', 'college', 'degree', 'bachelor', 'master'],
            'Experience': ['experience', 'work history', 'employment', 'internship'],
            'Projects': ['projects', 'personal projects', 'portfolio'],
            'Skills': ['skills', 'technologies', 'technical stack']
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
        # ... (Keep existing implementation) ...
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
        # ... (Keep existing implementation) ...
        try:
            preprocessed_resume = self.preprocess_text(resume_text)
            preprocessed_job = self.preprocess_text(job_text)
            tfidf_matrix = self.vectorizer.fit_transform([preprocessed_resume, preprocessed_job])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity * 100)
        except Exception as e:
            return 0.0

    def extract_skills(self, text):
        # ... (Keep existing implementation) ...
        preprocessed = self.preprocess_text(text)
        found_skills = []
        for skill in TECH_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, preprocessed):
                found_skills.append(skill.title())
        return list(set(found_skills))

    def match_skills(self, resume_text, job_text):
        # ... (Keep existing implementation) ...
        resume_skills = set(self.extract_skills(resume_text))
        job_skills = set(self.extract_skills(job_text))
        matched_skills = list(resume_skills.intersection(job_skills))
        missing_skills = list(job_skills - resume_skills)
        return matched_skills, missing_skills

    def calculate_keyword_overlap(self, resume_keywords, job_keywords):
        # ... (Keep existing implementation) ...
        resume_set = set(resume_keywords)
        job_set = set(job_keywords)
        if not job_set: return 0.0
        overlap = resume_set.intersection(job_set)
        return float((len(overlap) / len(job_set)) * 100)

    def generate_recommendations(self, missing_skills, matched_skills, keyword_overlap, missing_sections):
        """Generate actionable recommendations including structural advice"""
        recommendations = []
        
        # Content Recommendations
        if len(missing_skills) > 0:
            recommendations.append(f"Add these critical skills: {', '.join(missing_skills[:3])}")
        
        if keyword_overlap < 50:
            recommendations.append("Optimize resume with keywords from the JD")
            
        # Structure Recommendations
        if missing_sections:
            recommendations.append(f"Your resume is missing sections: {', '.join(missing_sections)}")
            
        return recommendations
    
    def analyze(self, resume_text, job_text):
        """Complete analysis of resume vs job description"""
        resume_keywords = self.extract_keywords(resume_text)
        job_keywords = self.extract_keywords(job_text)
        
        matched_skills, missing_skills = self.match_skills(resume_text, job_text)
        overall_similarity = self.calculate_similarity(resume_text, job_text)
        keyword_overlap = self.calculate_keyword_overlap(resume_keywords, job_keywords)
        
        # Structural Analysis
        structure_score, found_sections, missing_sections = self.analyze_structure(resume_text)
        
        # Weighted Scoring Algorithm
        job_skills_count = len(self.extract_skills(job_text))
        skill_match_score = (len(matched_skills) / job_skills_count * 100) if job_skills_count > 0 else 0
        
        final_score = (
            skill_match_score * 0.4 +
            overall_similarity * 0.3 +
            keyword_overlap * 0.2 +
            structure_score * 0.1
        )
        
        recommendations = self.generate_recommendations(
            missing_skills, matched_skills, keyword_overlap, missing_sections
        )
        
        return {
            'matchScore': round(final_score, 2),
            'structureScore': round(structure_score, 2),
            'matchedSkills': sorted(matched_skills),
            'missingSkills': sorted(missing_skills),
            'missingSections': missing_sections,
            'recommendations': recommendations,
        }