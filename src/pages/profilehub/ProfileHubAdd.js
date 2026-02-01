import React, { useEffect, useState, useCallback, useRef } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaCheckCircle,
  FaInfoCircle,
  FaSpinner,
  FaLayerGroup,
  FaHeading,
  FaAlignLeft,
  FaSave,
  FaPlusCircle
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";

// ---------------------------
// Styles & Utils
// ---------------------------

// Apple-style Select Styles (From your Style Guide)
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    padding: "2px 4px",
    borderColor: state.isFocused ? "#3b82f6" : "transparent",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    "&:hover": { borderColor: "#cbd5e1" },
    fontSize: "0.9rem",
    minHeight: "42px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    fontSize: "0.9rem",
  }),
};

// ---------------------------
// Main Component
// ---------------------------

export default function ProfileHubAdd() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- STATE ---
  const [activityTypes, setActivityTypes] = useState([]);
  const [activityType, setActivityType] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // --- FETCH TYPES ---
  useEffect(() => {
    setIsLoadingTypes(true);
    fetch(`${BASE_URL}/profilehub/activity-types`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setActivityTypes(
          data.map(t => ({
            value: t.activity_type_id,
            label: t.name,
          }))
        );
      })
      .catch(() => {
        Swal.fire("Error", "Failed to load activity types", "error");
      })
      .finally(() => setIsLoadingTypes(false));
  }, [token]);

  // --- FILE HANDLING ---
  const validateAndSetFiles = (newFiles) => {
    const totalFiles = [...files, ...newFiles];

    if (totalFiles.length > 2) {
      Swal.fire("Limit Exceeded", "You can upload a maximum of 2 files.", "warning");
      return;
    }

    const oversized = newFiles.some(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      Swal.fire("File Too Large", "One or more files exceed the 10MB limit.", "warning");
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  }, [files]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT ---
  const handleSave = async () => {
    // Validation
    if (!activityType) return Swal.fire("Missing Info", "Please select an activity type.", "warning");
    if (!title.trim()) return Swal.fire("Missing Info", "Activity title is required.", "warning");

    setIsProcessing(true);

    try {
      // 1. Create Activity
      const res = await fetch(`${BASE_URL}/profilehub/activity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          activity_type_id: activityType.value,
          title,
          description,
          start_date: startDate || null,
          end_date: endDate || null
        })
      });

      if (!res.ok) throw new Error("Failed to create activity record.");
      const activity = await res.json();

      // 2. Upload Files
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch(
          `${BASE_URL}/profilehub/activity/${activity.activity_id}/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd
          }
        );
        if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`);
      }

      // Success
      await Swal.fire({
        title: "Success",
        text: "Activity submitted successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/profilehub/activities");

    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "Something went wrong", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8 relative z-10"
      >

        {/* --- HEADER --- */}
        <div className="flex items-center gap-4">
          <div
            className="p-3 bg-white rounded-xl shadow-sm border border-black-100 text-black-400 "
          >
            <FaPlusCircle />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              New Activity Entry
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Fill in the details to add to your portfolio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* --- LEFT COLUMN: FORM (Span 8) --- */}
          <div className="lg:col-span-8 space-y-6">

            {/* Card 1: Basic Info */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FaLayerGroup />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Core Details</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Activity Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={activityTypes}
                    value={activityType}
                    onChange={setActivityType}
                    placeholder="Select Classification..."
                    isLoading={isLoadingTypes}
                    styles={selectStyles}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaHeading className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. 1st Prize in Hackathon"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <div className="relative">
                    <FaAlignLeft className="absolute left-4 top-4 text-gray-400" />
                    <textarea
                      rows={4}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the activity, your role, and the outcome..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Timeline */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FaCalendarAlt />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Timeline</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 font-medium cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 font-medium cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Evidence */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FaCloudUploadAlt />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Proofs & Attachments</h2>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
                  ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}
                `}
              >
                <input
                  type="file"
                  multiple
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) validateAndSetFiles(Array.from(e.target.files));
                  }}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-blue-500 text-2xl">
                    <FaCloudUploadAlt />
                  </div>
                  <p className="text-slate-800 font-bold text-lg">Click to upload or drag & drop</p>
                  <p className="text-slate-400 text-sm mt-1">PDF, JPG, PNG (Max 10MB)</p>
                </label>
              </div>

              {/* File List */}
              <AnimatePresence>
                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
                            <FaFileAlt />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* --- RIGHT COLUMN: ACTIONS (Span 4) --- */}
          <div className="lg:col-span-4 space-y-6">

            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 sticky top-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <FaSpinner />
                    </motion.div>
                  ) : (
                    <FaSave />
                  )}
                  {isProcessing ? "Processing..." : "Submit Activity"}
                </button>

                <button
                  onClick={() => navigate(-1)}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <FaInfoCircle className="text-blue-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-500 leading-relaxed">
                    <strong className="text-slate-800">Note:</strong> Submissions are reviewed by your Class Advisor. You can check the status of the entry anytime.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}