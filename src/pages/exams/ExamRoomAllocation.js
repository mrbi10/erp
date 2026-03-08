import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineOfficeBuilding, HiOutlineUsers, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
  HiOutlineFilter, HiOutlineRefresh
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RoomAllocations");
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
        head: [["Hall", "Dept", "Class", "Roll Start", "Roll End", "Count", "Pattern"]],
        body: data.map((r) => [r.hall_name, r.dept_name, r.class_name, r.roll_start, r.roll_end, r.student_count, r.seating_pattern]),
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

const SEATING_PATTERNS = ["serial", "alternating", "zigzag", "random"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

export default function ExamRoomAllocation() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [timetableSlots, setTimetableSlots] = useState([]);
  const [halls, setHalls] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    hall_id: null, dept_id: "", class_id: "", roll_start: "", roll_end: "",
    student_count: "", seating_pattern: SEATING_PATTERNS[0],
  });

  useEffect(() => {
    fetch(`${BASE_URL}/exam/sessions`, { headers })
      .then((r) => r.json())
      .then((sessions) => {
        if (!Array.isArray(sessions)) return;
        const allSlots = [];
        Promise.all(sessions.map((s) =>
          fetch(`${BASE_URL}/exam/sessions/${s.session_id}/timetable`, { headers })
            .then((r) => r.json())
            .then((tt) => { if (Array.isArray(tt)) tt.forEach((t) => allSlots.push({ ...t, session_name: s.session_name })); })
            .catch(() => {})
        )).then(() => setTimetableSlots(allSlots));
      });
    fetch(`${BASE_URL}/exam/halls`, { headers })
      .then((r) => r.json())
      .then((d) => setHalls(Array.isArray(d) ? d : []));
  }, []);

  const fetchAllocations = (slotId) => {
    setLoading(true);
    fetch(`${BASE_URL}/exam/hall-allocations?exam_timetable_id=${slotId}`, { headers })
      .then((r) => r.json())
      .then((d) => { setAllocations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSlotChange = (opt) => {
    setSelectedSlot(opt);
    if (opt) fetchAllocations(opt.value);
    else setAllocations([]);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !form.hall_id) return Swal.fire("Validation", "Please select a hall and timetable slot.", "warning");
    const body = {
      exam_timetable_id: selectedSlot.value,
      hall_id: form.hall_id.value,
      dept_id: form.dept_id,
      class_id: form.class_id,
      roll_start: form.roll_start,
      roll_end: form.roll_end,
      student_count: Number(form.student_count),
      seating_pattern: form.seating_pattern?.value || "serial",
    };
    try {
      const url = editId ? `${BASE_URL}/exam/hall-allocations/${editId}` : `${BASE_URL}/exam/hall-allocations`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire("Success", data.message, "success");
      setShowForm(false);
      setEditId(null);
      setForm({ hall_id: null, dept_id: "", class_id: "", roll_start: "", roll_end: "", student_count: "", seating_pattern: SEATING_PATTERNS[0] });
      fetchAllocations(selectedSlot.value);
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({ title: "Delete allocation?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" })
      .then(async ({ isConfirmed }) => {
        if (!isConfirmed) return;
        await fetch(`${BASE_URL}/exam/hall-allocations/${id}`, { method: "DELETE", headers });
        fetchAllocations(selectedSlot.value);
      });
  };

  const handleEdit = (row) => {
    setForm({
      hall_id: halls.map((h) => ({ value: h.hall_id, label: h.hall_name })).find((h) => h.value === row.hall_id) || null,
      dept_id: row.dept_id, class_id: row.class_id,
      roll_start: row.roll_start, roll_end: row.roll_end,
      student_count: row.student_count,
      seating_pattern: SEATING_PATTERNS.find((p) => p.value === row.seating_pattern) || SEATING_PATTERNS[0],
    });
    setEditId(row.allocation_id);
    setShowForm(true);
  };

  const stats = useMemo(() => ({
    halls: [...new Set(allocations.map((a) => a.hall_id))].length,
    students: allocations.reduce((a, b) => a + Number(b.student_count || 0), 0),
    allocations: allocations.length,
  }), [allocations]);

  const slotOptions = timetableSlots.map((t) => ({ value: t.exam_timetable_id, label: `${t.subject_name} — ${t.exam_date} ${t.start_time} (${t.session_name})` }));
  const hallOptions = halls.map((h) => ({ value: h.hall_id, label: `${h.hall_name} (${h.building}, Fl. ${h.floor}) — Cap: ${h.capacity}` }));

  const exportData = allocations.map((a) => ({
    Hall: a.hall_name, Building: a.building, Department: a.dept_name,
    Class: a.class_name, "Roll Start": a.roll_start, "Roll End": a.roll_end,
    "Student Count": a.student_count, "Seating Pattern": a.seating_pattern,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Room Allocation</h1>
            <p className="text-slate-500 mt-1 text-sm">Assign exam halls to classes and manage roll-range seating</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(true); setEditId(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
              <HiOutlinePlus className="w-4 h-4" /> Allocate Hall
            </button>
            <button onClick={() => exportToExcel(exportData, "Room_Allocations")} disabled={!allocations.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDownload className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => generatePDFReport(allocations, "Room Allocations")} disabled={!allocations.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDocumentText className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {allocations.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={HiOutlineOfficeBuilding} label="Halls Used" value={stats.halls} color="bg-sky-50 text-sky-500" />
            <StatCard icon={HiOutlineUsers} label="Students Allocated" value={stats.students} color="bg-indigo-50 text-indigo-500" />
            <StatCard icon={HiOutlineDocumentText} label="Allocations" value={stats.allocations} color="bg-emerald-50 text-emerald-500" />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFilter className="text-sky-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Filter by Timetable Slot</span>
          </div>
          <Select options={slotOptions} value={selectedSlot} onChange={handleSlotChange}
            styles={selectStyles} placeholder="Select subject / slot…" isClearable />
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit Allocation" : "Allocate Hall"}</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Hall *</label>
                    <Select options={hallOptions} value={form.hall_id} onChange={(v) => setForm((f) => ({ ...f, hall_id: v }))} styles={selectStyles} placeholder="Select hall…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Dept ID</label>
                      <input value={form.dept_id} onChange={(e) => setForm((f) => ({ ...f, dept_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="dept_id" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Class ID</label>
                      <input value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="class_id" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Roll Start</label>
                      <input value={form.roll_start} onChange={(e) => setForm((f) => ({ ...f, roll_start: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Roll End</label>
                      <input value={form.roll_end} onChange={(e) => setForm((f) => ({ ...f, roll_end: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. 60" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Student Count</label>
                      <input type="number" value={form.student_count} onChange={(e) => setForm((f) => ({ ...f, student_count: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Seating Pattern</label>
                      <Select options={SEATING_PATTERNS} value={form.seating_pattern} onChange={(v) => setForm((f) => ({ ...f, seating_pattern: v }))} styles={selectStyles} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSubmit}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all">
                    {editId ? "Update" : "Allocate"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditId(null); }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading allocations…</p>
            </motion.div>
          ) : !selectedSlot ? (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineOfficeBuilding className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Select a timetable slot to view allocations</p>
            </motion.div>
          ) : allocations.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineOfficeBuilding className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No halls allocated for this slot yet</p>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Hall", "Building / Floor", "Department", "Class", "Roll Range", "Students", "Pattern", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allocations.map((row, i) => (
                      <motion.tr key={row.allocation_id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-sky-50/30 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800">{row.hall_name}</td>
                        <td className="px-5 py-4 text-slate-500">{row.building}, Fl. {row.floor}</td>
                        <td className="px-5 py-4 text-slate-600">{row.dept_name || row.dept_id}</td>
                        <td className="px-5 py-4 text-slate-600">{row.class_name || row.class_id}</td>
                        <td className="px-5 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono">
                            {row.roll_start} — {row.roll_end}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{row.student_count}</td>
                        <td className="px-5 py-4">
                          <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full text-xs font-medium capitalize">{row.seating_pattern}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors">
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(row.allocation_id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
