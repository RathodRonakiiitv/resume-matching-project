import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from "jspdf";
import { 
  Upload, FileText, Briefcase, CheckCircle, XCircle, 
  Activity, Sparkles, AlertCircle, ArrowRight, Download, User, Star 
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

// --- Utility Components ---

const Card = ({ children, className = "", delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const SkillBadge = ({ skill, type, delay }) => {
  const isMatch = type === 'match';
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 10, delay: delay * 0.05 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border cursor-default select-none
        ${isMatch 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-rose-50 text-rose-700 border-rose-200'}`}
    >
      {isMatch ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
      {skill}
    </motion.span>
  );
};

const ScoreGauge = ({ score, label }) => {
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="80" cy="80" r="70"
          stroke="currentColor" strokeWidth="12" fill="transparent"
          className="text-gray-100"
        />
        <motion.circle
          cx="80" cy="80" r="70"
          stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeLinecap="round"
          className={score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}
          initial={{ strokeDasharray: 440, strokeDashoffset: 440 }}
          animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center transform translate-y-1">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-extrabold text-gray-800"
        >
          {score}%
        </motion.span>
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{label}</span>
      </div>
    </div>
  );
};

// --- Main Component ---

// ... imports remain the same ...

export default function ResumeMatcher() {
  // Store the actual FILE objects now, not just text
  const [candidates, setCandidates] = useState([]); 
  const [jobDesc, setJobDesc] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileLabel, setFileLabel] = useState('');

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // We store the raw file object now
    const loadedFiles = files.map(file => ({
      name: file.name,
      file: file // Store the File object directly
    }));

    setCandidates(loadedFiles);
    setFileLabel(`${loadedFiles.length} file(s) selected`);
    setError('');
  };

  const analyzeMatch = async () => {
    if (candidates.length === 0 || !jobDesc.trim()) {
      setError('Please upload resumes and provide a job description.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    const newResults = [];

    try {
      for (const candidate of candidates) {
        // Create FormData to send the file + text
        const formData = new FormData();
        formData.append('resume', candidate.file); // The binary file
        formData.append('job_description', jobDesc);

        const response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          // Do NOT set Content-Type header here; 
          // fetch sets it automatically for FormData (multipart/form-data)
          body: formData 
        });

        if (response.ok) {
          const data = await response.json();
          newResults.push({ ...data, fileName: candidate.name });
        } else {
           console.error("Failed to analyze", candidate.name);
        }
      }

      if (newResults.length === 0) {
        throw new Error('Analysis failed. Check server logs.');
      }
      
      setResults(newResults);
      
    } catch (err) {
      setError('An error occurred. Ensure backend is running and Groq key is valid.');
    } finally {
      setLoading(false);
    }
  };

  
  // Updated to accept a specific result object for export
  const exportReport = (resultData) => {
    if (!resultData) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Resume Analysis Report", 20, 25);
    
    // Candidate Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Candidate: ${resultData.candidate_info.name || 'N/A'}`, 20, 60);
    doc.setFontSize(12);
    doc.text(`Email: ${resultData.candidate_info.email || 'N/A'}`, 20, 70);
    doc.text(`Role: ${resultData.candidate_info.detected_job_title || 'N/A'}`, 20, 80);
    
    // Scores
    doc.setTextColor(0, 100, 0);
    doc.setFontSize(14);
    doc.text(`ATS Match Score: ${resultData.match_analysis.ats_score}%`, 140, 60);
    
    // Recommendations
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("AI Recommendations:", 20, 100);
    
    doc.setFontSize(11);
    resultData.improvements.forEach((rec, i) => {
      const splitText = doc.splitTextToSize(`• ${rec}`, 170);
      doc.text(splitText, 20, 110 + (i * 10));
    });

    const safeName = (resultData.candidate_info.name || "Candidate").replace(/\s+/g, '_');
    doc.save(`${safeName}_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans selection:bg-blue-100 pb-20">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-3xl mix-blend-multiply" />
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-200/40 blur-3xl mix-blend-multiply" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-200/40 blur-3xl mix-blend-multiply" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              Resume Intelligence
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Batch analyze candidates using advanced AI.
            </p>
          </motion.div>
        </header>

        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          {/* Resume Upload - NOW MULTIPLE */}
          <Card delay={0.1} className="flex flex-col h-full group">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Resumes</h2>
            </div>
            
            <div className="relative flex-1 flex flex-col justify-center">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {fileLabel ? <span className="text-blue-600 font-bold">{fileLabel}</span> : "Upload Multiple Files"}
                  </p>
                  <p className="text-sm text-gray-400">Supported: .txt</p>
                </div>
                {/* Added 'multiple' attribute here */}
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".txt,.pdf"  // <--- ALLOW PDF NOW
                  multiple 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
          </Card>

          {/* Job Description */}
          <Card delay={0.2} className="flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Job Description</h2>
            </div>
            <textarea
              className="w-full h-[22rem] flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all outline-none text-sm leading-relaxed"
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </Card>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center justify-center mb-16">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-lg mb-4 border border-rose-100"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={analyzeMatch}
            disabled={loading}
            className={`
              relative overflow-hidden px-12 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-xl hover:shadow-indigo-500/40'}
            `}
          >
            <span className="relative z-10 flex items-center space-x-2">
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze {candidates.length > 0 ? `${candidates.length} Candidates` : 'Batch'}</span>
                </>
              )}
            </span>
          </motion.button>
        </div>

        {/* Results Section - MAPPED FOR BATCH */}
        <div className="space-y-12">
          <AnimatePresence>
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {/* Visual Separator for multiple results */}
                {index > 0 && <div className="w-full h-px bg-gray-300 my-12" />}

                {/* Candidate Header */}
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-800">
                     <span className="text-indigo-600">#{index + 1}</span> {result.candidate_info.name || result.fileName}
                  </h2>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Scores & Candidate Info */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Candidate Card */}
                    <Card className="flex flex-col items-start bg-gradient-to-br from-white to-blue-50">
                      <div className="flex justify-between w-full items-start mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <button 
                          onClick={() => exportReport(result)} // Pass specific result
                          className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-blue-600"
                          title="Export PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{result.candidate_info.name || "Candidate"}</h3>
                      <p className="text-sm text-gray-500 mb-4">{result.candidate_info.email || "No email detected"}</p>
                      
                      <div className="w-full space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Level:</span>
                          <span className="font-semibold text-gray-700">{result.candidate_info.experience_level}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Target Role:</span>
                          <span className="font-semibold text-gray-700">{result.candidate_info.detected_job_title || "N/A"}</span>
                        </div>
                      </div>
                    </Card>

                    {/* ATS Score Gauge */}
                    <Card className="flex flex-col items-center text-center justify-center">
                      <ScoreGauge score={result.match_analysis.ats_score} label="ATS Score" />
                      <div className="mt-6 w-full text-center">
                         <p className="text-sm font-medium text-gray-500 mb-2">Industry Match</p>
                         <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                           result.match_analysis.industry_match === 'High' ? 'bg-green-100 text-green-700' : 
                           result.match_analysis.industry_match === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                         }`}>
                           {result.match_analysis.industry_match} Match
                         </div>
                      </div>
                    </Card>

                    {/* Quality Check */}
                    <Card>
                      <div className="flex items-center space-x-2 mb-4">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-bold text-gray-800">Quality Score</h3>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                         <span className="text-gray-600 text-sm">Grammar & Format</span>
                         <span className="font-bold text-gray-800">{result.quality_check.grammar_score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${result.quality_check.grammar_score}%` }}
                        ></div>
                      </div>
                      {result.quality_check.formatting_issues.length > 0 && (
                        <div className="mt-4 text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100">
                          <strong>Issues:</strong> {result.quality_check.formatting_issues.join(', ')}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Right Column: Skills & Recommendations */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Skills Analysis */}
                    <Card delay={0.2}>
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                        Skill Gap Analysis
                      </h3>
                      
                      <div className="mb-8">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Matched Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.match_analysis.matched_skills.length > 0 ? (
                            result.match_analysis.matched_skills.map((skill, i) => (
                              <SkillBadge key={i} skill={skill} type="match" delay={i} />
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-sm">No direct matches found.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Missing Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.match_analysis.missing_skills.length > 0 ? (
                            result.match_analysis.missing_skills.map((skill, i) => (
                              <SkillBadge key={i} skill={skill} type="missing" delay={i} />
                            ))
                          ) : (
                            <span className="text-emerald-500 font-medium text-sm flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2" /> All required skills found!
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Recommendations */}
                    <Card delay={0.4} className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none">
                      <h3 className="text-xl font-bold mb-6 flex items-center text-white">
                        <Sparkles className="w-5 h-5 mr-2 text-yellow-300" />
                        AI Recommendations
                      </h3>
                      <div className="space-y-4">
                        {result.improvements.map((rec, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors"
                          >
                            <ArrowRight className="w-5 h-5 mt-0.5 mr-3 text-yellow-300 flex-shrink-0" />
                            <p className="text-indigo-50 text-sm leading-relaxed">{rec}</p>
                          </motion.div>
                        ))}
                      </div>
                    </Card>

                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}