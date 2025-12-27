import { motion } from "framer-motion";

export default function UploadCard({ onSubmit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border"
    >
      <h2 className="text-xl font-semibold mb-4">
        Upload Resume & Job Description
      </h2>

      <input
        type="file"
        accept=".pdf,.txt"
        className="w-full mb-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
      />

      <textarea
        placeholder="Paste job description here..."
        className="w-full h-40 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
      />

      <button
        onClick={onSubmit}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition"
      >
        Analyze Resume
      </button>
    </motion.div>
  );
}
