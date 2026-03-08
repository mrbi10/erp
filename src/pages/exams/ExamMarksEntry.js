import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlinePencilAlt, HiOutlineUsers, HiOutlineCheckCircle,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineSave,
  HiOutlineFilter, HiOutlineExclamationCircle
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MarksEntry");
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
        head: [["Roll No", "Student", "Marks", "Total", "Status"]],
        body: data.map((r) => [r.roll_no, r.student_name, r.marks || "—", r.total || "—", r.mark_id ? "Entered" : "Pending"]),
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

const EXAM_TYPES = ["IAT1", "IAT2", "MODEL", "FINAL"].map((v) => ({ value: v, label: v }));

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

export default function ExamMarksEntry() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [filters, setFilters] = useState({
    class_id: "", subject_id: "", exam_type: EXAM_TYPES[0], academic_year_id: "",
  });
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState(false);

  const loadStudents = () => {
    const { class_id, subject_id, exam_type, academic_year_id } = filters;
    if (!class_id || !subject_id || !exam_type || !academic_year_id)
      return Swal.fire("Validation", "Please fill all filter fields.", "warning");
    setLoading(true); setFetched(false);
    fetch(`${BASE_URL}/marks/entry/students?class_id=${class_id}&subject_id=${subject_id}&exam_type=${exam_type.value}&academic_year_id=${academic_year_id}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setStudents(arr);
        const map = {};
        arr.forEach((s) => { map[s.student_id] = { marks: s.marks ?? "", total: s.total ?? "" }; });
        setMarksMap(map);
        setLoading(false); setFetched(true);
      })
      .catch(() => { setLoading(false); Swal.fire("Error", "Failed to load students", "error"); });
  };

  const handleMarkChange = (studentId, field, val) => {
    setMarksMap((m) => ({ ...m, [studentId]: { ...m[studentId], [field]: val } }));
  };

  const handleBulkSave = async () => {
    const entries = students.map((s) => ({
      student_id: s.student_id,
      subject_id: filters.subject_id,
      exam_type: filters.exam_type?.value,
      marks: Number(marksMap[s.student_id]?.marks || 0),
      total: Number(marksMap[s.student_id]?.total || 100),
      enrollment_id: s.enrollment_id,
    }));
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/marks/entry/bulk`, {
        method: "POST", headers, body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire("Saved", `Inserted: ${data.inserted}, Updated: ${data.updated}${data.failed ? `, Failed: ${data.failed}` : ""}`, "success");
      loadStudents();
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleSingleUpdate = async (student) => {
    const m = marksMap[student.student_id];
    if (!student.mark_id) {
      Swal.fire("Info", "Use Bulk Save for new entries.", "info");
      return;
    }
    const { value: reason } = await Swal.fire({ title: "Reason for update?", input: "text", inputPlaceholder: "Optional reason", showCancelButton: true });
    if (reason === undefined) return;
    try {
      const res = await fetch(`${BASE_URL}/marks/entry/${student.mark_id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ marks: Number(m.marks), total: Number(m.total || 100), reason }),
      });
      const data = await res.json();
      Swal.fire("Updated", data.message, "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
  };

  const stats = useMemo(() => {
    const entered = students.filter((s) => s.mark_id).length;
    const avg = students.length ? (students.reduce((a, b) => a + Number(b.marks || 0), 0) / students.length).toFixed(1) : 0;
    return { total: students.length, entered, pending: students.length - entered, avg };
  }, [students]);

  const exportData = students.map((s) => ({
    "Roll No": s.roll_no, Student: s.student_name,
    Marks: marksMap[s.student_id]?.marks || "", Total: marksMap[s.student_id]?.total || "",
    Status: s.mark_id ? "Entered" : "Pending",
  }));

  const allFilled = students.every((s) => marksMap[s.student_id]?.marks !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Marks Entry</h1>
            <p className="text-slate-500 mt-1 text-sm">Enter or update examination marks for your class</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBulkSave} disabled={!fetched || students.length === 0 || saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineSave className="w-4 h-4" />}
              {saving ? "Saving…" : "Bulk Save All"}
            </button>
            <button onClick={() => exportToExcel(exportData, "Marks_Entry")} disabled={!students.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDownload className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => generatePDFReport(students, "Marks Entry")} disabled={!students.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDocumentText className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {fetched && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={HiOutlineUsers} label="Total Students" value={stats.total} color="bg-slate-100 text-slate-500" />
            <StatCard icon={HiOutlineCheckCircle} label="Marks Entered" value={stats.entered} color="bg-emerald-50 text-emerald-500" />
            <StatCard icon={HiOutlineExclamationCircle} label="Pending" value={stats.pending} color="bg-amber-50 text-amber-500" />
            <StatCard icon={HiOutlinePencilAlt} label="Class Average" value={stats.avg} color="bg-indigo-50 text-indigo-500" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineFilter className="text-indigo-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Load Students</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Class ID</label>
              <input value={filters.class_id} onChange={(e) => setFilters((f) => ({ ...f, class_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Subject ID</label>
              <input value={filters.subject_id} onChange={(e) => setFilters((f) => ({ ...f, subject_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Exam Type</label>
              <Select options={EXAM_TYPES} value={filters.exam_type} onChange={(v) => setFilters((f) => ({ ...f, exam_type: v }))} styles={selectStyles} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Academic Year ID</label>
              <input value={filters.academic_year_id} onChange={(e) => setFilters((f) => ({ ...f, academic_year_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. 3" />
            </div>
          </div>
          <button onClick={loadStudents} disabled={loading}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineUsers className="w-4 h-4" />}
            {loading ? "Loading…" : "Load Students"}
          </button>
        </div>

        {/* Completion bar */}
        {fetched && students.length > 0 && (
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Entry Progress</span>
              <span>{stats.entered} / {stats.total} students</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total ? (stats.entered / stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.6 }} className="h-2 rounded-full bg-indigo-500" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading students…</p>
            </motion.div>
          ) : !fetched ? (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlinePencilAlt className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Fill filters and click "Load Students" to begin</p>
            </motion.div>
          ) : students.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineUsers className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No students found for the selected filters</p>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#", "Roll No", "Student Name", "Marks", "Total", "Status", "Action"].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((s, i) => {
                      const m = marksMap[s.student_id] || {};
                      const isEntered = !!s.mark_id;
                      const markVal = Number(m.marks || 0);
                      const totalVal = Number(m.total || 100);
                      const pct = totalVal ? Math.round((markVal / totalVal) * 100) : 0;
                      return (
                        <motion.tr key={s.student_id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-5 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-5 py-3 font-mono font-semibold text-slate-700">{s.roll_no}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{s.student_name}</td>
                          <td className="px-5 py-3 w-32">
                            <input type="number" min="0" max="500"
                              value={m.marks}
                              onChange={(e) => handleMarkChange(s.student_id, "marks", e.target.value)}
                              className={`w-full border rounded-lg px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors
                                ${m.marks === "" ? "border-slate-200 bg-white" : pct >= 50 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`} />
                          </td>
                          <td className="px-5 py-3 w-28">
                            <input type="number" min="1" value={m.total}
                              onChange={(e) => handleMarkChange(s.student_id, "total", e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isEntered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {isEntered ? "Entered" : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {isEntered && (
                              <button onClick={() => handleSingleUpdate(s)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-medium transition-colors">
                                <HiOutlinePencilAlt className="w-3 h-3" /> Update
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{students.length} students loaded</span>
                <button onClick={handleBulkSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50">
                  {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineSave className="w-3 h-3" />}
                  {saving ? "Saving…" : "Save All Marks"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
