import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Select from "react-select";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineAcademicCap,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlinePlus,
  HiOutlineLightningBolt, HiOutlinePencil, HiOutlineTrash,
  HiOutlineX, HiOutlineCheck, HiOutlineRefresh, HiOutlineEye,
  HiOutlineExclamationCircle, HiOutlineBookOpen, HiOutlineChevronUp,
  HiOutlineChevronDown, HiOutlineMenuAlt4, HiOutlineSave,
  HiOutlineBadgeCheck, HiOutlineArrowUp, HiOutlineArrowDown,
  HiOutlineChip, HiOutlineCollection, HiOutlineClipboardCheck,
  HiOutlineFilter,
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";

// ─── Utilities ────────────────────────────────────────────────────────────────

const apiHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const formatDateDisplay = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
};

const dayOfWeek = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" });
};

const isPast = (d) => d && new Date(d + "T23:59:59") < new Date();

const EXAM_MODES = ["offline", "online", "hybrid"];

const modeStyle = {
  offline: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  online: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  hybrid: { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400" },
};

const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  });
};

const generatePDF = (data, title) => {
  import("jspdf").then(({ default: jsPDF }) => {
    import("jspdf-autotable").then(() => {
      const doc = new jsPDF("landscape");
      doc.setFontSize(14);
      doc.text(title, 14, 18);
      doc.autoTable({
        startY: 26,
        head: [["#", "Subject", "Code", "Date", "Day", "Start", "End", "Duration", "Max Marks", "Mode"]],
        body: data.map((r, i) => [
          i + 1, r.subject_name, r.subject_code, r.exam_date,
          dayOfWeek(r.exam_date), r.start_time, r.end_time,
          `${r.duration_minutes} min`, r.max_marks, r.exam_mode,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
      });
      doc.save(`${title}.pdf`);
    });
  });
};

// ─── ROLE PERMISSIONS ─────────────────────────────────────────────────────────

const ROLES = {
  canManage: ["Admin", "trainer", "DeptAdmin"],
  canDelete: ["Admin", "trainer"],
  canView: ["Admin", "trainer", "staff", "CA", "DeptAdmin", "student"],
};
const can = (role, action) => ROLES[action]?.includes(role);

// ─── VALIDATION ───────────────────────────────────────────────────────────────

/**
 * Validates the timetable slots for conflicts.
 * Returns array of error strings, empty if valid.
 */
const validateSlots = (slots) => {
  const errors = [];
  const filledSlots = slots.filter((s) => s.exam_date && s.start_time && s.end_time);

  // Check for duplicate subject
  // const subjectIds = slots.map((s) => s.subject_id);
  const subjectIds = filledSlots.map((s) => s.subject_id);
  const dupSubjects = subjectIds.filter((id, i) => subjectIds.indexOf(id) !== i);
  if (dupSubjects.length) {
    errors.push("Duplicate subjects found — each subject can only appear once.");
  }

  // Check time conflicts: same dept+class, same date, overlapping times
  for (let i = 0; i < filledSlots.length; i++) {
    for (let j = i + 1; j < filledSlots.length; j++) {
      const a = filledSlots[i], b = filledSlots[j];
      if (a.exam_date !== b.exam_date) continue;
      // Time overlap check
      const aStart = a.start_time, aEnd = a.end_time;
      const bStart = b.start_time, bEnd = b.end_time;
      if (aStart < bEnd && bStart < aEnd) {
        errors.push(
          `Time conflict: "${a.subject_name}" and "${b.subject_name}" overlap on ${formatDateDisplay(a.exam_date)}.`
        );
      }
    }
  }

  // Check end time > start time
  for (const s of slots) {
    if (s.start_time && s.end_time && s.end_time <= s.start_time) {
      errors.push(`"${s.subject_name}": End time must be after start time.`);
    }
  }

  // Check required fields for slots that have a date
  for (const s of slots) {
    if (s.exam_date && (!s.start_time || !s.end_time)) {
      errors.push(`"${s.subject_name}": Date is set but start/end time is missing.`);
    }
  }

  return [...new Set(errors)]; // deduplicate
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const Spinner = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin flex-shrink-0">
    <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const StatusBadge = ({ status }) => {
  const map = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    SCHEDULED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ONGOING: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ARCHIVED: "bg-slate-200 text-slate-700 border-slate-300",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${map[status] || map.DRAFT}`}>
      {status || "DRAFT"}
    </span>
  );
};


const ModeTag = ({ mode }) => {
  const s = modeStyle[mode] || modeStyle.offline;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {mode}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <h3 className="font-bold text-slate-600 text-base">{title}</h3>
    {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ─── SLOT ROW (in schedule builder) ──────────────────────────────────────────

const SlotRow = ({ slot, index, total, onChange, onRemove, onMoveUp, onMoveDown, sessionRange }) => {
  const hasError = slot._errors?.length > 0;
  const isDatePast = isPast(slot.exam_date);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className={`relative group bg-white rounded-2xl border-2 transition-all ${hasError
        ? "border-red-200 shadow-sm shadow-red-50"
        : "border-slate-100 hover:border-indigo-100 hover:shadow-md"
        }`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors ${slot.exam_date ? (isDatePast ? "bg-slate-200" : "bg-indigo-400") : "bg-slate-100"
        }`} />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start gap-4">
          {/* Order controls */}
          <div className="flex flex-col gap-1 pt-1 flex-shrink-0">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <HiOutlineChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-black text-slate-300 text-center w-6">{index + 1}</span>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <HiOutlineChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subject info */}
          <div className="flex-shrink-0 min-w-0 w-48">
            <p className="font-bold text-slate-800 text-sm leading-tight truncate">{slot.subject_name}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">{slot.subject_code}</p>
            {slot.exam_date && (
              <p className="text-[11px] text-indigo-500 font-semibold mt-1">{dayOfWeek(slot.exam_date)}</p>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 min-w-0">
            {/* Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date *</label>
              <input
                type="date"
                value={slot.exam_date}
                min={sessionRange.start}
                max={sessionRange.end}
                onChange={(e) => onChange("exam_date", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* Start time */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start *</label>
              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => onChange("start_time", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* End time */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End *</label>
              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => onChange("end_time", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* Max Marks */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Marks</label>
              <input
                type="number"
                min={1}
                value={slot.max_marks}
                onChange={(e) => onChange("max_marks", Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* Mode */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mode</label>
              <select
                value={slot.exam_mode}
                onChange={(e) => onChange("exam_mode", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all bg-slate-50 hover:bg-white cursor-pointer"
              >
                {EXAM_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Remove */}
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-8 h-8 mt-4 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            title="Remove from timetable"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        {/* Inline errors */}
        {hasError && (
          <div className="mt-2 ml-10 space-y-0.5">
            {slot._errors.map((e, i) => (
              <p key={i} className="text-xs text-red-500 flex items-center gap-1.5">
                <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── TIMETABLE VIEW TABLE ─────────────────────────────────────────────────────

const TimetableTable = ({ timetable, role, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["#", "Subject", "Date & Day", "Time", "Duration", "Max Marks", "Mode",
                ...(can(role, "canManage") ? ["Actions"] : [])
              ].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence>
              {timetable.map((row, i) => (
                <motion.tr
                  key={row.exam_timetable_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className={`group hover:bg-indigo-50/30 transition-colors ${isPast(row.exam_date) ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-4 text-slate-300 font-mono text-xs">{i + 1}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800 text-sm">{row.subject_name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{row.subject_code}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${isPast(row.exam_date) ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"
                      }`}>
                      <HiOutlineCalendar className="w-3 h-3" />
                      {formatDateDisplay(row.exam_date?.slice(0, 10))}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">{dayOfWeek(row.exam_date?.slice(0, 10))}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-mono whitespace-nowrap text-xs">
                    {row.start_time} – {row.end_time}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm">{row.duration_minutes} min</td>
                  <td className="px-5 py-4 font-black text-slate-800">{row.max_marks}</td>
                  <td className="px-5 py-4"><ModeTag mode={row.exam_mode} /></td>
                  {can(role, "canManage") && (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-500 transition"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                        </button>
                        {can(role, "canDelete") && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── EDIT SINGLE SLOT MODAL ───────────────────────────────────────────────────

const EditSlotModal = ({ row, sessionRange, onClose, onSave, token }) => {
  const [form, setForm] = useState({
    exam_date: row.exam_date?.slice(0, 10) || "",
    start_time: row.start_time || "",
    end_time: row.end_time || "",
    duration_minutes: row.duration_minutes || 180,
    max_marks: row.max_marks || 100,
    exam_mode: row.exam_mode || "offline",
    question_paper_code: row.question_paper_code || "",
    allow_late_entry_minutes: row.allow_late_entry_minutes || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.exam_date || !form.start_time || !form.end_time)
      return Swal.fire("Missing", "Date, start and end time are required.", "warning");
    if (form.end_time <= form.start_time)
      return Swal.fire("Invalid", "End time must be after start time.", "warning");

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/exam/timetable/${row.exam_timetable_id}`, {
        method: "PUT",
        headers: apiHeaders(token),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
      onSave();
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-800">Edit Schedule</h2>
            <p className="text-xs text-slate-400 mt-0.5">{row.subject_name} · {row.subject_code}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Exam Date *</label>
            <input type="date" value={form.exam_date} min={sessionRange.start} max={sessionRange.end}
              onChange={(e) => setForm(f => ({ ...f, exam_date: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
            {form.exam_date && <p className="text-xs text-indigo-500 font-semibold mt-1 ml-1">{dayOfWeek(form.exam_date)}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time *</label>
              <input type="time" value={form.start_time}
                onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Time *</label>
              <input type="time" value={form.end_time}
                onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration_minutes} min={1}
                onChange={(e) => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Marks</label>
              <input type="number" value={form.max_marks} min={1}
                onChange={(e) => setForm(f => ({ ...f, max_marks: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mode</label>
              <select value={form.exam_mode}
                onChange={(e) => setForm(f => ({ ...f, exam_mode: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all bg-white">
                {EXAM_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Late Entry (min)</label>
              <input type="number" value={form.allow_late_entry_minutes} min={0}
                onChange={(e) => setForm(f => ({ ...f, allow_late_entry_minutes: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Paper Code</label>
            <input type="text" value={form.question_paper_code} placeholder="Optional"
              onChange={(e) => setForm(f => ({ ...f, question_paper_code: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
            {saving ? <Spinner size={15} /> : <HiOutlineCheck className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── SELECT STYLES ────────────────────────────────────────────────────────────

const selectStyles = {
  control: (b, s) => ({
    ...b, borderRadius: 12, borderColor: s.isFocused ? "#6366f1" : "#e2e8f0",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
    minHeight: 46, fontSize: 14, "&:hover": { borderColor: "#6366f1" }, transition: "all 0.15s",
  }),
  menu: (b) => ({ ...b, borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", zIndex: 9999 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  option: (b, s) => ({
    ...b, padding: "10px 14px", fontSize: 14,
    backgroundColor: s.isSelected ? "#6366f1" : s.isFocused ? "#eef2ff" : "white",
    color: s.isSelected ? "white" : "#1e293b",
  }),
  indicatorSeparator: () => ({ display: "none" }),
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ExamTimetable() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "student";

  // ── Data state
  const [sessions, setSessions] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // ── UI state
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // ── Builder state (schedule builder)
  const [builderMode, setBuilderMode] = useState(false); // false = view table, true = builder
  const [slots, setSlots] = useState([]);           // working slots in builder
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // ── Edit modal
  const [editRow, setEditRow] = useState(null);

  const [bulkStartTime, setBulkStartTime] = useState("09:30");
  const [bulkEndTime, setBulkEndTime] = useState("12:30");
  const [bulkStartDate, setBulkStartDate] = useState("");

  // ── Fetch sessions
  useEffect(() => {
    fetch(`${BASE_URL}/exam/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => { })
      .finally(() => setLoadingSessions(false));
  }, []);

  // ── Fetch timetable on session change
  useEffect(() => {
    setBuilderMode(false);
    setSlots([]);
    setValidationErrors([]);
    if (!selectedSession) { setTimetable([]); return; }
    fetchTimetable();
  }, [selectedSession]);

  // ── Fetch subjects when session changes (for builder)
  useEffect(() => {

    if (!selectedSession || !can(role, "canManage")) return;

    setLoadingSubjects(true);

    fetch(`${BASE_URL}/subjects/examtimetable/${selectedSession.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setSubjects(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));

  }, [selectedSession, role]);

  const fetchTimetable = () => {
    if (!selectedSession) return;
    setLoadingTimetable(true);
    fetch(`${BASE_URL}/exam/sessions/${selectedSession.value}/timetable`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setTimetable(Array.isArray(d) ? d : []))
      .catch(() => Swal.fire("Error", "Failed to load timetable", "error"))
      .finally(() => setLoadingTimetable(false));
  };

  const applyTimeToAll = () => {

    if (!bulkStartTime || !bulkEndTime) return;

    setSlots(prev =>
      prev.map(slot => {

        if (!slot.exam_date) return slot;

        const [sh, sm] = bulkStartTime.split(":").map(Number);
        const [eh, em] = bulkEndTime.split(":").map(Number);

        const duration = (eh * 60 + em) - (sh * 60 + sm);

        return {
          ...slot,
          start_time: bulkStartTime,
          end_time: bulkEndTime,
          duration_minutes: duration
        };
      })
    );
  };
  const autoGenerateDates = () => {

    if (!bulkStartDate) return;

    let current = new Date(bulkStartDate);

    const nextSlots = slots.map(slot => {

      while (current.getDay() === 0 || current.getDay() === 6) {
        current.setDate(current.getDate() + 1);
      }

      const examDate = current.toISOString().slice(0, 10);

      current.setDate(current.getDate() + 1);

      return {
        ...slot,
        exam_date: examDate
      };

    });

    setSlots(nextSlots);
  };

  // ── Enter builder: pre-populate from existing timetable, then fill remaining subjects
  const enterBuilder = () => {
    const sess = sessions.find((s) => s.session_id === selectedSession?.value);
    const sessionRange = {
      start: sess?.start_date?.slice(0, 10) || "",
      end: sess?.end_date?.slice(0, 10) || "",
    };

    // Start with existing timetable entries (preserving their data)
    const existing = timetable.map((t) => ({
      _id: t.exam_timetable_id,
      _isExisting: true,
      subject_id: t.subject_id,
      subject_name: t.subject_name,
      subject_code: t.subject_code,
      exam_date: t.exam_date?.slice(0, 10) || "",
      start_time: t.start_time || "",
      end_time: t.end_time || "",
      duration_minutes: t.duration_minutes || 180,
      max_marks: t.max_marks || 100,
      exam_mode: t.exam_mode || "offline",
      question_paper_code: t.question_paper_code || "",
      allow_late_entry_minutes: t.allow_late_entry_minutes || 0,
      _errors: [],
    }));

    const existingSubjectIds = new Set(existing.map((e) => e.subject_id));

    // Add remaining subjects not yet in timetable
    const newSlots = [...subjects]
      .sort((a, b) => a.subject_code.localeCompare(b.subject_code))
      .filter((s) => !existingSubjectIds.has(s.subject_id))
      .map((s) => ({
        _id: `new_${s.subject_id}_${Date.now()}_${Math.random()}`,
        _isExisting: false,
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        subject_code: s.subject_code,
        exam_date: "",
        start_time: "",
        end_time: "",
        duration_minutes: 180,
        max_marks: 100,
        exam_mode: "offline",
        question_paper_code: "",
        allow_late_entry_minutes: 0,
        _errors: [],
      }));

    setSlots([...existing, ...newSlots]);
    setBuilderMode(true);
    setValidationErrors([]);
  };

  // ── Slot field change
  const updateSlot = (index, key, value) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };

      // Auto-compute duration from times
      if ((key === "start_time" || key === "end_time")) {
        const st = key === "start_time" ? value : next[index].start_time;
        const et = key === "end_time" ? value : next[index].end_time;
        if (st && et && et > st) {
          const [sh, sm] = st.split(":").map(Number);
          const [eh, em] = et.split(":").map(Number);
          next[index].duration_minutes = (eh * 60 + em) - (sh * 60 + sm);
        }
      }

      return next;
    });
    // Clear global errors on change
    setValidationErrors([]);
  };

  const moveSlot = (index, dir) => {
    setSlots((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setValidationErrors([]);
  };

  // ── Save timetable (auto-generate endpoint with all slots that have a date)
  const handleSave = async () => {
    // Only save slots that have a date (skip blanks)
    const filledSlots = slots.filter((s) => s.exam_date && s.start_time && s.end_time);

    if (filledSlots.length === 0) {
      return Swal.fire("Nothing to save", "Please assign at least one exam date and time.", "info");
    }

    // Run validation
    const errors = validateSlots(filledSlots.map((s) => ({ ...s })));
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Mark per-slot errors
      setSlots((prev) => prev.map((slot) => {
        if (!slot.exam_date) return { ...slot, _errors: [] };
        const slotErrors = [];
        if (slot.end_time <= slot.start_time && slot.start_time && slot.end_time) {
          slotErrors.push("End time must be after start time.");
        }
        // Check for time conflicts with other slots
        filledSlots.forEach((other) => {
          if (other.subject_id === slot.subject_id) return;
          if (other.exam_date !== slot.exam_date) return;
          if (slot.start_time < other.end_time && other.start_time < slot.end_time) {
            slotErrors.push(`Overlaps with ${other.subject_name}`);
          }
        });
        return { ...slot, _errors: slotErrors };
      }));
      return;
    }

    // Confirm if there are unfilled subjects
    const unfilledCount = slots.length - filledSlots.length;
    if (unfilledCount > 0) {
      const result = await Swal.fire({
        title: "Some subjects have no date",
        text: `${unfilledCount} subject(s) without a date will be skipped. Continue saving ${filledSlots.length} slot(s)?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, save filled slots",
        confirmButtonColor: "#6366f1",
      });
      if (!result.isConfirmed) return;
    }

    setSaving(true);
    try {
      const payload = {
        subjects: filledSlots.map((s) => ({
          subject_id: s.subject_id,
          exam_date: s.exam_date,
          start_time: s.start_time,
          end_time: s.end_time,
          duration_minutes: s.duration_minutes,
          max_marks: s.max_marks,
          exam_mode: s.exam_mode,
          question_paper_code: s.question_paper_code || null,
          allow_late_entry_minutes: s.allow_late_entry_minutes || 0,
        })),
      };

      const res = await fetch(
        `${BASE_URL}/exam/sessions/${selectedSession.value}/timetable/auto-generate`,
        { method: "POST", headers: apiHeaders(token), body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await Swal.fire({
        icon: "success",
        title: "Timetable Saved!",
        text: `${data.inserted || filledSlots.length} exam slot(s) scheduled.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setBuilderMode(false);
      setValidationErrors([]);
      fetchTimetable();
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to save timetable.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete from view table
  const handleDelete = (row) => {
    Swal.fire({
      title: "Remove exam slot?",
      text: `"${row.subject_name}" on ${formatDateDisplay(row.exam_date?.slice(0, 10))} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await fetch(`${BASE_URL}/exam/timetable/${row.exam_timetable_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchTimetable();
        Swal.fire({ icon: "success", title: "Removed", timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire("Error", "Could not remove slot.", "error");
      }
    });
  };

  // ── Derived
  const sessionOptions = sessions.map((s) => ({
    value: s.session_id,
    label: `${s.session_name}`,
    sub: s.exam_type_name || "",
    data: s,
  }));

  const selectedSessionData = sessions.find((s) => s.session_id === selectedSession?.value);

  const sessionRange = {
    start: selectedSessionData?.start_date?.slice(0, 10) || "",
    end: selectedSessionData?.end_date?.slice(0, 10) || "",
  };

  const stats = useMemo(() => ({
    total: timetable.length,
    upcoming: timetable.filter((t) => !isPast(t.exam_date?.slice(0, 10))).length,
    past: timetable.filter((t) => isPast(t.exam_date?.slice(0, 10))).length,
    totalMarks: timetable.reduce((a, b) => a + Number(b.max_marks || 0), 0),
  }), [timetable]);

  const exportRows = timetable.map((t) => ({
    "#": timetable.indexOf(t) + 1,
    Subject: t.subject_name,
    Code: t.subject_code,
    Date: t.exam_date?.slice(0, 10),
    Day: dayOfWeek(t.exam_date?.slice(0, 10)),
    Start: t.start_time,
    End: t.end_time,
    "Duration (min)": t.duration_minutes,
    "Max Marks": t.max_marks,
    Mode: t.exam_mode,
  }));

  const filledCount = slots.filter((s) => s.exam_date && s.start_time && s.end_time).length;

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg">
                Academic Portal
              </span>
            </div>
            <h1 className="text-4xl font-black text-left text-slate-900 tracking-tight">Exam Timetable</h1>
            <p className="text-slate-500 mt-2 font-medium text-sm">
              {can(role, "canManage")
                ? "Schedule and manage examination timetables per session"
                : "View your examination schedule"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {timetable.length > 0 && !builderMode && (
              <>
                <button
                  onClick={() => exportToExcel(exportRows, `Exam_Timetable_${selectedSessionData?.session_name || ""}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-emerald-200"
                >
                  <HiOutlineDownload className="w-4 h-4" /> Excel
                </button>
                <button
                  onClick={() => generatePDF(timetable, `Exam Timetable — ${selectedSessionData?.session_name || ""}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-rose-200"
                >
                  <HiOutlineDocumentText className="w-4 h-4" /> PDF
                </button>
              </>
            )}
            {can(role, "canManage") && selectedSession && !builderMode && (
              <button
                onClick={enterBuilder}
                disabled={loadingSubjects}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-60"
              >
                {loadingSubjects ? <Spinner size={15} /> : <HiOutlineClipboardCheck className="w-4 h-4" />}
                {timetable.length > 0 ? "Edit Timetable" : "Build Timetable"}
              </button>
            )}
            {builderMode && (
              <>
                <button
                  onClick={() => { setBuilderMode(false); setValidationErrors([]); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all"
                >
                  <HiOutlineX className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-emerald-200 disabled:opacity-60"
                >
                  {saving ? <Spinner size={15} /> : <HiOutlineSave className="w-4 h-4" />}
                  {saving ? "Saving…" : `Save Timetable (${filledCount} slots)`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── SESSION SELECTOR ──────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFilter className="text-indigo-400 w-4 h-4" />
            <span className="text-sm font-bold text-slate-700">Exam Session</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 max-w-lg">
              <Select
                options={sessionOptions}
                value={selectedSession}
                onChange={(opt) => {
                  if (builderMode) {
                    Swal.fire({
                      title: "Leave builder?",
                      text: "Unsaved changes will be lost.",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Leave",
                      confirmButtonColor: "#6366f1",
                    }).then((r) => { if (r.isConfirmed) { setBuilderMode(false); setSelectedSession(opt); } });
                  } else {
                    setSelectedSession(opt);
                  }
                }}
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder={loadingSessions ? "Loading sessions…" : "Select an exam session…"}
                isLoading={loadingSessions}
                isClearable
                formatOptionLabel={(opt) => (
                  <div>
                    <span className="font-semibold text-slate-800">{opt.label}</span>
                    {opt.sub && <span className="text-xs text-slate-400 ml-2">· {opt.sub}</span>}
                  </div>
                )}
              />
            </div>
            {selectedSessionData && (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedSessionData.status} />
                {selectedSessionData.timetable_published ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    ✓ Published
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                    Unpublished
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 text-[11px] font-bold border border-slate-200">
                  {sessionRange.start} → {sessionRange.end}
                </span>
                {selectedSessionData.dept_name && (
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-100">
                    {selectedSessionData.dept_name}
                    {selectedSessionData.class_name && ` · ${selectedSessionData.class_name}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── STATS ─────────────────────────────────────────── */}
        <AnimatePresence>
          {timetable.length > 0 && !builderMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: "Total Exams", value: stats.total, icon: HiOutlineCalendar, gradient: "from-indigo-500 to-violet-500" },
                { label: "Upcoming", value: stats.upcoming, icon: HiOutlineClock, gradient: "from-amber-400 to-orange-500" },
                { label: "Completed", value: stats.past, icon: HiOutlineBadgeCheck, gradient: "from-emerald-400 to-teal-500" },
                { label: "Total Marks", value: stats.totalMarks, icon: HiOutlineDocumentText, gradient: "from-rose-400 to-pink-500" },
              ].map(({ label, value, icon: Icon, gradient }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-black text-slate-800">{value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VALIDATION ERRORS ─────────────────────────────── */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 text-sm mb-2">Please fix these issues before saving:</p>
                  <ul className="space-y-1">
                    {validationErrors.map((e, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-1.5">
                        <span className="mt-0.5">•</span> {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Loading */}
          {loadingTimetable && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Spinner size={36} color="#6366f1" />
              <p className="text-slate-400 text-sm mt-4">Loading timetable…</p>
            </motion.div>
          )}

          {/* No session selected */}
          {!loadingTimetable && !selectedSession && (
            <motion.div key="no-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
              <EmptyState
                icon={HiOutlineCalendar}
                title="Select a session to begin"
                subtitle="Choose an exam session from the dropdown above"
              />
            </motion.div>
          )}

          {/* BUILDER MODE */}
          {!loadingTimetable && selectedSession && builderMode && (
            <motion.div key="builder" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>

              {/* Builder header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    Timetable Builder
                    <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                      {filledCount}/{slots.length} scheduled
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Assign dates and times to subjects. Use arrows to reorder. Subjects without a date won't be saved.
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-5 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" /> Has date assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-200" /> No date yet (will be skipped)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Has conflict/error
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">

                <div>
                  <label className="text-xs font-bold text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={autoGenerateDates}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Auto Generate Dates
                </button>

                <div>
                  <label className="text-xs font-bold text-slate-500">Start Time</label>
                  <input
                    type="time"
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">End Time</label>
                  <input
                    type="time"
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={applyTimeToAll}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold"
                >
                  Apply Time to All
                </button>

              </div>

              {/* Slots */}
              {slots.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                  <HiOutlineBookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">No subjects found for this session.</p>
                  <p className="text-slate-400 text-sm mt-1">Make sure subjects are assigned to the session's department and class.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {slots.map((slot, index) => (
                      <SlotRow
                        key={slot._id}
                        slot={slot}
                        index={index}
                        total={slots.length}
                        sessionRange={sessionRange}
                        onChange={(key, value) => updateSlot(index, key, value)}
                        onRemove={() => removeSlot(index)}
                        onMoveUp={() => moveSlot(index, -1)}
                        onMoveDown={() => moveSlot(index, 1)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Save button at bottom */}
              {slots.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {filledCount > 0
                      ? <><span className="font-bold text-emerald-600">{filledCount}</span> slot(s) will be saved · <span className="text-slate-400">{slots.length - filledCount}</span> skipped</>
                      : "Assign dates to subjects to save them"}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setBuilderMode(false); setValidationErrors([]); }}
                      className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || filledCount === 0}
                      className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {saving ? <Spinner size={15} /> : <HiOutlineSave className="w-4 h-4" />}
                      {saving ? "Saving…" : `Save ${filledCount} Slot${filledCount !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW MODE — empty timetable */}
          {!loadingTimetable && selectedSession && !builderMode && timetable.length === 0 && (
            <motion.div key="empty-tt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
              <EmptyState
                icon={HiOutlineCalendar}
                title="No timetable yet for this session"
                subtitle="Build the timetable by assigning subjects to dates and times"
                action={can(role, "canManage") && (
                  <button
                    onClick={enterBuilder}
                    disabled={loadingSubjects}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-60"
                  >
                    {loadingSubjects ? <Spinner size={15} /> : <HiOutlineClipboardCheck className="w-4 h-4" />}
                    Build Timetable
                  </button>
                )}
              />
            </motion.div>
          )}

          {/* VIEW MODE — timetable table */}
          {!loadingTimetable && selectedSession && !builderMode && timetable.length > 0 && (
            <motion.div key="table-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
                  Schedule
                  <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                    {timetable.length} exam{timetable.length !== 1 ? "s" : ""}
                  </span>
                </h2>
                <button
                  onClick={fetchTimetable}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition font-semibold"
                >
                  <HiOutlineRefresh className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <TimetableTable
                timetable={timetable}
                role={role}
                onEdit={(row) => setEditRow(row)}
                onDelete={handleDelete}
              />

              <div className="mt-3 px-1">
                <p className="text-xs text-slate-400">
                  Faded rows indicate past exams · Dates are within session range {sessionRange.start} to {sessionRange.end}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── STUDENT NOTICE ─────────────────────────────────── */}
        {role === "student" && timetable.length > 0 && !builderMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
            <HiOutlineEye className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-indigo-800">Hall & Seat Information</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                Contact your department admin or check the seating plan section for your assigned hall and seat number.
              </p>
            </div>
          </motion.div>
        )}

      </div>

      {/* ── EDIT MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {editRow && (
          <EditSlotModal
            key={editRow.exam_timetable_id}
            row={editRow}
            sessionRange={sessionRange}
            token={token}
            onClose={() => setEditRow(null)}
            onSave={() => { setEditRow(null); fetchTimetable(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}