import React, { useEffect, useState, useMemo, useCallback } from "react";
import { BASE_URL } from "../../constants/API";
import { FaPlus, FaSave, FaEdit, FaTrash, FaTimes, FaSpinner, FaClock, FaCalendarAlt, FaChalkboardTeacher, FaDoorOpen, FaChevronRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import Select from 'react-select';

const DAYS = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
];

const BASE_SLOTS = [
    { label: "09:00 - 09:50 (P1)", start: "09:00", end: "09:50", type: "class", period: 1 },
    { label: "09:50 - 10:40 (P2)", start: "09:50", end: "10:40", type: "class", period: 2 },
    { label: "10:40 - 10:55 (Break)", start: "10:40", end: "10:55", type: "break", period: 0 },
    { label: "10:55 - 11:40 (P3)", start: "10:55", end: "11:40", type: "class", period: 3 },
    { label: "13:40 - 14:20 (P6)", start: "13:40", end: "14:20", type: "class", period: 6 },
    { label: "14:20 - 15:00 (P7)", start: "14:20", end: "15:00", type: "class", period: 7 },
    { label: "15:00 - 15:40 (P8)", start: "15:00", end: "15:40", type: "class", period: 8 },
];

const LUNCH_BY_YEAR = {
    "1": { label: "11:40 - 12:20 (Lunch)", start: "11:40", end: "12:20", type: "lunch", period: 4 },
    "2": { label: "12:20 - 13:00 (Lunch)", start: "12:20", end: "13:00", type: "lunch", period: 5 },
    "3": { label: "12:20 - 13:00 (Lunch)", start: "12:20", end: "13:00", type: "lunch", period: 5 },
    "4": { label: "13:00 - 13:40 (Lunch)", start: "13:00", end: "13:40", type: "lunch", period: 6 },
};

const PERIODS_BY_YEAR = {
    "1": [
        { label: "11:40 - 12:20 (P4)", start: "11:40", end: "12:20", type: "class", period: 4 },
        LUNCH_BY_YEAR["1"],
        { label: "12:20 - 13:00 (P5)", start: "12:20", end: "13:00", type: "class", period: 5 },
    ],
    "2": [
        { label: "11:40 - 12:20 (P4)", start: "11:40", end: "12:20", type: "class", period: 4 },
        LUNCH_BY_YEAR["2"],
        { label: "13:00 - 13:40 (P5)", start: "13:00", end: "13:40", type: "class", period: 5 },
    ],
    "3": [
        { label: "11:40 - 12:20 (P4)", start: "11:40", end: "12:20", type: "class", period: 4 },
        LUNCH_BY_YEAR["3"],
        { label: "13:00 - 13:40 (P5)", start: "13:00", end: "13:40", type: "class", period: 5 },
    ],
    "4": [
        { label: "11:40 - 12:20 (P4)", start: "11:40", end: "12:20", type: "class", period: 4 },
        { label: "12:20 - 13:00 (P5)", start: "12:20", end: "13:00", type: "class", period: 5 },
        LUNCH_BY_YEAR["4"],
    ],
};

const getSlotsForClass = (classYear) => {
    if (!classYear || !PERIODS_BY_YEAR[classYear]) {
        return BASE_SLOTS.map(slot => ({ ...slot }));
    }

    const yearPeriods = PERIODS_BY_YEAR[classYear];

    const slots = [
        ...BASE_SLOTS.slice(0, 3), 
        BASE_SLOTS[3], 
        ...yearPeriods, 
        ...BASE_SLOTS.slice(4) 
    ].sort((a, b) => a.start.localeCompare(b.start)); 

    return slots;
};

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: '1.25rem',
        minHeight: '52px',
        borderColor: state.isFocused ? '#4f46e5' : '#e5e7eb',
        boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        '&:hover': {
            borderColor: state.isFocused ? '#4f46e5' : '#d1d5db',
        },
        backgroundColor: 'white', 
        fontSize: '1rem', 
        paddingLeft: '0.5rem',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#9ca3af',
    }),
    singleValue: (base) => ({
        ...base,
        color: '#1f2937',
        fontWeight: '500',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#eef2ff' : 'white',
        color: '#1f2937',
        '&:active': {
            backgroundColor: '#c7d2fe',
        },
    }),
};

