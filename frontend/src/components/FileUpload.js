import React from "react";
import { Upload } from 'lucide-react';

export default function FileUpload({ onUpload }) {
  const handleFileChange = (e) => {
    // 1. Get all files, not just the first one
    const files = Array.from(e.target.files); 
    
    if (files.length > 0) {
      // 2. Pass the entire array to the parent component
      onUpload(files); 
    }
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm text-gray-500 text-center">
            <span className="font-semibold text-blue-600">Click to upload</span> multiple resumes
            <br/>(TXT format)
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".txt" 
          multiple  // <--- KEY CHANGE: Allows selecting multiple files
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
}