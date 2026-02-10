import React, { useEffect, useState } from "react";
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
  FaTimesCircle
} from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

/* ===================== OPTIONS ===================== */

const ACADEMIC_YEAR_OPTIONS = [
  { value: "2022-2023", label: "2022–2023" },
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

/* ===================== CUSTOM STYLES ===================== */

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    padding: "4px",
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px #c7d2fe" : "none",
    "&:hover": { borderColor: "#cbd5e1" }
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "#334155", fontWeight: "500" }),
};

/* ===================== COMPONENT ===================== */

export default function ManageFeedback({ user }) {
  /* ---------- STATE ---------- */
  const [sessions, setSessions] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    dept_id: "",
    class_id: "",
    academic_year: "",
    title: "",
    start_date: "",
    end_date: "",
    question_set_id: ""
  });

  const token = localStorage.getItem("token");

  /* ---------- EFFECT ---------- */
  useEffect(() => {
    if (!["CA", "HOD", "Principal"].includes(user.role)) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const [sessRes, qsRes] = await Promise.all([
          axios.get(`${BASE_URL}/feedback/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/feedback/question-sets`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setSessions(sessRes.data || []);
        setQuestionSets(qsRes.data || []);
      } catch {
        Swal.fire("Error", "Failed to load feedback data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.role, token]);

  /* ---------- ACCESS GUARD ---------- */
  if (!["CA", "HOD", "Principal"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 font-medium">
        Access denied. Authorized personnel only.
      </div>
    );
  }

  /* ---------- HANDLERS ---------- */

  const handleCreateSession = async () => {
    const {
      dept_id,
      class_id,
      academic_year,
      title,
      start_date,
      end_date,
      question_set_id
    } = form;

    if (
      !academic_year ||
      !title ||
      !start_date ||
      !end_date ||
      !question_set_id ||
      (user.role !== "CA" && !dept_id && !class_id)
    ) {
      Swal.fire("Missing Data", "Please fill in all required fields.", "warning");
      return;
    }

    if (new Date(start_date) > new Date(end_date)) {
      Swal.fire("Invalid Date Range", "Start date must be before end date.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Create Session?",
      text: "This will start a new feedback collection session.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Create Session",
      confirmButtonColor: "#4f46e5"
    });

    if (!confirm.isConfirmed) return;

    try {
      setCreating(true);

      const payload = {
        ...form,
        dept_id: user.role === "CA" ? user.dept_id : form.dept_id,
        class_id: user.role === "CA" ? user.assigned_class_id : form.class_id
      };

      await axios.post(
        `${BASE_URL}/feedback/session`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Created", "Feedback session created successfully.", "success");

      setForm({
        dept_id: "",
        class_id: "",
        academic_year: "",
        title: "",
        start_date: "",
        end_date: "",
        question_set_id: ""
      });

      const res = await axios.get(
        `${BASE_URL}/feedback/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(res.data || []);
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
      text: "Students will no longer be able to submit feedback.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Close it",
      confirmButtonColor: "#dc2626"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.patch(
        `${BASE_URL}/feedback/session/${sessionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Closed", "Session has been closed.", "success");

      setSessions(prev =>
        prev.map(s =>
          s.session_id === sessionId ? { ...s, is_active: 0 } : s
        )
      );
    } catch {
      Swal.fire("Error", "Failed to close session", "error");
    }
  };

  /* ---------- RENDER ---------- */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading sessions...</p>
      </div>
    );
  }

  // Question Set Options for Select
  const questionSetOptions = questionSets
    .filter(qs => qs.is_active)
    .map(qs => ({ value: qs.set_id, label: qs.name }));

  // Helper to find Select value object
  const getSelectValue = (options, value) => options.find(o => o.value === value) || null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in-up">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manage Feedback</h1>
        <p className="text-slate-500 mt-1">Create and monitor student feedback sessions.</p>
      </div>

      {/* CREATE SESSION CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
             <FaPlus className="text-sm" />
          </div>
          Create New Session
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Department */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Department</label>
            <Select
              isDisabled={user.role === "CA" || user.role === "HOD"}
              options={DEPT_OPTIONS}
              placeholder="Select Department"
              value={getSelectValue(DEPT_OPTIONS, form.dept_id)}
              onChange={opt => setForm({ ...form, dept_id: opt?.value || "" })}
              styles={customSelectStyles}
            />
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Class</label>
            <Select
              options={CLASS_OPTIONS}
              isDisabled={user.role === "CA"}
              placeholder="Select Year"
              value={getSelectValue(CLASS_OPTIONS, form.class_id)}
              onChange={opt => setForm({ ...form, class_id: opt?.value || "" })}
              styles={customSelectStyles}
            />
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Academic Year</label>
            <Select
              options={ACADEMIC_YEAR_OPTIONS}
              placeholder="Select Academic Year"
              value={getSelectValue(ACADEMIC_YEAR_OPTIONS, form.academic_year)}
              onChange={opt => setForm({ ...form, academic_year: opt?.value || "" })}
              styles={customSelectStyles}
            />
          </div>

          {/* Question Set */}
          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Question Set</label>
            <Select
              options={questionSetOptions}
              placeholder="Select Question Set"
              value={getSelectValue(questionSetOptions, form.question_set_id)}
              onChange={opt => setForm({ ...form, question_set_id: opt?.value || "" })}
              styles={customSelectStyles}
            />
          </div>

          {/* Title */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Session Title</label>
            <div className="relative">
              <FaListAlt className="absolute left-4 top-3.5 text-slate-400" />
              <input
                placeholder="e.g., Internal Assessment 1 Feedback"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Start Date</label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">End Date</label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          
           {/* Submit Button Area */}
           <div className="flex items-end lg:col-span-1">
             <button
               onClick={handleCreateSession}
               disabled={creating}
               className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-lg hover:-translate-y-0.5 transition-all text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-70 disabled:transform-none"
             >
               {creating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
               Launch Session
             </button>
           </div>
        </div>
      </div>

      {/* SESSION LIST TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-lg font-bold text-slate-800">History</h2>
             <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-500">{sessions.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-5">Session Details</th>
                <th className="p-5">Academic Year</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(s => (
                <tr key={s.session_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5">
                    <p className="font-bold text-slate-800 text-base">{s.title}</p>
                    <p className="text-slate-400 text-xs mt-1">ID: #{s.session_id}</p>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full w-fit">
                        <FaCalendarAlt className="text-slate-400" />
                        {s.academic_year}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    {s.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                           Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                           <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                           Closed
                        </span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    {s.is_active ? (
                      <button
                        onClick={() => handleCloseSession(s.session_id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-transparent hover:border-red-200"
                      >
                        <FaLock className="text-xs" /> Close
                      </button>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <FaListAlt className="text-4xl mb-3 opacity-20" />
                        <p className="font-medium">No sessions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}