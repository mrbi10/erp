import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { 
  FaPlus, 
  FaLock, 
  FaSpinner, 
  FaUniversity, 
  FaLayerGroup, 
  FaCalendarAlt, 
  FaListAlt, 
  FaCheckCircle, 
  FaTimesCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

/* ===================== CONFIGURATION ===================== */

const ACADEMIC_YEAR_OPTIONS = [
  { value: "2023-2024", label: "2023–2024" },
  { value: "2024-2025", label: "2024–2025" },
  { value: "2025-2026", label: "2025–2026" },
  { value: "2026-2027", label: "2026–2027" }
];

const DEPT_OPTIONS = Object.entries(DEPT_MAP).map(
  ([id, name]) => ({ value: Number(id), label: name })
);

const CLASS_OPTIONS = Object.entries(CLASS_MAP).map(
  ([id, label]) => ({ value: Number(id), label })
);

/* ===================== STYLES ===================== */

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '46px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
    paddingLeft: '4px',
    fontSize: '0.9rem',
    '&:hover': { borderColor: '#cbd5e1' }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    zIndex: 50
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '10px 12px',
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "#334155", fontWeight: "600" }),
};

/* ===================== COMPONENT ===================== */

export default function ManageFeedback({ user }) {
  /* ---------- STATE ---------- */
  const [sessions, setSessions] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form State
  const [form, setForm] = useState({
    dept: null,      // Select object {value, label}
    targetClass: null, // Select object
    academicYear: null, // Select object
    questionSet: null, // Select object
    title: "",
    startDate: "",
    endDate: ""
  });

  const token = localStorage.getItem("token");

  /* ---------- DATA FETCHING ---------- */
  useEffect(() => {
    if (!["CA", "HOD", "Principal"].includes(user.role)) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch Sessions & Question Sets
        const [sessRes, qsRes] = await Promise.all([
          axios.get(`${BASE_URL}/feedback/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/feedback/question-sets`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Sort sessions by newest first
        const sortedSessions = (sessRes.data || []).sort((a, b) => b.session_id - a.session_id);
        
        setSessions(sortedSessions);
        setQuestionSets(qsRes.data || []);
        
        // Auto-fill form for CA if possible
        if (user.role === "CA" && user.dept_id && user.assigned_class_id) {
            const deptObj = DEPT_OPTIONS.find(d => d.value === Number(user.dept_id));
            const classObj = CLASS_OPTIONS.find(c => c.value === Number(user.assigned_class_id));
            
            setForm(prev => ({
                ...prev,
                dept: deptObj || null,
                targetClass: classObj || null
            }));
        }

      } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'System Error',
            text: 'Failed to load feedback configuration data.',
            confirmButtonColor: '#4f46e5'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.role, user.dept_id, user.assigned_class_id, token]);

  /* ---------- COMPUTED DATA ---------- */
  
  const questionSetOptions = useMemo(() => 
    questionSets
      .filter(qs => qs.is_active)
      .map(qs => ({ value: qs.set_id, label: qs.name })), 
    [questionSets]
  );

  /* ---------- HANDLERS ---------- */

  const handleCreateSession = async () => {
    const {
      dept,
      targetClass,
      academicYear,
      title,
      startDate,
      endDate,
      questionSet
    } = form;

    // 1. Validation
    if (
      !academicYear ||
      !title ||
      !startDate ||
      !endDate ||
      !questionSet ||
      (user.role !== "CA" && (!dept || !targetClass))
    ) {
      Swal.fire({
        icon: 'warning',
        title: "Missing Fields", 
        text: "Please complete all required fields to launch a session.",
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Swal.fire({
        icon: 'warning',
        title: "Invalid Dates", 
        text: "The End Date cannot be before the Start Date.",
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // 2. Confirmation
    const confirm = await Swal.fire({
      title: "Launch Session?",
      html: `You are about to start <b>"${title}"</b>.<br/>Students will be able to submit feedback immediately.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Launch",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8"
    });

    if (!confirm.isConfirmed) return;

    // 3. API Call
    try {
      setCreating(true);

      const payload = {
        dept_id: user.role === "CA" ? user.dept_id : dept.value,
        class_id: user.role === "CA" ? user.assigned_class_id : targetClass.value,
        academic_year: academicYear.value,
        title,
        start_date: startDate,
        end_date: endDate,
        question_set_id: questionSet.value
      };

      await axios.post(
        `${BASE_URL}/feedback/session`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
          icon: 'success',
          title: "Session Created", 
          text: "Feedback collection has started successfully.",
          timer: 2000,
          showConfirmButton: false
      });

      // Reset specific fields
      setForm(prev => ({
        ...prev,
        title: "",
        startDate: "",
        endDate: "",
        questionSet: null,
        // Keep dept/class/year for ease of bulk creation
      }));

      // Refresh List
      const res = await axios.get(
        `${BASE_URL}/feedback/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions((res.data || []).sort((a, b) => b.session_id - a.session_id));

    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to create session",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCloseSession = async (sessionId) => {
    const confirm = await Swal.fire({
      title: "Close Session?",
      text: "This will permanently stop new feedback submissions.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Close Session",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.patch(
        `${BASE_URL}/feedback/session/${sessionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
          icon: 'success',
          title: "Session Closed", 
          text: "The feedback session is now archived.",
          timer: 1500,
          showConfirmButton: false
      });

      setSessions(prev =>
        prev.map(s =>
          s.session_id === sessionId ? { ...s, is_active: 0 } : s
        )
      );
    } catch {
      Swal.fire("Error", "Failed to close session", "error");
    }
  };

  /* ---------- RENDER: ACCESS DENIED ---------- */
  if (!["CA", "HOD", "Principal"].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <FaLock className="text-4xl mb-4 opacity-20" />
        <p className="font-medium">Access Restricted</p>
        <p className="text-sm">Authorized personnel only.</p>
      </div>
    );
  }

  /* ---------- RENDER: LOADING ---------- */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-bold animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  /* ---------- RENDER: MAIN CONTENT ---------- */
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in-up font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Feedback Management</h1>
           <p className="text-slate-500 mt-1">Configure and oversee student evaluation cycles.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-indigo-100 shadow-sm">
           <FaLayerGroup />
           {sessions.filter(s => s.is_active).length} Active Sessions
        </div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
             <FaPlus className="text-xs" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">New Feedback Session</h2>
        </div>

        <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* --- Row 1: Context --- */}
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Department</label>
                    <Select
                        isDisabled={user.role === "CA"}
                        options={DEPT_OPTIONS}
                        placeholder="Select Department"
                        value={form.dept}
                        onChange={val => setForm({ ...form, dept: val })}
                        styles={customSelectStyles}
                    />
                    {user.role === "CA" && <p className="text-[10px] text-indigo-500 font-medium pl-1">*Auto-locked to your Dept</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Class</label>
                    <Select
                        isDisabled={user.role === "CA"}
                        options={CLASS_OPTIONS}
                        placeholder="Select Class/Year"
                        value={form.targetClass}
                        onChange={val => setForm({ ...form, targetClass: val })}
                        styles={customSelectStyles}
                    />
                     {user.role === "CA" && <p className="text-[10px] text-indigo-500 font-medium pl-1">*Auto-locked to your Class</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Academic Year</label>
                    <Select
                        options={ACADEMIC_YEAR_OPTIONS}
                        placeholder="Select Year..."
                        value={form.academicYear}
                        onChange={val => setForm({ ...form, academicYear: val })}
                        styles={customSelectStyles}
                    />
                </div>

                {/* --- Row 2: Configuration --- */}

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Questionnaire</label>
                    <Select
                        options={questionSetOptions}
                        placeholder="Select Template..."
                        value={form.questionSet}
                        onChange={val => setForm({ ...form, questionSet: val })}
                        styles={customSelectStyles}
                    />
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Session Title</label>
                    <div className="relative">
                        <FaListAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="e.g. Mid-Semester Feedback 2024"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-700"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                </div>

                 {/* --- Row 3: Timing --- */}

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 text-sm font-medium"
                        value={form.startDate}
                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">End Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 text-sm font-medium"
                        value={form.endDate}
                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                    />
                </div>

                {/* Action Button */}
                <div className="flex items-end lg:col-span-1">
                    <button
                        onClick={handleCreateSession}
                        disabled={creating}
                        className={`
                            w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                            ${creating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-200 hover:-translate-y-0.5'}
                        `}
                    >
                        {creating ? (
                            <> <FaSpinner className="animate-spin" /> Processing... </>
                        ) : (
                            <> <FaPlus /> Launch Session </>
                        )}
                    </button>
                </div>

            </div>
        </div>
      </div>

      {/* SESSION LIST */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FaListAlt className="text-slate-400" /> Session History
        </h3>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-5">Session</th>
                            <th className="p-5">Target Audience</th>
                            <th className="p-5">Duration</th>
                            <th className="p-5 text-center">Status</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sessions.map(s => (
                            <tr key={s.session_id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-5">
                                    <p className="font-bold text-slate-800 text-base">{s.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 rounded">#{s.session_id}</span>
                                        <span className="text-xs text-slate-500">{s.academic_year}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                                            <FaUniversity className="text-indigo-400" />
                                            {DEPT_MAP[s.dept_id] || "Unknown Dept"}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                                            <FaLayerGroup className="text-indigo-400" />
                                            {CLASS_MAP[s.class_id] || "Unknown Class"}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p>Start: <span className="font-medium">{new Date(s.start_date).toLocaleDateString()}</span></p>
                                        <p>End: <span className="font-medium">{new Date(s.end_date).toLocaleDateString()}</span></p>
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    {s.is_active ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                                            <FaLock className="text-[9px]" />
                                            Closed
                                        </span>
                                    )}
                                </td>
                                <td className="p-5 text-right">
                                    {s.is_active ? (
                                        <button
                                            onClick={() => handleCloseSession(s.session_id)}
                                            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                        >
                                            Close Session
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic font-medium px-3">Archived</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sessions.length === 0 && (
                             <tr>
                                <td colSpan="5" className="p-10 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <FaExclamationTriangle className="text-3xl mb-2 opacity-50" />
                                        <p className="font-medium text-sm">No feedback sessions created yet.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

    </div>
  );
}