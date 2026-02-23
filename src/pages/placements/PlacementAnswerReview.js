import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBookOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaLayerGroup,
  FaExclamationTriangle,
  FaTrophy,
  FaClipboardList,
  FaUserClock,
  FaSearch,
  FaFilter,
  FaShieldAlt,
  FaHistory,
  FaExchangeAlt,
  FaUserGraduate,
  FaArrowRight,
  FaInfoCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, yearoptions } from "../../constants/deptClass";
import { formatSubmittedAt } from "../../constants/dateUtils";

/* -------------------- STYLES & HELPERS -------------------- */
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    padding: "6px",
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px #c7d2fe" : "none",
    "&:hover": { borderColor: "#cbd5e1" },
    backgroundColor: "#f8fafc",
    fontSize: "0.875rem",
    minHeight: "48px", // Better touch target
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "#334155", fontWeight: "600" }),
  menu: (base) => ({ ...base, zIndex: 50, borderRadius: "0.75rem", overflow: "hidden" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#e0e7ff" : "white",
    color: state.isSelected ? "white" : "#334155",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: "10px 12px"
  })
};

/* -------------------- SUB-COMPONENTS -------------------- */

// 1. Stat Card (Responsive Grid Item)
const StatCard = ({ label, value, icon: Icon, color }) => {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 sm:p-5 rounded-2xl border ${styles[color] || styles.indigo} flex items-center gap-4 shadow-sm min-w-[140px] flex-1`}
    >
      <div className={`p-3 rounded-xl bg-white shadow-sm flex-shrink-0`}>
        <Icon className="text-xl" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">{label}</p>
        <h3 className="text-lg sm:text-xl font-extrabold truncate">{value}</h3>
      </div>
    </motion.div>
  );
};

// 2. Option Row (Handles long text wrapping)
const OptionRow = ({ label, text, status }) => {
  let containerStyle = "border-slate-100 bg-white text-slate-600 hover:bg-slate-50";
  let icon = null;

  if (status === 'correct') {
    containerStyle = "border-emerald-200 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-200 font-medium";
    icon = <FaCheckCircle className="text-emerald-500 flex-shrink-0" />;
  } else if (status === 'wrong') {
    containerStyle = "border-rose-200 bg-rose-50/50 text-rose-800 ring-1 ring-rose-200 font-medium";
    icon = <FaTimesCircle className="text-rose-500 flex-shrink-0" />;
  } else if (status === 'missed') {
    containerStyle = "border-emerald-200 bg-white text-emerald-700 border-dashed";
    icon = <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase whitespace-nowrap">Correct Answer</span>;
  }

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${containerStyle}`}>
      <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold shadow-sm mt-0.5 ${status === 'correct' ? 'bg-emerald-200 text-emerald-800' : status === 'wrong' ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
        {label}
      </div>
      {/* break-words ensures long text doesn't overflow */}
      <span className="flex-grow text-sm leading-relaxed break-words">{text}</span>
      {icon}
    </div>
  );
};

// 3. Question Card (Robust Layout)
const QuestionCard = ({ index, data, isComparison = false, studentName }) => {
  const options = [
    { key: 'A', text: data.option_a },
    { key: 'B', text: data.option_b },
    { key: 'C', text: data.option_c },
    { key: 'D', text: data.option_d },
  ];

  let statusBadge = { text: "Unattempted", color: "bg-slate-100 text-slate-500" };
  if (data.status === "correct") statusBadge = { text: "Correct", color: "bg-emerald-100 text-emerald-700" };
  if (data.status === "wrong") statusBadge = { text: "Incorrect", color: "bg-rose-100 text-rose-700" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col ${isComparison ? 'shadow-none border-slate-200' : ''}`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex gap-3 w-full">
          <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-200 mt-1">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            {isComparison && <p className="text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1"><FaUserGraduate /> {studentName}</p>}
            {/* break-words handles extremely long words/code snippets */}
            <h4 className="text-sm font-semibold text-slate-800 leading-snug break-words whitespace-pre-line">{data.question}</h4>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide flex-shrink-0 ${statusBadge.color} self-start sm:self-center`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Options */}
      <div className="p-4 sm:p-5 space-y-2.5 flex-1">
        {options.map((opt) => {
          if (!opt.text) return null;
          let status = 'neutral';
          if (data.selected_option === opt.key) {
            status = data.selected_option === data.correct_option ? 'correct' : 'wrong';
          } else if (data.correct_option === opt.key) {
            status = 'missed';
          }
          return <OptionRow key={opt.key} label={opt.key} text={opt.text} status={status} />;
        })}
      </div>
    </motion.div>
  );
};

