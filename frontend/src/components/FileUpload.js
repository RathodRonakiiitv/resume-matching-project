import React, { useState } from "react";

export default function FileUpload({ setResume }) {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResume(file);
      setFileName(file.name);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-bold mb-2">Upload Resume</label>
      <div className="relative border-2 border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer group">
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        required
      />
        <div className="text-center pointer-events-none">
          <svg
            className="mx-auto h-12 w-12 text-blue-400 group-hover:text-blue-600 transition-colors"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-1 text-sm text-gray-600 group-hover:text-gray-800">
            {fileName ? <span className="font-semibold text-blue-700">{fileName}</span> : "Click or drag to upload PDF/Image"}
          </p>
        </div>
      </div>
    </div>
  );
}
