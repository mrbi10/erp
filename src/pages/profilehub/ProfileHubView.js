import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaUserGraduate,
  FaCalendarAlt,
  FaFileAlt,
  FaDownload,
  FaSpinner,
  FaClipboardList,
  FaLayerGroup,
  FaClock,
  FaPenNib
} from "react-icons/fa";

import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { formatIST } from "../../constants/dateUtils";

const getDeptName = (id) => DEPT_MAP[id] || `Dept ${id}`;
const getClassName = (id) => CLASS_MAP[id] || `Class ${id}`;


// ---------------------------
// Helpers & Config
// ---------------------------

const getInitials = (str) => {
  if (!str) return "ST";

  const last3 = str.slice(-3);

  if (last3.startsWith("0")) {
    return last3.slice(-2);
  }

  return last3;
};


const formatDateSafe = (dateString) => {
  if (!dateString) return "N/A";
  // Assuming dateString is ISO or YYYY-MM-DD. 
  // We create a Date object and pass it to your formatIST util.
  const dateObj = new Date(dateString);
  return isNaN(dateObj.getTime()) ? dateString : formatIST(dateObj).split(',')[0]; // Just the date part if formatIST includes time
};

// ---------------------------
// Sub-Components
// ---------------------------

// 1. Insight Pill (Stats)
const InsightPill = ({ label, count, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
    className="bg-white px-5 py-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4 min-w-[180px] hover:shadow-lg transition-all duration-300"
  >
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split("-")[1]}-600`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xl font-extrabold text-slate-800">{count}</p>
    </div>
  </motion.div>
);

// 2. Review Card
const ReviewCard = ({ activity, role, onVerify, onReject, index }) => {
  const files = (activity.files || []).filter(Boolean);
  const [remarks, setRemarks] = useState("");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="group bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 flex flex-col"
    >
      {/* --- Student Header --- */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
          {getInitials(activity.register_no)}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 leading-none">
            {activity.student_name}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {activity.register_no}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {role === "Principal" && (
              <>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                  {getDeptName(activity.dept_id)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 uppercase tracking-wide">
                  {getClassName(activity.class_id)}
                </span>
              </>
            )}

            {role === "HOD" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 uppercase tracking-wide">
                {getClassName(activity.class_id)}
              </span>
            )}

          </div>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 border border-gray-200">
            {activity.activity_type}
          </span>
        </div>
      </div>

      {/* --- Activity Content --- */}
      <div className="flex-grow space-y-3">
        <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
          {activity.title}
        </h3>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 p-2 rounded-lg w-fit">
          <FaCalendarAlt className="text-indigo-400" />
          <span>{formatDateSafe(activity.start_date)}</span>
          <span className="text-gray-300">→</span>
          <span>{formatDateSafe(activity.end_date)}</span>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
          {activity.description || "No description provided."}
        </p>
      </div>

      {/* --- Evidence Section --- */}
      <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
        <FaFileAlt /> Evidence ({files.length})
      </p>

      <div className="flex flex-wrap gap-2">
        {files.length > 0 ? (
          files.map(file => (
            <a
              key={file.file_id}
              href={file.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-xs font-medium text-gray-600"
            >
              <FaDownload className="text-[10px] opacity-50" />
              <span className="truncate max-w-[120px]">
                {file.file_type || "File"}
              </span>
            </a>
          ))
        ) : (
          <span className="text-xs text-gray-400 italic pl-1">
            No proofs attached
          </span>
        )}
      </div>

      {/* --- Actions --- */}
      <div className="pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl space-y-3">
        {/* Remarks */}
        <div className="relative">
          <FaPenNib className="absolute left-3 top-3 text-gray-300 text-xs" />
          <textarea
            rows={1}
            placeholder="Remarks (Required for rejection)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onVerify(activity.activity_id, remarks)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-emerald-200 transition-all active:scale-95"
          >
            <FaCheckCircle /> Verify
          </button>
          <button
            onClick={() => onReject(activity.activity_id, remarks)}
            className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          >
            <FaTimesCircle /> Reject
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ---------------------------
// Main Component
// ---------------------------

export default function ProfileHubView() {
  // State
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "Faculty";

  // --- Fetch Data ---
  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/profilehub/review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(res.data);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load pending activities", "error");
    } finally {
      setLoading(false);
    }
  };



  // --- Handlers ---

  const handleAction = async (activityId, status, remarks) => {
    // Validation for Rejection
    if (status === "REJECTED" && !remarks.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Remarks Required',
        text: 'Please provide a reason for rejection in the remarks field.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    try {
      // Optimistic UI update (remove from list immediately)
      const previousActivities = [...activities];
      setActivities(prev => prev.filter(a => a.activity_id !== activityId));

      await axios.put(
        `${BASE_URL}/profilehub/activity/${activityId}/verify`,
        { status, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success Toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Toast.fire({
        icon: status === 'VERIFIED' ? 'success' : 'info',
        title: `Activity ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}`
      });

    } catch (err) {
      // Revert if failed
      console.error(err);
      fetchActivities(); // Reload exact state
      Swal.fire("Error", err.response?.data?.message || "Action failed", "error");
    }
  };

  // --- Computed ---

  const filteredActivities = useMemo(() => {
    if (!searchTerm) return activities;

    const q = searchTerm.toLowerCase();

    return activities.filter(a => {
      const deptName = getDeptName(a.dept_id).toLowerCase();
      const className = getClassName(a.class_id).toLowerCase();

      return (
        a.title?.toLowerCase().includes(q) ||
        a.register_no?.toLowerCase().includes(q) ||
        a.student_name?.toLowerCase().includes(q) ||
        deptName.includes(q) ||
        className.includes(q)
      );
    });
  }, [activities, searchTerm]);


  const stats = useMemo(() => ({
    total: activities.length,
    byDept: [...new Set(activities.map(a => a.dept_id))].length, // Unique depts
    distinctStudents: [...new Set(activities.map(a => a.register_no))].length
  }), [activities]);

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
        <p className="mt-4 text-slate-400 font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-50/60 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-50/60 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* --- Header & Stats --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-wide">
                {role} View
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Activity Review
            </h1>
            <p className="text-slate-500 mt-1 text-lg">
              Pending approvals and verification requests
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
            <InsightPill
              label="Pending Requests"
              count={stats.total}
              icon={FaClipboardList}
              color="bg-orange-50 text-orange-600"
              delay={0}
            />
            <InsightPill
              label="Unique Students"
              count={stats.distinctStudents}
              icon={FaUserGraduate}
              color="bg-blue-50 text-blue-600"
              delay={1}
            />
            <InsightPill
              label="Departments"
              count={stats.byDept}
              icon={FaLayerGroup}
              color="bg-purple-50 text-purple-600"
              delay={2}
            />
          </div>
        </div>

        {/* --- Toolbar --- */}
        <div className="bg-white rounded-2xl p-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center sticky top-4 z-20 backdrop-blur-xl bg-white/90">
          <div className="pl-4 pr-3 text-gray-400">
            <FaSearch />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Reg No, Department or Activity Title..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-gray-400 py-3"
          />
          <div className="hidden sm:block pr-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {filteredActivities.length} Records
          </div>
        </div>

        {/* --- Content Grid --- */}
        {filteredActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mb-4">
              <FaCheckCircle />
            </div>
            <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
            <p className="text-slate-500 mt-1">No pending activities match your criteria.</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <ReviewCard
                  key={activity.activity_id}
                  index={index}
                  activity={activity}
                  role={role}
                  onVerify={(id, rem) => handleAction(id, "VERIFIED", rem)}
                  onReject={(id, rem) => handleAction(id, "REJECTED", rem)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
}