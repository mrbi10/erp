import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlineFilter, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineUsers, HiOutlineAcademicCap
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  });
};

const generatePDFReport = (data, title) => {
  import("jspdf").then(({ default: jsPDF }) => {
    import("jspdf-autotable").then(() => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.autoTable({
        startY: 30,
        head: [["Subject", "Students", "Average", "Highest", "Lowest", "Passed", "Failed", "Pass %"]],
        body: data.map((r) => [r.subject_name || "—", r.total_students, r.average_marks, r.highest_marks, r.lowest_marks, r.passed, r.failed, `${r.pass_percentage}%`]),
      });
      doc.save(`${title}.pdf`);
    });
  });
};

const selectStyles = {
  control: (b) => ({ ...b, borderRadius: 12, borderColor: "#e2e8f0", boxShadow: "none", minHeight: 42, fontSize: 14 }),
  menu: (b) => ({ ...b, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }),
  option: (b, s) => ({ ...b, backgroundColor: s.isSelected ? "#6366f1" : s.isFocused ? "#eef2ff" : "white", color: s.isSelected ? "white" : "#1e293b" }),
};

const EXAM_TYPES = [{ value: "", label: "All Types" }, ...["IAT1", "IAT2", "MODEL", "FINAL"].map((v) => ({ value: v, label: v }))];

const GaugeBar = ({ value, max = 100, color = "bg-indigo-500" }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }} className={`h-2.5 rounded-full ${color}`} />
    </div>
    <span className="text-sm font-semibold text-slate-700 w-12 text-right">{value}%</span>
  </div>
);

