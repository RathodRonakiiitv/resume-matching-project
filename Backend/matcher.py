"""
Resume Job Matcher Core Logic
ML/NLP implementation for resume analysis
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re
from collections import Counter
from skills_data import TECH_SKILLS

# Download NLTK data
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
    
    def extract_keywords(self, text, top_n=20):
        """Extract keywords using TF-IDF"""
        preprocessed = self.preprocess_text(text)
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform([preprocessed])
            feature_names = self.vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            top_indices = scores.argsort()[-top_n:][::-1]
            keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
            return keywords
        except:
            words = preprocessed.split()
            words = [w for w in words if w not in self.stop_words and len(w) > 2]
            word_freq = Counter(words)
            return [word for word, _ in word_freq.most_common(top_n)]
    
    def calculate_similarity(self, resume_text, job_text):
        """Calculate cosine similarity between resume and job description"""
        try:
            preprocessed_resume = self.preprocess_text(resume_text)
            preprocessed_job = self.preprocess_text(job_text)
            
            tfidf_matrix = self.vectorizer.fit_transform([preprocessed_resume, preprocessed_job])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity * 100)
        except Exception as e:
            print(f"Similarity calculation error: {e}")
            return 0.0
    
    def extract_skills(self, text):
        """Extract skills from text using predefined skill list"""
        preprocessed = self.preprocess_text(text)
        found_skills = []
        
        for skill in TECH_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, preprocessed):
                found_skills.append(skill.title())
        
        return list(set(found_skills))
    
    def match_skills(self, resume_text, job_text):
        """Match skills between resume and job description"""
        resume_skills = set(self.extract_skills(resume_text))
        job_skills = set(self.extract_skills(job_text))
        
        matched_skills = list(resume_skills.intersection(job_skills))
        missing_skills = list(job_skills - resume_skills)
        
        return matched_skills, missing_skills
    
    def calculate_keyword_overlap(self, resume_keywords, job_keywords):
        """Calculate keyword overlap percentage"""
        resume_set = set(resume_keywords)
        job_set = set(job_keywords)
        
        if not job_set:
            return 0.0
        
        overlap = resume_set.intersection(job_set)
        overlap_percentage = (len(overlap) / len(job_set)) * 100
        
        return float(overlap_percentage)
    
    def generate_recommendations(self, missing_skills, matched_skills, keyword_overlap):
        """Generate actionable recommendations"""
        recommendations = []
        
        if len(missing_skills) > 0:
            top_missing = missing_skills[:3]
            recommendations.append(f"Consider adding these skills: {', '.join(top_missing)}")
        
        if keyword_overlap < 50:
            recommendations.append("Optimize your resume with more job-relevant keywords")
        
        if len(matched_skills) < 5:
            recommendations.append("Highlight more technical skills and tools you've used")
        
        if keyword_overlap >= 70 and len(matched_skills) >= 5:
            recommendations.append("Your resume is well-aligned with this job!")
        else:
            recommendations.append("Review the job description and emphasize matching experiences")
        
        if len(missing_skills) > 5:
            recommendations.append("Focus on the most critical missing skills first")
        
        return recommendations
    
    def analyze(self, resume_text, job_text):
        """Complete analysis of resume vs job description"""
        resume_keywords = self.extract_keywords(resume_text)
        job_keywords = self.extract_keywords(job_text)
        
        matched_skills, missing_skills = self.match_skills(resume_text, job_text)
        
        overall_similarity = self.calculate_similarity(resume_text, job_text)
        keyword_overlap = self.calculate_keyword_overlap(resume_keywords, job_keywords)
        
        job_skills_count = len(self.extract_skills(job_text))
        skill_match_score = (len(matched_skills) / job_skills_count * 100) if job_skills_count > 0 else 0
        
        match_score = (
            skill_match_score * 0.5 +
            overall_similarity * 0.3 +
            keyword_overlap * 0.2
        )
        
        recommendations = self.generate_recommendations(
            missing_skills, matched_skills, keyword_overlap
        )
        
        return {
            'matchScore': round(match_score, 2),
            'matchedSkills': sorted(matched_skills),
            'missingSkills': sorted(missing_skills),
            'keywordOverlap': round(keyword_overlap, 2),
            'resumeKeywords': resume_keywords[:15],
            'jobKeywords': job_keywords[:15],
            'recommendations': recommendations,
            'overallSimilarity': round(overall_similarity, 2)
        }