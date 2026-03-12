import React, { useState, useEffect, useMemo, useCallback } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptclassV2";

/* ══════════════════════════════════════════════════════════
   EXPORT HELPERS
══════════════════════════════════════════════════════════ */
const exportToExcel = (data, filename) => {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HallAllocations");
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
        head: [["Hall", "Building", "Department", "Class", "Roll Start", "Roll End", "Students"]],
        body: data.map((r) => [
          r.Hall, r.Building, r.Department, r.Class,
          r["Roll Start"], r["Roll End"], r["Student Count"],
        ]),
      });
      doc.save(`${title}.pdf`);
    });
  });
};

/* ══════════════════════════════════════════════════════════
   SHARED SELECT STYLES
══════════════════════════════════════════════════════════ */
const selectStyles = {
  control: (b, s) => ({
    ...b,
    borderRadius: 10,
    borderColor: s.isFocused ? "#6366f1" : "#e2e8f0",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
    minHeight: 46,
    fontSize: 15,
    "&:hover": { borderColor: "#6366f1" },
  }),
  menu: (b) => ({
    ...b, borderRadius: 12,
    boxShadow: "0 10px 40px rgba(0,0,0,0.13)", zIndex: 100,
  }),
  option: (b, s) => ({
    ...b,
    backgroundColor: s.isSelected ? "#6366f1" : s.isFocused ? "#eef2ff" : "white",
    color: s.isSelected ? "white" : "#1e293b",
    fontSize: 14,
    padding: "10px 14px",
  }),
  placeholder: (b) => ({ ...b, color: "#94a3b8", fontSize: 14 }),
  singleValue: (b) => ({ ...b, fontSize: 14, color: "#1e293b" }),
};

/* ══════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════════════════════ */