const BigStat = ({ icon: Icon, label, value, sub, color, textColor }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-6 shadow-sm border ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${textColor} opacity-70`}>{label}</p>
        <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
        {sub && <p className={`text-sm mt-1 ${textColor} opacity-60`}>{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${textColor} opacity-20 bg-current`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export default function ExamAnalytics() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [mode, setMode] = useState("class");
  const [targetId, setTargetId] = useState("");
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [classAnalytics, setClassAnalytics] = useState([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/exam/sessions`, { headers })
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []));
  }, []);

  const sessionOptions = [{ value: "", label: "All Sessions" }, ...sessions.map((s) => ({ value: s.session_id, label: s.session_name }))];

  const buildParams = () => {
    const p = new URLSearchParams();
    if (examType?.value) p.append("exam_type", examType.value);
    if (academicYearId) p.append("academic_year_id", academicYearId);
    if (sessionId) p.append("session_id", sessionId);
    if (subjectId && mode === "class") p.append("subject_id", subjectId);
    return p.toString();
  };

  const loadAnalytics = () => {
    if (!targetId) return Swal.fire("Required", `Enter ${mode === "class" ? "Class" : "Subject"} ID`, "warning");
    setLoading(true); setFetched(false);
    const params = buildParams();
    const url = mode === "class"
      ? `${BASE_URL}/marks/analytics/class/${targetId}?${params}`
      : `${BASE_URL}/marks/analytics/subject/${targetId}?${params}`;
    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (mode === "class") setClassAnalytics(Array.isArray(d) ? d : []);
        else setSubjectAnalytics(d);
        setLoading(false); setFetched(true);
      })
      .catch(() => { setLoading(false); Swal.fire("Error", "Failed to load analytics", "error"); });
  };

  const overallStats = useMemo(() => {
    if (!classAnalytics.length) return null;
    const totalStudents = Math.max(...classAnalytics.map((c) => Number(c.total_students || 0)));
    const avgPass = (classAnalytics.reduce((a, b) => a + Number(b.pass_percentage || 0), 0) / classAnalytics.length).toFixed(1);
    const bestSubject = classAnalytics.reduce((a, b) => Number(a.pass_percentage) > Number(b.pass_percentage) ? a : b);
    const worstSubject = classAnalytics.reduce((a, b) => Number(a.pass_percentage) < Number(b.pass_percentage) ? a : b);
    return { totalStudents, avgPass, bestSubject: bestSubject.subject_name, worstSubject: worstSubject.subject_name };
  }, [classAnalytics]);

  const exportData = mode === "class"
    ? classAnalytics.map((r) => ({
        Subject: r.subject_name, Code: r.subject_code, Students: r.total_students,
        Average: r.average_marks, Highest: r.highest_marks, Lowest: r.lowest_marks,
        Passed: r.passed, Failed: r.failed, "Pass %": r.pass_percentage,
      }))
    : subjectAnalytics ? [{
        Subject: subjectAnalytics.subject_name, Students: subjectAnalytics.total_students,
        Average: subjectAnalytics.average_marks, Highest: subjectAnalytics.highest_marks,
        Lowest: subjectAnalytics.lowest_marks, Passed: subjectAnalytics.passed,
        Failed: subjectAnalytics.failed, "Pass %": subjectAnalytics.pass_percentage,
      }] : [];

  const passColor = (pct) => {
    const p = Number(pct);
    if (p >= 75) return "bg-emerald-500";
    if (p >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Analytics</h1>
            <p className="text-slate-500 mt-1 text-sm">Exam performance insights — pass rates, averages, subject-wise analytics</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel(exportData, "Exam_Analytics")} disabled={!fetched}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDownload className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => generatePDFReport(exportData, "Exam Analytics")} disabled={!fetched}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDocumentText className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {/* Mode toggle */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex gap-3 mb-1">
            {["class", "subject"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setFetched(false); setClassAnalytics([]); setSubjectAnalytics(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${mode === m ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {m === "class" ? "Class Analytics" : "Subject Analytics"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="text-violet-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">{mode === "class" ? "Class ID" : "Subject ID"} *</label>
              <input value={targetId} onChange={(e) => setTargetId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder={mode === "class" ? "e.g. 12" : "e.g. 5"} />
            </div>
            <Select options={EXAM_TYPES} value={examType} onChange={setExamType} styles={selectStyles} placeholder="Exam Type" />
            <input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Academic Year ID" />
            {mode === "class" && (
              <Select options={sessionOptions} value={sessionOptions.find((s) => s.value === sessionId) || null}
                onChange={(o) => setSessionId(o?.value || "")} styles={selectStyles} placeholder="Session (optional)" />
            )}
            {mode === "subject" && (
              <input value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder="Class ID filter (optional)" />
            )}
          </div>
          <button onClick={loadAnalytics} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-all">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineChartBar className="w-4 h-4" />}
            {loading ? "Analyzing…" : "Run Analytics"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Computing analytics…</p>
            </motion.div>
          ) : !fetched ? (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineChartBar className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Set filters and run analytics</p>
            </motion.div>

          ) : mode === "subject" && subjectAnalytics ? (
            <motion.div key="subject-analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BigStat icon={HiOutlineUsers} label="Total Students" value={subjectAnalytics.total_students}
                  color="bg-slate-900 border-slate-800" textColor="text-white" />
                <BigStat icon={HiOutlineTrendingUp} label="Average Marks" value={subjectAnalytics.average_marks}
                  color="bg-indigo-600 border-indigo-500" textColor="text-white" />
                <BigStat icon={HiOutlineCheckCircle} label="Passed" value={subjectAnalytics.passed}
                  color="bg-emerald-500 border-emerald-400" textColor="text-white" />
                <BigStat icon={HiOutlineXCircle} label="Failed" value={subjectAnalytics.failed}
                  color="bg-rose-500 border-rose-400" textColor="text-white" />
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-5">
                  {subjectAnalytics.subject_name} — {subjectAnalytics.subject_code}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {[["Highest Marks", subjectAnalytics.highest_marks], ["Lowest Marks", subjectAnalytics.lowest_marks], ["Average", subjectAnalytics.average_marks]].map(([label, val]) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-semibold text-slate-800">{val}</span>
                        </div>
                        <GaugeBar value={Math.round((val / 100) * 100)} color="bg-indigo-500" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <motion.circle cx="18" cy="18" r="15.9155" fill="none" stroke="#8b5cf6" strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${subjectAnalytics.pass_percentage}, 100`}
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${subjectAnalytics.pass_percentage}, 100` }}
                          transition={{ duration: 1, ease: "easeOut" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-800">{subjectAnalytics.pass_percentage}%</span>
                        <span className="text-xs text-slate-400">Pass Rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          ) : mode === "class" && classAnalytics.length === 0 ? (
            <motion.div key="class-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineAcademicCap className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No analytics data found</p>
            </motion.div>

          ) : mode === "class" && classAnalytics.length > 0 ? (
            <motion.div key="class-analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">
              {overallStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <BigStat icon={HiOutlineUsers} label="Total Students" value={overallStats.totalStudents}
                    color="bg-slate-900 border-slate-800" textColor="text-white" />
                  <BigStat icon={HiOutlineTrendingUp} label="Avg Pass Rate" value={`${overallStats.avgPass}%`}
                    color="bg-violet-600 border-violet-500" textColor="text-white" />
                  <BigStat icon={HiOutlineCheckCircle} label="Best Subject" value={overallStats.bestSubject}
                    color="bg-emerald-500 border-emerald-400" textColor="text-white" sub="Highest pass %" />
                  <BigStat icon={HiOutlineXCircle} label="Needs Attention" value={overallStats.worstSubject}
                    color="bg-rose-500 border-rose-400" textColor="text-white" sub="Lowest pass %" />
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {["Subject", "Code", "Students", "Avg Marks", "Highest", "Lowest", "Passed", "Failed", "Pass Rate"].map((h) => (
                          <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {classAnalytics.map((row, i) => (
                        <motion.tr key={row.subject_id || i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="hover:bg-violet-50/30 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-800">{row.subject_name}</td>
                          <td className="px-5 py-4 font-mono text-slate-400 text-xs">{row.subject_code}</td>
                          <td className="px-5 py-4 text-slate-600">{row.total_students}</td>
                          <td className="px-5 py-4 font-semibold text-slate-800">{row.average_marks}</td>
                          <td className="px-5 py-4 text-emerald-600 font-semibold">{row.highest_marks}</td>
                          <td className="px-5 py-4 text-rose-600 font-semibold">{row.lowest_marks}</td>
                          <td className="px-5 py-4">
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">{row.passed}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-xs font-semibold">{row.failed}</span>
                          </td>
                          <td className="px-5 py-4 w-48">
                            <GaugeBar value={Number(row.pass_percentage)} color={passColor(row.pass_percentage)} />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                  {classAnalytics.length} subject{classAnalytics.length !== 1 ? "s" : ""} analyzed
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
