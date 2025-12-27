import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { jsPDF } from "jspdf";
// Removed unused 'getHistory' import
import { 
  Upload, FileText, Briefcase, CheckCircle, XCircle, 
  Activity, Sparkles, AlertCircle, Download, 
  Layout, Clock, ChevronRight // Removed 'History' and 'BarChart'
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import TiltCard from './TiltCard';

const API_URL = 'http://localhost:5000';

// --- Typing Effect Component ---
const TypingText = ({ text }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.04 * i },
    }),
  };
  const child = {
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 20 },
  };

  return (
    <motion.div style={{ display: "inline-block" }} variants={container} initial="hidden" animate="visible">
      {letters.map((letter, index) => (
        <motion.span variants={child} key={index} style={{ display: "inline-block", marginRight: letter === " " ? "0.3em" : "0" }}>
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

// --- Standard UI Components ---
const SkillBadge = ({ skill, type, delay }) => {
  const isMatch = type === 'match';
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, delay: delay * 0.05 }}
      whileHover={{ scale: 1.1, rotate: Math.random() * 4 - 2 }}
      className={`cursor-hover inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm cursor-default border transition-colors
        ${isMatch 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
          : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'}`}
    >
      {isMatch ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
      {skill}
    </motion.span>
  );
};

// --- Sub-Views ---
const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-slate-400 animate-pulse">Loading history...</div>;

  return (
    <motion.div className="grid gap-4">
      {history.map((item, i) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02, x: 10 }}
          className="cursor-hover bg-white/80 p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between"
        >
          <div>
            <div className="flex items-center mb-1">
              <FileText className="w-4 h-4 text-indigo-500 mr-2" />
              <h3 className="font-bold text-slate-800">{item.filename}</h3>
            </div>
            <p className="text-xs text-slate-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(item.timestamp).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
             <p className={`text-xl font-black ${item.match_score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {Math.round(item.match_score)}%
             </p>
          </div>
        </motion.div>
      ))}
      {history.length === 0 && <div className="text-center py-20 text-slate-400">No scan history found.</div>}
    </motion.div>
  );
};

// --- Main Application ---
export default function ResumeMatcher() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [candidates, setCandidates] = useState([]); 
  const [jobDesc, setJobDesc] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Scroll Progress Bar Logic
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const loadedFiles = files.map(file => ({ name: file.name, file: file }));
    setCandidates(loadedFiles);
    setError('');
  };

  const analyzeMatch = async () => {
    if (candidates.length === 0) return setError('Please upload a resume PDF.');
    if (!jobDesc.trim()) return setError('Please paste the Job Description.');

    setLoading(true);
    setError('');
    setResults([]);
    const newResults = [];

    try {
      for (const candidate of candidates) {
        const formData = new FormData();
        formData.append('resume_file', candidate.file);
        formData.append('job_description', jobDesc);

        const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: formData });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Server error');
        newResults.push({ ...data, fileName: candidate.name });
      }
      setResults(newResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (result) => {
    const doc = new jsPDF();
    doc.text(`Analysis: ${result.fileName}`, 20, 20);
    doc.text(`Match Score: ${result.matchScore}%`, 20, 30);
    doc.save(`${result.fileName}_Report.pdf`);
  };

  return (
    <div className="min-h-screen relative bg-transparent pb-32">
      
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-indigo-600 origin-left z-50" style={{ scaleX }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-2xl flex space-x-2 border border-white/40 shadow-sm">
            {['analyze', 'history'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-hover px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'history' ? (
          <div className="max-w-4xl mx-auto"><HistoryView /></div>
        ) : (
          <>
            {/* Header Text (Typing Effect) */}
            <div className="text-center mb-16">
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 drop-shadow-sm">
                <TypingText text="Resume Intelligence" />
              </h1>
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 1 }} 
                className="text-xl text-slate-600 max-w-2xl mx-auto"
              >
                AI-Powered Skill Matching & Structural Analysis
              </motion.p>
            </div>

            {/* Input Section - Using 3D Tilt Cards */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              
              {/* UPLOAD CARD */}
              <div className="lg:col-span-5 h-full">
                <TiltCard className="h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="p-4 bg-indigo-50 rounded-full mb-4">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Resume</h3>
                    <p className="text-sm text-slate-500 mb-6">PDF format supported</p>
                    <label className="cursor-hover relative px-6 py-3 bg-white border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
                      <span className="text-indigo-600 font-bold">{candidates.length ? `${candidates.length} Files` : 'Choose File'}</span>
                      <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileUpload} />
                    </label>
                  </div>
                </TiltCard>
              </div>

              {/* JOB DESC CARD */}
              <div className="lg:col-span-7 h-full">
                <TiltCard className="h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <Briefcase className="w-5 h-5 text-violet-600" />
                    <h3 className="font-bold text-slate-800">Job Description</h3>
                  </div>
                  <textarea
                    className="cursor-hover w-full h-full min-h-[200px] p-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none text-slate-600"
                    placeholder="Paste the job requirements here..."
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                  />
                </TiltCard>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center justify-center mb-24">
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center space-x-2 text-rose-600 bg-rose-50 px-6 py-3 rounded-xl mb-6 border border-rose-100">
                    <AlertCircle className="w-5 h-5" /><span className="font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={analyzeMatch} 
                disabled={loading}
                className={`cursor-hover px-12 py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-indigo-500/30'}`}
              >
                {loading ? <Activity className="w-6 h-6 animate-spin" /> : <div className="flex items-center"><Sparkles className="w-5 h-5 mr-2" /> Analyze Now</div>}
              </motion.button>
            </div>

            {/* Results Section */}
            <div className="space-y-12">
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-6 px-2">
                       <h2 className="text-3xl font-bold text-slate-800 flex items-center">
                         <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white text-lg mr-4">{index + 1}</span>
                         {result.fileName}
                       </h2>
                       <button onClick={() => exportReport(result)} className="cursor-hover flex items-center px-4 py-2 bg-white rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm"><Download className="w-4 h-4 mr-2" /> PDF</button>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-4 space-y-6">
                        <TiltCard className="flex flex-col items-center justify-center bg-white/80">
                          <ScoreGauge score={result.matchScore} label="Match Score" />
                          <div className="w-full mt-6 pt-6 border-t border-slate-100 flex justify-between">
                             <span className="text-slate-500 font-medium flex items-center"><Layout className="w-4 h-4 mr-2" /> Structure</span>
                             <span className="font-bold text-slate-800">{result.structureScore}%</span>
                          </div>
                        </TiltCard>
                      </div>

                      <div className="lg:col-span-8 space-y-6">
                        <TiltCard>
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Activity className="w-5 h-5 text-indigo-500 mr-2" /> Skills Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Matched</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.matchedSkills.length > 0 ? result.matchedSkills.map((s, i) => <SkillBadge key={i} skill={s} type="match" delay={i} />) : <span className="text-sm text-slate-400 italic">None</span>}
                              </div>
                            </div>
                            <div>
                               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Missing</h4>
                               <div className="flex flex-wrap gap-2">
                                {result.missingSkills.length > 0 ? result.missingSkills.map((s, i) => <SkillBadge key={i} skill={s} type="missing" delay={i} />) : <span className="text-emerald-600 font-bold text-sm">Perfect match!</span>}
                              </div>
                            </div>
                          </div>
                        </TiltCard>
                        
                        
                        {/* Recommendations */}
                        {/* CHANGE IS HERE: Removed the dark background classes entirely */}
                        <TiltCard className="bg-white/80 border border-white/60">
                          {/* Update text color to slate-800 (Dark) instead of White */}
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <Sparkles className="w-5 h-5 text-indigo-500 mr-2" /> AI Recommendations
                          </h3>
                          <div className="space-y-3">
                            {result.recommendations.map((rec, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ x: -20, opacity: 0 }} 
                                animate={{ x: 0, opacity: 1 }} 
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                // Update inner items to be light gray
                                className="flex items-start p-3 rounded-lg bg-slate-50 border border-slate-200"
                              >
                                <ChevronRight className="w-5 h-5 text-indigo-500 mt-0.5 mr-2 shrink-0" />
                                <p className="text-slate-600 text-sm">{rec}</p>
                              </motion.div>
                            ))}
                          </div>
                        </TiltCard>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}