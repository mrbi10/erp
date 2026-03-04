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
import { useNavigate } from "react-router-dom";

// ---------------------------
// Constants & Styles
// ---------------------------

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
    const navigate = useNavigate();

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

    const [dropdownOptions, setDropdownOptions] = useState([]);

    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    }), [token]);

    /* ================= FETCH TIMETABLE ================= */
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

            const classSlots = rawSlots.filter(s => s.class_id === Number(selectedClassId));

            const mergedGrid = classSlots.map(slot => {
                const assignment = rawTimetable.find(t => t.time_slot_id === slot.id);
                return {
                    ...slot,
                    time_slot_id: slot.id,
                    ...assignment 
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
    }, [classId]);

    useEffect(() => {
        const fetchOptions = async () => {
            if (!deptId || !classId) return;

            try {
                const res = await fetch(
                    `${BASE_URL}/timetable/options?dept_id=${deptId}&class_id=${classId}`,
                    { headers }
                );

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setDropdownOptions(data.options || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchOptions();
    }, [deptId, classId]);

    useEffect(() => {
        if (!user) return;
        if (user.role === "CA") {
            setDeptId(user.dept_id);
            setClassId(user.assigned_class_id);
        }
        if (user.role === "HOD" || user.role === "DeptAdmin" || user.role === "Staff") {
            setDeptId(user.dept_id);
        }
    }, [user]);

    const isDeptLocked = ["CA", "HOD", "DeptAdmin", "Staff"].includes(user.role);
    const isClassLocked = user.role === "CA";

    const subjectOptions = dropdownOptions
        .reduce((acc, opt) => {
            if (!acc.find(s => s.value === opt.subject_map_id)) {
                acc.push({
                    value: opt.subject_map_id,
                    label: `${opt.subject_code} - ${opt.subject_name}`
                });
            }
            return acc;
        }, []);

    const staffOptions = dropdownOptions
        .filter(opt => opt.subject_map_id === Number(editForm.subject_id))
        .map(opt => ({
            value: opt.staff_id,
            label: opt.staff_name
        }));

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
                body: JSON.stringify({
                    dept_id: Number(deptId),
                    class_id: Number(classId)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                switch (data.errorCode) {
                    case "NO_TIME_SLOTS":
                    case "NO_SUBJECT_REQUIREMENTS":
                        Swal.fire({
                            icon: "error",
                            title: "Setup Missing",
                            text: "Timetable setup is incomplete.",
                            showCancelButton: true,
                            confirmButtonText: "Go to Setup",
                            confirmButtonColor: "#2563eb"
                        }).then((result) => { if (result.isConfirmed) navigate("/timetable/setup"); });
                        return;
                    case "NO_STAFF_MAPPING":
                        Swal.fire({
                            icon: "error",
                            title: "Staff Mapping Missing",
                            text: "No staff assigned to subjects.",
                            showCancelButton: true,
                            confirmButtonText: "Check Staff Access",
                            confirmButtonColor: "#2563eb"
                        }).then((result) => { if (result.isConfirmed) navigate("/staffaccess/manage"); });
                        return;
                    default:
                        throw new Error(data.message || "Generation failed");
                }
            }

            Swal.fire({ title: "Success!", text: "Timetable generated", icon: "success", timer: 1500, showConfirmButton: false });
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
            Swal.fire("Required", "Subject and Staff are required.", "warning");
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

            const data = await res.json();
            if (!res.ok) {
                if (data.errorCode === "STAFF_TIME_CLASH") {
                    Swal.fire({ icon: "error", title: "Time Conflict", text: data.message });
                    return;
                }
                throw new Error(data.message || "Update failed");
            }

            Swal.fire({ title: "Updated", icon: "success", timer: 1500, showConfirmButton: false });
            setEditingSlot(null);
            fetchTimetable(classId);
        } catch (err) {
            Swal.fire("Update Failed", err.message, "error");
        } finally {
            setIsUpdating(false);
        }
    };

    /* ================= DATA TRANSFORMATION (WITH MERGING) ================= */
    const { grid, orderedSlots } = useMemo(() => {
        if (!timetable.length) return { grid: {}, orderedSlots: [] };

        const grouped = {};
        const structureMap = {};

        // 1. Sort and Group by Day
        timetable.forEach(slot => {
            if (!grouped[slot.day]) grouped[slot.day] = [];
            grouped[slot.day].push({ ...slot });

            const timeKey = `${slot.start_time}-${slot.end_time}`;
            if (!structureMap[timeKey]) {
                structureMap[timeKey] = {
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    is_break: slot.is_break,
                    break_type: slot.break_type
                };
            }
        });

        const ordered = Object.values(structureMap).sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
        );

        // 2. Merging Logic: Calculate colSpan for identical back-to-back periods
        Object.keys(grouped).forEach(day => {
            const slots = grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));

            for (let i = 0; i < slots.length; i++) {
                let current = slots[i];
                if (current.is_break || !current.subject_id || current._skip) continue;

                let span = 1;
                for (let j = i + 1; j < slots.length; j++) {
                    let next = slots[j];

                    if (
                        !next.is_break &&
                        next.subject_id === current.subject_id &&
                        next.staff_id === current.staff_id &&
                        next.period_type === current.period_type
                    ) {
                        span++;
                        next._skip = true; // Mark to skip rendering
                    } else {
                        break;
                    }
                }
                current._span = span;
            }
        });

        return { grid: grouped, orderedSlots: ordered };
    }, [timetable]);

    const deptOptions = Object.entries(DEPT_MAP).map(([k, v]) => ({ value: Number(k), label: v }));
    const classOptions = Object.entries(CLASS_MAP).map(([k, v]) => ({ value: Number(k), label: v }));

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-10 font-sans text-slate-800 pb-24">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-blue-100 rounded-2xl text-blue-700">
                                <FaCalendarAlt className="text-2xl" />
                            </span>
                            Timetable Setup
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium ml-1 text-lg">
                            Generate structure and allocate staff
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/timetable/setup")}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all"
                    >
                        Setup Timetable Details
                    </button>
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
                            isDisabled={isDeptLocked}
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
                            isDisabled={isClassLocked}
                        />
                    </div>

                    <div className="w-full lg:w-auto flex-1 flex justify-end">
                        <button
                            onClick={generate}
                            disabled={generating || !deptId || !classId}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 h-[48px]"
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
                            <FaCalendarAlt className="text-4xl opacity-20 mb-4" />
                            <p className="text-xl font-semibold">No grid found.</p>
                            <p className="text-slate-500 mt-2">Select a class to load or generate the skeleton.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-4 sm:p-6">
                            <table className="w-full border-collapse min-w-[1000px]">
                                <thead>
                                    <tr>
                                        <th className="p-4 bg-slate-50 border-b border-r border-slate-200 text-left text-sm font-black text-slate-500 uppercase w-32 sticky left-0 z-10">Day</th>
                                        {orderedSlots.map((slot, index) => {
                                            const teachingNum = orderedSlots.slice(0, index + 1).filter(s => s.is_break === 0).length;
                                            return (
                                                <th key={index} className="p-3 bg-slate-50 border-b border-slate-200 text-center align-bottom">
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                                        {slot.is_break === 1 ? "Break" : `Period ${teachingNum}`}
                                                    </span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {WEEK_DAYS.map((day) => {
                                        const daySlots = grid[day] || [];
                                        if (daySlots.length === 0) return null;

                                        return (
                                            <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 border-b border-r border-slate-200 bg-white sticky left-0 z-10 font-bold text-slate-700 uppercase tracking-wider">
                                                    {FULL_DAYS[day]}
                                                </td>
                                                {orderedSlots.map((structureSlot) => {
                                                    const slot = daySlots.find(s => s.start_time === structureSlot.start_time && s.end_time === structureSlot.end_time);
                                                    if (!slot || slot._skip) return null;

                                                    const isBreak = slot.is_break === 1;
                                                    const isAssigned = slot.subject_id && slot.staff_id;

                                                    return (
                                                        <td
                                                            key={slot.time_slot_id}
                                                            colSpan={slot._span || 1}
                                                            className={`p-2 border-b border-slate-200 align-top h-36 min-w-[12rem]`}
                                                        >
                                                            {isBreak ? (
                                                                <div className="flex flex-col items-center justify-center h-full rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                                    {slot.break_type === "lunch" ? <FaUtensils className="text-amber-500 mb-1" /> : <FaCoffee className="text-amber-500 mb-1" />}
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{slot.break_type || "Break"}</span>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    onClick={() => handleOpenEdit(slot)}
                                                                    className={`w-full h-full p-3 rounded-2xl border transition-all cursor-pointer flex flex-col group ${
                                                                        isAssigned ? "bg-white border-slate-200 hover:border-blue-500 hover:shadow-md" : "bg-slate-50 border-dashed border-slate-300 items-center justify-center"
                                                                    }`}
                                                                >
                                                                    {isAssigned ? (
                                                                        <>
                                                                            <div className="mb-2 flex justify-between items-start">
                                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-900 text-white uppercase">{slot.subject_code}</span>
                                                                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg border ${slot.period_type === 'LAB' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                                                                                    {slot.period_type}
                                                                                </span>
                                                                            </div>
                                                                            <span className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">{slot.subject_name}</span>
                                                                            
                                                                            {/* Location/Lab Name Logic */}
                                                                            {slot.period_type === "LAB" && slot.lab_name && (
                                                                                <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                                    <span className="text-[10px] font-bold uppercase tracking-tight">{slot.lab_name}</span>
                                                                                </div>
                                                                            )}

                                                                            <div className="mt-auto flex items-center gap-2 pt-2 border-t border-slate-50">
                                                                                <FaChalkboardTeacher className="text-slate-400 group-hover:text-blue-500 text-[10px]" />
                                                                                <span className="text-[11px] font-bold text-slate-500 truncate">{slot.staff_name}</span>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                                                            <FaEdit className="text-slate-400" />
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Assign</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
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
                title={`Configure ${editingSlot?.day} Slot`}
                footer={
                    <>
                        <button onClick={() => setEditingSlot(null)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 transition-colors">Cancel</button>
                        <button onClick={submitUpdateSlot} disabled={isUpdating} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 flex items-center gap-2">
                            {isUpdating ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Allocation
                        </button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2"><FaBook className="text-blue-500" /> Subject</label>
                        <Select styles={selectStyles} placeholder="Select Subject" options={subjectOptions} value={subjectOptions.find(o => o.value === editForm.subject_id) || null} onChange={(s) => setEditForm({ subject_id: s?.value || "", staff_id: "" })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2"><FaChalkboardTeacher className="text-blue-500" /> Staff</label>
                        <Select styles={selectStyles} placeholder="Select Staff" options={staffOptions} value={staffOptions.find(o => o.value === editForm.staff_id) || null} onChange={(s) => setEditForm(p => ({ ...p, staff_id: s?.value || "" }))} isDisabled={!editForm.subject_id} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}