const useAuthFetch = () => {
    const token = localStorage.getItem("token");
    const auth = useMemo(() => ({
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }), [token]);

    const fetcher = useCallback(async (url, options = {}) => {
        const response = await fetch(url, { ...options, headers: { ...options.headers, ...auth.headers } });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        return response.json();
    }, [auth.headers]);
    
    return fetcher;
};

export default function Timetable() {
    const fetcher = useAuthFetch();

    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [deptId, setDeptId] = useState("");
    const [classId, setClassId] = useState("");
    const [day, setDay] = useState("Monday");

    const [isMasterLoading, setIsMasterLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const selectedClassObj = classes.find(c => String(c.class_id) === String(classId));
    const classYear = selectedClassObj ? String(selectedClassObj.class_id).charAt(0) : null;

    const TIME_SLOTS = useMemo(
        () => getSlotsForClass(classYear),
        [classYear]
    );

    const [form, setForm] = useState({
        id: null,
        subject_id: "",
        staff_id: "",
        start_time: "",
        end_time: "",
        room: "",
    });

    const resetForm = useCallback(() => {
        setForm({
            id: null,
            subject_id: "",
            staff_id: "",
            start_time: "",
            end_time: "",
            room: "",
        });
        setIsModalOpen(false);
    }, []);

    const reload = useCallback(async () => {
        if (!classId) {
            setTimetable([]);
            return;
        }

        setIsDataLoading(true);
        try {
            const data = await fetcher(`${BASE_URL}/timetable/class/${classId}`);

            const currentSlots = getSlotsForClass(classYear);
            const processedTimetable = (data || [])
                .map(item => {
                    const startTime = item.start_time.substring(0, 5);
                    const endTime = item.end_time.substring(0, 5);

                    return {
                        ...item,
                        start_time: startTime,
                        end_time: endTime,
                        period: currentSlots.find(s => s.start === startTime && s.end === endTime)?.period || 0,
                    };
                })
                .filter(item => item.day === day);

            setTimetable(processedTimetable);
        } catch (error) {
            console.error("Failed to load timetable:", error);
            setTimetable([]);
        } finally {
            setIsDataLoading(false);
        }
    }, [classId, fetcher, day, classYear]);

    useEffect(() => {
        const loadMeta = async () => {
            setIsMasterLoading(true);
            try {
                const data = await fetcher(`${BASE_URL}/timetable/meta`);
                setDepartments(data.departments || []);
                setClasses(data.classes || []);
            } catch (error) {
                Swal.fire("Error", "Failed to load core data.", "error");
            } finally {
                setIsMasterLoading(false);
            }
        };
        loadMeta();
    }, [fetcher]);

    useEffect(() => {
        if (!classId || !deptId) {
            setSubjects([]);
            setStaffs([]);
            return;
        }

        const loadRelatedData = async () => {
            try {
                const [subjectData, staffData] = await Promise.all([
                    fetcher(`${BASE_URL}/subjects?class_id=${classId}`),
                    fetcher(`${BASE_URL}/users?role=Staff&dept_id=${deptId}`),
                ]);

                setSubjects(Array.isArray(subjectData.subjects) ? subjectData.subjects : []);
                setStaffs(Array.isArray(staffData.users) ? staffData.users : []);
            } catch (error) {
                console.error("Failed to load subjects/staff:", error);
            }
        };
        loadRelatedData();
    }, [classId, deptId, fetcher]);

    useEffect(() => {
        reload();
    }, [classId, day, reload]);

    const validateForm = () => {
        if (!classId) {
            Swal.fire("Required", "Please select a Class first.", "warning");
            return false;
        }
        if (!form.subject_id || !form.start_time || !form.end_time) {
            Swal.fire("Required Fields", "Subject and Time Slot are mandatory.", "warning");
            return false;
        }
        if (form.start_time >= form.end_time) {
            Swal.fire("Invalid Time", "Start Time must be before End Time.", "warning");
            return false;
        }
        return true;
    };

    const handleSaveUpdate = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        const isUpdate = form.id !== null;
        const url = isUpdate ? `${BASE_URL}/timetable/update/${form.id}` : `${BASE_URL}/timetable/save`;
        const method = isUpdate ? "PATCH" : "POST";
        const successMessage = isUpdate ? "Slot successfully updated." : "Slot successfully added.";

        try {
            await fetcher(url, {
                method,
                body: JSON.stringify({
                    ...(isUpdate ? {} : { dept_id: Number(deptId), class_id: Number(classId), day, start_time: form.start_time }),
                    subject_id: form.subject_id ? Number(form.subject_id) : null,
                    staff_id: form.staff_id ? Number(form.staff_id) : null,
                    end_time: form.end_time,
                    room: form.room || null,
                }),
            });
            Swal.fire("Success!", successMessage, "success");
            resetForm();
            reload();
        } catch (error) {
            Swal.fire("Error", `Failed to ${isUpdate ? 'update' : 'save'} slot. ${error.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSlot = async (id) => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "This action is irreversible.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#94a3b8",
            confirmButtonText: "Yes, delete it!"
        });

        if (!confirm.isConfirmed) return;

        try {
            await fetcher(`${BASE_URL}/timetable/delete/${id}`, { method: "DELETE" });
            Swal.fire("Deleted!", "The class slot has been deleted.", "success");
            reload();
        } catch (error) {
            Swal.fire("Error", "Failed to delete slot.", "error");
        }
    };

    const edit = (row) => {
        setForm({
            id: row.id,
            subject_id: row.subject_id,
            staff_id: row.staff_id,
            start_time: row.start_time,
            end_time: row.end_time,
            room: row.room || "",
        });
        setIsModalOpen(true);
    };

    const handleEmptySlotClick = (slot) => {
        if (!classId) {
            Swal.fire("Selection Required", "Please select a Class first.", "info");
            return;
        }
        setForm({ 
            ...form, 
            start_time: slot.start, 
            end_time: slot.end, 
            id: null, // Ensure it's a new slot
            subject_id: "",
            staff_id: "",
            room: "",
        });
        setIsModalOpen(true);
    };

    const departmentOptions = useMemo(() => departments.map(d => ({ value: d.dept_id, label: d.dept_name })), [departments]);
    const classOptions = useMemo(() => classes
        .filter(c => String(c.dept_id) === String(deptId))
        .map(c => ({ value: c.class_id, label: c.class_name })), [classes, deptId]);
    const subjectOptions = useMemo(() => subjects.map(s => ({ value: s.subject_id, label: s.subject_name })), [subjects]);
    const staffOptions = useMemo(() => staffs.map(s => ({ value: s.user_id, label: s.name })), [staffs]);

    const classTimeSlotOptions = TIME_SLOTS
        .filter(s => s.type === "class")
        .map(s => ({
            value: `${s.start}-${s.end}`,
            label: s.label,
            start: s.start,
            end: s.end,
        }));

    const selectedDay = DAYS.find(d => d.value === day);
    const selectedDept = departmentOptions.find(d => d.value === deptId);
    const selectedClass = classOptions.find(c => c.value === classId);
    const selectedSubject = subjectOptions.find(s => s.value === form.subject_id);
    const selectedStaff = staffOptions.find(s => s.value === form.staff_id);

    const getSlotContent = (slot) => {
        const found = timetable.find(t => t.day === day && t.start_time === slot.start && t.end_time === slot.end);

        if (slot.type === 'break' || slot.type === 'lunch') {
            const bgColor = slot.type === 'lunch' ? 'bg-orange-50 text-orange-600' : 'bg-lime-50 text-lime-600';
            const icon = slot.type === 'lunch' ? <FaClock className="text-xl"/> : <FaPlus className="text-xl rotate-45" />;
            return (
                <div className={`text-center font-semibold ${bgColor} h-full flex items-center justify-center p-2 rounded-xl transition-all duration-300`}>
                    <div className="flex flex-col items-center justify-center">
                        <span className="mb-1">{icon}</span>
                        <span className="text-sm">{slot.type === 'lunch' ? 'Lunch Break' : 'Short Break'}</span>
                    </div>
                </div>
            );
        }

if (found) {
    return (
        <div className="p-2 h-full flex flex-col justify-between bg-indigo-50 border border-indigo-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className="font-extrabold text-indigo-800 text-base leading-tight overflow-hidden max-h-14"> 
                {found.subject_name}
            </div>
            
            <div className="space-y-1 mt-1">
                <div className="text-xs text-gray-700 flex items-center gap-1">
                    <FaChalkboardTeacher className="text-sm text-indigo-500" /> 
                    <span className="font-medium truncate max-w-full">{found.staff_name || 'Staff N/A'}</span>
                </div>
                <div className="text-xs text-gray-700 flex items-center gap-1">
                    <FaDoorOpen className="text-sm text-indigo-500" /> 
                    <span className="font-medium">{found.room || 'Room N/A'}</span>
                </div>
            </div>

            <div className="mt-1 flex gap-2">
                <button 
                    onClick={() => edit(found)} 
                    className="text-xs text-green-600 hover:text-green-800 p-1.5 rounded-full bg-white/70 hover:bg-white transition-colors shadow-sm" 
                    title="Edit Slot"
                >
                    <FaEdit />
                </button>
                <button 
                    onClick={() => handleDeleteSlot(found.id)} 
                    className="text-xs text-red-600 hover:text-red-800 p-1.5 rounded-full bg-white/70 hover:bg-white transition-colors shadow-sm" 
                    title="Delete Slot"
                >
                    <FaTrash />
                </button>
            </div>
        </div>
    );
}

        return (
            <button 
                onClick={() => handleEmptySlotClick(slot)}
                className="group p-4 h-full w-full flex flex-col items-center justify-center bg-white/70 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300"
                title={`Add slot for ${slot.label}`}
                disabled={!classId}
            >
                <FaPlus className="text-gray-400 group-hover:text-indigo-600 transition-colors text-lg" />
                <span className="text-sm text-gray-500 mt-1 font-medium group-hover:text-indigo-700 transition-colors">Add Class</span>
            </button>
        );
    };


    return (
        <div className="p-4 sm:p-6 lg:p-12 bg-gray-100 min-h-screen font-sans text-slate-800">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-10 flex items-center gap-4 text-gray-900">
                    <span className="p-3 bg-indigo-500 rounded-xl text-white shadow-xl"><FaCalendarAlt /></span>
                    Timetable Management
                </h1>

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="p-6 rounded-3xl bg-white shadow-2xl shadow-indigo-100 border border-gray-100 mb-10"
                >
                    <h2 className="text-xl font-bold mb-5 text-gray-700 flex items-center gap-2">
                        <FaChevronRight className="text-indigo-500 text-sm" /> Configuration
                    </h2>
                    {isMasterLoading ? (
                        <div className="p-6 text-center text-indigo-500">
                            <FaSpinner className="animate-spin inline-block text-2xl mr-3" /> Loading Core Data...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Select
                                styles={customSelectStyles}
                                placeholder="Select Department"
                                options={departmentOptions}
                                value={selectedDept}
                                onChange={option => {
                                    setDeptId(option ? option.value : "");
                                    setClassId("");
                                    resetForm();
                                }}
                                isClearable
                            />

                            <Select
                                styles={customSelectStyles}
                                placeholder="Select Class"
                                options={classOptions}
                                value={selectedClass}
                                onChange={option => {
                                    setClassId(option ? option.value : "");
                                    resetForm();
                                }}
                                isDisabled={!deptId || classOptions.length === 0}
                                isClearable
                            />

                            <Select
                                styles={customSelectStyles}
                                placeholder="Select Day"
                                options={DAYS}
                                value={selectedDay}
                                onChange={option => {
                                    setDay(option.value);
                                }}
                                isSearchable={false}
                            />

                            <div />
                        </div>
                    )}
                </motion.div>

                <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
                    <FaClock className="text-indigo-500" /> Timetable for <span className="text-indigo-600">{day}</span>
                </h2>
                <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100 border border-gray-100 overflow-hidden min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {isDataLoading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-12 text-center"
                            >
                                <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto" />
                                <p className="mt-4 text-gray-500 text-lg">Fetching today's schedule...</p>
                            </motion.div>
                        ) : !classId ? (
                            <motion.div 
                                key="empty-select"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-12 text-center text-gray-500 bg-gray-50/50 rounded-3xl"
                            >
                                <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-3" />
                                <p className="text-lg font-medium">Please select a Department and Class above to load the timetable structure.</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.05 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6"
                            >
                                {TIME_SLOTS.map((slot, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                        className={`relative ${slot.type === 'class' ? 'h-36' : 'h-28'}`}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full p-1">
                                            <div className="text-xs font-semibold text-gray-500 mb-1 flex justify-between items-center px-1">
                                                <span>{slot.type === 'class' ? `P${slot.period}` : slot.type.toUpperCase()}</span>
                                                <span className="text-gray-400">{slot.start} - {slot.end}</span>
                                            </div>
                                            {getSlotContent(slot)}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* --- MODAL FOR ADD/EDIT SLOT --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-gray-900 bg-opacity-40 flex items-center justify-center p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => resetForm()}
                    >
                        <motion.div
                            className="bg-white w-full max-w-4xl p-6 sm:p-8 rounded-3xl shadow-2xl"
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            onClick={e => e.stopPropagation()} 
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <FaEdit className={form.id ? 'text-indigo-500' : 'text-green-500'} />
                                    {form.id ? `Edit Class Slot` : `Add New Slot for ${day}`}
                                </h3>
                                <button onClick={resetForm} className="p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-full">
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                
                                {/* Time Slot (Read-Only on Edit, Selected on Add) */}
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Time Slot</label>
                                    <Select
                                        styles={customSelectStyles}
                                        placeholder="Select Time Slot"
                                        options={classTimeSlotOptions}
                                        isDisabled={form.id !== null} // Disabled if editing
                                        value={
                                            form.start_time && form.end_time
                                                ? {
                                                    value: `${form.start_time}-${form.end_time}`,
                                                    label: classTimeSlotOptions.find(opt => opt.start === form.start_time && opt.end === form.end_time)?.label || `${form.start_time} - ${form.end_time}`,
                                                }
                                                : null
                                        }
                                        onChange={(opt) => {
                                            if (opt) {
                                                const [start, end] = opt.value.split("-");
                                                setForm({ ...form, start_time: start, end_time: end });
                                            } else {
                                                setForm({ ...form, start_time: "", end_time: "" });
                                            }
                                        }}
                                    />
                                    {form.id && <p className="text-xs text-gray-500 mt-2">Time is fixed for editing existing slots.</p>}
                                </div>
                                
                                {/* Subject */}
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Subject</label>
                                    <Select
                                        styles={customSelectStyles}
                                        placeholder="Select Subject"
                                        options={subjectOptions}
                                        value={selectedSubject}
                                        onChange={option => setForm({ ...form, subject_id: option ? option.value : "" })}
                                        isDisabled={!classId}
                                    />
                                </div>

                                {/* Staff */}
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Staff </label>
                                    <Select
                                        styles={customSelectStyles}
                                        placeholder="Select Staff"
                                        options={staffOptions}
                                        value={selectedStaff}
                                        onChange={option => setForm({ ...form, staff_id: option ? option.value : "" })}
                                        isClearable
                                        isDisabled={!deptId}
                                    />
                                </div>

                                {/* Room */}
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Room</label>
                                    <input
                                        placeholder="e.g., A101"
                                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-base focus:ring-indigo-300 focus:border-indigo-400 transition-shadow"
                                        value={form.room}
                                        onChange={e => setForm({ ...form, room: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-4 mt-8">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={resetForm}
                                    className="p-3 sm:p-4 bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors text-base font-semibold shadow-sm"
                                    disabled={isSaving}
                                >
                                    <FaTimes />
                                    Cancel
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveUpdate}
                                    disabled={isSaving || !classId}
                                    className={`p-3 sm:p-4 ${isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-bold text-base disabled:opacity-50 shadow-md hover:shadow-lg`}
                                >
                                    {isSaving ? <FaSpinner className="animate-spin" /> : (form.id ? <FaSave /> : <FaPlus />)}
                                    {form.id ? "Update Slot" : "Add Slot"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}