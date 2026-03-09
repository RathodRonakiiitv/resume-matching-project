"""
Skills Database
Contains comprehensive list of technical skills, categories, and alias mappings.
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

# ---- Skill Alias / Synonym Mapping ----
# Maps common abbreviations, alternate names, and typos to their canonical skill name.
# Both keys and values should be lowercase.
SKILL_ALIASES = {
    # Programming Languages
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'golang': 'go',
    'c sharp': 'c#',
    'csharp': 'c#',
    'cplusplus': 'c++',
    'cpp': 'c++',

    # Frontend
    'reactjs': 'react',
    'react.js': 'react',
    'angularjs': 'angular',
    'angular.js': 'angular',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'next': 'next.js',
    'nextjs': 'next.js',
    'tailwindcss': 'tailwind',
    'tailwind css': 'tailwind',
    'mui': 'material-ui',

    # Backend
    'node': 'node.js',
    'nodejs': 'node.js',
    'expressjs': 'express',
    'express.js': 'express',
    'fast api': 'fastapi',
    'asp.net core': 'asp.net',
    'dotnet': 'asp.net',

    # Databases
    'postgres': 'postgresql',
    'mongo': 'mongodb',
    'elastic search': 'elasticsearch',
    'dynamo': 'dynamodb',
    'maria': 'mariadb',

    # Cloud & DevOps
    'amazon web services': 'aws',
    'google cloud platform': 'gcp',
    'microsoft azure': 'azure',
    'k8s': 'kubernetes',
    'k8': 'kubernetes',
    'ci cd': 'ci/cd',
    'cicd': 'ci/cd',
    'continuous integration': 'ci/cd',
    'continuous deployment': 'ci/cd',
    'shell': 'shell scripting',
    'aws lambda': 'lambda',

    # AI & Data Science
    'ml': 'machine learning',
    'dl': 'deep learning',
    'tf': 'tensorflow',
    'sklearn': 'scikit-learn',
    'sk-learn': 'scikit-learn',
    'sci-kit learn': 'scikit-learn',
    'natural language processing': 'nlp',
    'cv': 'computer vision',
    'apache spark': 'spark',
    'apache hadoop': 'hadoop',
    'powerbi': 'power bi',

    # Mobile
    'rn': 'react native',
    'react-native': 'react native',

    # Tools
    'github actions': 'github',
    'gitlab ci': 'gitlab',
}