const StepHeader = ({ number, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
      {number}
    </span>
    <div>
      <p className="text-base font-bold text-slate-800">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color, textColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-5 flex items-center gap-4 ${color}`}
  >
    <div className={`w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center ${textColor}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  </motion.div>
);

const Field = ({ label, hint, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
    {children}
  </div>
);

const Banner = ({ type = "info", children }) => {
  const styles = {
    info:    "bg-sky-50 text-sky-700 border-sky-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error:   "bg-rose-50 text-rose-700 border-rose-200",
  };
  const icons = {
    info:    HiOutlineInformationCircle,
    warning: HiOutlineExclamationCircle,
    success: HiOutlineCheckCircle,
    error:   HiOutlineExclamationCircle,
  };
  const Icon = icons[type];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ALLOCATION TABLE
══════════════════════════════════════════════════════════ */
const AllocationTable = ({ allocations, onEdit, onDelete }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-100">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
          {["Hall", "Building / Floor", "Department", "Class", "Roll Range", "Students", "Actions"].map((h) => (
            <th
              key={h}
              className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {allocations.map((row, i) => (
          <motion.tr
            key={row.allocation_id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="hover:bg-indigo-50/20 transition-colors"
          >
            <td className="px-5 py-4 font-bold text-slate-800">{row.hall_name}</td>
            <td className="px-5 py-4 text-slate-500 text-sm">
              {row.building}{row.floor ? `, Floor ${row.floor}` : ""}
            </td>
            <td className="px-5 py-4 text-slate-600">
              {DEPT_MAP[row.dept_id] ?? row.dept_id}
            </td>
            <td className="px-5 py-4 text-slate-600">
              {CLASS_MAP[row.class_id] ?? row.class_id}
            </td>
            <td className="px-5 py-4">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                {row.roll_start} – {row.roll_end}
              </span>
            </td>
            <td className="px-5 py-4">
              <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-lg text-xs">
                {row.student_count} students
              </span>
            </td>
            <td className="px-5 py-4">
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(row)}
                  className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors"
                  title="Edit"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(row.allocation_id)}
                  className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                  title="Delete"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ══════════════════════════════════════════════════════════
   ALLOCATION FORM
══════════════════════════════════════════════════════════ */
const AllocationForm = ({
  editId,
  form,
  setForm,
  hallOptions,
  classOptions,
  classesLoading,
  selectedSlot,
  studentOptions,
  allocations,
  onSubmit,
  onCancel,
}) => {
  /* Roll numbers already used by other allocations */
  const usedRolls = useMemo(() => {
    const used = new Set();
    allocations
      .filter((a) => !editId || a.allocation_id !== editId)
      .forEach((a) => {
        for (let r = Number(a.roll_start); r <= Number(a.roll_end); r++) used.add(r);
      });
    return used;
  }, [allocations, editId]);

  /* Students not yet allocated */
  const availableStudents = useMemo(
    () => studentOptions.filter((s) => !usedRolls.has(Number(s.rollNumber))),
    [studentOptions, usedRolls]
  );

  const startOptions = availableStudents.map((s) => ({
    value: s.rollNumber,
    label: `${s.index} – ${s.roll_no}`,
  }));

  const endOptions = useMemo(() => {
    if (!form.start_student) return [];
    return availableStudents
      .filter((s) => Number(s.rollNumber) >= Number(form.start_student.value))
      .map((s) => ({ value: s.rollNumber, label: `${s.index} – ${s.roll_no}` }));
  }, [form.start_student, availableStudents]);

  const studentCount = useMemo(() => {
    if (!form.start_student || !form.end_student) return null;
    return Number(form.end_student.value) - Number(form.start_student.value) + 1;
  }, [form.start_student, form.end_student]);

  const selectedHallData = hallOptions.find((h) => h.value === form.hall_id?.value);
  const capacity = selectedHallData?.capacity ?? null;
  const capacityExceeded = studentCount !== null && capacity !== null && studentCount > capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <StepHeader
        number={editId ? "✎" : "3"}
        title={editId ? "Edit Hall Allocation" : "Allocate a Hall"}
        subtitle={selectedSlot ? `Exam: ${selectedSlot.label}` : "Select an exam slot first"}
      />

      {!selectedSlot ? (
        <Banner type="warning">Please select an exam slot above before allocating a hall.</Banner>
      ) : (
        <div className="space-y-5">

          {/* Hall */}
          <Field label="Hall" required>
            <Select
              options={hallOptions}
              value={form.hall_id}
              onChange={(v) => setForm((f) => ({ ...f, hall_id: v }))}
              styles={selectStyles}
              placeholder="Select a hall…"
            />
            {capacity !== null && (
              <p className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${capacityExceeded ? "text-rose-500" : "text-slate-500"}`}>
                <HiOutlineOfficeBuilding className="w-4 h-4" />
                Capacity: <strong>{capacity} students</strong>
                {capacityExceeded && (
                  <span className="ml-1 font-bold text-rose-500">— Selected students exceed hall capacity.</span>
                )}
              </p>
            )}
          </Field>

          {/* Department & Class */}
          <Field label="Department & Class" required>
            <Select
              options={classOptions}
              value={form.dept_class}
              onChange={(v) =>
                setForm((f) => ({ ...f, dept_class: v, start_student: null, end_student: null }))
              }
              styles={selectStyles}
              placeholder={classesLoading ? "Loading classes…" : "Select department & class…"}
              isLoading={classesLoading}
              isDisabled={classesLoading}
            />
          </Field>

          {/* Start Student */}
          <Field
            label="Start Student"
            hint="The first student in this hall's roll range"
            required
          >
            {!form.dept_class ? (
              <Banner type="info">Select a department & class first.</Banner>
            ) : availableStudents.length === 0 ? (
              <Banner type="success">All students from this class are already allocated to a hall.</Banner>
            ) : (
              <Select
                options={startOptions}
                value={form.start_student}
                onChange={(v) =>
                  setForm((f) => ({ ...f, start_student: v, end_student: null }))
                }
                styles={selectStyles}
                placeholder="Select start student…"
              />
            )}
          </Field>

          {/* End Student */}
          <Field
            label="End Student"
            hint="The last student in this hall's roll range"
            required
          >
            {!form.start_student ? (
              <Banner type="info">Select a start student first.</Banner>
            ) : (
              <Select
                options={endOptions}
                value={form.end_student}
                onChange={(v) => setForm((f) => ({ ...f, end_student: v }))}
                styles={selectStyles}
                placeholder="Select end student…"
              />
            )}
          </Field>

          {/* Student count preview */}
          <AnimatePresence>
            {studentCount !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl px-5 py-4 flex items-center gap-3 font-semibold text-sm border ${
                  capacityExceeded
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                <HiOutlineUsers className="w-5 h-5 shrink-0" />
                Students selected:
                <span className="text-2xl font-extrabold ml-1">{studentCount}</span>
                {capacityExceeded && capacity && (
                  <span className="ml-auto font-bold text-xs text-rose-600">
                    Hall capacity is only {capacity}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onSubmit}
              disabled={capacityExceeded}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              {editId ? "Update Allocation" : "Save Allocation"}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function ExamHallAllocation() {
  const token   = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const [timetableSlots,  setTimetableSlots]  = useState([]);
  const [halls,           setHalls]           = useState([]);
  const [classes,         setClasses]         = useState([]);
  const [allocations,     setAllocations]     = useState([]);
  const [students,        setStudents]        = useState([]);
  const [selectedSlot,    setSelectedSlot]    = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [classesLoading,  setClassesLoading]  = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [editId,          setEditId]          = useState(null);

  const emptyForm = {
    hall_id:       null,
    dept_class:    null,
    start_student: null,
    end_student:   null,
  };
  const [form, setForm] = useState(emptyForm);

  /* ── Initial loads: sessions + halls ── */
  useEffect(() => {
    fetch(`${BASE_URL}/exam/sessions`, { headers })
      .then((r) => r.json())
      .then((sessions) => {
        if (!Array.isArray(sessions)) return;
        const all = [];
        Promise.all(
          sessions.map((s) =>
            fetch(`${BASE_URL}/exam/sessions/${s.session_id}/timetable`, { headers })
              .then((r) => r.json())
              .then((tt) => {
                if (Array.isArray(tt))
                  tt.forEach((t) => all.push({ ...t, session_name: s.session_name }));
              })
              .catch(() => {})
          )
        ).then(() => setTimetableSlots(all));
      })
      .catch(() => {});

    fetch(`${BASE_URL}/exam/halls`, { headers })
      .then((r) => r.json())
      .then((d) => setHalls(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [headers]);

  /* ── Fetch eligible classes for a slot ── */
  const fetchClasses = useCallback((slotId) => {
    setClassesLoading(true);
    fetch(`${BASE_URL}/exam/timetable/${slotId}/classes`, { headers })
      .then((r) => r.json())
      .then((d) => { setClasses(Array.isArray(d) ? d : []); setClassesLoading(false); })
      .catch(() => { setClasses([]); setClassesLoading(false); });
  }, [headers]);

  /* ── Fetch allocations for a slot ── */
  const fetchAllocations = useCallback((slotId) => {
    setLoading(true);
    fetch(`${BASE_URL}/exam/hall-allocations?exam_timetable_id=${slotId}`, { headers })
      .then((r) => r.json())
      .then((d) => { setAllocations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [headers]);

  /* ── Fetch students for a dept/class ── */
  const fetchStudents = useCallback((deptId, classId) => {
    fetch(`${BASE_URL}/students?dept_id=${deptId}&class_id=${classId}`, { headers })
      .then((r) => r.json())
      .then((d) => setStudents(Array.isArray(d) ? d : []))
      .catch(() => setStudents([]));
  }, [headers]);

  /* ── Slot change ── */
  const handleSlotChange = (opt) => {
    setSelectedSlot(opt);
    setAllocations([]);
    setClasses([]);
    setStudents([]);
    setShowForm(false);
    setForm(emptyForm);
    if (opt) {
      fetchAllocations(opt.value);
      fetchClasses(opt.value);
    }
  };

  /* ── Load students when dept/class is picked in form ── */
  useEffect(() => {
    if (form.dept_class) {
      fetchStudents(form.dept_class.dept_id, form.dept_class.class_id);
    } else {
      setStudents([]);
    }
  }, [form.dept_class, fetchStudents]);

  /* ── Submit (create or update) ── */
  const handleSubmit = async () => {
    if (!form.hall_id)       return Swal.fire("Missing field", "Please select a hall.", "warning");
    if (!form.dept_class)    return Swal.fire("Missing field", "Please select a department & class.", "warning");
    if (!form.start_student) return Swal.fire("Missing field", "Please select a start student.", "warning");
    if (!form.end_student)   return Swal.fire("Missing field", "Please select an end student.", "warning");

    const body = {
      exam_timetable_id: selectedSlot.value,
      hall_id:           form.hall_id.value,
      dept_id:           form.dept_class.dept_id,
      class_id:          form.dept_class.class_id,
      roll_start:        form.start_student.value,
      roll_end:          form.end_student.value,
    };

    try {
      const url    = editId
        ? `${BASE_URL}/exam/hall-allocations/${editId}`
        : `${BASE_URL}/exam/hall-allocations`;
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      Swal.fire("Saved!", data.message || "Allocation saved successfully.", "success");
      closeForm();
      fetchAllocations(selectedSlot.value);
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    }
  };

  /* ── Delete ── */
  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete this allocation?",
      text: "Are you sure you want to delete this allocation? This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    }).then(async ({ isConfirmed }) => {
      if (!isConfirmed) return;
      await fetch(`${BASE_URL}/exam/hall-allocations/${id}`, { method: "DELETE", headers });
      fetchAllocations(selectedSlot.value);
    });
  };

  /* ── Edit ── */
  const handleEdit = (row) => {
    const hallOpt = hallOptions.find((h) => h.value === row.hall_id) || null;
    const dcOpt   = classOptions.find(
      (c) => c.dept_id === row.dept_id && c.class_id === row.class_id
    ) || {
      value:    `${row.dept_id}-${row.class_id}`,
      label:    `${DEPT_MAP[row.dept_id] ?? row.dept_id} — ${CLASS_MAP[row.class_id] ?? row.class_id}`,
      dept_id:  row.dept_id,
      class_id: row.class_id,
    };

    setForm({
      hall_id:       hallOpt,
      dept_class:    dcOpt,
      start_student: { value: row.roll_start, label: String(row.roll_start) },
      end_student:   { value: row.roll_end,   label: String(row.roll_end)   },
    });
    setEditId(row.allocation_id);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("allocation-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  /* ── Derived options ── */
  const slotOptions = timetableSlots.map((t) => ({
    value: t.exam_timetable_id,
    label: `${t.subject_name} — ${t.exam_date} — ${t.start_time} (${t.session_name})`,
  }));

  const hallOptions = halls.map((h) => ({
    value:    h.hall_id,
    label:    `${h.hall_name} (${h.building} – Floor ${h.floor} – Capacity ${h.capacity})`,
    capacity: h.capacity,
  }));

  /* Use DEPT_MAP / CLASS_MAP for class dropdown labels */
  const classOptions = classes.map((c) => ({
    value:    `${c.dept_id}-${c.class_id}`,
    label:    `${DEPT_MAP[c.dept_id] ?? c.dept_id} — ${CLASS_MAP[c.class_id] ?? c.class_id}`,
    dept_id:  c.dept_id,
    class_id: c.class_id,
  }));

  /* Student options: index + roll_no from API field */
  const studentOptions = useMemo(
    () =>
      students.map((s, i) => ({
        index:      i + 1,
        rollNumber: s.roll_no_numeric ?? s.roll_no,
        roll_no:    s.roll_no,
      })),
    [students]
  );

  /* Stats */
  const stats = useMemo(() => ({
    halls:       [...new Set(allocations.map((a) => a.hall_id))].length,
    students:    allocations.reduce((acc, a) => acc + Number(a.student_count || 0), 0),
    allocations: allocations.length,
  }), [allocations]);

  /* Export data — use DEPT_MAP / CLASS_MAP, never rely on API name fields */
  const exportData = allocations.map((a) => ({
    Hall:            a.hall_name,
    Building:        a.building,
    Department:      DEPT_MAP[a.dept_id] ?? a.dept_id,
    Class:           CLASS_MAP[a.class_id] ?? a.class_id,
    "Roll Start":    a.roll_start,
    "Roll End":      a.roll_end,
    "Student Count": a.student_count,
  }));

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Exam Hall Allocation
            </h1>
            <p className="text-slate-500 mt-1">Assign exam halls for student roll ranges.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportToExcel(exportData, "Hall_Allocations")}
              disabled={!allocations.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-40"
            >
              <HiOutlineDownload className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={() => generatePDFReport(exportData, "Hall Allocations")}
              disabled={!allocations.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-40"
            >
              <HiOutlineDocumentText className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <AnimatePresence>
          {allocations.length > 0 && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <StatCard icon={HiOutlineOfficeBuilding} label="Halls Used"          value={stats.halls}       color="bg-sky-100 text-sky-800"        textColor="text-sky-500" />
              <StatCard icon={HiOutlineUsers}           label="Students Allocated" value={stats.students}    color="bg-indigo-100 text-indigo-800"   textColor="text-indigo-500" />
              <StatCard icon={HiOutlineDocumentText}    label="Total Allocations"  value={stats.allocations} color="bg-emerald-100 text-emerald-800"  textColor="text-emerald-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Step 1: Select Exam Slot ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <StepHeader
            number="1"
            title="Select Exam Slot"
            subtitle="Choose the subject and time slot to manage hall allocations for"
          />
          <Select
            options={slotOptions}
            value={selectedSlot}
            onChange={handleSlotChange}
            styles={selectStyles}
            placeholder="Search subject or exam date…"
            isClearable
          />
        </motion.div>

        {/* ── Step 2: Allocations Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-start justify-between mb-5">
            <StepHeader
              number="2"
              title="Hall Allocations"
              subtitle={
                selectedSlot
                  ? "Halls currently assigned for this exam slot"
                  : "Select an exam slot above to view allocations"
              }
            />
            {selectedSlot && !showForm && (
              <button
                onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                + Allocate Hall
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading allocations…</p>
            </div>
          ) : !selectedSlot ? (
            <div className="flex flex-col items-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
              <HiOutlineOfficeBuilding className="w-14 h-14 text-slate-200 mb-3" />
              <p className="text-slate-500 font-semibold">No exam slot selected</p>
              <p className="text-slate-400 text-sm mt-1">Select an exam slot in Step 1 to begin.</p>
            </div>
          ) : allocations.length === 0 ? (
            <div className="flex flex-col items-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
              <HiOutlineOfficeBuilding className="w-14 h-14 text-slate-200 mb-3" />
              <p className="text-slate-500 font-semibold">No halls allocated yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Click <strong>Allocate Hall</strong> to assign the first hall.
              </p>
            </div>
          ) : (
            <AllocationTable
              allocations={allocations}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </motion.div>

        {/* ── Step 3: Allocation Form (inline below table) ── */}
        <AnimatePresence>
          {showForm && (
            <div id="allocation-form">
              <AllocationForm
                editId={editId}
                form={form}
                setForm={setForm}
                hallOptions={hallOptions}
                classOptions={classOptions}
                classesLoading={classesLoading}
                selectedSlot={selectedSlot}
                studentOptions={studentOptions}
                allocations={allocations}
                onSubmit={handleSubmit}
                onCancel={closeForm}
              />
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}