import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineViewGrid, HiOutlineRefresh, HiOutlineSearch,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineTrash,
  HiOutlineFilter, HiOutlineLocationMarker
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SeatingPlan");
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
        head: [["Student", "Roll No", "Hall", "Row", "Column"]],
        body: data.map((r) => [r.student_name, r.roll_no, r.hall_name, r.seat_row, r.seat_column]),
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

export default function ExamSeating() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "student";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [timetableSlots, setTimetableSlots] = useState([]);
  const [halls, setHalls] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentSeat, setStudentSeat] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);

  const isStudent = role === "student";
  const canManage = ["Admin", "staff"].includes(role);

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

  const fetchSeats = (slotId, hallId) => {
    setLoading(true);
    const url = hallId ? `${BASE_URL}/exam/seating/${slotId}?hall_id=${hallId}` : `${BASE_URL}/exam/seating/${slotId}`;
    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => { setSeats(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSlotChange = (opt) => {
    setSelectedSlot(opt);
    setSeats([]);
    setStudentSeat(null);
    if (opt) {
      if (isStudent) fetchStudentSeat(opt.value);
      else fetchSeats(opt.value, selectedHall?.value);
    }
  };

  const fetchStudentSeat = (slotId) => {
    setSeatLoading(true);
    fetch(`${BASE_URL}/exam/seating/${slotId}/student/${user.id}`, { headers })
      .then((r) => r.json())
      .then((d) => { setStudentSeat(d); setSeatLoading(false); })
      .catch(() => setSeatLoading(false));
  };

  const handleGenerate = async () => {
    if (!selectedSlot) return;
    const hallOpt = await Swal.fire({
      title: "Generate Seating Plan",
      html: `<select id="hall-sel" class="swal2-input" style="width:100%">
        ${halls.map((h) => `<option value="${h.hall_id}">${h.hall_name} (${h.building})</option>`).join("")}
      </select>`,
      preConfirm: () => document.getElementById("hall-sel").value,
      showCancelButton: true, confirmButtonText: "Generate",
    });
    if (!hallOpt.isConfirmed) return;
    try {
      const res = await fetch(`${BASE_URL}/exam/seating/generate`, {
        method: "POST", headers,
        body: JSON.stringify({ exam_timetable_id: selectedSlot.value, hall_id: hallOpt.value }),
      });
      const data = await res.json();
      Swal.fire("Generated", data.message, "success");
      fetchSeats(selectedSlot.value, selectedHall?.value);
    } catch (e) { Swal.fire("Error", e.message, "error"); }
  };

  const handleRegenerate = () => {
    Swal.fire({ title: "Regenerate seating?", text: "Existing plan will be deleted.", icon: "warning", showCancelButton: true, confirmButtonColor: "#f59e0b" })
      .then(async ({ isConfirmed }) => {
        if (!isConfirmed || !selectedSlot || !selectedHall) return;
        const res = await fetch(`${BASE_URL}/exam/seating/${selectedSlot.value}/regenerate`, {
          method: "POST", headers, body: JSON.stringify({ hall_id: selectedHall.value }),
        });
        const data = await res.json();
        Swal.fire("Done", data.message, "success");
        fetchSeats(selectedSlot.value, selectedHall?.value);
      });
  };

  const handleDelete = () => {
    Swal.fire({ title: "Delete seating plan?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" })
      .then(async ({ isConfirmed }) => {
        if (!isConfirmed || !selectedSlot) return;
        await fetch(`${BASE_URL}/exam/seating/${selectedSlot.value}`, { method: "DELETE", headers });
        setSeats([]);
        Swal.fire("Deleted", "Seating plan removed.", "success");
      });
  };

  const slotOptions = timetableSlots.map((t) => ({ value: t.exam_timetable_id, label: `${t.subject_name} — ${t.exam_date} (${t.session_name})` }));
  const hallOptions = halls.map((h) => ({ value: h.hall_id, label: `${h.hall_name} (${h.building})` }));

  const filtered = useMemo(() => seats.filter((s) =>
    !searchQuery || s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(s.roll_no).includes(searchQuery)
  ), [seats, searchQuery]);

  const stats = useMemo(() => ({
    total: seats.length,
    halls: [...new Set(seats.map((s) => s.hall_id))].length,
    rows: seats.length ? Math.max(...seats.map((s) => s.seat_row)) : 0,
  }), [seats]);

  const exportData = seats.map((s) => ({
    Student: s.student_name, "Roll No": s.roll_no, Hall: s.hall_name,
    Row: s.seat_row, Column: s.seat_column,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Seating Plan</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {isStudent ? "Find your exam hall and seat number" : "Generate and manage student seating arrangements"}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
                <HiOutlineViewGrid className="w-4 h-4" /> Generate
              </button>
              <button onClick={handleRegenerate} disabled={!seats.length}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
                <HiOutlineRefresh className="w-4 h-4" /> Regenerate
              </button>
              <button onClick={handleDelete} disabled={!seats.length}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
                <HiOutlineTrash className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => exportToExcel(exportData, "Seating_Plan")} disabled={!seats.length}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
                <HiOutlineDownload className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => generatePDFReport(seats, "Seating Plan")} disabled={!seats.length}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-40">
                <HiOutlineDocumentText className="w-4 h-4" /> PDF
              </button>
            </div>
          )}
        </motion.div>

        {seats.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={HiOutlineViewGrid} label="Total Seats" value={stats.total} color="bg-teal-50 text-teal-500" />
            <StatCard icon={HiOutlineLocationMarker} label="Halls" value={stats.halls} color="bg-indigo-50 text-indigo-500" />
            <StatCard icon={HiOutlineFilter} label="Rows" value={stats.rows} color="bg-amber-50 text-amber-500" />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineFilter className="text-teal-400 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select options={slotOptions} value={selectedSlot} onChange={handleSlotChange}
              styles={selectStyles} placeholder="Select subject / slot…" isClearable />
            {!isStudent && (
              <Select options={hallOptions} value={selectedHall}
                onChange={(opt) => { setSelectedHall(opt); if (selectedSlot) fetchSeats(selectedSlot.value, opt?.value); }}
                styles={selectStyles} placeholder="Filter by hall (optional)…" isClearable />
            )}
            {!isStudent && (
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or roll no…"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
            )}
          </div>
        </div>

        {/* Student seat card */}
        {isStudent && selectedSlot && (
          <AnimatePresence>
            {seatLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : studentSeat ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <HiOutlineLocationMarker className="w-6 h-6 opacity-80" />
                  <span className="font-semibold text-lg opacity-90">Your Seat</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[["Hall", studentSeat.hall_name], ["Building", studentSeat.building], ["Floor", studentSeat.floor], ["Row × Column", `${studentSeat.seat_row} × ${studentSeat.seat_column}`]].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-teal-100 text-xs font-medium uppercase tracking-wide mb-1">{l}</p>
                      <p className="text-2xl font-bold">{v}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                <HiOutlineLocationMarker className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Seating not assigned yet for this exam</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Staff/Admin table */}
        {!isStudent && (
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Loading seating plan…</p>
              </motion.div>
            ) : !selectedSlot ? (
              <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                <HiOutlineViewGrid className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Select a slot to view the seating plan</p>
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                <HiOutlineViewGrid className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">{seats.length ? "No results match your search" : "Seating plan not generated yet"}</p>
              </motion.div>
            ) : (
              <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {["#", "Student", "Roll No", "Hall", "Seat Row", "Seat Column"].map((h) => (
                          <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((row, i) => (
                        <motion.tr key={row.seat_id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-5 py-4 font-semibold text-slate-800">{row.student_name}</td>
                          <td className="px-5 py-4 font-mono text-slate-600">{row.roll_no}</td>
                          <td className="px-5 py-4 text-slate-600">{row.hall_name}</td>
                          <td className="px-5 py-4">
                            <span className="bg-teal-100 text-teal-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{row.seat_row}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{row.seat_column}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                  Showing {filtered.length} of {seats.length} seats
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
