import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineAcademicCap,
  HiOutlineDocumentText, HiOutlineFilter, HiOutlineDownload
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
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
        head: [["Subject", "Date", "Start", "End", "Duration", "Max Marks", "Mode"]],
        body: data.map((r) => [r.subject_name, r.exam_date, r.start_time, r.end_time, `${r.duration_minutes} min`, r.max_marks, r.exam_mode]),
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

export default function ExamTimetable() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "student";

  const [sessions, setSessions] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${BASE_URL}/exam/sessions`, { headers })
      .then((r) => r.json())
      .then((d) => { setSessions(Array.isArray(d) ? d : []); setSessionsLoading(false); })
      .catch(() => setSessionsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    setLoading(true);
    fetch(`${BASE_URL}/exam/sessions/${selectedSession.value}/timetable`, { headers })
      .then((r) => r.json())
      .then((d) => { setTimetable(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setLoading(false); Swal.fire("Error", "Failed to load timetable", "error"); });
  }, [selectedSession]);

  const sessionOptions = sessions.map((s) => ({
    value: s.session_id,
    label: `${s.session_name} — ${s.exam_type_name || ""} (${s.class_name || s.dept_name || ""})`,
  }));

  const stats = useMemo(() => ({
    total: timetable.length,
    upcoming: timetable.filter((t) => new Date(t.exam_date) >= new Date()).length,
    subjects: [...new Set(timetable.map((t) => t.subject_id))].length,
    maxMarks: timetable.reduce((a, b) => a + Number(b.max_marks || 0), 0),
  }), [timetable]);

  const exportData = timetable.map((t) => ({
    Subject: t.subject_name, Code: t.subject_code, Date: t.exam_date,
    Start: t.start_time, End: t.end_time, "Duration (min)": t.duration_minutes,
    "Max Marks": t.max_marks, Mode: t.exam_mode, "Paper Code": t.question_paper_code || "",
  }));

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const isPast = (d) => new Date(d) < new Date();
  const modeColor = { offline: "bg-slate-100 text-slate-600", online: "bg-blue-100 text-blue-700", hybrid: "bg-purple-100 text-purple-700" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Timetable</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {role === "student" ? "Your upcoming examination schedule" : "View and manage examination schedules across sessions"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel(exportData, "Exam_Timetable")} disabled={!timetable.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <HiOutlineDownload className="w-4 h-4" /> Export Excel
            </button>
            <button onClick={() => generatePDFReport(timetable, "Exam Timetable")} disabled={!timetable.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <HiOutlineDocumentText className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </motion.div>

        {timetable.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={HiOutlineCalendar} label="Total Exams" value={stats.total} color="bg-indigo-50 text-indigo-500" />
            <StatCard icon={HiOutlineClock} label="Upcoming" value={stats.upcoming} color="bg-amber-50 text-amber-500" />
            <StatCard icon={HiOutlineAcademicCap} label="Subjects" value={stats.subjects} color="bg-emerald-50 text-emerald-500" />
            <StatCard icon={HiOutlineDocumentText} label="Total Marks" value={stats.maxMarks} color="bg-violet-50 text-violet-500" />
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFilter className="text-indigo-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Select Exam Session</span>
          </div>
          <div className="max-w-xl">
            <Select options={sessionOptions} value={selectedSession} onChange={setSelectedSession}
              styles={selectStyles} placeholder={sessionsLoading ? "Loading sessions…" : "Choose an exam session…"}
              isLoading={sessionsLoading} isClearable />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading timetable…</p>
            </motion.div>
          ) : !selectedSession ? (
            <motion.div key="select-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineCalendar className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Select a session above to view the timetable</p>
            </motion.div>
          ) : timetable.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineCalendar className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No timetable entries for this session yet</p>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#", "Subject", "Date", "Start", "End", "Duration", "Max Marks", "Mode", "Paper Code"].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {timetable.map((row, i) => (
                      <motion.tr key={row.exam_timetable_id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                        className={`hover:bg-indigo-50/30 transition-colors ${isPast(row.exam_date) ? "opacity-50" : ""}`}>
                        <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{row.subject_name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{row.subject_code}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${isPast(row.exam_date) ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"}`}>
                            <HiOutlineCalendar className="w-3 h-3" />
                            {formatDate(row.exam_date)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono">{row.start_time}</td>
                        <td className="px-5 py-4 text-slate-600 font-mono">{row.end_time}</td>
                        <td className="px-5 py-4 text-slate-600">{row.duration_minutes} min</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{row.max_marks}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${modeColor[row.exam_mode] || "bg-slate-100 text-slate-600"}`}>
                            {row.exam_mode}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 font-mono text-xs">{row.question_paper_code || "—"}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                Showing {timetable.length} exam slot{timetable.length !== 1 ? "s" : ""}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
