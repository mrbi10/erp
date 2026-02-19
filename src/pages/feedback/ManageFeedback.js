import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { formatDDMMYYYY } from "../../constants/dateUtils";
import {
  FaPlus,
  FaLock,
  FaSpinner,
  FaUniversity,
  FaLayerGroup,
  FaCalendarAlt,
  FaListAlt,
  FaExclamationTriangle,
  FaPlay,
  FaStopCircle
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
    minHeight: '48px',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    backgroundColor: state.isDisabled ? '#f8fafc' : '#fff',
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    '&:hover': { borderColor: state.isDisabled ? '#cbd5e1' : '#94a3b8' }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 50
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    padding: '12px 14px',
    fontWeight: '500'
  }),
  placeholder: (base) => ({ ...base, color: "#64748b" }),
  singleValue: (base) => ({ ...base, color: "#1e293b", fontWeight: "600" }),
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
    dept: null,
    targetClass: null,
    academicYear: null,
    questionSet: null,
    title: "",
    startDate: "",
    endDate: ""
  });

  const token = localStorage.getItem("token");

  /* ---------- DATA FETCHING ---------- */
  useEffect(() => {
    if (!["CA", "HOD", "DeptAdmin", "Principal"].includes(user.role)) {
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

        const sortedSessions = (sessRes.data || []).sort((a, b) => b.session_id - a.session_id);
        setSessions(sortedSessions);
        setQuestionSets(qsRes.data || []);

        if (["CA", "DeptAdmin"].includes(user.role) && user.dept_id) {
          const deptObj = DEPT_OPTIONS.find(d => d.value === Number(user.dept_id));
          setForm(prev => ({ ...prev, dept: deptObj || null }));
        }

        if (user.role === "CA" && user.assigned_class_id) {
          const classObj = CLASS_OPTIONS.find(c => c.value === Number(user.assigned_class_id));
          setForm(prev => ({ ...prev, targetClass: classObj || null }));
        }

      } catch (error) {
        Swal.fire('System Error', 'Failed to load feedback configuration data.', 'error');
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
  const handleCreateSession = async (e) => {
    e.preventDefault();
    const { dept, targetClass, academicYear, title, startDate, endDate, questionSet } = form;

    if (!academicYear || !title || !startDate || !endDate || !questionSet || (user.role !== "CA" && (!dept || !targetClass))) {
      Swal.fire('Missing Fields', 'Please complete all required fields to launch a session.', 'warning');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Swal.fire('Invalid Dates', 'The End Date cannot be before the Start Date.', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: "Launch Session?",
      html: `You are about to start <b>"${title}"</b>.<br/><br/>Students will be able to submit feedback immediately.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Launch Now",
      confirmButtonColor: "#4f46e5"
    });

    if (!confirm.isConfirmed) return;

    try {
      setCreating(true);

      const payload = {
        dept_id: user.role === "CA" || user.role === "DeptAdmin" ? user.dept_id : dept.value,
        class_id: user.role === "CA" ? user.assigned_class_id : targetClass.value,
        academic_year: academicYear.value,
        title,
        start_date: startDate,
        end_date: endDate,
        question_set_id: questionSet.value
      };

      await axios.post(`${BASE_URL}/feedback/session`, payload, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({ icon: 'success', title: "Session Created", text: "Feedback collection has started.", timer: 2000, showConfirmButton: false });

      setForm(prev => ({ ...prev, title: "", startDate: "", endDate: "", questionSet: null }));

      const res = await axios.get(`${BASE_URL}/feedback/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      setSessions((res.data || []).sort((a, b) => b.session_id - a.session_id));

    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create session", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSession = async (sessionId) => {
    const confirm = await Swal.fire({
      title: "Reopen Session?",
      text: "Students will be able to submit feedback again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Reopen",
      confirmButtonColor: "#16a34a"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.patch(
        `${BASE_URL}/feedback/session/${sessionId}/open`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: 'success',
        title: "Session Reopened",
        timer: 1500,
        showConfirmButton: false
      });

      setSessions(prev =>
        prev.map(s =>
          s.session_id === sessionId ? { ...s, is_active: 1 } : s
        )
      );

    } catch {
      Swal.fire("Error", "Failed to reopen session", "error");
    }
  };

  const handleCloseSession = async (sessionId) => {
    const confirm = await Swal.fire({
      title: "Close Session?",
      text: "This will permanently stop new feedback submissions for this session.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Close Session",
      confirmButtonColor: "#dc2626"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.patch(`${BASE_URL}/feedback/session/${sessionId}/close`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ icon: 'success', title: "Session Closed", timer: 1500, showConfirmButton: false });
      setSessions(prev => prev.map(s => s.session_id === sessionId ? { ...s, is_active: 0 } : s));
    } catch {
      Swal.fire("Error", "Failed to close session", "error");
    }
  };

  /* ---------- RENDER: ACCESS DENIED ---------- */
  if (!["CA", "HOD", "DeptAdmin", "Principal"].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <FaLock className="text-5xl mb-4 opacity-30" />
        <p className="font-bold text-xl text-slate-600">Access Restricted</p>
        <p className="text-md mt-1">Authorized administrative personnel only.</p>
      </div>
    );
  }

  /* ---------- RENDER: LOADING ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
        <FaSpinner className="animate-spin text-5xl mb-4" />
        <p className="font-bold text-slate-700">Loading Dashboard...</p>
      </div>
    );
  }

  /* ---------- RENDER: MAIN CONTENT ---------- */
  return (
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Feedback Management</h1>
            <p className="text-slate-600 font-medium mt-1">Configure and oversee student evaluation cycles.</p>
          </div>
          <div className="bg-indigo-100 text-indigo-800 px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-3 border border-indigo-200">
            <FaLayerGroup className="text-lg" />
            {sessions.filter(s => s.is_active).length} Active Sessions
          </div>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 p-5 flex items-center gap-3">
            <div className="bg-indigo-500 text-white p-2 rounded-lg">
              <FaPlus className="text-sm" />
            </div>
            <h2 className="text-xl font-bold text-white">Create New Feedback Session</h2>
          </div>

          <form onSubmit={handleCreateSession} className="p-6 md:p-8 space-y-8">

            {/* Row 1: Target Audience */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">1. Target Audience</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                    Department {(user.role === "CA" || user.role === "DeptAdmin") && <FaLock className="text-slate-400" title="Locked to your department" />}
                  </label>
                  <Select
                    isDisabled={user.role === "CA" || user.role === "DeptAdmin"}
                    options={DEPT_OPTIONS}
                    placeholder="Select Department"
                    value={form.dept}
                    onChange={val => setForm({ ...form, dept: val })}
                    styles={customSelectStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                    Class / Year {user.role === "CA" && <FaLock className="text-slate-400" title="Locked to your assigned class" />}
                  </label>
                  <Select
                    isDisabled={user.role === "CA"}
                    options={CLASS_OPTIONS}
                    placeholder="Select Class/Year"
                    value={form.targetClass}
                    onChange={val => setForm({ ...form, targetClass: val })}
                    styles={customSelectStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Academic Year</label>
                  <Select
                    options={ACADEMIC_YEAR_OPTIONS}
                    placeholder="Select Year..."
                    value={form.academicYear}
                    onChange={val => setForm({ ...form, academicYear: val })}
                    styles={customSelectStyles}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Configuration */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">2. Session Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Questionnaire Template</label>
                  <Select
                    options={questionSetOptions}
                    placeholder="Select Template..."
                    value={form.questionSet}
                    onChange={val => setForm({ ...form, questionSet: val })}
                    styles={customSelectStyles}
                  />
                </div>
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Session Title</label>
                  <div className="relative">
                    <FaListAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Mid-Semester Feedback 2026"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Timeline & Launch */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">3. Timeline & Launch</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                      value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={creating}
                    className={`
                      w-full py-3 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 transition-colors border-2
                      ${creating ? 'bg-indigo-400 border-indigo-400 cursor-not-allowed' : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700'}
                    `}
                  >
                    {creating ? (
                      <> <FaSpinner className="animate-spin text-xl" /> Processing... </>
                    ) : (
                      <> <FaPlay /> Launch Session Now </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* SESSION LIST */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-3">
            <FaListAlt className="text-slate-500 text-xl" />
            <h3 className="text-xl font-bold text-slate-800">Session History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-1/3">Session Title</th>
                  <th className="p-4">Target Audience</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sessions.map(s => (
                  <tr key={s.session_id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-base">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">ID: {s.session_id}</span>
                        <span className="text-sm font-semibold text-slate-600">{s.academic_year}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                        <span className="flex items-center gap-2">
                          <FaUniversity className="text-slate-400" />
                          {DEPT_MAP[s.dept_id] || "Unknown Dept"}
                        </span>
                        <span className="flex items-center gap-2">
                          <FaLayerGroup className="text-slate-400" />
                          {CLASS_MAP[s.class_id] || "Unknown Class"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      <p>Start: {formatDDMMYYYY(s.start_date)}</p>
                      <p>End: {formatDDMMYYYY(s.end_date)}</p>
                    </td>
                    <td className="p-4 text-center">
                      {s.is_active ? (
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-600 border border-slate-300">
                          <FaLock className="mr-2 text-slate-400" />
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {s.is_active ? (
                        <button
                          onClick={() => handleCloseSession(s.session_id)}
                          className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors border-2 border-red-700 flex items-center justify-center gap-2 mx-auto shadow-sm"
                        >
                          <FaStopCircle /> Close
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenSession(s.session_id)}
                          className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors border-2 border-emerald-700 flex items-center justify-center gap-2 mx-auto shadow-sm"
                        >
                          <FaPlay /> Reopen
                        </button>
                      )}

                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FaExclamationTriangle className="text-5xl mb-3 opacity-30" />
                        <p className="font-bold text-lg text-slate-600">No Sessions Found</p>
                        <p className="text-md mt-1 text-slate-500">Create your first feedback session above.</p>
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