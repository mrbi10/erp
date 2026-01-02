import React, { useEffect, useState, useCallback } from "react";
import { BASE_URL } from "../../constants/API";
import { FaChalkboardTeacher, FaDoorOpen, FaClock, FaBook, FaCalendarDay } from "react-icons/fa";
import { motion } from "framer-motion";
// Removed Select import

/* ---------- CONSTANTS (Updated DAYS structure for Segments) ---------- */

const DAYS = [
    { short: "Mon", value: "Monday", label: "Monday" },
    { short: "Tue", value: "Tuesday", label: "Tuesday" },
    { short: "Wed", value: "Wednesday", label: "Wednesday" },
    { short: "Thu", value: "Thursday", label: "Thursday" },
    { short: "Fri", value: "Friday", label: "Friday" },
    { short: "Sat", value: "Saturday", label: "Saturday" },
];

const BASE_SLOTS = [
    { start: "09:00", end: "09:50", type: "class", period: 1 },
    { start: "09:50", end: "10:40", type: "class", period: 2 },
    { start: "10:40", end: "10:55", type: "break" },
    { start: "10:55", end: "11:40", type: "class", period: 3 },
    { start: "11:40", end: "12:20", type: "class", period: 4 },
    { start: "12:20", end: "13:00", type: "break" },
    { start: "13:00", end: "13:40", type: "class", period: 5 },
    { start: "13:40", end: "14:20", type: "class", period: 6 },
    { start: "14:20", end: "15:00", type: "class", period: 7 },
    { start: "15:00", end: "15:40", type: "class", period: 8 },

];

/* ---------- AUTH FETCH (No Change) ---------- */

const useAuthFetch = () => {
    const token = localStorage.getItem("token");

    return useCallback(async (url) => {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    }, [token]);
};

/* ------------------- COMPONENTS ------------------- */

// Segmented Control Component (Apple-like Tab Bar)
const SegmentedControl = ({ value, onChange, segments }) => {
    return (
        <div className="p-1 bg-gray-200 rounded-xl flex shadow-inner max-w-full overflow-x-auto whitespace-nowrap">
            {segments.map((segment) => (
                <motion.button
                    key={segment.value}
                    onClick={() => onChange(segment.value)}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-lg z-10 transition duration-300 ease-out ${value === segment.value
                            ? 'text-gray-900' // Text color when active
                            : 'text-gray-600 hover:text-gray-800' // Text color when inactive
                        }`}
                >
                    {value === segment.value && (
                        <motion.span
                            layoutId="indicator" // Unique layoutId for smooth animation
                            className="absolute inset-0 bg-white rounded-xl shadow-md z-0"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                    <span className="relative z-20">{segment.short}</span>
                </motion.button>
            ))}
        </div>
    );
};

// Card component with spillage fixes
const TimetableCard = ({ slot, data }) => {
    const { start, end, period } = slot;

    const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    if (slot.type === "break") {
        return (
            <motion.div
                variants={cardVariants}
                className="h-28 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-md flex flex-col items-center justify-center font-semibold text-gray-500 transition duration-300 hover:shadow-lg"
            >
                <FaClock className="text-2xl text-lime-600 mb-1" />
                <span className="text-lg text-lime-700">Break Time</span>
                <span className="text-xs mt-1 text-gray-500">{start} - {end}</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={cardVariants}
            className={`h-40 rounded-2xl p-4 flex flex-col justify-between transition duration-300 hover:shadow-xl cursor-pointer ${data
                    ? "bg-white border border-gray-100 shadow-lg"
                    : "bg-gray-50 border border-gray-200 shadow-inner"
                }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Top Row: Period and Time */}
            <div className="text-xs flex justify-between font-medium items-center">
                <span className="px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-100 shadow-sm whitespace-nowrap">
                    P{period}
                </span>
                <span className="text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <FaClock className="text-xs" />
                    {start} - {end}
                </span>
            </div>

            {data ? (
                <>
                    {/* Subject Name - Fixed spillage using 'truncate' */}
                    <div className="flex flex-col space-y-1 overflow-hidden">
                        <div className="font-extrabold text-lg text-gray-800 truncate" title={data.subject_name}>
                            {data.subject_name}
                        </div>

                        {/* Staff - Fixed spillage using 'truncate' */}
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                            <FaChalkboardTeacher className="text-indigo-500 flex-shrink-0" />
                            <span className="truncate" title={data.staff_name}>{data.staff_name}</span>
                        </div>

                        {/* Room */}
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                            <FaDoorOpen className="text-indigo-500 flex-shrink-0" />
                            <span className="truncate">Room: {data.room || "—"}</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-md text-gray-400 font-semibold text-center flex-grow flex items-center justify-center">
                    <span className="p-3 bg-gray-100 rounded-full">
                        No Scheduled Class
                    </span>
                </div>
            )}
        </motion.div>
    );
};

/* ---------- MAIN COMPONENT ---------- */

export default function StudentTimetable() {
    const fetcher = useAuthFetch();

    const [user, setUser] = useState(null);
    const [day, setDay] = useState("Monday");
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const classId = user?.assigned_class_id;

    /* ----- Load timetable when day changes ----- */
    useEffect(() => {
        if (!classId) return;

        setLoading(true);
        fetcher(`${BASE_URL}/timetable/class/${classId}`)
            .then(data => {
                const filtered = (data || []).filter(t => t.day === day);
                setTimetable(filtered);
            })
            .catch(error => {
                console.error("Error fetching timetable:", error);
                setTimetable([]);
            })
            .finally(() => setLoading(false));
    }, [day, classId, fetcher]);

    const getSlotData = (slot) =>
        timetable.find(
            t =>
                t.start_time.startsWith(slot.start) &&
                t.end_time.startsWith(slot.end)
        );

    /* ---------- UI ---------- */

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <header className="mb-8 p-4 bg-white rounded-3xl shadow-lg border border-gray-100">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
                        <FaBook className="text-indigo-500" />
                        Class Schedule
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View your daily timetable. Select a day below to check your classes.
                    </p>
                </header>

                {/* Day Selector - Segmented Control (New UI) */}
                <div className="mb-8 overflow-x-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <FaCalendarDay className="text-sm text-indigo-500" />
                        Select Day:
                    </label>
                    <SegmentedControl
                        value={day}
                        onChange={setDay}
                        segments={DAYS}
                    />
                </div>

                {/* Timetable Grid with Animation */}
                <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {loading && (
                        <div className="col-span-full py-12 text-center text-indigo-500 font-medium bg-white rounded-2xl shadow-xl">
                            <FaClock className="inline animate-spin mr-2" />
                            Fetching schedule for {day}...
                        </div>
                    )}

                    {!loading &&
                        BASE_SLOTS.map((slot, i) => (
                            <TimetableCard key={i} slot={slot} data={getSlotData(slot)} />
                        ))}

                    {!loading && BASE_SLOTS.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-2xl shadow-xl">
                            No time slots defined for the timetable.
                        </div>
                    )}

                </motion.div>
            </div>
        </div>
    );
}