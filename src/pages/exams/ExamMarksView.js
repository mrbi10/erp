import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineFilter,
  HiOutlineTrendingUp, HiOutlineAcademicCap
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
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
        head: [["Subject", "Exam Type", "Marks", "Total", "Result"]],
        body: data.map((r) => [r.subject_name || r.Subject, r.exam_type || r["Exam Type"], r.marks || r.Marks, r.total || r.Total, r.result_status || r.Result]),
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

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  </motion.div>
);

export default function ExamMarksView() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "student";
  const headers = { Authorization: `Bearer ${token}` };

  const isStudent = role === "student";
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // student filters
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [academicYearId, setAcademicYearId] = useState("");

  // staff/admin filters
  const [viewMode, setViewMode] = useState("student");
  const [targetId, setTargetId] = useState("");
  const [filterExamType, setFilterExamType] = useState(EXAM_TYPES[0]);
  const [filterAcadYear, setFilterAcadYear] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const loadStudentMarks = () => {
    setLoading(true); setFetched(false);
    const studentId = isStudent ? user.id : targetId;
    if (!studentId) return Swal.fire("Required", "Enter Student ID", "warning");
    let url = `${BASE_URL}/marks/student/${studentId}?`;
    if (examType?.value) url += `exam_type=${examType.value}&`;
    if (academicYearId) url += `academic_year_id=${academicYearId}`;
    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => { setMarks(Array.isArray(d) ? d : []); setLoading(false); setFetched(true); })
      .catch(() => { setLoading(false); Swal.fire("Error", "Failed to fetch marks", "error"); });
  };

  const loadClassMarks = () => {
    if (!targetId) return Swal.fire("Required", "Enter Class ID", "warning");
    setLoading(true); setFetched(false);
    let url = `${BASE_URL}/marks/class/${targetId}?`;
    if (filterExamType?.value) url += `exam_type=${filterExamType.value}&`;
    if (filterSubject) url += `subject_id=${filterSubject}&`;
    if (filterAcadYear) url += `academic_year_id=${filterAcadYear}`;
    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => { setMarks(Array.isArray(d) ? d : []); setLoading(false); setFetched(true); })
      .catch(() => setLoading(false));
  };

  // Auto-load for students
  useEffect(() => {
    if (isStudent) {
      setLoading(true);
      let url = `${BASE_URL}/marks/student/${user.id}?`;
      if (examType?.value) url += `exam_type=${examType.value}&`;
      if (academicYearId) url += `academic_year_id=${academicYearId}`;
      fetch(url, { headers })
        .then((r) => r.json())
        .then((d) => { setMarks(Array.isArray(d) ? d : []); setLoading(false); setFetched(true); })
        .catch(() => setLoading(false));
    }
  }, [examType, academicYearId]);

  const stats = useMemo(() => {
    if (!marks.length) return { total: 0, passed: 0, avg: 0, highest: 0 };
    const total = marks.length;
    const passed = marks.filter((m) => m.result_status === "Pass").length;
    const allMarks = marks.map((m) => Number(m.marks || 0));
    const avg = (allMarks.reduce((a, b) => a + b, 0) / total).toFixed(1);
    const highest = Math.max(...allMarks);
    return { total, passed, failed: total - passed, avg, highest };
  }, [marks]);

  const exportData = marks.map((m) => ({
    Subject: m.subject_name, Code: m.subject_code, "Exam Type": m.exam_type,
    Marks: m.marks, Total: m.total, Result: m.result_status || "—",
    Student: m.student_name || "", "Roll No": m.roll_no || "",
  }));

  const resultBadge = (status) =>
    status === "Pass" ? "bg-emerald-100 text-emerald-700" : status === "Fail" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500";

  const examTypeBadge = { IAT1: "bg-blue-100 text-blue-700", IAT2: "bg-sky-100 text-sky-700", MODEL: "bg-violet-100 text-violet-700", FINAL: "bg-amber-100 text-amber-700" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Marks View</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {isStudent ? "Your examination marks and results" : "View student or class marks"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel(exportData, "Marks_View")} disabled={!marks.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDownload className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => generatePDFReport(marks, "Marks Report")} disabled={!marks.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDocumentText className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {fetched && marks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={HiOutlineClipboardList} label="Total Records" value={stats.total} color="bg-slate-100 text-slate-500" />
            <StatCard icon={HiOutlineCheckCircle} label="Passed" value={stats.passed} color="bg-emerald-50 text-emerald-500" />
            <StatCard icon={HiOutlineXCircle} label="Failed" value={stats.failed} color="bg-rose-50 text-rose-500" />
            <StatCard icon={HiOutlineTrendingUp} label="Class Avg" value={stats.avg} color="bg-indigo-50 text-indigo-500" sub={`Highest: ${stats.highest}`} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineFilter className="text-emerald-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </div>
          {isStudent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select options={EXAM_TYPES} value={examType} onChange={setExamType} styles={selectStyles} placeholder="All Exam Types" />
              <input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Academic Year ID (optional)" />
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-2">
                {["student", "class"].map((m) => (
                  <button key={m} onClick={() => { setViewMode(m); setMarks([]); setFetched(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${viewMode === m ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {m} View
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input value={targetId} onChange={(e) => setTargetId(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder={viewMode === "student" ? "Student ID" : "Class ID"} />
                <Select options={EXAM_TYPES} value={filterExamType} onChange={setFilterExamType} styles={selectStyles} placeholder="Exam Type" />
                <input value={filterAcadYear} onChange={(e) => setFilterAcadYear(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="Academic Year ID" />
                {viewMode === "class" && (
                  <input value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Subject ID (optional)" />
                )}
              </div>
              <button onClick={viewMode === "student" ? loadStudentMarks : loadClassMarks} disabled={loading}
                className="mt-1 px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
                {loading ? "Loading…" : "Load Marks"}
              </button>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading marks…</p>
            </motion.div>
          ) : !fetched && !isStudent ? (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineAcademicCap className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Set filters and click Load Marks</p>
            </motion.div>
          ) : marks.length === 0 && fetched ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineClipboardList className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No marks found for selected filters</p>
            </motion.div>
          ) : marks.length > 0 ? (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#",
                        ...(isStudent || viewMode === "student" ? ["Subject", "Code"] : ["Student", "Roll No", "Subject"]),
                        "Exam Type", "Marks", "Total", "%", "Result"
                      ].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {marks.map((m, i) => {
                      const pct = m.total ? Math.round((m.marks / m.total) * 100) : 0;
                      return (
                        <motion.tr key={m.mark_id || i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                          {(isStudent || viewMode === "student") ? (
                            <>
                              <td className="px-5 py-4 font-semibold text-slate-800">{m.subject_name}</td>
                              <td className="px-5 py-4 text-slate-400 font-mono text-xs">{m.subject_code}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-5 py-4 font-semibold text-slate-800">{m.student_name}</td>
                              <td className="px-5 py-4 font-mono text-slate-600">{m.roll_no}</td>
                              <td className="px-5 py-4 text-slate-600">{m.subject_name}</td>
                            </>
                          )}
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${examTypeBadge[m.exam_type] || "bg-slate-100 text-slate-600"}`}>
                              {m.exam_type}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900 text-base">{m.marks}</td>
                          <td className="px-5 py-4 text-slate-500">{m.total}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${pct >= 50 ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-medium text-slate-600">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {m.result_status ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${resultBadge(m.result_status)}`}>
                                {m.result_status}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                {marks.length} record{marks.length !== 1 ? "s" : ""}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
