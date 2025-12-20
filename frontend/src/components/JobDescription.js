import React from "react";

export default function JobDescription({ jobDesc, setJobDesc }) {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-bold mb-2">Job Description</label>
      <textarea
        rows="6"
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm resize-none text-gray-700"
        placeholder="Paste the job description here to analyze requirements..."
        required
      ></textarea>
    </div>
  );
}
