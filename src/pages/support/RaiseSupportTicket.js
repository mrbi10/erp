import React, { useState, useRef, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select"; // npm install react-select
import { motion, AnimatePresence } from "framer-motion"; // npm install framer-motion
import { 
  FaTicketAlt, 
  FaCloudUploadAlt, 
  FaPaperPlane, 
  FaSpinner, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaTimes,
  FaFileImage,
  FaLifeRing,
  FaShieldAlt
} from "react-icons/fa";

import { BASE_URL } from "../../constants/API";

// --- STYLING CONFIGURATION ---

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '50px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    paddingLeft: '4px',
    transition: 'all 0.2s',
    '&:hover': { borderColor: '#93c5fd' }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    padding: '10px 15px',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8'
  })
};

// Priority Configuration with Colors
const PRIORITY_OPTIONS = [
  { value: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', active: 'ring-emerald-500 bg-emerald-50' },
  { value: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200', active: 'ring-blue-500 bg-blue-50' },
  { value: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200', active: 'ring-orange-500 bg-orange-50' },
  { value: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', active: 'ring-red-500 bg-red-50' }
];

export default function RaiseSupportTicket() {
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  // --- STATE ---
  const [form, setForm] = useState({
    subject: "",
    module: null, // Changed to object for React Select
    description: "",
    priority: "Medium"
  });
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // --- OPTIONS ---
  const moduleOptions = useMemo(() => [
    { value: "Login", label: "Login & Authentication" },
    { value: "Attendance", label: "Attendance Tracking" },
    { value: "Marks", label: "Marks & Grading" },
    { value: "Exam", label: "Examination Module" },
    { value: "Other", label: "Other / General Inquiry" },
  ], []);

  // --- HANDLERS ---

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) { // 5MB Limit check (Optional UX improvement)
        Swal.fire("File too large", "Please upload an image smaller than 5MB", "warning");
        return;
      }
      setFile(selected);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "image/png" || droppedFile.type === "image/jpeg")) {
      setFile(droppedFile);
    } else {
      Swal.fire("Invalid File", "Please drop a PNG or JPEG image.", "warning");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject || !form.module || !form.description) {
      Swal.fire("Missing Information", "Please fill in all required fields.", "warning");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the Ticket
      const payload = {
        ...form,
        module: form.module.value // Extract value from React Select object
      };

      // Using Fetch (as per original logic, but wrapped cleanly)
      const res = await fetch(`${BASE_URL}/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create ticket");

      // 2. Upload File (if exists)
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${BASE_URL}/support/${data.ticket_id}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error("Ticket created, but file upload failed.");
      }

      // 3. Success State
      Swal.fire({
        icon: 'success',
        title: 'Ticket #'+ (data.ticket_id || 'Submitted'),
        text: 'Your support request has been logged successfully.',
        confirmButtonColor: '#3b82f6'
      });

      // Reset
      setForm({
        subject: "",
        module: null,
        description: "",
        priority: "Medium"
      });
      setFile(null);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err.message || "An unexpected error occurred.",
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === LEFT COLUMN: FORM === */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaTicketAlt className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl text-white font-bold">New Support Ticket</h2>
                <p className="text-blue-100 text-sm opacity-90">Describe your issue and we'll help you resolve it.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              {/* Subject & Module */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief summary of the issue..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Affected Module</label>
                  <Select
                    options={moduleOptions}
                    value={form.module}
                    onChange={(val) => setForm({ ...form, module: val })}
                    styles={customSelectStyles}
                    placeholder="Select Module..."
                    isSearchable
                  />
                </div>
              </div>

              {/* Priority Selector (Visual) */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                  Priority Level <span className="text-xs font-normal text-slate-400">(Select one)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, priority: opt.value })}
                      className={`
                        py-2 px-3 rounded-lg border text-sm font-bold transition-all
                        ${form.priority === opt.value 
                          ? `${opt.color} ring-2 ring-offset-1 ${opt.active}` 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
                      `}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Detailed Description</label>
                <textarea
                  placeholder="Please provide steps to reproduce the issue, expected results, and actual results..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                  required
                />
              </div>

              {/* File Upload (Drag & Drop) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Screenshot (Optional)</label>
                
                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
                      ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                    `}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/png,image/jpeg"
                      onChange={handleFileChange}
                    />
                    <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
                      <FaCloudUploadAlt className="text-2xl" />
                    </div>
                    <p className="text-slate-600 font-medium">Click or Drag & Drop to Upload</p>
                    <p className="text-xs text-slate-400 mt-1">PNG or JPG (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FaFileImage className="text-blue-500 text-xl" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                    ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-200'}
                  `}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Submit Ticket
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>

        {/* === RIGHT COLUMN: GUIDELINES === */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Guidelines Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FaLifeRing className="text-blue-500" /> Support Guidelines
            </h3>
            
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-1 min-w-[20px]"><FaCheckCircle className="text-emerald-500" /></span>
                <span><strong>Be Specific:</strong> "Login failed" is hard to fix. "Login failed with Error 500 at 10 AM" is helpful.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-1 min-w-[20px]"><FaCheckCircle className="text-emerald-500" /></span>
                <span><strong>Screenshots:</strong> Always attach a screenshot of the error message if possible.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-1 min-w-[20px]"><FaCheckCircle className="text-emerald-500" /></span>
                <span><strong>One Issue Per Ticket:</strong> Please raise separate tickets for different problems.</span>
              </li>
            </ul>
          </div>

        
        </div>

      </div>
    </div>
  );
}