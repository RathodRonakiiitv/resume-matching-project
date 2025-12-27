// src/components/CustomCursor.jsx
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Physics-based spring for smooth trailing
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16); // Center the 32px cursor
      cursorY.set(e.clientY - 16);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Check if hovering over clickable elements
    const handleMouseOver = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.cursor-hover')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Main Ring */}
      <motion.div
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
        }}
        className={`fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-indigo-500 pointer-events-none z-[9999] transition-all duration-200 ease-out
          ${isHovering ? 'scale-150 bg-indigo-500/10 border-indigo-600' : 'scale-100'}
        `}
      />
      {/* Center Dot (No lag) */}
      <div 
        style={{ left: mousePosition.x, top: mousePosition.y }}
        className="fixed w-2 h-2 bg-indigo-600 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
}