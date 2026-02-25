import React, { useEffect, useState, useMemo } from "react";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import {
    FaCalendarAlt,
    FaCogs,
    FaSpinner,
    FaEdit,
    FaTimes,
    FaSave,
    FaChalkboardTeacher,
    FaBook,
    FaCoffee,
    FaUtensils
} from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

// ---------------------------
// Constants & Styles
// ---------------------------

// Match the exact keys from your JSON
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = { 
    "Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", 
    "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday" 
};

const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: "12px",
        padding: "2px 4px",
        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        border: "2px solid #e2e8f0",
        "&:hover": { borderColor: "#cbd5e1" },
        fontSize: "1rem",
        minHeight: "48px"
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
        color: state.isSelected ? "white" : "#1e293b",
        cursor: "pointer",
        fontSize: "1rem",
        padding: "12px"
    }),
};

// ---------------------------
// Modal Component
// ---------------------------
const Modal = ({ isOpen, onClose, title, children, footer }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                />
                <div className="fixed inset-0 flex justify-center items-center z-50 pointer-events-none p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100"
                    >
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        <div className="p-6">{children}</div>
                        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">{footer}</div>}
                    </motion.div>
                </div>
            </>
        )}
    </AnimatePresence>
);

// ---------------------------
// Main Component
// ---------------------------
export default function GenerateTimetable({ user }) {
    const token = localStorage.getItem("token");

    // Selection State
    const [deptId, setDeptId] = useState("");
    const [classId, setClassId] = useState("");

    // Data State
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Edit Modal State
    const [editingSlot, setEditingSlot] = useState(null);
    const [editForm, setEditForm] = useState({ subject_id: "", staff_id: "" });
    const [isUpdating, setIsUpdating] = useState(false);

    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    }), [token]);

    /* ================= FETCH & MERGE TIMETABLE ================= */
    const fetchTimetable = async (selectedClassId) => {
        if (!selectedClassId) {
            setTimetable([]);
            return;
        }

        setLoading(true);

        try {
            const url = `${BASE_URL}/timetable?dept_id=${user.dept_id}&class_id=${selectedClassId}`;
            const res = await fetch(url, { headers });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to fetch timetable");

            const rawTimetable = data.timetable || [];
            const rawSlots = data.timeSlots || [];

            // MERGE LOGIC:
            // 1. Take all structural slots for this specific class
            // 2. Map assignment details onto them if they exist
            const classSlots = rawSlots.filter(s => s.class_id === Number(selectedClassId));
            
            const mergedGrid = classSlots.map(slot => {
                const assignment = rawTimetable.find(t => t.time_slot_id === slot.id);
                return {
                    ...slot,
                    time_slot_id: slot.id, // Standardize ID key
                    ...assignment // Inject assigned subject/staff if available
                };
            });

            setTimetable(mergedGrid);

        } catch (err) {
            console.error(err);
            setTimetable([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable(classId);
        // eslint-disable-next-line
    }, [classId]);

    /* ================= GENERATE TIMETABLE ================= */
    const generate = async () => {
        if (!deptId || !classId) {
            Swal.fire("Missing Fields", "Please select both Department and Class.", "warning");
            return;
        }

        try {
            setGenerating(true);
            const res = await fetch(`${BASE_URL}/timetable/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify({ dept_id: Number(deptId), class_id: Number(classId) })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Generation failed");

            Swal.fire({ title: "Success!", text: "Timetable structure generated", icon: "success", timer: 1500, showConfirmButton: false });
            fetchTimetable(classId);
        } catch (err) {
            Swal.fire("Generation Failed", err.message, "error");
        } finally {
            setGenerating(false);
        }
    };

    /* ================= UPDATE SLOT ================= */
    const handleOpenEdit = (slot) => {
        setEditingSlot(slot);
        setEditForm({
            subject_id: slot.subject_id || "",
            staff_id: slot.staff_id || ""
        });
    };

    const submitUpdateSlot = async () => {
        if (!editForm.subject_id || !editForm.staff_id) {
            Swal.fire("Required", "Subject ID and Staff ID are required.", "warning");
            return;
        }

        setIsUpdating(true);
        try {
            const res = await fetch(`${BASE_URL}/timetable/update-slot`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    dept_id: Number(deptId),
                    class_id: Number(classId),
                    time_slot_id: editingSlot.time_slot_id,
                    subject_id: Number(editForm.subject_id),
                    staff_id: Number(editForm.staff_id)
                })
            });

            if (!res.ok) throw new Error("Update failed");

            Swal.fire({ title: "Updated", icon: "success", timer: 1500, showConfirmButton: false });
            
            setEditingSlot(null);
            fetchTimetable(classId); // Refresh to get correct Subject & Staff Names
            
        } catch (err) {
            Swal.fire("Update Failed", err.message, "error");
        } finally {
            setIsUpdating(false);
        }
    };

    /* ================= DATA TRANSFORMATION ================= */
    const { grid, maxPeriods } = useMemo(() => {
        if (!timetable.length) return { grid: {}, maxPeriods: 0 };

        const grouped = {};
        let maxP = 0;

        timetable.forEach(slot => {
            if (!grouped[slot.day]) grouped[slot.day] = [];
            grouped[slot.day].push(slot);
            if (slot.period_number > maxP) maxP = slot.period_number;
        });

        Object.keys(grouped).forEach(day => {
            grouped[day].sort((a, b) => a.period_number - b.period_number);
        });

        return { grid: grouped, maxPeriods: maxP };
    }, [timetable]);

    const deptOptions = Object.entries(DEPT_MAP).map(([k, v]) => ({ value: Number(k), label: v }));
    const classOptions = Object.entries(CLASS_MAP).map(([k, v]) => ({ value: Number(k), label: v }));

    /* ================= RENDER ================= */
    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-10 font-sans text-slate-800 pb-24">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-blue-100 rounded-2xl text-blue-700"><FaCalendarAlt className="text-2xl" /></span>
                            Timetable Setup
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium ml-1 text-lg">Generate structure and allocate staff</p>
                    </div>
                </div>

                {/* Controls & Filters */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-6 items-end z-20 relative">
                    <div className="w-full lg:w-1/3 space-y-2">
                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Department</label>
                        <Select
                            styles={selectStyles}
                            placeholder="Select Department"
                            options={deptOptions}
                            value={deptOptions.find(o => o.value === Number(deptId)) || null}
                            onChange={(o) => setDeptId(o ? o.value : "")}
                        />
                    </div>

                    <div className="w-full lg:w-1/3 space-y-2">
                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Class / Year</label>
                        <Select
                            styles={selectStyles}
                            placeholder="Select Class"
                            options={classOptions}
                            value={classOptions.find(o => o.value === Number(classId)) || null}
                            onChange={(o) => setClassId(o ? o.value : "")}
                        />
                    </div>

                    <div className="w-full lg:w-auto flex-1 flex justify-end">
                        <button
                            onClick={generate}
                            disabled={generating || !deptId || !classId}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 text-base h-[48px]"
                        >
                            {generating ? <FaSpinner className="animate-spin text-lg" /> : <FaCogs className="text-lg" />}
                            {generating ? "Generating..." : "Generate Grid"}
                        </button>
                    </div>
                </div>

                {/* Timetable View */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                            <FaSpinner className="text-4xl text-blue-500 animate-spin mb-4" />
                            <p className="text-lg font-bold">Loading Setup...</p>
                        </div>
                    ) : timetable.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center text-slate-400">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <FaCalendarAlt className="text-4xl opacity-20" />
                            </div>
                            <p className="text-xl font-semibold">No grid found.</p>
                            <p className="text-slate-500 mt-2">Select a class or click Generate to create the skeleton.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-4 sm:p-6">
                            <table className="w-full border-collapse min-w-[1000px]">
                                <thead>
                                    <tr>
                                        <th className="p-4 bg-slate-50 border-b border-r border-slate-200 text-left text-sm font-black text-slate-500 uppercase w-32 sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.05)]">Day</th>
                                        {Array.from({ length: maxPeriods }).map((_, i) => (
                                            <th key={i} className="p-3 bg-slate-50 border-b border-slate-200 text-center align-bottom">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                                    Period {i + 1}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {WEEK_DAYS.map((day) => {
                                        const daySlots = grid[day] || [];
                                        if (daySlots.length === 0) return null;

                                        return (
                                            <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 border-b border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.05)] font-bold text-slate-700 uppercase tracking-wider">
                                                    {FULL_DAYS[day]}
                                                </td>
                                                {Array.from({ length: maxPeriods }).map((_, i) => {
                                                    const slot = daySlots.find(s => s.period_number === i + 1);

                                                    if (!slot) return <td key={i} className="p-2 border-b border-slate-200 bg-slate-50/30"></td>;

                                                    const isBreak = slot.is_break === 1;
                                                    const isAssigned = slot.subject_id && slot.staff_id;

                                                    // Break Period Rendering
                                                    if (isBreak) {
                                                        return (
                                                            <td key={slot.time_slot_id} className="p-2 border-b border-slate-200 bg-slate-50/50 align-middle">
                                                                <div className="flex flex-col items-center justify-center h-full min-h-[90px] rounded-lg border border-dashed border-slate-300">
                                                                    {slot.break_type === "lunch" ? <FaUtensils className="text-amber-500 mb-1 text-lg" /> : <FaCoffee className="text-amber-500 mb-1 text-lg" />}
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{slot.break_type || "Break"}</span>
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    // Class Period Rendering
                                                    return (
                                                        <td key={slot.time_slot_id} className="p-2 border-b border-slate-200 align-top h-32 w-44">
                                                            <div
                                                                onClick={() => handleOpenEdit(slot)}
                                                                className={`w-full h-full p-3 rounded-xl border transition-all cursor-pointer flex flex-col
                                                                    ${isAssigned
                                                                        ? "bg-blue-50/50 border-blue-100 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
                                                                        : "bg-slate-50 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100 items-center justify-center"
                                                                    }`}
                                                            >
                                                                {isAssigned ? (
                                                                    <>
                                                                        <div className="mb-1.5 flex justify-between items-start">
                                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-white text-blue-700 uppercase tracking-wider shadow-sm">
                                                                                {slot.subject_code || slot.subject_id}
                                                                            </span>
                                                                        </div>
                                                                        <span className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-2">
                                                                            {slot.subject_name || "Unknown Subject"}
                                                                        </span>
                                                                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 mt-auto bg-white border border-slate-100 px-2 py-1 rounded w-max max-w-full">
                                                                            <FaChalkboardTeacher className="text-blue-500 shrink-0" /> 
                                                                            <span className="truncate">{slot.staff_name || slot.staff_id}</span>
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2 text-slate-400 group">
                                                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                                            <FaEdit />
                                                                        </div>
                                                                        <span className="text-xs font-bold uppercase tracking-wider">Assign Slot</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* --- EDIT SLOT MODAL --- */}
            <Modal
                isOpen={!!editingSlot}
                onClose={() => !isUpdating && setEditingSlot(null)}
                title={`Configure Period ${editingSlot?.period_number} • ${FULL_DAYS[editingSlot?.day]}`}
                footer={
                    <>
                        <button onClick={() => setEditingSlot(null)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 transition-colors">Cancel</button>
                        <button
                            onClick={submitUpdateSlot}
                            disabled={isUpdating}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {isUpdating ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Allocation
                        </button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                            <FaBook className="text-blue-500" /> Subject ID
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., 3 (for Machine Learning)"
                            value={editForm.subject_id}
                            onChange={(e) => setEditForm(p => ({ ...p, subject_id: e.target.value }))}
                            className="w-full p-3.5 rounded-xl border-2 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                            <FaChalkboardTeacher className="text-blue-500" /> Staff ID
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., 73 (for Mrs. Asha)"
                            value={editForm.staff_id}
                            onChange={(e) => setEditForm(p => ({ ...p, staff_id: e.target.value }))}
                            className="w-full p-3.5 rounded-xl border-2 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-800"
                        />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                        <FaCogs className="text-blue-500 mt-0.5 text-lg shrink-0" />
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            Enter the exact numerical database IDs for the Staff and Subject. The grid will automatically map these to display the correct Staff Name and Subject Name after saving.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}