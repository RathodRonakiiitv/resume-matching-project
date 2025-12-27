import React from 'react';
import ResumeMatcher from '../components/ResumeMatcher';
import ScrollBackground from '../components/ScrollBackground';
import CustomCursor from '../components/CustomCursor'; // Import Cursor

const Home = () => {
  return (
    <main className="relative min-h-screen w-full cursor-none"> {/* Hide default cursor */}
      
      {/* 1. Custom Cursor */}
      <CustomCursor />

      {/* 2. Background Layer */}
      <ScrollBackground />

      {/* 3. Content Layer */}
      <div className="relative z-10">
        <ResumeMatcher />
      </div>
    </main>
  );
};

export default Home;