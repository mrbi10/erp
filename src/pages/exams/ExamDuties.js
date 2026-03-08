import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineUserGroup, HiOutlineClipboardCheck, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
  HiOutlineFilter, HiOutlineBadgeCheck
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Duties");
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
        head: [["Staff", "Hall", "Role", "Duty Start", "Duty End", "Attended"]],
        body: data.map((r) => [r.staff_name, r.hall_name, r.role, r.duty_start, r.duty_end, r.attendance_marked ? "Yes" : "No"]),
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

const ROLES = ["invigilator", "chief_invigilator", "observer", "flying_squad"].map((v) => ({ value: v, label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));
const ROLE_COLORS = { invigilator: "bg-indigo-100 text-indigo-700", chief_invigilator: "bg-amber-100 text-amber-700", observer: "bg-violet-100 text-violet-700", flying_squad: "bg-rose-100 text-rose-700" };

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

export default function ExamDuties() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "staff";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [timetableSlots, setTimetableSlots] = useState([]);
  const [halls, setHalls] = useState([]);
  const [invigilators, setInvigilators] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    hall_id: null, staff_id: "", role_opt: ROLES[0], duty_start: "", duty_end: "",
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

  const fetchInvigilators = (slotId) => {
    setLoading(true);
    fetch(`${BASE_URL}/exam/invigilators?exam_timetable_id=${slotId}`, { headers })
      .then((r) => r.json())
      .then((d) => { setInvigilators(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSlotChange = (opt) => {
    setSelectedSlot(opt);
    if (opt) fetchInvigilators(opt.value);
    else setInvigilators([]);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !form.staff_id || !form.hall_id) return Swal.fire("Validation", "Staff, hall and slot are required.", "warning");
    const body = {
      exam_timetable_id: selectedSlot.value,
      hall_id: form.hall_id.value,
      staff_id: form.staff_id,
      role: form.role_opt?.value || "invigilator",
      duty_start: form.duty_start,
      duty_end: form.duty_end,
    };
    try {
      const url = editId ? `${BASE_URL}/exam/invigilators/${editId}` : `${BASE_URL}/exam/invigilators`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire("Success", data.message, "success");
      setShowForm(false); setEditId(null);
      setForm({ hall_id: null, staff_id: "", role_opt: ROLES[0], duty_start: "", duty_end: "" });
      fetchInvigilators(selectedSlot.value);
    } catch (e) { Swal.fire("Error", e.message, "error"); }
  };

  const handleDelete = (id) => {
    Swal.fire({ title: "Remove invigilator?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" })
      .then(async ({ isConfirmed }) => {
        if (!isConfirmed) return;
        await fetch(`${BASE_URL}/exam/invigilators/${id}`, { method: "DELETE", headers });
        fetchInvigilators(selectedSlot.value);
      });
  };

  const handleEdit = (row) => {
    setForm({
      hall_id: halls.map((h) => ({ value: h.hall_id, label: h.hall_name })).find((h) => h.value === row.hall_id) || null,
      staff_id: row.staff_id,
      role_opt: ROLES.find((r) => r.value === row.role) || ROLES[0],
      duty_start: row.duty_start || "", duty_end: row.duty_end || "",
    });
    setEditId(row.invigilator_id);
    setShowForm(true);
  };

  const handleMarkAttendance = async (id, current) => {
    const res = await fetch(`${BASE_URL}/exam/invigilators/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ attendance_marked: current ? 0 : 1 }),
    });
    if (res.ok) fetchInvigilators(selectedSlot.value);
  };

  const stats = useMemo(() => ({
    total: invigilators.length,
    attended: invigilators.filter((i) => i.attendance_marked).length,
    halls: [...new Set(invigilators.map((i) => i.hall_id))].length,
  }), [invigilators]);

  const slotOptions = timetableSlots.map((t) => ({ value: t.exam_timetable_id, label: `${t.subject_name} — ${t.exam_date} (${t.session_name})` }));
  const hallOptions = halls.map((h) => ({ value: h.hall_id, label: `${h.hall_name} (${h.building})` }));

  const canManage = ["Admin", "staff"].includes(role);

  const exportData = invigilators.map((i) => ({
    Staff: i.staff_name, Email: i.staff_email, Designation: i.designation,
    Hall: i.hall_name, Role: i.role, "Duty Start": i.duty_start, "Duty End": i.duty_end,
    Attended: i.attendance_marked ? "Yes" : "No", Remarks: i.remarks || "",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invigilation Duties</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage and track exam invigilation assignments</p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <button onClick={() => { setShowForm(true); setEditId(null); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
                <HiOutlinePlus className="w-4 h-4" /> Assign Duty
              </button>
            )}
            <button onClick={() => exportToExcel(exportData, "Invigilation_Duties")} disabled={!invigilators.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDownload className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => generatePDFReport(invigilators, "Invigilation Duties")} disabled={!invigilators.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
              <HiOutlineDocumentText className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {invigilators.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={HiOutlineUserGroup} label="Assigned" value={stats.total} color="bg-violet-50 text-violet-500" />
            <StatCard icon={HiOutlineBadgeCheck} label="Attended" value={stats.attended} color="bg-emerald-50 text-emerald-500" />
            <StatCard icon={HiOutlineClipboardCheck} label="Halls Covered" value={stats.halls} color="bg-sky-50 text-sky-500" />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFilter className="text-violet-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Select Timetable Slot</span>
          </div>
          <Select options={slotOptions} value={selectedSlot} onChange={handleSlotChange}
            styles={selectStyles} placeholder="Select subject / slot…" isClearable />
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit Duty" : "Assign Invigilator"}</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Hall *</label>
                    <Select options={hallOptions} value={form.hall_id} onChange={(v) => setForm((f) => ({ ...f, hall_id: v }))} styles={selectStyles} placeholder="Select hall…" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Staff ID *</label>
                    <input value={form.staff_id} onChange={(e) => setForm((f) => ({ ...f, staff_id: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Staff ID" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Role</label>
                    <Select options={ROLES} value={form.role_opt} onChange={(v) => setForm((f) => ({ ...f, role_opt: v }))} styles={selectStyles} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Duty Start</label>
                      <input type="time" value={form.duty_start} onChange={(e) => setForm((f) => ({ ...f, duty_start: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Duty End</label>
                      <input type="time" value={form.duty_end} onChange={(e) => setForm((f) => ({ ...f, duty_end: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSubmit} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-all">
                    {editId ? "Update" : "Assign"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all">
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
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading duties…</p>
            </motion.div>
          ) : !selectedSlot ? (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineUserGroup className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Select a timetable slot to view duties</p>
            </motion.div>
          ) : invigilators.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <HiOutlineUserGroup className="w-14 h-14 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No invigilators assigned for this slot</p>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Staff", "Designation", "Hall", "Role", "Duty Start", "Duty End", "Attended", ...(canManage ? ["Actions"] : [])].map((h) => (
                        <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invigilators.map((row, i) => (
                      <motion.tr key={row.invigilator_id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{row.staff_name}</p>
                          <p className="text-xs text-slate-400">{row.staff_email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{row.designation}</td>
                        <td className="px-5 py-4 text-slate-600">{row.hall_name}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[row.role] || "bg-slate-100 text-slate-600"}`}>
                            {row.role?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-600">{row.duty_start}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{row.duty_end}</td>
                        <td className="px-5 py-4">
                          {canManage ? (
                            <button onClick={() => handleMarkAttendance(row.invigilator_id, row.attendance_marked)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${row.attendance_marked ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                              {row.attendance_marked ? "Present" : "Mark Present"}
                            </button>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.attendance_marked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {row.attendance_marked ? "Present" : "Absent"}
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors">
                                <HiOutlinePencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(row.invigilator_id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
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
