import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineEye, HiOutlineEyeOff, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlineFilter, HiOutlineBadgeCheck,
  HiOutlineLockClosed, HiOutlineRefresh, HiOutlineExclamationCircle
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
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
        head: [["Student", "Roll No", "Subject", "Exam Type", "Marks", "Total", "Result"]],
        body: data.map((r) => [r.student_name, r.roll_no, r.subject_name, r.exam_type, r.marks, r.total, r.result_status]),
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

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </motion.div>
);

export default function ExamPublishResults() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [classId, setClassId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null); // session publish state
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/exam/sessions`, { headers })
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []));
  }, []);

  const sessionOptions = sessions.map((s) => ({
    value: s.session_id,
    label: `${s.session_name} — ${s.exam_type_name || ""} (${s.class_name || ""})`,
    data: s,
  }));

  const handleSessionChange = (opt) => {
    setSelectedSession(opt);
    setResults([]); setFetched(false);
    if (opt) setPublishStatus(opt.data?.results_published ? "published" : "unpublished");
  };

  const loadResults = () => {
    if (!selectedSession || !classId) return Swal.fire("Required", "Select a session and enter Class ID.", "warning");
    setLoading(true); setFetched(false);
    fetch(`${BASE_URL}/marks/results/class/${classId}?session_id=${selectedSession.value}`, { headers })
      .then((r) => r.json())
      .then((d) => { setResults(Array.isArray(d) ? d : []); setLoading(false); setFetched(true); })
      .catch(() => { setLoading(false); Swal.fire("Error", "Failed to load results.", "error"); });
  };

  const handlePublish = async () => {
    const { value: remarks } = await Swal.fire({
      title: "Publish Results",
      text: "Students will be able to view their results immediately.",
      input: "text", inputPlaceholder: "Optional remarks…",
      icon: "question", showCancelButton: true,
      confirmButtonText: "Publish Now", confirmButtonColor: "#10b981",
    });
    if (remarks === undefined) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/marks/results/publish`, {
        method: "POST", headers,
        body: JSON.stringify({ session_id: selectedSession.value, visible_to_students: 1, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPublishStatus("published");
      Swal.fire("Published!", data.message, "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleUnpublish = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "Unpublish Results?",
      text: "Students will no longer be able to view results.",
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Unpublish", confirmButtonColor: "#ef4444",
    });
    if (!isConfirmed) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/marks/results/unpublish`, {
        method: "POST", headers,
        body: JSON.stringify({ session_id: selectedSession.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPublishStatus("unpublished");
      Swal.fire("Unpublished", data.message, "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setActionLoading(false); }
  };

  const stats = useMemo(() => {
    if (!results.length) return { total: 0, passed: 0, failed: 0, pass_pct: 0 };
    const uniqueStudents = [...new Set(results.map((r) => r.student_id || r.student_name))];
    const passedStudents = new Set(results.filter((r) => r.result_status === "Fail").map((r) => r.student_id));
    const passed = uniqueStudents.length - passedStudents.size;
    return {
      total: uniqueStudents.length,
      passed, failed: passedStudents.size,
      pass_pct: uniqueStudents.length ? Math.round((passed / uniqueStudents.length) * 100) : 0,
    };
  }, [results]);

  const exportData = results.map((r) => ({
    Student: r.student_name, "Roll No": r.roll_no, Subject: r.subject_name,
    "Exam Type": r.exam_type, Marks: r.marks, Total: r.total,
    "Passing Marks": r.passing_marks, Result: r.result_status,
  }));

  const isPublished = publishStatus === "published";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Publish Results</h1>
            <p className="text-slate-500 mt-1 text-sm">Review and publish examination results to students</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel(exportData, "Class_Results")} disabled={!results.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDownload className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => generatePDFReport(results, "Class Results")} disabled={!results.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDocumentText className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {/* Publish status banner */}
        {selectedSession && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-6 py-5 flex items-center justify-between shadow-sm ${isPublished ? "bg-emerald-500 text-white" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center gap-3">
              {isPublished ? <HiOutlineBadgeCheck className="w-6 h-6" /> : <HiOutlineLockClosed className="w-6 h-6 text-amber-500" />}
              <div>
                <p className={`font-bold text-lg ${!isPublished && "text-amber-800"}`}>
                  Results are {isPublished ? "Published" : "Unpublished"}
                </p>
                <p className={`text-sm ${isPublished ? "text-emerald-100" : "text-amber-600"}`}>
                  {isPublished ? "Students can view their results" : "Students cannot view results yet"}
                </p>
              </div>
            </div>
            <div>
              {isPublished ? (
                <button onClick={handleUnpublish} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineEyeOff className="w-4 h-4" />}
                  Unpublish
                </button>
              ) : (
                <button onClick={handlePublish} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all shadow-md disabled:opacity-50">
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineEye className="w-4 h-4" />}
                  Publish Results
                </button>
              )}
            </div>
          </motion.div>
        )}

        {fetched && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={HiOutlineDocumentText} label="Total Students" value={stats.total} color="bg-slate-100 text-slate-500" />
            <StatCard icon={HiOutlineBadgeCheck} label="Passed" value={stats.passed} color="bg-emerald-50 text-emerald-500" />
            <StatCard icon={HiOutlineExclamationCircle} label="Failed" value={stats.failed} color="bg-rose-50 text-rose-500" />
            <StatCard icon={HiOutlineRefresh} label="Pass %" value={`${stats.pass_pct}%`} color="bg-indigo-50 text-indigo-500" />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineFilter className="text-amber-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Load Results for Review</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select options={sessionOptions} value={selectedSession} onChange={handleSessionChange}
              styles={selectStyles} placeholder="Select session…" isClearable />
            <input value={classId} onChange={(e) => setClassId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Class ID" />
          </div>
          <button onClick={loadResults} disabled={loading}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
            {loading ? "Loading…" : "Load Results"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading results…</p>
            </motion.div>
          ) : !fetched ? (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineDocumentText className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Select session and class, then load results</p>
            </motion.div>
          ) : results.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineDocumentText className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No results found — ensure marks are entered first</p>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Student", "Roll No", "Subject", "Exam Type", "Marks", "/ Total", "Pass Mark", "Result"].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map((r, i) => (
                      <motion.tr key={`${r.student_name}-${r.subject_name}-${i}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                        className={`hover:bg-amber-50/30 transition-colors ${r.result_status === "Fail" ? "bg-rose-50/20" : ""}`}>
                        <td className="px-5 py-3 font-semibold text-slate-800">{r.student_name}</td>
                        <td className="px-5 py-3 font-mono text-slate-600">{r.roll_no}</td>
                        <td className="px-5 py-3 text-slate-600">{r.subject_name}</td>
                        <td className="px-5 py-3">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">{r.exam_type}</span>
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900 text-base">{r.marks}</td>
                        <td className="px-5 py-3 text-slate-400">{r.total}</td>
                        <td className="px-5 py-3 text-slate-500">{r.passing_marks}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.result_status === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {r.result_status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{results.length} result rows</span>
                {!isPublished && (
                  <button onClick={handlePublish} disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium transition-all">
                    <HiOutlineEye className="w-3 h-3" /> Publish These Results
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
