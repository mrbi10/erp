import React, { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../constants/API";
import {
    FaCalendarAlt, FaSpinner, FaBook, FaChalkboardTeacher,
    FaUserGraduate, FaClock, FaCoffee, FaUtensils,
    FaTimes, FaListUl, FaTh
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- CONSTANTS & HELPERS ---
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = {
    "Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday",
    "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday"
};

const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hour, minute] = timeString.split(":");
    const d = new Date();
    d.setHours(parseInt(hour, 10), parseInt(minute, 10));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isCurrentSlot = (day, currentDayShort, currentHHMMSS, startTime, endTime) => {
    return day === currentDayShort && currentHHMMSS >= startTime && currentHHMMSS < endTime;
};

// --- MAIN COMPONENT ---
export default function Viewtimetable({ user }) {
    const token = localStorage.getItem("token");
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    // States
    const [loading, setLoading] = useState(true);
    const [groupedData, setGroupedData] = useState({});
    const [activeClassTab, setActiveClassTab] = useState("ALL");
    const [mobileViewMode, setMobileViewMode] = useState("AGENDA"); // AGENDA or GRID
    const [selectedMobileDay, setSelectedMobileDay] = useState("");

    // Modal State
    const [selectedCell, setSelectedCell] = useState(null);

    // Real-time tracking
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const currentDayShort = now.toLocaleDateString("en-US", { weekday: "short" });
    const currentHHMMSS = now.toTimeString().slice(0, 8);

    // Default to today if it's a weekday, otherwise Monday
    useEffect(() => {
        if (WEEK_DAYS.includes(currentDayShort)) {
            setSelectedMobileDay(currentDayShort);
        } else {
            setSelectedMobileDay("Mon");
        }
    }, [currentDayShort]);

    /* ================= FETCH & GROUP DATA ================= */
    const fetchData = async () => {
        setLoading(true);

        try {
            let params = `?dept_id=${user.dept_id}`;

            if (user.role?.toLowerCase() === "student") {
                params += `&class_id=${user.class_id}`;
            }

            const url = `${BASE_URL}/timetable/${params}`;
            const res = await fetch(url, { headers });
            const data = await res.json();

            const rawTimetable = data.timetable || [];
            const rawSlots = data.timeSlots || [];

            const classesMap = {};

            /* 1. Build slot structure */
            rawSlots.forEach(slot => {
                const cId = slot.class_id || "Unassigned";

                if (!classesMap[cId]) {
                    classesMap[cId] = { classId: cId, periods: {}, grid: {} };
                }

                if (!classesMap[cId].periods[slot.period_number]) {
                    classesMap[cId].periods[slot.period_number] = {
                        period_number: slot.period_number,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        is_break: slot.is_break,
                        break_type: slot.break_type
                    };
                }
            });

            /* 2. Fill timetable grid */
            rawTimetable.forEach(item => {
                const cId = item.class_id || "Unassigned";

                if (!classesMap[cId]) {
                    classesMap[cId] = { classId: cId, periods: {}, grid: {} };
                }

                if (!classesMap[cId].grid[item.day]) {
                    classesMap[cId].grid[item.day] = {};
                }

                classesMap[cId].grid[item.day][item.period_number] = item;
            });

            /* 3. Sort periods */
            Object.keys(classesMap).forEach(key => {
                classesMap[key].periodsList = Object.values(
                    classesMap[key].periods
                ).sort((a, b) => a.period_number - b.period_number);
            });

            setGroupedData(classesMap);

        } catch (err) {
            console.error("Timetable fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [user]);

    /* ================= UI HELPERS ================= */
    const headerInfo = {
        title: user.role.toLowerCase() === "student" ? "My Timetable" : "Master Schedule",
        desc: "Live schedule & period tracking"
    };

    const availableClasses = Object.keys(groupedData);
    const classesToRender = activeClassTab === "ALL"
        ? availableClasses
        : availableClasses.filter(id => id === activeClassTab);

    /* ================= RENDER ================= */
    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <FaSpinner className="text-4xl text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Loading Schedule...</h2>
            <p className="text-slate-500 mt-2">Please wait a moment.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans text-slate-800 pb-24">
            <div className="max-w-[1500px] mx-auto space-y-6">

                {/* --- HEADER --- */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-100 text-blue-700 rounded-xl">
                            <FaCalendarAlt className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                {headerInfo.title}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {headerInfo.desc}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                        {/* Clock */}
                        <div className="flex items-center justify-center gap-3 px-5 py-3 bg-slate-100 rounded-xl text-slate-700 font-semibold border border-slate-200">
                            <FaClock className="text-blue-600" />
                            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-900 tracking-wider">{formatTime(currentHHMMSS)}</span>
                        </div>

                        {/* Mobile Toggles */}
                        <div className="flex lg:hidden bg-slate-200 p-1 rounded-xl">
                            <button
                                onClick={() => setMobileViewMode("AGENDA")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-colors ${mobileViewMode === "AGENDA" ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                            >
                                <FaListUl /> Agenda
                            </button>
                            <button
                                onClick={() => setMobileViewMode("GRID")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-colors ${mobileViewMode === "GRID" ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                            >
                                <FaTh /> Grid
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- CLASS TABS --- */}
                {availableClasses.length > 1 && (
                    <div className="flex overflow-x-auto pb-2 hide-scrollbar gap-2">
                        <button
                            onClick={() => setActiveClassTab("ALL")}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors border ${activeClassTab === "ALL" ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                        >
                            All Classes
                        </button>
                        {availableClasses.map(cId => (
                            <button
                                key={cId}
                                onClick={() => setActiveClassTab(cId)}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors border ${activeClassTab === cId ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                            >
                                Class {cId}
                            </button>
                        ))}
                    </div>
                )}

                {/* --- EMPTY STATE --- */}
                {availableClasses.length === 0 && (
                    <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
                        <FaCalendarAlt className="text-6xl text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">No Timetable Found</h3>
                        <p className="text-slate-500 mt-2">There is currently no schedule assigned.</p>
                    </div>
                )}

                {/* --- TIMETABLE RENDER --- */}
                <div className="space-y-10">
                    {classesToRender.map((cId) => {
                        const classData = groupedData[cId];
                        const headersList = classData.periodsList;
                        const gridData = classData.grid;

                        return (
                            <div key={cId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-slate-50 border-b border-slate-200 p-5">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        Class {cId} Schedule
                                    </h2>
                                </div>

                                {/* ================= MOBILE AGENDA VIEW ================= */}
                                <div className={`lg:hidden ${mobileViewMode === "AGENDA" ? 'block' : 'hidden'}`}>
                                    {/* Days Ribbon */}
                                    <div className="flex overflow-x-auto hide-scrollbar p-3 gap-2 bg-slate-50 border-b border-slate-100">
                                        {WEEK_DAYS.map(day => {
                                            const isSelected = selectedMobileDay === day;
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => setSelectedMobileDay(day)}
                                                    className={`flex-1 min-w-[65px] p-3 rounded-xl flex flex-col items-center transition-colors border ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                                >
                                                    <span className={`text-xs uppercase font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{day}</span>
                                                    <span className="text-base font-bold mt-0.5">{FULL_DAYS[day].slice(0, 3)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Agenda Timeline */}
                                    <div className="p-4 space-y-4 bg-white">
                                        {headersList.map((period) => {
                                            const cell = gridData[selectedMobileDay]?.[period.period_number];
                                            const activeSlot = isCurrentSlot(selectedMobileDay, currentDayShort, currentHHMMSS, period.start_time, period.end_time);
                                            const isBreak = period.is_break === 1;

                                            // BREAK RENDER
                                            if (isBreak) {
                                                return (
                                                    <div key={period.period_number} className={`flex items-center gap-4 p-4 rounded-xl border ${activeSlot ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="p-3 bg-white rounded-lg border border-slate-100">
                                                            {period.break_type === "lunch" ? <FaUtensils className="text-amber-500 text-xl" /> : <FaCoffee className="text-amber-500 text-xl" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 uppercase tracking-wide">{period.break_type || "Break"}</p>
                                                            <p className="text-sm font-medium text-slate-500">{formatTime(period.start_time)} - {formatTime(period.end_time)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // CLASS RENDER
                                            return (
                                                <div key={period.period_number} className="flex gap-4">
                                                    {/* Left Time Column */}
                                                    <div className="flex flex-col items-end w-16 pt-1">
                                                        <span className={`text-xs font-bold ${activeSlot ? 'text-blue-600' : 'text-slate-500'}`}>{formatTime(period.start_time)}</span>
                                                    </div>

                                                    {/* Class Card */}
                                                    <div
                                                        onClick={() => cell && setSelectedCell({ ...cell, periodDetails: period })}
                                                        className={`flex-1 p-4 rounded-xl border transition-colors cursor-pointer ${
                                                            cell
                                                                ? activeSlot
                                                                    ? 'bg-blue-600 text-white border-blue-700 shadow-md relative'
                                                                    : 'bg-white border-slate-200 hover:border-blue-400 active:bg-slate-50'
                                                                : 'bg-slate-50 border-dashed border-slate-300 flex items-center justify-center min-h-[100px]'
                                                        }`}
                                                    >
                                                        {cell ? (
                                                            <div className="flex flex-col h-full">
                                                                {/* Subject Code Pill */}
                                                                <div className="mb-2">
                                                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${activeSlot ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                                        {cell.subject_code}
                                                                    </span>
                                                                </div>
                                                                <h4 className={`text-base font-bold leading-tight mb-3 ${activeSlot ? 'text-white' : 'text-slate-800'}`}>
                                                                    {cell.subject_name}
                                                                </h4>
                                                                <div className={`mt-auto text-sm font-medium flex items-center gap-2 ${activeSlot ? 'text-blue-100' : 'text-slate-500'}`}>
                                                                    <FaChalkboardTeacher />
                                                                    <span className="truncate">{cell.staff_name || "TBA"}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 font-semibold text-sm">Free Period</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ================= DESKTOP / TABLET GRID VIEW ================= */}
                                <div className={`hidden lg:block overflow-x-auto bg-white ${mobileViewMode === "GRID" ? '!block' : ''}`}>
                                    <table className="w-full border-collapse min-w-[1100px] text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-4 text-left font-bold text-slate-500 uppercase w-32 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                                                    Day / Time
                                                </th>
                                                {headersList.map((header) => {
                                                    const isBreak = header.is_break === 1;
                                                    return (
                                                        <th key={header.period_number} className={`p-3 text-center border-r border-slate-200 align-top ${isBreak ? 'w-24 bg-amber-50/50' : 'min-w-[180px]'}`}>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`text-xs font-bold uppercase tracking-wider ${isBreak ? 'text-amber-600' : 'text-slate-700'}`}>
                                                                    {isBreak ? 'Break' : `Period ${header.period_number}`}
                                                                </span>
                                                                <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                                    {formatTime(header.start_time)} - {formatTime(header.end_time)}
                                                                </span>
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {WEEK_DAYS.map((day) => {
                                                const daySlots = gridData[day] || {};
                                                const isToday = day === currentDayShort;

                                                return (
                                                    <tr key={day} className={`border-b border-slate-200 ${isToday ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}>
                                                        
                                                        {/* Sticky Day Column */}
                                                        <td className={`p-4 font-bold text-slate-700 uppercase tracking-wide border-r border-slate-200 sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.05)] ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                                                            <div className="flex items-center gap-2">
                                                                {isToday && <div className="w-1.5 h-5 bg-blue-600 rounded-full" />}
                                                                {FULL_DAYS[day]}
                                                            </div>
                                                        </td>

                                                        {/* Slots */}
                                                        {headersList.map((header) => {
                                                            const cell = daySlots[header.period_number];
                                                            const isBreak = header.is_break === 1;
                                                            const activeSlot = isCurrentSlot(day, currentDayShort, currentHHMMSS, header.start_time, header.end_time);

                                                            // BREAK RENDER
                                                            if (isBreak) {
                                                                return (
                                                                    <td key={`${day}-${header.period_number}`} className="p-2 border-r border-slate-200 bg-slate-50/50 align-middle">
                                                                        <div className={`flex flex-col items-center justify-center h-full min-h-[90px] rounded-lg border border-dashed ${activeSlot ? 'bg-amber-100 border-amber-400' : 'bg-transparent border-slate-300'}`}>
                                                                            {header.break_type === "lunch" ? <FaUtensils className="text-amber-500 mb-1 text-lg" /> : <FaCoffee className="text-amber-500 mb-1 text-lg" />}
                                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{header.break_type || "Break"}</span>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            }

                                                            // CLASS RENDER
                                                            return (
                                                                <td key={`${day}-${header.period_number}`} className="p-2 border-r border-slate-200 align-top h-full">
                                                                    {cell ? (
                                                                        <div
                                                                            onClick={() => setSelectedCell({ ...cell, periodDetails: header })}
                                                                            className={`w-full h-full min-h-[100px] p-3 rounded-lg flex flex-col cursor-pointer transition-colors border ${
                                                                                activeSlot
                                                                                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                                                                    : 'bg-white border-slate-200 hover:border-blue-400'
                                                                            }`}
                                                                        >
                                                                            <div className="mb-1.5">
                                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${activeSlot ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                                                    {cell.subject_code}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            <div className={`font-bold leading-tight line-clamp-2 mb-2 ${activeSlot ? 'text-white' : 'text-slate-800'}`}>
                                                                                {cell.subject_name}
                                                                            </div>
                                                                            
                                                                            <div className={`mt-auto text-xs font-medium flex items-center gap-1.5 ${activeSlot ? 'text-blue-100' : 'text-slate-500'}`}>
                                                                                {user.role === "Staff" ? <FaUserGraduate /> : <FaChalkboardTeacher />}
                                                                                <span className="truncate">
                                                                                    {user.role === "Staff" ? `Class ${cell.class_id}` : cell.staff_name || "TBA"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full h-full min-h-[100px] rounded-lg flex items-center justify-center border border-dashed border-slate-200 bg-slate-50/50">
                                                                            <span className="text-slate-400 font-medium text-xs">Free</span>
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
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================= MODAL FOR CELL DETAILS ================= */}
            <AnimatePresence>
                {selectedCell && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedCell(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                        />
                        {/* Modal Box */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-slate-200"
                        >
                            {/* Header */}
                            <div className="bg-blue-600 p-6 text-white relative">
                                <button onClick={() => setSelectedCell(null)} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                    <FaTimes />
                                </button>
                                <div className="flex items-center gap-2 mb-3 text-blue-100 font-semibold text-sm uppercase tracking-wide">
                                    <FaCalendarAlt /> {FULL_DAYS[selectedCell.day]} • Period {selectedCell.period_number}
                                </div>
                                <h3 className="text-2xl font-bold leading-snug pr-8 mb-2">
                                    {selectedCell.subject_name || "Unknown Subject"}
                                </h3>
                                <span className="inline-block bg-white/20 border border-white/30 px-3 py-1 rounded text-sm font-bold tracking-wider">
                                    {selectedCell.subject_code}
                                </span>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-4 p-3 border-b border-slate-100">
                                    <div className="mt-1 text-blue-500"><FaClock className="text-xl" /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase">Timing</p>
                                        <p className="text-base font-bold text-slate-800">{formatTime(selectedCell.periodDetails?.start_time)} - {formatTime(selectedCell.periodDetails?.end_time)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-3 border-b border-slate-100">
                                    <div className="mt-1 text-blue-500"><FaChalkboardTeacher className="text-xl" /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase">Assigned Staff</p>
                                        <p className="text-base font-bold text-slate-800">{selectedCell.staff_name || "Not Assigned"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-3">
                                    <div className="mt-1 text-blue-500"><FaUserGraduate className="text-xl" /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase">Class / Group</p>
                                        <p className="text-base font-bold text-slate-800">Class ID: {selectedCell.class_id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                <button onClick={() => setSelectedCell(null)} className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-colors">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}