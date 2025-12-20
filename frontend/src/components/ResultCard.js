import React from "react";

export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="bg-white p-6 mt-8 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-gray-500 font-medium uppercase tracking-wide text-sm">Match Score</h2>
        <div className="text-5xl font-extrabold text-blue-600 mt-2">{result.match_percentage}%</div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-8 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${result.match_percentage}%` }}
        ></div>
      </div>

      {/* Matched skills */}
      <h3 className="font-bold text-gray-800 text-lg flex items-center">
        ✅ Matched Skills
      </h3>
      <div className="flex flex-wrap mt-3 mb-6 gap-2">
        {result.matched_skills && result.matched_skills.length > 0 ? (
          result.matched_skills.map((skill, i) => (
            <span
              key={i}
              className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium border border-green-200"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-gray-500 text-sm italic">No matched skills found</span>
        )}
      </div>

      {/* Missing skills */}
      <h3 className="font-bold text-gray-800 text-lg flex items-center">
        ⚠️ Missing Skills
      </h3>
      <div className="flex flex-wrap mt-3 gap-2">
        {result.missing_skills && result.missing_skills.length > 0 ? (
          result.missing_skills.map((skill, i) => (
            <span
              key={i}
              className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium border border-red-100"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-gray-500 text-sm italic">No missing skills detected</span>
        )}
      </div>
    </div>
  );
}
