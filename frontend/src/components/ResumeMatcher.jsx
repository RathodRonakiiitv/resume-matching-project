import React, { useState } from 'react';
import { Upload, FileText, Briefcase, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function ResumeMatcher() {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setError('PDF support coming soon. Please paste text for now.');
      return;
    }

    const text = await file.text();
    setResumeText(text);
    setError('');
  };

  const analyzeMatch = async () => {
    if (!resumeText.trim() || !jobDesc.trim()) {
      setError('Please provide both resume and job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDesc
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to connect to backend. Make sure the server is running on port 5000.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Resume-Job Skill Matcher</h1>
          <p className="text-gray-600">Analyze your resume against job descriptions using AI/ML</p>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Your Resume</h2>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center justify-center w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition">
                <Upload className="w-5 h-5 mr-2" />
                <span>Upload Resume (TXT)</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Or paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>

          {/* Job Description Input */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Briefcase className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Job Description</h2>
            </div>
            
            <textarea
              className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        {/* Analyze Button */}
        <div className="text-center mb-8">
          <button
            onClick={analyzeMatch}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Match'}
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analysis Results</h2>

            {/* Score Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className={`${getScoreBg(results.matchScore)} rounded-lg p-6 text-center`}>
                <TrendingUp className={`w-12 h-12 ${getScoreColor(results.matchScore)} mx-auto mb-2`} />
                <div className={`text-4xl font-bold ${getScoreColor(results.matchScore)} mb-1`}>
                  {results.matchScore}%
                </div>
                <div className="text-gray-700 font-semibold">Overall Match</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  {results.matchedSkills.length}
                </div>
                <div className="text-gray-700 font-semibold">Matched Skills</div>
              </div>

              <div className="bg-orange-50 rounded-lg p-6 text-center">
                <XCircle className="w-12 h-12 text-orange-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-orange-600 mb-1">
                  {results.missingSkills.length}
                </div>
                <div className="text-gray-700 font-semibold">Missing Skills</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Matched Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.matchedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword Analysis */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Keyword Overlap: {results.keywordOverlap}%
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${results.keywordOverlap}%` }}
                />
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {results.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}