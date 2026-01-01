# Resume Intelligence Documentation

## Overview
Resume Intelligence is a sophisticated recruiter-grade platform that goes beyond simple keyword matching. It uses ML and NLP to provide a holistic analysis of candidate resumes against job descriptions.

## Technical Architecture

### Backend (Flask + Scikit-Learn + NLTK)
- **NLP Engine**: Uses TF-IDF vectorization and Cosine Similarity for semantic matching.
- **Skill Categorization**: A systematic mapping of 80+ technical skills into 8 distinct categories.
- **Tone & Seniority Analysis**: Heuristic-based analysis to assess professional tone and estimated experience level.
- **Bullet Point Optimization**: Analyzes resume descriptions for quantifyable metrics and active verbs.

### Frontend (React + Framer Motion + Tailwind CSS)
- **Bento-style Dashboard**: A modern, sectioned layout for clear data visualization.
- **Scroll Reveal System**: Interactive report sections that reveal as the user explores.
- **3D Interactive Components**: Uses `TiltCard` with hardware-accelerated transforms for a premium feel.
- **Match Intelligence**: A custom `ScoreGauge` for visual performance tracking.

## Feature Spotlight

1.  **Skill Categorization**: Automatically groups skills into categories like "Cloud & DevOps" or "Backend & API" for easier review.
2.  **Interview Preparation**: Generates dynamic questions based on the candidate's strengths and missing skills.
3.  **Actionable Insights**: Provides specific tips on how to improve the resume, such as adding metrics or strong verbs.
4.  **Recruiter-Grade PDF**: Generates professional multi-section reports for easy sharing within HR teams.
