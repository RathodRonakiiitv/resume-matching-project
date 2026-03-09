"""
Resume Job Matcher Core Logic - v2.0
Advanced ML/NLP pipeline with multi-signal scoring:
  - TF-IDF keyword matching
  - TruncatedSVD semantic embeddings (lightweight, no PyTorch needed)
  - Skill synonym expansion
  - Weighted 5-factor scoring
  - In-memory caching for performance
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
import re
import numpy as np
from functools import lru_cache
from collections import Counter
import hashlib
import sys
import os

# --- RENDER/PRODUCTION PATH FIX ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from skills_data import TECH_SKILLS, SKILL_CATEGORIES, SKILL_ALIASES

# ---- NLTK Setup (robust for Render) ----
def setup_nltk():
    """Download all required NLTK resources. Idempotent and error-tolerant."""
    resources = ['punkt', 'punkt_tab', 'stopwords']
    for resource in resources:
        try:
            nltk.download(resource, quiet=True)
        except Exception:
            pass  # Gracefully skip if download fails (already present or network error)

setup_nltk()


# ---- In-Memory Analysis Cache ----
_analysis_cache = {}
_CACHE_MAX_SIZE = 50


def _cache_key(resume_text, job_text):
    """Generate a deterministic cache key from input texts."""
    combined = (resume_text.strip().lower() + "|||" + job_text.strip().lower())
    return hashlib.md5(combined.encode('utf-8')).hexdigest()


class ResumeJobMatcher:
    """
    Production-grade resume-vs-job-description matcher.
    Uses a multi-signal ML pipeline for accurate scoring.
    """

    def __init__(self):
        self.stop_words = set(stopwords.words('english'))

        # ---- TF-IDF Vectorizer (keyword-level matching) ----
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),       # unigrams, bigrams, trigrams
            stop_words='english',
            sublinear_tf=True,        # dampens term frequency with log(1+tf)
            min_df=1,
            max_df=0.95,
        )

        # ---- Semantic Embedding config ----
        # TF-IDF → TruncatedSVD for dense vector semantic comparison
        self._semantic_tfidf = TfidfVectorizer(
            max_features=8000,
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True,
            min_df=1,
        )

        # ---- Build expanded skill set with aliases ----
        self._canonical_skills = set(s.lower() for s in TECH_SKILLS)
        self._alias_map = {k.lower(): v.lower() for k, v in SKILL_ALIASES.items()}

        print("✅ ResumeJobMatcher initialized (multi-signal pipeline)")

    # ================================================================
    #  TEXT PREPROCESSING
    # ================================================================

    def preprocess_text(self, text):
        """Clean and normalize text while preserving tech tokens."""
        text = text.lower()
        # Keep +, #, . for tech terms like C++, C#, Node.js
        text = re.sub(r'[^a-zA-Z0-9\s\+\#\.\-\/]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    # ================================================================
    #  SKILL EXTRACTION (with synonym expansion)
    # ================================================================

    def _resolve_skill(self, token):
        """Resolve a token to its canonical skill name via alias map."""
        token_lower = token.lower().strip()
        if token_lower in self._canonical_skills:
            return token_lower
        if token_lower in self._alias_map:
            return self._alias_map[token_lower]
        return None

    def extract_skills(self, text):
        """Extract skills from text using regex + alias expansion."""
        preprocessed = self.preprocess_text(text)
        found_skills = set()

        # 1. Direct canonical match (exact word boundary)
        for skill in TECH_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, preprocessed):
                found_skills.add(skill.lower())

        # 2. Alias expansion — find aliases in text and map to canonical
        for alias, canonical in self._alias_map.items():
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, preprocessed):
                found_skills.add(canonical)

        return [s.title() for s in found_skills]

    def match_skills(self, resume_text, job_text):
        """Return matched and missing skills between resume and JD."""
        resume_skills = set(self.extract_skills(resume_text))
        job_skills = set(self.extract_skills(job_text))
        matched = sorted(resume_skills & job_skills)
        missing = sorted(job_skills - resume_skills)
        return matched, missing

    # ================================================================
    #  SIMILARITY SCORES
    # ================================================================

    def calculate_tfidf_similarity(self, resume_text, job_text):
        """Cosine similarity on TF-IDF vectors (keyword-level overlap)."""
        try:
            preprocessed = [self.preprocess_text(resume_text), self.preprocess_text(job_text)]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(preprocessed)
            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(np.clip(sim * 100, 0, 100))
        except Exception:
            return 0.0

    def calculate_semantic_similarity(self, resume_text, job_text):
        """
        Cosine similarity on TruncatedSVD embeddings (semantic-level).
        Captures meaning beyond exact keyword overlap.
        Dynamically sets SVD components based on feature count.
        """
        try:
            preprocessed = [self.preprocess_text(resume_text), self.preprocess_text(job_text)]
            tfidf_matrix = self._semantic_tfidf.fit_transform(preprocessed)

            # n_components must be < min(n_samples, n_features)
            max_components = min(tfidf_matrix.shape[0], tfidf_matrix.shape[1]) - 1
            n_components = min(100, max(1, max_components))

            svd = TruncatedSVD(n_components=n_components, random_state=42)
            embeddings = svd.fit_transform(tfidf_matrix)
            sim = cosine_similarity(embeddings[0:1], embeddings[1:2])[0][0]
            return float(np.clip(sim * 100, 0, 100))
        except Exception:
            return 0.0

    def calculate_keyword_density(self, resume_text, job_text):
        """
        Measures what % of JD's important keywords appear in the resume.
        Uses TF-IDF to identify the JD's top keywords.
        """
        try:
            job_preprocessed = self.preprocess_text(job_text)
            resume_preprocessed = self.preprocess_text(resume_text)

            # Get top JD keywords by TF-IDF weight
            vec = TfidfVectorizer(max_features=200, stop_words='english', ngram_range=(1, 2))
            matrix = vec.fit_transform([job_preprocessed])
            features = vec.get_feature_names_out()
            scores = matrix.toarray()[0]

            # Top 30 most important JD keywords
            top_indices = scores.argsort()[-30:][::-1]
            top_keywords = [features[i] for i in top_indices if scores[i] > 0]

            if not top_keywords:
                return 0.0

            # Count how many appear in resume
            found = sum(1 for kw in top_keywords if kw in resume_preprocessed)
            density = (found / len(top_keywords)) * 100
            return float(np.clip(density, 0, 100))
        except Exception:
            return 0.0

    # ================================================================
    #  STRUCTURAL ANALYSIS
    # ================================================================

    def analyze_structure(self, text):
        """Check for critical resume sections."""
        text_lower = text.lower()
        sections = {
            'Contact Info': ['email', 'phone', 'github', 'linkedin', 'address', 'portfolio'],
            'Education': ['education', 'university', 'college', 'degree', 'bachelor', 'master', 'phd', 'gpa', 'cgpa'],
            'Experience': ['experience', 'work history', 'employment', 'internship', 'role', 'position', 'worked at'],
            'Projects': ['projects', 'personal projects', 'portfolio', 'open source', 'side project'],
            'Skills': ['skills', 'technologies', 'technical stack', 'expertise', 'proficiencies', 'competencies']
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

    # ================================================================
    #  CATEGORIZATION, INSIGHTS, TIPS
    # ================================================================

    def categorize_skills(self, skills):
        """Group skills into their categories."""
        categorized = {cat: [] for cat in SKILL_CATEGORIES}
        for skill in skills:
            skill_lower = skill.lower()
            found = False
            for cat, cat_skills in SKILL_CATEGORIES.items():
                if skill_lower in cat_skills:
                    categorized[cat].append(skill)
                    found = True
                    break
            if not found:
                categorized.setdefault('Other', []).append(skill)
        return {k: v for k, v in categorized.items() if v}

    def analyze_bullet_points(self, text):
        """Analyze resume descriptions for quantifiable metrics and action verbs."""
        tips = []
        sentences = nltk.sent_tokenize(text)
        action_verbs = [
            'led', 'managed', 'developed', 'created', 'designed', 'implemented',
            'increased', 'reduced', 'saved', 'optimized', 'built', 'deployed',
            'automated', 'streamlined', 'architected', 'delivered', 'launched',
            'spearheaded', 'orchestrated', 'engineered'
        ]

        # Metric detection
        has_metrics = bool(re.findall(r'\d+%', text)) or bool(re.findall(r'\$[\d,]+', text)) or bool(re.findall(r'\d+x', text))
        if not has_metrics:
            tips.append("Quantify your achievements with numbers (e.g., 'Increased efficiency by 20%', 'Reduced load time by 3x').")

        # Action verb usage
        verb_count = sum(1 for sent in sentences if any(verb in sent.lower() for verb in action_verbs))
        if len(sentences) > 0 and verb_count < len(sentences) * 0.4:
            tips.append("Use more strong action verbs at the start of your bullet points (e.g., 'Engineered', 'Deployed', 'Optimized').")

        # Length check
        short_bullets = sum(1 for s in sentences if len(s.split()) < 5)
        if short_bullets > len(sentences) * 0.3:
            tips.append("Expand short bullet points — each should describe the impact and context of what you did.")

        return tips

    def estimate_experience(self, text):
        """Estimate experience level based on keyword signals."""
        senior_keywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'director', 'vp', 'staff', 'head of']
        mid_keywords = ['engineer', 'developer', 'analyst', 'consultant', 'specialist']
        junior_keywords = ['junior', 'entry', 'intern', 'associate', 'fresher', 'student', 'trainee', 'apprentice']

        text_lower = text.lower()
        senior_score = sum(1 for k in senior_keywords if k in text_lower)
        mid_score = sum(1 for k in mid_keywords if k in text_lower)
        junior_score = sum(1 for k in junior_keywords if k in text_lower)

        # Year extraction heuristic
        year_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text_lower)
        max_years = max([int(y) for y in year_matches], default=0)

        if max_years >= 7 or senior_score > junior_score + mid_score:
            return "Senior"
        if max_years >= 3 or (mid_score > 0 and junior_score == 0):
            return "Mid-Level"
        return "Junior/Entry"

    def analyze_tone(self, text):
        """Assess professional tone of the resume."""
        professional_words = [
            'delivered', 'collaborated', 'optimized', 'facilitated', 'streamlined',
            'architected', 'spearheaded', 'orchestrated', 'leveraged', 'achieved'
        ]
        casual_words = ['did', 'got', 'stuff', 'things', 'maybe', 'think', 'worked on', 'helped with']

        text_lower = text.lower()
        prof_count = sum(text_lower.count(w) for w in professional_words)
        casual_count = sum(text_lower.count(w) for w in casual_words)

        if casual_count > prof_count:
            return "Casual (Needs improvement)"
        if prof_count > 3:
            return "Highly Professional"
        return "Professional"

    def generate_interview_questions(self, missing_skills, matched_skills):
        """Generate targeted interview questions based on skill analysis."""
        questions = []
        if matched_skills:
            questions.append(f"Can you describe a challenging project where you utilized {matched_skills[0]}?")
            if len(matched_skills) > 1:
                questions.append(f"How do you typically integrate {matched_skills[0]} and {matched_skills[1]} in your workflow?")
        if missing_skills:
            questions.append(f"How would you approach learning and implementing {missing_skills[0]} in a production environment?")
            if len(missing_skills) > 1:
                questions.append(f"What strategies would you use to ramp up on {missing_skills[1]} quickly?")
        questions.append("Tell me about a time you had to troubleshoot a complex technical issue under a tight deadline.")
        return questions

    # ================================================================
    #  EXTRACT TOP KEYWORDS (for display)
    # ================================================================

    def extract_keywords(self, text, top_n=20):
        """Extract top keywords by TF-IDF weight."""
        preprocessed = self.preprocess_text(text)
        try:
            vec = TfidfVectorizer(max_features=500, stop_words='english', ngram_range=(1, 2))
            matrix = vec.fit_transform([preprocessed])
            features = vec.get_feature_names_out()
            scores = matrix.toarray()[0]
            top_indices = scores.argsort()[-top_n:][::-1]
            return [features[i] for i in top_indices if scores[i] > 0]
        except Exception:
            return []

    # ================================================================
    #  MAIN ANALYSIS (multi-signal pipeline)
    # ================================================================

    def analyze(self, resume_text, job_text):
        """
        Complete multi-signal analysis of resume vs job description.

        Scoring Formula (5-factor weighted):
          - Skill Match Score:      35%   (precision of skill overlap)
          - Semantic Similarity:    30%   (TruncatedSVD embedding cosine)
          - TF-IDF Similarity:      15%   (keyword-level cosine)
          - Structural Score:       10%   (section completeness)
          - Keyword Density:        10%   (JD keyword coverage)
        """
        # ---- Check cache first ----
        key = _cache_key(resume_text, job_text)
        if key in _analysis_cache:
            return _analysis_cache[key]

        # ---- Compute all signals ----
        matched_skills, missing_skills = self.match_skills(resume_text, job_text)

        # Signal 1: Skill match percentage
        job_skills_count = len(self.extract_skills(job_text))
        skill_match_score = (len(matched_skills) / job_skills_count * 100) if job_skills_count > 0 else 0

        # Signal 2: Semantic similarity (TruncatedSVD embeddings)
        semantic_sim = self.calculate_semantic_similarity(resume_text, job_text)

        # Signal 3: TF-IDF cosine similarity
        tfidf_sim = self.calculate_tfidf_similarity(resume_text, job_text)

        # Signal 4: Structural analysis
        structure_score, found_sections, missing_sections = self.analyze_structure(resume_text)

        # Signal 5: Keyword density
        kw_density = self.calculate_keyword_density(resume_text, job_text)

        # ---- Weighted Final Score ----
        final_score = (
            skill_match_score * 0.35 +
            semantic_sim      * 0.30 +
            tfidf_sim         * 0.15 +
            structure_score   * 0.10 +
            kw_density        * 0.10
        )
        final_score = float(np.clip(final_score, 0, 100))

        # ---- Supporting Analysis ----
        exp_level = self.estimate_experience(resume_text)
        tone = self.analyze_tone(resume_text)
        matched_categorized = self.categorize_skills(matched_skills)
        missing_categorized = self.categorize_skills(missing_skills)
        bullet_tips = self.analyze_bullet_points(resume_text)
        interview_q = self.generate_interview_questions(missing_skills, matched_skills)

        # ---- Build Recommendations ----
        recommendations = []
        if missing_skills:
            recommendations.append(f"Focus on learning: {', '.join(missing_skills[:3])}")
        recommendations.extend(bullet_tips)
        if missing_sections:
            recommendations.append(f"Consider adding these missing sections: {', '.join(missing_sections)}")
        if semantic_sim < 40:
            recommendations.append("Your resume's language doesn't closely match the job description. Mirror the JD's terminology.")
        if kw_density < 30:
            recommendations.append("Many important keywords from the job description are missing. Tailor your resume to include them.")

        result = {
            'matchScore': round(final_score, 2),
            'structureScore': round(structure_score, 2),
            'semanticScore': round(semantic_sim, 2),
            'tfidfScore': round(tfidf_sim, 2),
            'keywordDensity': round(kw_density, 2),
            'skillMatchScore': round(skill_match_score, 2),
            'matchedSkills': sorted(matched_skills),
            'missingSkills': sorted(missing_skills),
            'matchedCategorized': matched_categorized,
            'missingCategorized': missing_categorized,
            'experienceLevel': exp_level,
            'tone': tone,
            'recommendations': recommendations,
            'interviewQuestions': interview_q,
            'missingSections': missing_sections,
        }

        # ---- Cache result ----
        if len(_analysis_cache) >= _CACHE_MAX_SIZE:
            # Evict oldest entry
            oldest_key = next(iter(_analysis_cache))
            del _analysis_cache[oldest_key]
        _analysis_cache[key] = result

        return result
