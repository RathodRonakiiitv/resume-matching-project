import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { jsPDF } from "jspdf";
import {
  Upload, FileText, Briefcase, CheckCircle, XCircle,
  Activity, Sparkles, AlertCircle, Download,
  Layout, Clock, ChevronRight
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import TiltCard from './TiltCard';

const API_URL = 'http://localhost:5000';

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-50">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <XCircle className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);


// --- Premium UI Components ---
const SkillCategory = ({ title, skills, type, delay }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay * 0.1 }}
      className="mb-6"
    >
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => <SkillBadge key={i} skill={s} type={type} delay={i} />)}
      </div>
    </motion.div>
  );
};

const InsightBadge = ({ icon: Icon, label, value, colorClass }) => (
  <div className="flex items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
    <div className={`p-2 rounded-lg ${colorClass} mr-4`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  </div>
);


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
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
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
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
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

// --- Roadmap Modal ---
const RoadmapModal = ({ missingSkills }) => {
  if (!missingSkills?.length) return <p className="text-slate-500 italic">No missing skills found. You're ready!</p>;
  return (
    <div className="space-y-8">
      {missingSkills.slice(0, 3).map((skill, i) => (
        <div key={i} className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            {i + 1}
          </div>
          <h4 className="font-bold text-slate-900 mb-2">{skill}</h4>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase mb-1">Beginner</p>
              <p className="text-sm text-slate-600">Documentation & Introduction Tutorials (2-3 days)</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase mb-1">Intermediate</p>
              <p className="text-sm text-slate-600">Build a small CRUD application or integration (1 week)</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Interview Modal ---
const InterviewModal = ({ questions }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  if (!questions?.length) return null;

  return (
    <div className="space-y-8 text-center py-4">
      <div className="flex justify-center mb-6">
        <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full font-bold text-sm flex items-center">
          <Clock className="w-4 h-4 mr-2" /> 0:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="min-h-[120px] flex items-center justify-center"
        >
          <p className="text-xl font-bold text-slate-800 leading-relaxed italic">
            "{questions[currentIdx]}"
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-between items-center pt-8 border-t border-slate-50">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentIdx + 1} / {questions.length}</span>
        <button
          onClick={() => { setCurrentIdx((prev) => (prev + 1) % questions.length); setTimeLeft(120); }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20"
        >
          Next Question
        </button>
      </div>
    </div>
  );
};

// --- Main Application ---
export default function ResumeMatcher() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [showModal, setShowModal] = useState(null); // 'roadmap' | 'interview'
  const [modalData, setModalData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jobDesc, setJobDesc] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
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
        setLoadingStage(`Parsing ${candidate.name}...`);
        const formData = new FormData();
        formData.append('resume_file', candidate.file);
        formData.append('job_description', jobDesc);

        setLoadingStage(`Analyzing skills for ${candidate.name}...`);
        const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Server error');

        setLoadingStage(`Calculating match for ${candidate.name}...`);
        newResults.push({ ...data, fileName: candidate.name });
      }
      setResults(newResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const exportReport = (result) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Resume intelligence Report", margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Candidate: ${result.fileName}`, margin, y);
    y += 8;
    doc.text(`Analysis Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    // Overall Score
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(margin, y, 170, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`Match Score: ${Math.round(result.matchScore)}%`, margin + 5, y + 10);
    y += 25;

    // Details Grid
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`Experience Level: ${result.experienceLevel}`, margin, y);
    doc.text(`Tone: ${result.tone}`, margin + 80, y);
    y += 10;
    doc.text(`Structural Score: ${result.structureScore}%`, margin, y);
    y += 20;

    // Skills
    doc.setFontSize(14);
    doc.text("Matched Skills", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const matched = result.matchedSkills.join(", ");
    const matchedLines = doc.splitTextToSize(matched, 170);
    doc.text(matchedLines, margin, y);
    y += (matchedLines.length * 5) + 10;

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Missing Skills", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const missing = result.missingSkills.join(", ");
    if (missing) {
      const missingLines = doc.splitTextToSize(missing, 170);
      doc.text(missingLines, margin, y);
      y += (missingLines.length * 5) + 10;
    } else {
      doc.text("Perfect match!", margin, y);
      y += 10;
    }

    // Recommendations
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Recommendations", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    result.recommendations.forEach(rec => {
      const recLines = doc.splitTextToSize(`• ${rec}`, 170);
      doc.text(recLines, margin, y);
      y += (recLines.length * 5) + 2;
    });

    doc.save(`${result.fileName.split('.')[0]}_Intelligence_Report.pdf`);
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
                {loading ? (
                  <div className="flex flex-col items-center">
                    <Activity className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-xs font-bold tracking-widest uppercase opacity-50">{loadingStage}</span>
                  </div>
                ) : (
                  <div className="flex items-center"><Sparkles className="w-5 h-5 mr-2" /> Match Intelligence</div>
                )}
              </motion.button>
            </div>


            {/* Results Section */}
            <div className="space-y-12">
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative"
                  >
                    {/* Sticky Header for this result */}
                    <div className="sticky top-4 z-30 mb-8">
                      <div className="glass px-6 py-4 rounded-2xl flex items-center justify-between shadow-indigo-500/5">
                        <div className="flex items-center">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold mr-3">{index + 1}</span>
                          <h2 className="text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{result.fileName}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="hidden md:flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold">
                            {Math.round(result.matchScore)}% Match
                          </div>
                          <button onClick={() => exportReport(result)} className="cursor-hover flex items-center px-4 py-2 bg-white rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm text-sm font-bold">
                            <Download className="w-4 h-4 mr-2" /> PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                      {/* Left Column: Visual Scores & Metadata */}
                      <div className="lg:col-span-4 space-y-8">
                        <TiltCard className="flex flex-col items-center justify-center bg-white/80 p-8">
                          <ScoreGauge score={result.matchScore} label="Overall Match" />
                          <div className="w-full mt-8 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <Layout className="w-4 h-4 mr-2" /> Structural Score
                              </span>
                              <span className="font-black text-indigo-600">{result.structureScore}%</span>
                            </div>
                          </div>
                        </TiltCard>

                        <div className="grid gap-4">
                          <InsightBadge
                            icon={Briefcase}
                            label="Experience Level"
                            value={result.experienceLevel}
                            colorClass="bg-indigo-50 text-indigo-600"
                          />
                          <InsightBadge
                            icon={Activity}
                            label="Tone Analysis"
                            value={result.tone}
                            colorClass="bg-violet-50 text-violet-600"
                          />
                        </div>
                      </div>

                      {/* Right Column: Detailed Breakdown */}
                      <div className="lg:col-span-8 space-y-8">
                        {/* Skills Bento Box */}
                        <TiltCard className="bg-white/80">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-900 flex items-center text-lg uppercase tracking-tight">
                              <Sparkles className="w-5 h-5 text-indigo-500 mr-2" /> Skill Intelligence
                            </h3>
                          </div>

                          <div className="grid md:grid-cols-2 gap-12">
                            <div>
                              <div className="flex items-center mb-6">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h4 className="font-bold text-slate-800">Core Strengths</h4>
                              </div>
                              {Object.entries(result.matchedCategorized || {}).map(([cat, skills], i) => (
                                <SkillCategory key={cat} title={cat} skills={skills} type="match" delay={i} />
                              ))}
                            </div>
                            <div>
                              <div className="flex items-center mb-6">
                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                                  <XCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <h4 className="font-bold text-slate-800">Skill Gaps</h4>
                              </div>
                              {Object.entries(result.missingCategorized || {}).map(([cat, skills], i) => (
                                <SkillCategory key={cat} title={cat} skills={skills} type="missing" delay={i} />
                              ))}
                            </div>
                          </div>
                        </TiltCard>

                        {/* Actionable Recommendations */}
                        <div className="grid md:grid-cols-2 gap-8">
                          {/* Improvement Tips Card */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="custom-card"
                          >
                            <h3 className="custom-card-title">
                              <AlertCircle className="w-5 h-5 text-[#b671d6] mr-2" /> Improvement Tips
                            </h3>
                            <div className="custom-card-des space-y-3">
                              {result.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start group">
                                  <ChevronRight className="w-4 h-4 text-[#b671d6] mt-0.5 mr-2" />
                                  <span>{rec}</span>
                                </div>
                              ))}
                            </div>
                            <div
                              className="custom-card-button"
                              onClick={() => { setShowModal('roadmap'); setModalData(result.missingSkills); }}
                            >
                              Explore More <span className="arrow-icon">→</span>
                            </div>
                          </motion.div>

                          {/* Interview Prep Card */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="custom-card"
                          >
                            <h3 className="custom-card-title">
                              <Clock className="w-5 h-5 text-[#b671d6] mr-2" /> Interview Prep
                            </h3>
                            <div className="custom-card-des space-y-3">
                              {result.interviewQuestions?.map((q, i) => (
                                <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5 italic">
                                  "{q}"
                                </div>
                              ))}
                            </div>
                            <div
                              className="custom-card-button"
                              onClick={() => { setShowModal('interview'); setModalData(result.interviewQuestions); }}
                            >
                              Practice <span className="arrow-icon">→</span>
                            </div>
                          </motion.div>




                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={!!showModal}
        onClose={() => setShowModal(null)}
        title={showModal === 'roadmap' ? 'Personalized Skill Roadmap' : 'Interview Practice Session'}
      >
        {showModal === 'roadmap' && <RoadmapModal missingSkills={modalData} />}
        {showModal === 'interview' && <InterviewModal questions={modalData} />}
      </Modal>

    </div>
  );
}
