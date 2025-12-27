import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ScrollBackground() {
  const { scrollYProgress } = useScroll();

  // 1. Color Shift: Morphs background color based on scroll %
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#f8fafc", "#eef2ff", "#fdf2f8"] // Slate-50 -> Indigo-50 -> Pink-50
  );

  // 2. Parallax Movements (Blobs move at different speeds)
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]); // Fast Up
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]); // Slow Up
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -50]);  // Very Slow
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 180]); // Rotation

  return (
    <motion.div 
      style={{ backgroundColor }}
      className="fixed inset-0 w-full h-full -z-50 overflow-hidden"
    >
      {/* Grainy Texture for detail */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

      {/* Blob 1: Top Left - Purple */}
      <motion.div
        style={{ y: y1, rotate }}
        className="absolute -top-20 -left-20 w-[40rem] h-[40rem] bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"
      />

      {/* Blob 2: Top Right - Indigo */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-0 -right-20 w-[35rem] h-[35rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"
      />

      {/* Blob 3: Bottom Center - Pink (Appears as you scroll down) */}
      <motion.div
        style={{ y: y3, x: "-50%" }}
        className="absolute bottom-[-10%] left-1/2 w-[50rem] h-[50rem] bg-pink-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"
      />
    </motion.div>
  );
}