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
  FaChevronRight,
  FaShieldAlt,
  FaHistory
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, yearoptions } from "../../constants/deptClass";
import { formatSubmittedAt } from "../../constants/dateUtils";

/* -------------------- THEME & STYLES -------------------- */
const THEME = {
  primary: "indigo",
  bg: "bg-slate-50",
  card: "bg-white shadow-sm border border-slate-200 rounded-xl",
  textMain: "text-slate-800",
  textSub: "text-slate-500",
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(99, 102, 241, 0.2)" : "none",
    padding: "2px",
    fontSize: "0.875rem",
    "&:hover": { borderColor: "#cbd5e1" },
  }),
  menu: (base) => ({ ...base, zIndex: 60, borderRadius: "0.75rem", overflow: "hidden" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#e0e7ff" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
  }),
};

/* -------------------- SUB-COMPONENTS -------------------- */

// 1. Modern Stat Card
const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${THEME.card} p-5 flex items-center justify-between overflow-hidden relative`}
  >
    <div className="z-10 relative">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
      <Icon className="text-xl" />
    </div>
    {/* Decorative background blob */}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 ${bgClass}`} />
  </motion.div>
);

// 2. Option Row (The Answer Choice)
const OptionRow = ({ label, text, status }) => {
  // Status: 'correct' | 'wrong' | 'neutral' | 'unselected-correct'
  let styles = "border-slate-100 bg-white hover:bg-slate-50 text-slate-600";
  let icon = null;

  if (status === 'correct') {
    styles = "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium ring-1 ring-emerald-200";
    icon = <FaCheckCircle className="text-emerald-500 text-lg" />;
  } else if (status === 'wrong') {
    styles = "border-rose-200 bg-rose-50 text-rose-800 font-medium ring-1 ring-rose-200";
    icon = <FaTimesCircle className="text-rose-500 text-lg" />;
  } else if (status === 'missed') {
    // Correct option but user didn't pick it
    styles = "border-emerald-200 bg-white text-emerald-700 border-dashed";
    icon = <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Correct Answer</span>;
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${styles}`}>
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border text-xs font-bold uppercase shadow-sm">
        {label}
      </div>
      <span className="flex-grow text-sm leading-relaxed">{text}</span>
      {icon}
    </div>
  );
};

// 3. Question Card
const QuestionCard = ({ index, data }) => {
  const options = [
    { key: 'A', text: data.option_a },
    { key: 'B', text: data.option_b },
    { key: 'C', text: data.option_c },
    { key: 'D', text: data.option_d },
  ];

  let statusColor = "bg-slate-400"; // Unattempted
  if (data.status === "correct") statusColor = "bg-emerald-500";
  if (data.status === "wrong") statusColor = "bg-rose-500";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${THEME.card} overflow-hidden group`}
    >
      <div className={`h-1.5 w-full ${statusColor}`} />
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <span className="flex-shrink-0 flex flex-col items-center">
            <span className="text-2xl font-black text-slate-200">#{index + 1}</span>
          </span>
          <div className="flex-grow">
            <h4 className="text-lg font-semibold text-slate-800 leading-snug">{data.question}</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
  const [compareMode, setCompareMode] = useState(false);
  const [compareFilters, setCompareFilters] = useState({
    student_id: "",
    attempt_id: "",
  });
  const [compareAttempt, setCompareAttempt] = useState(null);
  const [compareAttempts, setCompareAttempts] = useState([]);


  const compareQuestionMap = useMemo(() => {
  if (!compareAttempt) return {};
  return Object.fromEntries(
    compareAttempt.questions.map(q => [q.question_id, q])
  );
}, [compareAttempt]);



  /* ---------- API HELPERS ---------- */
  const api = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null);

  /* ---------- FETCH CHAINS ---------- */
  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/courses`)
      .then(d => setData(p => ({ ...p, courses: asArray(d?.courses || d) })));
  }, []);

  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/tests?course_id=${filters.course_id || ""}`)
      .then(d => setData(p => ({ ...p, tests: asArray(d?.tests || d) })));
  }, [filters.course_id]);

  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/students?dept_id=${filters.dept_id}&class_id=${filters.class_id}&course_id=${filters.course_id}&test_id=${filters.test_id}`)
      .then(d => setData(p => ({ ...p, students: asArray(d?.students || d) })));
  }, [filters.dept_id, filters.class_id, filters.course_id, filters.test_id]);

  useEffect(() => {
    if (!filters.student_id || !filters.test_id) return;
    api(`${BASE_URL}/placement-training/review/attempts?student_id=${filters.student_id}&test_id=${filters.test_id}`)
      .then(d => setData(p => ({ ...p, attempts: asArray(d?.attempts || d) })));
  }, [filters.student_id, filters.test_id]);

  useEffect(() => {
    if (!filters.attempt_id) return;
    setLoading(true);
    setAttempt(null);
    setViolations(null);
    api(`${BASE_URL}/placement-training/review/attempt/${filters.attempt_id}`)
      .then(d => setAttempt(d || null))
      .finally(() => setLoading(false));
  }, [filters.attempt_id]);


  useEffect(() => {
    if (!compareFilters.student_id || !filters.test_id) {
      setCompareAttempts([]);
      return;
    }

    api(
      `${BASE_URL}/placement-training/review/attempts?student_id=${compareFilters.student_id}&test_id=${filters.test_id}`
    ).then(d => setCompareAttempts(asArray(d?.attempts || d)));
  }, [compareFilters.student_id, filters.test_id]);



  useEffect(() => {
  if (!compareFilters.attempt_id) {
    setCompareAttempt(null);
    return;
  }

  setCompareAttempt(null);

  api(
    `${BASE_URL}/placement-training/review/attempt/${compareFilters.attempt_id}`
  ).then(d => setCompareAttempt(d || null));
}, [compareFilters.attempt_id]);


useEffect(() => {
  setCompareMode(false);
  setCompareAttempt(null);
  setCompareFilters({ student_id: "", attempt_id: "" });
  setCompareAttempts([]);
}, [filters.attempt_id]);




  /* ---------- FILTER LOGIC ---------- */
  const filteredQuestions = useMemo(() => {
    const q = attempt?.questions || [];
    if (questionFilter === "all") return q;

    if (questionFilter === "unattempted") {
      return q.filter(x => !x.selected_option);
    }

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
    <div className={`min-h-screen ${THEME.bg} p-4 md:p-8 font-sans text-slate-800`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>

            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900">
              <FaBookOpen className="text-indigo-600" />
              Assessment Review
            </h1>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className={`${THEME.card} p-6`}>
          <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-400 uppercase tracking-wide">
            <FaFilter /> Filter Criteria
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Select styles={customSelectStyles} placeholder="Department" options={Object.entries(DEPT_MAP).map(([v, l]) => ({ value: v, label: l }))} onChange={o => setFilters(f => ({ ...f, dept_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Year" options={yearoptions} onChange={o => setFilters(f => ({ ...f, class_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Course" options={asArray(data.courses).map(c => ({ value: c.course_id, label: c.name }))} onChange={o => setFilters(f => ({ ...f, course_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Test" options={asArray(data.tests).map(t => ({ value: t.test_id, label: t.title }))} onChange={o => setFilters(f => ({ ...f, test_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Student" options={asArray(data.students).map(s => ({ value: s.student_id, label: `${s.name} (${s.student_id})` }))} onChange={o => setFilters(f => ({ ...f, student_id: o?.value || "" }))} />
            <Select styles={customSelectStyles} placeholder="Select Attempt..." options={asArray(data.attempts).map(a => ({ value: a.attempt_id, label: `Attempt #${a.attempt_no}` }))} onChange={o => setFilters(f => ({ ...f, attempt_id: o?.value || "" }))} />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-indigo-500">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <FaLayerGroup className="text-5xl" />
            </motion.div>
            <p className="mt-4 font-medium text-slate-500">Retrieving attempt data...</p>
          </div>
        )}

        {/* CONTENT AREA */}
        {!loading && attempt && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Score Achieved" value={`${attempt.summary?.score ?? 0} / ${attempt.summary?.total_questions ?? 0}`} icon={FaTrophy} colorClass="text-amber-600" bgClass="bg-amber-100" />
              <StatCard label="Pass Status" value={(attempt.summary?.pass_status || "N/A").toUpperCase()} icon={FaCheckCircle} colorClass={attempt.summary?.pass_status === 'Pass' ? "text-emerald-600" : "text-rose-600"} bgClass={attempt.summary?.pass_status === 'Pass' ? "bg-emerald-100" : "bg-rose-100"} />
              <StatCard label="Questions Attempted" value={attempt.summary?.answered_count ?? 0} icon={FaClipboardList} colorClass="text-blue-600" bgClass="bg-blue-100" />
              <StatCard label="Submission Type" value={attempt.summary?.submission_type || "Auto"} icon={FaUserClock} colorClass="text-purple-600" bgClass="bg-purple-100" />
              <button
                disabled={!filters.attempt_id}
                onClick={() => setCompareMode(v => !v)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                {compareMode ? "Exit Compare" : "Compare"}
              </button>
            </div>

            {compareMode && (
              <div className={`${THEME.card} p-6`}>
                <h4 className="font-bold text-slate-700 mb-4">
                  Select Student to Compare
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    styles={customSelectStyles}
                    placeholder="Compare Student"
                    options={asArray(data.students)
                      .filter(s => s.student_id !== filters.student_id)
                      .map(s => ({
                        value: s.student_id,
                        label: `${s.name} (${s.student_id})`,
                      }))}
                    onChange={o =>
                      setCompareFilters(f => ({ ...f, student_id: o?.value || "" }))
                    }
                  />

                 <Select
  isDisabled={!compareFilters.student_id}
  styles={customSelectStyles}
  placeholder="Compare Attempt"
  options={compareAttempts.map(a => ({
    value: a.attempt_id,
    label: `Attempt #${a.attempt_no}`,
  }))}
  onChange={o =>
    setCompareFilters(f => ({ ...f, attempt_id: o?.value || "" }))
  }
/>


                </div>
              </div>
            )}


            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

              {/* LEFT COL: Questions */}
              <div className="lg:col-span-3 space-y-6">

                {/* Custom Tab Bar */}
                <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex shadow-sm">
                  {[
                    { id: "all", label: "All Questions" },
                    { id: "correct", label: "Correct Only" },
                    { id: "wrong", label: "Incorrect" },
                    { id: "unattempted", label: "Skipped" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setQuestionFilter(tab.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${questionFilter === tab.id
                        ? "bg-indigo-500 text-white shadow-md"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                      <FaSearch className="mx-auto text-4xl text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">No questions match this filter.</p>
                    </div>
                  ) : (
                    filteredQuestions.map((q, i) => (
                      <QuestionCard key={q.question_id || i} index={i} data={q} />
                    ))
                  )}
                </div>
              </div>

             {compareMode && compareAttempt && (
  <div className="lg:col-span-3 mt-10 border-t pt-8">
    <h3 className="text-xl font-bold text-slate-800 mb-6">
      Comparison View
    </h3>

    <div className="space-y-8">
      {filteredQuestions.map((q, i) => {
        const compareQ = compareQuestionMap[q.question_id];

        return (
          <div
            key={q.question_id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Primary student */}
            <QuestionCard index={i} data={q} />

            {/* Compared student */}
            {compareQ ? (
              <QuestionCard index={i} data={compareQ} />
            ) : (
              <div className="p-6 bg-slate-50 border rounded-xl text-slate-400 flex items-center justify-center">
                Not Attempted
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}


              {/* RIGHT COL: Meta & Security */}
              <div className="space-y-6 lg:col-span-1">
                {/* Security Card */}
                <div className={`${THEME.card} overflow-hidden`}>
                  <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700">
                      <FaShieldAlt className="text-slate-400" /> Security Logs
                    </h3>
                  </div>
                  <div className="p-4">
                    {!violations ? (
                      <button
                        onClick={handleViolationCheck}
                        className="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center gap-2"
                      >
                        <FaExclamationTriangle />
                        Load Violation Data
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {asArray(violations).length === 0 && (
                          <div className="text-center py-4 text-emerald-600 text-sm font-medium bg-emerald-50 rounded-lg">
                            <FaCheckCircle className="inline mr-2" /> Clean Record
                          </div>
                        )}
                        {asArray(violations).map((v, i) => (
                          <div key={i} className="text-xs bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg">
                            <strong className="block mb-1">{v.violation_type}</strong>
                            <span className="opacity-75 flex items-center gap-1">
                              <FaHistory className="text-[10px]" /> {formatSubmittedAt(v.event_timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attempt Meta Info */}
                <div className={`${THEME.card} p-5`}>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Meta Data</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attempt ID</span>
                      <span className="font-mono text-slate-700">{attempt.attempt_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-slate-700">
                        {attempt.summary?.submitted_at ? formatSubmittedAt(attempt.summary.submitted_at) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* EMPTY STATE (Before Selection) */}
        {!loading && !attempt && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <FaBookOpen className="text-6xl mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-400">Select a student and attempt to begin review.</p>
          </div>
        )}
      </div>
    </div>
  );
}