/* ==================== MAIN COMPONENT ==================== */
export default function PlacementAnswerReview() {
  const token = localStorage.getItem("token");
  const asArray = (v) => Array.isArray(v) ? v : [];

  /* ---------- STATE ---------- */
  const [filters, setFilters] = useState({
    dept_id: "", class_id: "", course_id: "", test_id: "", student_id: "", attempt_id: "",
  });

  const [data, setData] = useState({ courses: [], tests: [], students: [], attempts: [] });
  const [attempt, setAttempt] = useState(null);
  const [violations, setViolations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questionFilter, setQuestionFilter] = useState("all");

  // Compare Mode State
  const [compareMode, setCompareMode] = useState(false);
  const [compareFilters, setCompareFilters] = useState({ student_id: "", attempt_id: "" });
  const [compareAttempt, setCompareAttempt] = useState(null);
  const [compareAttempts, setCompareAttempts] = useState([]);

  // Memoized Comparison Map
  const compareQuestionMap = useMemo(() => {
    if (!compareAttempt) return {};
    return Object.fromEntries(compareAttempt.questions.map(q => [q.question_id, q]));
  }, [compareAttempt]);

  /* ---------- API HELPERS ---------- */
  const api = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null);

  /* ---------- EFFECTS (Data Fetching) ---------- */
  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/courses`).then(d => setData(p => ({ ...p, courses: asArray(d?.courses || d) })));
  }, []);

  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/tests?course_id=${filters.course_id || ""}`).then(d => setData(p => ({ ...p, tests: asArray(d?.tests || d) })));
  }, [filters.course_id]);

  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/students?dept_id=${filters.dept_id}&class_id=${filters.class_id}&course_id=${filters.course_id}&test_id=${filters.test_id}`).then(d => setData(p => ({ ...p, students: asArray(d?.students || d) })));
  }, [filters.dept_id, filters.class_id, filters.course_id, filters.test_id]);

  useEffect(() => {
    if (!filters.student_id || !filters.test_id) return;
    api(`${BASE_URL}/placement-training/review/attempts?student_id=${filters.student_id}&test_id=${filters.test_id}`).then(d => setData(p => ({ ...p, attempts: asArray(d?.attempts || d) })));
  }, [filters.student_id, filters.test_id]);

  useEffect(() => {
    if (!filters.attempt_id) return;
    setLoading(true);
    setAttempt(null);
    setViolations(null);
    api(`${BASE_URL}/placement-training/review/attempt/${filters.attempt_id}`).then(d => setAttempt(d || null)).finally(() => setLoading(false));
  }, [filters.attempt_id]);

  // Comparison Effects
  useEffect(() => {
    if (!compareFilters.student_id || !filters.test_id) { setCompareAttempts([]); return; }
    api(`${BASE_URL}/placement-training/review/attempts?student_id=${compareFilters.student_id}&test_id=${filters.test_id}`).then(d => setCompareAttempts(asArray(d?.attempts || d)));
  }, [compareFilters.student_id, filters.test_id]);

  useEffect(() => {
    if (!compareFilters.attempt_id) { setCompareAttempt(null); return; }
    setCompareAttempt(null);
    api(`${BASE_URL}/placement-training/review/attempt/${compareFilters.attempt_id}`).then(d => setCompareAttempt(d || null));
  }, [compareFilters.attempt_id]);

  useEffect(() => {
    // Reset comparison when main attempt changes
    setCompareMode(false);
    setCompareAttempt(null);
    setCompareFilters({ student_id: "", attempt_id: "" });
    setCompareAttempts([]);
  }, [filters.attempt_id]);

  /* ---------- LOGIC ---------- */
  const filteredQuestions = useMemo(() => {
    const q = attempt?.questions || [];
    if (questionFilter === "all") return q;
    if (questionFilter === "unattempted") return q.filter(x => !x.selected_option);
    return q.filter(x => x.status === questionFilter);
  }, [attempt, questionFilter]);

  const handleViolationCheck = async () => {
    const result = await Swal.fire({
      title: "Authenticate Access",
      text: "Loading sensitive proctoring logs requires confirmation.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Access Logs",
    });

    if (result.isConfirmed) {
      const v = await api(`${BASE_URL}/placement-training/review/attempt/${filters.attempt_id}/violations`);
      setViolations(v || []);
    }
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 animate-fade-in-up">
      <div className="max-w-[90rem] mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
              <FaBookOpen />
            </div>
            Assessment Review
          </h1>
          <p className="text-slate-500 mt-2 ml-1 text-sm md:text-base">Analyze student performance and proctoring logs.</p>
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <FaFilter /> Search Criteria
          </div>
          {/* Responsive Grid: Adjusted to prevent squished dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
            <Select styles={customSelectStyles} placeholder="Department" options={Object.entries(DEPT_MAP).map(([v, l]) => ({ value: v, label: l }))} onChange={o => setFilters(f => ({ ...f, dept_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Year" options={yearoptions} onChange={o => setFilters(f => ({ ...f, class_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Course" options={asArray(data.courses).map(c => ({ value: c.course_id, label: c.name }))} onChange={o => setFilters(f => ({ ...f, course_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Test" options={asArray(data.tests).map(t => ({ value: t.test_id, label: t.title }))} onChange={o => setFilters(f => ({ ...f, test_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Student" options={asArray(data.students).map(s => ({ value: s.student_id, label: `${s.name} (${s.student_id})` }))} onChange={o => setFilters(f => ({ ...f, student_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Attempt..." options={asArray(data.attempts).map(a => ({ value: a.attempt_id, label: `Attempt #${a.attempt_no}` }))} onChange={o => setFilters(f => ({ ...f, attempt_id: o?.value || "" }))} />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <FaLayerGroup className="text-5xl text-indigo-300 animate-bounce mb-4" />
            <p className="font-medium text-slate-400">Retrieving assessment data...</p>
          </div>
        )}

        {/* CONTENT AREA */}
        {!loading && attempt && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* STATS OVERVIEW - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">
              <div className="col-span-2 sm:col-span-1">
                <StatCard label="Score" value={`${attempt.summary?.score ?? 0}/${attempt.summary?.total_questions ?? 0}`} icon={FaTrophy} color="amber" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <StatCard label="Status" value={(attempt.summary?.pass_status || "N/A").toUpperCase()} icon={attempt.summary?.pass_status === 'Pass' ? FaCheckCircle : FaTimesCircle} color={attempt.summary?.pass_status === 'Pass' ? "emerald" : "rose"} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <StatCard label="Answered" value={attempt.summary?.answered_count ?? 0} icon={FaClipboardList} color="blue" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <StatCard label="Type" value={attempt.summary?.submission_type || "Auto"} icon={FaUserClock} color="purple" />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <button
                  disabled={!filters.attempt_id}
                  onClick={() => setCompareMode(v => !v)}
                  className={`w-full h-full min-h-[80px] rounded-2xl border-2 font-bold text-sm flex flex-col items-center justify-center transition-all ${compareMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                >
                  <FaExchangeAlt className="mb-1 text-lg" />
                  {compareMode ? "Close Comparison" : "Compare Student"}
                </button>
              </div>
            </div>

            {/* COMPARE SELECTION PANEL */}
            <AnimatePresence>
              {compareMode && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-inner">
                    <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <FaUserGraduate /> Select Student to Compare
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        styles={customSelectStyles}
                        placeholder="Select Peer..."
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        menuPlacement="bottom"
                        options={asArray(data.students)
                          .filter(s => s.student_id !== filters.student_id)
                          .map(s => ({
                            value: s.student_id,
                            label: `${s.name} (${s.student_id})`
                          }))}
                        onChange={o =>
                          setCompareFilters(f => ({ ...f, student_id: o?.value || "" }))
                        }
                      />

                      <Select
                        isDisabled={!compareFilters.student_id}
                        styles={customSelectStyles}
                        placeholder="Select Their Attempt..."
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        menuPlacement="bottom"
                        options={compareAttempts.map(a => ({
                          value: a.attempt_id,
                          label: `Attempt #${a.attempt_no}`
                        }))}
                        onChange={o =>
                          setCompareFilters(f => ({ ...f, attempt_id: o?.value || "" }))
                        }
                      />

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MAIN CONTENT LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

              {/* LEFT COL: Questions List */}
              <div className="xl:col-span-3 space-y-6">

                {/* Filter Tabs - Horizontal Scroll on Mobile */}
                <div className="overflow-x-auto pb-2 -mb-2">
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200 inline-flex shadow-sm whitespace-nowrap">
                    {[
                      { id: "all", label: "All Questions" },
                      { id: "correct", label: "Correct" },
                      { id: "wrong", label: "Incorrect" },
                      { id: "unattempted", label: "Skipped" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setQuestionFilter(tab.id)}
                        className={`px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all ${questionFilter === tab.id ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions Grid */}
                <div className="space-y-6">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                      <FaSearch className="mx-auto text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium">No questions match this filter.</p>
                    </div>
                  ) : (
                    <>
                      {/* --- NORMAL VIEW --- */}
                      {!compareMode && filteredQuestions.map((q, i) => (
                        <QuestionCard key={q.question_id || i} index={i} data={q} />
                      ))}

                      {/* --- COMPARISON VIEW --- */}
                      {compareMode && compareAttempt && (
                        <div className="space-y-12">
                          {/* Comparison Header */}
                          <div className="hidden md:flex items-center gap-4 text-slate-400 font-bold text-sm uppercase tracking-wider py-2 border-b">
                            <span className="flex-1 pl-4">Primary Student</span>
                            <FaArrowRight />
                            <span className="flex-1 text-right text-indigo-500 pr-4">Compared Peer</span>
                          </div>

                          {filteredQuestions.map((q, i) => {
                            const compareQ = compareQuestionMap[q.question_id];
                            return (
                              <div key={q.question_id} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                {/* Mobile Label */}
                                <div className="md:hidden flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                  <FaArrowRight className="text-indigo-500" /> Comparison #{i + 1}
                                </div>

                                {/* Connector Line (Desktop Only) */}
                                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -ml-px z-0"></div>

                                {/* Cards */}
                                <div className="relative z-10 h-full">
                                  <QuestionCard index={i} data={q} isComparison studentName="Primary Student" />
                                </div>
                                <div className="relative z-10 h-full">
                                  {compareQ ? (
                                    <QuestionCard index={i} data={compareQ} isComparison studentName="Peer Student" />
                                  ) : (
                                    <div className="h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm font-medium p-8">
                                      <FaInfoCircle className="mr-2" /> Question not found in peer's attempt
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT COL: Security & Meta (Sticky on Desktop) */}
              <div className="space-y-6 xl:col-span-1 xl:sticky xl:top-6">

                {/* Security Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700">
                      <FaShieldAlt className="text-indigo-500" /> Security Logs
                    </h3>
                  </div>
                  <div className="p-4">
                    {!violations ? (
                      <button
                        onClick={handleViolationCheck}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <FaExclamationTriangle className="text-xl" />
                        Verify Proctoring Data
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {asArray(violations).length === 0 && (
                          <div className="text-center py-6 text-emerald-600 font-bold bg-emerald-50 rounded-xl border border-emerald-100">
                            <FaCheckCircle className="text-2xl mb-2 mx-auto" />
                            No Violations Detected
                          </div>
                        )}
                        {asArray(violations).map((v, i) => (
                          <div key={i} className="text-xs bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg shadow-sm">
                            <strong className="block mb-1 text-rose-900">{v.violation_type}</strong>
                            <span className="opacity-80 flex items-center gap-1 font-mono">
                              <FaHistory /> {formatSubmittedAt(v.event_timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 border-b pb-2">Session Metadata</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Attempt ID</span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-xs">#{attempt.attempt_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Submitted</span>
                      <span className="font-bold text-slate-700 text-right">
                        {attempt.summary?.submitted_at ? formatSubmittedAt(attempt.summary.submitted_at) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* EMPTY STATE */}
        {!loading && !attempt && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
              <FaBookOpen className="text-4xl text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">Ready to Review</h2>
            <p className="text-slate-400 mt-2 text-center px-4">Select filters above to load an assessment attempt.</p>
          </div>
        )}
      </div>
    </div>
  );
}