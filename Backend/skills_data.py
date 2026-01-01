"""
Skills Database
Contains comprehensive list of technical skills
"""

SKILL_CATEGORIES = {
    'Programming Languages': [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 
        'swift', 'kotlin', 'go', 'rust', 'scala', 'r', 'matlab', 'perl', 'c'
    ],
    'Frontend & UI': [
        'react', 'angular', 'vue', 'html', 'css', 'sass', 'scss', 'webpack', 
        'nextjs', 'next.js', 'redux', 'jquery', 'bootstrap', 'tailwind', 
        'material-ui', 'responsive design'
    ],
    'Backend & API': [
        'nodejs', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net',
        'rest api', 'graphql', 'api', 'soap', 'microservices', 'grpc', 'fastapi'
    ],
    'Databases': [
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 
        'elasticsearch', 'oracle', 'sqlite', 'dynamodb', 'mariadb', 'neo4j'
    ],
    'Cloud & DevOps': [
        'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 
        'gitlab', 'github', 'terraform', 'ansible', 'ci/cd', 'linux', 'unix', 
        'shell scripting', 'bash', 'serverless', 'lambda'
    ],
    'AI & Data Science': [
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
        'scikit-learn', 'pandas', 'numpy', 'data analysis', 'nlp', 'computer vision',
        'opencv', 'spark', 'hadoop', 'data mining', 'statistics', 'tableau', 'power bi'
    ],
    'Mobile Development': [
        'android', 'ios', 'react native', 'flutter', 'xamarin'
    ],
    'Soft Skills & Tools': [
        'git', 'agile', 'scrum', 'kanban', 'jira', 'project management', 
        'leadership', 'communication', 'problem solving', 'teamwork'
    ]
}

# Flatten for backward compatibility
TECH_SKILLS = [skill for skills in SKILL_CATEGORIES.values() for skill in skills]
