import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaHome, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-y-hidden bg-[#F8FAFC] flex items-center justify-center p-6 font-sans text-slate-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative"
      >
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-10 text-center">

          {/* Icon / visual */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 mb-6 shadow-sm">
            <FaExclamationTriangle className="text-3xl" />
          </div>

          {/* Typography */}
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            The page you are looking for doesn't exist or has been moved.
            Please double-check the URL or navigate back.
          </p>

          {/* Action Grid */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">

            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <FaArrowLeft className="text-sm" />
              Go Back
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <FaHome className="text-sm" />
              Home
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-all active:scale-95"
            >
              <FaRedo className="text-sm" />
              Reload
            </button>

          </div>
        </div>

        {/* Footer Hint */}
        <div className="bg-slate-50 py-4 px-10 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            Error Code: 404
          </p>
        </div>
      </motion.div>
    </div>
  );
}