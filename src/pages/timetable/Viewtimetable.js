import React, { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../constants/API";
import {
    FaCalendarAlt, FaSpinner, FaChalkboardTeacher,
    FaClock, FaCoffee, FaUtensils,
    FaMapMarkerAlt
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- CONSTANTS ---
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
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

const isCurrentSlot = (day, currentDayShort, currentHHMMSS, startTime, endTime) => {
    return day === currentDayShort && currentHHMMSS >= startTime && currentHHMMSS < endTime;
};

export default function Viewtimetable({ user }) {
    const token = localStorage.getItem("token");
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const [loading, setLoading] = useState(true);
    const [groupedData, setGroupedData] = useState({});
    const [activeClassTab, setActiveClassTab] = useState("ALL");
    const [mobileViewMode, setMobileViewMode] = useState("AGENDA");
    const [selectedMobileDay, setSelectedMobileDay] = useState("");
    const [selectedCell, setSelectedCell] = useState(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const currentDayShort = now.toLocaleDateString("en-US", { weekday: "short" });
    const currentHHMMSS = now.toTimeString().slice(0, 8);

    useEffect(() => {
        setSelectedMobileDay(WEEK_DAYS.includes(currentDayShort) ? currentDayShort : "Mon");
    }, [currentDayShort]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let params = `?dept_id=${user.dept_id}`;
            if (user.role?.toLowerCase() === "student") params += `&class_id=${user.class_id}`;
            const res = await fetch(`${BASE_URL}/timetable/${params}`, { headers });
            const data = await res.json();

            const classesMap = {};
            (data.timeSlots || []).forEach(slot => {
                const cId = slot.class_id || "Unassigned";
                if (!classesMap[cId]) classesMap[cId] = { classId: cId, periods: {}, grid: {} };
                classesMap[cId].periods[slot.period_number] = { ...slot };
            });

            (data.timetable || []).forEach(item => {
                const cId = item.class_id || "Unassigned";
                if (!classesMap[cId].grid[item.day]) classesMap[cId].grid[item.day] = {};
                classesMap[cId].grid[item.day][item.period_number] = item;
            });

            // --- ADVANCED MERGING LOGIC ---
            Object.keys(classesMap).forEach(key => {
                const currentClass = classesMap[key];
                const ordered = Object.values(currentClass.periods)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
                
                currentClass.orderedSlots = ordered;

                // Process Merging for each day in this class
                WEEK_DAYS.forEach(day => {
                    if (!currentClass.grid[day]) return;
                    
                    for (let i = 0; i < ordered.length; i++) {
                        const slotInfo = ordered[i];
                        const cell = currentClass.grid[day][slotInfo.period_number];
                        
                        if (!cell || cell._skip || slotInfo.is_break) continue;

                        let span = 1;
                        for (let j = i + 1; j < ordered.length; j++) {
                            const nextSlotInfo = ordered[j];
                            const nextCell = currentClass.grid[day][nextSlotInfo.period_number];

                            if (nextCell && 
                                nextCell.subject_id === cell.subject_id && 
                                nextCell.staff_id === cell.staff_id &&
                                nextCell.period_type === cell.period_type) {
                                span++;
                                nextCell._skip = true;
                            } else {
                                break;
                            }
                        }
                        cell._span = span;
                    }
                });
            });
            
            setGroupedData(classesMap);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
            >
                <FaCalendarAlt className="text-white text-xl" />
            </motion.div>
        </div>
    );

    const isStudent = user.role?.toLowerCase() === "student";
    const availableClasses = Object.keys(groupedData);
    const classesToRender = isStudent
        ? availableClasses.filter(id => String(id) === String(user.class_id))
        : activeClassTab === "ALL" ? availableClasses : [activeClassTab];

    return (
        <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-24 selection:bg-indigo-100">
            {/* --- SMART APP BAR --- */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <FaCalendarAlt />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">Schedule</h1>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Live Now
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* --- MOBILE DAY SELECTOR --- */}
                <div className="lg:hidden relative">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 py-3 scroll-smooth">
                        {WEEK_DAYS.map(day => {
                            const isActive = selectedMobileDay === day;
                            const isToday = day === currentDayShort;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedMobileDay(day)}
                                    className={`relative flex-shrink-0 w-20 h-24 rounded-3xl flex flex-col items-center justify-center transition-all duration-300
                                    ${isActive ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-2xl scale-105" : "bg-white border border-slate-100 text-slate-400"}`}
                                >
                                    {isToday && !isActive && <span className="absolute top-2 right-3 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                                    <span className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isActive ? "text-indigo-200" : "text-slate-400"}`}>{day}</span>
                                    <span className="text-2xl font-black">{isToday ? "•" : day.charAt(0)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* --- CLASS TABS --- */}
                {!isStudent && availableClasses.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <TabBtn active={activeClassTab === "ALL"} onClick={() => setActiveClassTab("ALL")}>All</TabBtn>
                        {availableClasses.map(id => (
                            <TabBtn key={id} active={activeClassTab === id} onClick={() => setActiveClassTab(id)}>Class {id}</TabBtn>
                        ))}
                    </div>
                )}

                {/* --- MAIN CONTENT --- */}
                <div className="space-y-16">
                    {classesToRender.map((cId) => {
                        const classData = groupedData[cId];
                        const headersList = classData.orderedSlots;
                        const gridData = classData.grid;

                        return (
                            <div key={cId} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Desktop Grid View */}
                                <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="p-8 text-left text-[10px] font-black uppercase text-slate-400 border-r border-slate-50">Timeline</th>
                                                {headersList.map((h, i) => (
                                                    <th key={i} className={`p-6 text-center border-r border-slate-50 ${h.is_break ? 'bg-amber-50/20' : ''}`}>
                                                        <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-tighter">
                                                            {h.is_break ? (h.break_type === 'short' ? 'Break' : 'Lunch') : `Period ${headersList.slice(0, i + 1).filter(x => !x.is_break).length}`}
                                                        </span>
                                                        <span className="text-xs font-black text-slate-800">{formatTime(h.start_time)}</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {WEEK_DAYS.map(day => {
                                                const isToday = day === currentDayShort;
                                                return (
                                                    <tr key={day} className={`border-t border-slate-50 ${isToday ? 'bg-indigo-50/20' : ''}`}>
                                                        <td className={`p-8 border-r border-slate-50 font-black text-lg ${isToday ? 'text-indigo-600' : 'text-slate-300'}`}>{day}</td>
                                                        {headersList.map(slot => {
                                                            const cell = gridData[day]?.[slot.period_number];
                                                            if (cell?._skip) return null;
                                                            const active = isCurrentSlot(day, currentDayShort, currentHHMMSS, slot.start_time, slot.end_time);

                                                            return (
                                                                <td key={slot.period_number} colSpan={cell?._span || 1} className="p-2 border-r border-slate-50 align-top">
                                                                    {slot.is_break ? (
                                                                        <div className={`flex items-center justify-center h-full min-h-[100px] rounded-3xl border-2 border-dashed ${active ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                                            {slot.break_type === 'lunch' ? <FaUtensils /> : <FaCoffee />}
                                                                        </div>
                                                                    ) : (
                                                                        cell ? (
                                                                            <motion.div
                                                                                whileHover={{ scale: 1.02, y: -4 }}
                                                                                onClick={() => setSelectedCell({ ...cell, periodDetails: slot })}
                                                                                className={`p-5 rounded-[2rem] h-full cursor-pointer transition-all ${active ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl' : 'bg-white border border-slate-100 hover:border-indigo-200 shadow-sm'}`}
                                                                            >
                                                                                <div className="flex justify-between items-start mb-3">
                                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-indigo-200' : 'text-slate-400'}`}>{cell.subject_code}</span>
                                                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${cell.period_type === 'LAB' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>{cell.period_type}</span>
                                                                                </div>
                                                                                <h4 className="font-bold text-sm leading-tight mb-2 line-clamp-2">{cell.subject_name}</h4>
                                                                                
                                                                                {cell.period_type === 'LAB' && cell.lab_name && (
                                                                                    <div className={`flex items-center gap-1 text-[9px] font-bold mb-3 ${active ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                                                                        <div className="w-1 h-1 rounded-full bg-current" /> {cell.lab_name}
                                                                                    </div>
                                                                                )}

                                                                                <div className={`flex items-center gap-2 text-[10px] font-bold mt-auto ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                                                    <FaChalkboardTeacher /> {cell.staff_name}
                                                                                </div>
                                                                            </motion.div>
                                                                        ) : <div className="h-full min-h-[100px] bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100" />
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

                                {/* Mobile Agenda View */}
                                <div className={`lg:hidden space-y-6 ${mobileViewMode === 'AGENDA' ? 'block' : 'hidden'}`}>
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xl font-black text-slate-900">{FULL_DAYS[selectedMobileDay]}</h3>
                                        {selectedMobileDay === currentDayShort && <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Live</span>}
                                    </div>
                                    <div className="space-y-4">
                                        {headersList.map((slot, i) => {
                                            const cell = gridData[selectedMobileDay]?.[slot.period_number];
                                            if (cell?._skip) return null;
                                            const active = isCurrentSlot(selectedMobileDay, currentDayShort, currentHHMMSS, slot.start_time, slot.end_time);

                                            return (
                                                <div key={i} className="flex gap-4">
                                                    <div className="pt-2 w-12 text-right">
                                                        <span className={`text-[10px] font-black ${active ? 'text-indigo-600' : 'text-slate-300'}`}>{formatTime(slot.start_time).split(' ')[0]}</span>
                                                    </div>
                                                    <motion.div
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => cell && setSelectedCell({ ...cell, periodDetails: slot })}
                                                        className={`flex-1 p-6 rounded-[2rem] border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}
                                                    >
                                                        {slot.is_break ? (
                                                            <div className="flex items-center gap-4 py-2 opacity-60">
                                                                {slot.break_type === 'lunch' ? <FaUtensils /> : <FaCoffee />}
                                                                <span className="font-bold uppercase text-xs tracking-widest">{slot.break_type || "Break"}</span>
                                                            </div>
                                                        ) : (
                                                            cell ? (
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <div className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-indigo-200' : 'text-slate-400'}`}>{cell.subject_code}</div>
                                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{cell.period_type}</span>
                                                                    </div>
                                                                    <h4 className="text-base font-black leading-tight mb-2">{cell.subject_name}</h4>
                                                                    {cell.period_type === 'LAB' && cell.lab_name && <p className={`text-[10px] font-bold mb-3 ${active ? 'text-emerald-300' : 'text-emerald-600'}`}>{cell.lab_name}</p>}
                                                                    <div className={`flex items-center gap-3 text-xs font-bold ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                                                                        <FaChalkboardTeacher /> {cell.staff_name}
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-slate-300 font-bold italic text-sm">Free Window</span>
                                                        )}
                                                    </motion.div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- FOCUS MODAL --- */}
            <AnimatePresence>
                {selectedCell && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCell(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="fixed bottom-0 left-0 right-0 lg:left-auto lg:right-8 lg:bottom-8 lg:w-96 bg-white rounded-t-[3rem] lg:rounded-[3rem] shadow-2xl z-[70] p-8 md:p-10"
                        >
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 lg:hidden" />
                            <div className="space-y-8">
                                <div>
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedCell.subject_code}</span>
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedCell.period_type}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedCell.subject_name}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-5 rounded-3xl">
                                        <FaClock className="text-indigo-600 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Timing</p>
                                        <p className="font-black text-slate-900 text-sm">{formatTime(selectedCell.periodDetails?.start_time)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-3xl">
                                        <FaMapMarkerAlt className="text-indigo-600 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                                        <p className="font-black text-slate-900 text-sm">{selectedCell.period_type === 'LAB' ? selectedCell.lab_name : `Class ${selectedCell.class_id}`}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-5 border border-slate-100 rounded-3xl">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><FaChalkboardTeacher /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Lead Instructor</p>
                                        <p className="font-black text-slate-900">{selectedCell.staff_name}</p>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedCell(null)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm tracking-widest hover:bg-slate-800 transition-all active:scale-95">CLOSE</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

const TabBtn = ({ children, active, onClick }) => (
    <button onClick={onClick} className={`px-8 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap uppercase tracking-widest ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100'}`}>
        {children}
    </button>
);