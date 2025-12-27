import React from 'react';
import { motion } from 'framer-motion';

const ScoreGauge = ({ score, label, color = "default" }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const roundedScore = Math.round(score);
  const offset = circumference - (roundedScore / 100) * circumference;
  
  let colorClass = "text-rose-500";
  if (roundedScore >= 70) colorClass = "text-emerald-500";
  else if (roundedScore >= 50) colorClass = "text-amber-500";
  if (color === "blue") colorClass = "text-indigo-500";

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Background Circle */}
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
        <motion.circle
          cx="96" cy="96" r={radius}
          stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeLinecap="round"
          className={colorClass}
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>

      {/* --- CONTENT CONTAINER --- */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        
        {/* 1. NUMBER: Pushed UP by 5px and Line-Height set to 1 (leading-none) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`text-3xl font-extrabold leading-none ${colorClass} -translate-y-1`} 
        >
          {roundedScore}%
        </motion.div>
        
        {/* 2. LABEL: Pushed DOWN by 5px (translate-y-2) */}
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest translate-y-2">
          {label}
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;