import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { motion } from "framer-motion";
import {
  FaBookOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaLayerGroup,
  FaExclamationTriangle,
  FaFilter,
  FaTrophy,
  FaClipboardList,
  FaUserClock,
  FaSearch
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, yearoptions } from "../../constants/deptClass";
import { formatSubmittedAt } from "../../constants/dateUtils";

/* -------------------- SELECT STYLES -------------------- */
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: 12,
    minHeight: 42,
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    boxShadow: "none",
  }),
  menu: (base) => ({ ...base, zIndex: 50 }),
};

/* -------------------- SMALL COMPONENTS -------------------- */
const StatCard = ({ label, value, subtext, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border flex gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
      {subtext && <p className="text-[11px] text-gray-400">{subtext}</p>}
    </div>
  </div>
);

const OptionRow = ({ option, correct, selected }) => {
  if (!option) return null;

  let cls = "p-3 rounded-xl border flex justify-between text-sm ";
  if (correct) cls += "bg-emerald-50 border-emerald-200 text-emerald-700";
  else if (selected) cls += "bg-rose-50 border-rose-200 text-rose-700";
  else cls += "bg-white border-gray-100";

  return (
    <div className={cls}>
      <span>{option}</span>
      {correct && <FaCheckCircle />}
      {selected && !correct && <FaTimesCircle />}
    </div>
  );
};

/* ==================== MAIN COMPONENT ==================== */
export default function PlacementAnswerReview() {
  const token = localStorage.getItem("token");

  const asArray = (v) => Array.isArray(v) ? v : [];

  /* ---------- STATE ---------- */
  const [filters, setFilters] = useState({
    dept_id: "",
    class_id: "",
    course_id: "",
    test_id: "",
    student_id: "",
    attempt_id: "",
  });

  const [data, setData] = useState({
    courses: [],
    tests: [],
    students: [],
    attempts: [],
  });

  const [attempt, setAttempt] = useState(null);
  const [violations, setViolations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questionFilter, setQuestionFilter] = useState("all");

  /* ---------- SAFE FETCH ---------- */
  const api = (url) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .catch(() => null);

  /* ---------- FETCH OPTIONS (NO CASCADE RESET) ---------- */
  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/courses`)
      .then((d) => setData((p) => ({
        ...p,
        courses: Array.isArray(d) ? d : d?.courses || []
      })));

  }, []);

  useEffect(() => {
    api(`${BASE_URL}/placement-training/review/tests?course_id=${filters.course_id || ""}`)
      .then(d => setData(p => ({
        ...p,
        tests: Array.isArray(d) ? d : d?.tests || []
      })));
  }, [filters.course_id]);

  useEffect(() => {
    api(
      `${BASE_URL}/placement-training/review/students?dept_id=${filters.dept_id}&class_id=${filters.class_id}&course_id=${filters.course_id}&test_id=${filters.test_id}`
    ).then(d => setData(p => ({
      ...p,
      students: Array.isArray(d) ? d : d?.students || []
    })));
  }, [filters.dept_id, filters.class_id, filters.course_id, filters.test_id]);

  useEffect(() => {
    if (!filters.student_id || !filters.test_id) return;
    api(
      `${BASE_URL}/placement-training/review/attempts?student_id=${filters.student_id}&test_id=${filters.test_id}`
    ).then(d => setData(p => ({
      ...p,
      attempts: Array.isArray(d) ? d : d?.attempts || []
    })));
  }, [filters.student_id, filters.test_id]);


  /* ---------- FETCH ATTEMPT (NO VIOLATIONS AUTO) ---------- */
  useEffect(() => {
    if (!filters.attempt_id) return;
    setLoading(true);
    setAttempt(null);
    setViolations(null);

    api(`${BASE_URL}/placement-training/review/attempt/${filters.attempt_id}`)
      .then((d) => setAttempt(d || null))
      .finally(() => setLoading(false));
  }, [filters.attempt_id]);

  /* ---------- QUESTIONS FILTER ---------- */
  const questions = useMemo(() => {
    const q = attempt?.questions || [];
    if (questionFilter === "all") return q;
    return q.filter((x) => x.status === questionFilter);
  }, [attempt, questionFilter]);

  /* ---------- LOAD VIOLATIONS ON DEMAND ---------- */
  const loadViolations = async () => {
    const ok = await Swal.fire({
      title: "View security logs?",
      text: "Sensitive proctoring data",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "View",
    });

    if (!ok.isConfirmed) return;

    const v = await api(
      `${BASE_URL}/placement-training/review/attempt/${filters.attempt_id}/violations`
    );
    setViolations(v || []);
  };

  /* ==================== UI ==================== */
  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      <h1 className="text-3xl font-extrabold flex gap-3">
        <FaBookOpen /> Review Assessment
      </h1>

      {/* ---------------- FILTERS ---------------- */}
      <div className="bg-white p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Select styles={selectStyles} placeholder="Department"
          options={Object.entries(DEPT_MAP).map(([v, l]) => ({ value: v, label: l }))}
          onChange={(o) => setFilters(f => ({ ...f, dept_id: o?.value || "" }))} />

        <Select styles={selectStyles} placeholder="Year"
          options={yearoptions}
          onChange={(o) => setFilters(f => ({ ...f, class_id: o?.value || "" }))} />

        <Select styles={selectStyles} placeholder="Course"
          options={asArray(data.courses).map(c => ({
            value: c.course_id,
            label: c.name
          }))}
          onChange={(o) => setFilters(f => ({ ...f, course_id: o?.value || "" }))} />

        <Select styles={selectStyles} placeholder="Test"
          options={asArray(data.tests).map(t => ({ value: t.test_id, label: t.title }))}
          onChange={(o) => setFilters(f => ({ ...f, test_id: o?.value || "" }))} />

        <Select styles={selectStyles} placeholder="Student"
          options={asArray(data.students).map(s => ({
            value: s.student_id,
            label: `${s.name} (${s.roll_no})`
          }))}
          onChange={(o) => setFilters(f => ({ ...f, student_id: o?.value || "" }))} />

        <Select styles={selectStyles} placeholder="Attempt"
          options={asArray(data.attempts).map(a => ({
            value: a.attempt_id,
            label: `Attempt ${a.attempt_no}`
          }))}
          onChange={(o) => setFilters(f => ({ ...f, attempt_id: o?.value || "" }))} />
      </div>

      {/* ---------------- LOADING ---------------- */}
      {loading && (
        <div className="text-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
            <FaLayerGroup className="text-4xl mx-auto text-indigo-500" />
          </motion.div>
        </div>
      )}

      {/* ---------------- SUMMARY ---------------- */}
      {attempt && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Score"
              value={`${attempt.summary?.score ?? 0}/${attempt.summary?.total_questions ?? 0}`}
              icon={FaTrophy} color="bg-indigo-50 text-indigo-600" />

            <StatCard label="Result"
              value={(attempt.summary?.pass_status || "N/A").toUpperCase()}
              icon={FaCheckCircle} color="bg-emerald-50 text-emerald-600" />

            <StatCard label="Attempted"
              value={`${attempt.summary?.answered_count ?? 0}`}
              icon={FaClipboardList} color="bg-blue-50 text-blue-600" />

            <StatCard label="Submission"
              value={attempt.summary?.submission_type || "N/A"}
              icon={FaUserClock} color="bg-purple-50 text-purple-600" />
          </div>

          {/* ---------------- VIOLATIONS ---------------- */}
          <button
            onClick={loadViolations}
            className="mt-6 text-sm font-bold text-rose-600 flex gap-2 items-center"
          >
            <FaExclamationTriangle /> View Security Logs
          </button>

          {violations && (
            <div className="bg-white mt-4 rounded-xl border p-4 space-y-2">
              {asArray(violations).length === 0 && <p>No violations</p>}
              {asArray(violations).map((v, i) => (
                <div key={i} className="text-xs border p-3 rounded">
                  <b>{v.violation_type}</b> · {formatSubmittedAt(v.event_timestamp)}
                </div>
              ))}
            </div>
          )}

          {/* ---------------- QUESTIONS ---------------- */}
          <div className="bg-white mt-8 rounded-2xl border">
            <div className="flex gap-2 p-3 border-b">
              {["all", "correct", "wrong", "unattempted"].map(f => (
                <button key={f}
                  onClick={() => setQuestionFilter(f)}
                  className={`px-3 py-1 text-xs rounded ${questionFilter === f ? "bg-indigo-100" : ""}`}>
                  {f}
                </button>
              ))}
            </div>

            {questions.length === 0 && (
              <div className="p-10 text-center text-gray-400">
                <FaSearch className="mx-auto text-2xl mb-2" />
                No questions
              </div>
            )}

            {questions.map((q, i) => (
              <div key={q.question_id} className="p-6 border-b">
                <p className="font-bold mb-3">Q{i + 1}. {q.question}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <OptionRow option={q.option_a} correct={q.correct_option === "A"} selected={q.selected_option === "A"} />
                  <OptionRow option={q.option_b} correct={q.correct_option === "B"} selected={q.selected_option === "B"} />
                  <OptionRow option={q.option_c} correct={q.correct_option === "C"} selected={q.selected_option === "C"} />
                  <OptionRow option={q.option_d} correct={q.correct_option === "D"} selected={q.selected_option === "D"} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
