import React, { useEffect, useMemo, useState } from "react";
import { FaBook, FaCalendarAlt, FaUtensils, FaSyncAlt, FaArrowRight, FaCheckCircle, FaExclamationCircle, FaClock, FaEnvelopeOpenText, FaFileDownload, FaGraduationCap, FaMoneyBillAlt, FaBell } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import { BASE_URL } from "../../constants/API";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {  FaUsers, FaBuilding, FaUserGraduate } from "react-icons/fa";
import { DEPT_MAP } from "../../constants/deptClass";


const CARD_CLASSES = "p-6 bg-white rounded-2xl border border-gray-100 shadow-xl transition duration-500 hover:shadow-2xl hover:border-sky-200 h-full flex flex-col";
const HEADER_ICON_COLOR = "text-sky-600";
const HEADER_TEXT_CLASSES = "text-xl font-semibold text-gray-800 tracking-tight";
const SUBHEADER_TEXT_CLASSES = "text-sm text-gray-500 font-light";
const ACCENT_COLOR_CLASSES = "text-sky-600 font-bold";
const PRIMARY_BUTTON_CLASSES = "px-4 py-2 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition duration-300 shadow-md";

const formatTime = (time) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m}`;
};

const ROMAN_MAP = { 1: "I", 2: "II", 3: "III", 4: "IV" };

const getTargetLabel = (a, classes) => {
    if (a.target_type === "all") {
        return { text: "College Wide", color: "bg-red-100 text-red-600", icon: <FaUsers /> };
    }

    if (a.target_type === "department") {
        return {
            text: `${DEPT_MAP[a.dept_id] || "Dept"} Only`,
            color: "bg-blue-100 text-blue-600",
            icon: <FaBuilding />
        };
    }

    if (a.target_type === "class") {
        const cls = classes?.find(
            c => c.dept_id === a.dept_id && c.class_id === a.class_id
        );

        return {
            text: cls
                ? `${DEPT_MAP[a.dept_id]} - ${ROMAN_MAP[cls.year]} Year`
                : "Class",
            color: "bg-emerald-100 text-emerald-600",
            icon: <FaUserGraduate />
        };
    }

    return { text: "General", color: "bg-gray-100 text-gray-600", icon: <FaUsers /> };
};


const formatdatetime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        weekday: "short",
    });
}

const AttendanceCard = ({ profileData, token }) => {
    const [studentData, setStudentData] = useState([]);

    const fetchStudentData = async () => {
        try {
            const res = await fetch(`${BASE_URL}/attendance/student/${profileData?.regNo}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStudentData(data);
        } catch {
            setStudentData([]);
        }
    };

    useEffect(() => {
        if (!profileData?.regNo) return;
        fetchStudentData();
    }, [profileData?.regNo, token]);




    const cumulativeTrend = useMemo(() => {
        if (!studentData.length) return [];

        const sorted = [...studentData].sort((a, b) => new Date(a.date) - new Date(b.date));

        let presentCount = 0;

        return sorted.map((record, index) => {
            if (record.status === "Present" || record.status === "P") {
                presentCount++;
            }

            const totalDays = index + 1;
            const pct = (presentCount / totalDays) * 100;

            return {
                date: new Date(record.date).toLocaleDateString(),
                pct: Number(pct.toFixed(2))
            };
        }).slice(-15);
    }, [studentData]);



    const overallPercentage = cumulativeTrend.length
        ? cumulativeTrend[cumulativeTrend.length - 1].pct
        : 0;

    const overallBgColor =
        overallPercentage >= 75 ? "bg-green-500"
            : overallPercentage >= 50 ? "bg-yellow-500"
                : "bg-red-500";


    const lineData = {
        labels: cumulativeTrend.map(d => d.date),
        datasets: [
            {
                label: "",
                data: cumulativeTrend.map(d => d.pct),
                borderColor: "#0ea5e9",
                backgroundColor: "rgba(14,165,233,0.2)",
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: () => null,
                    label: ctx => `${ctx.raw}%`
                }
            }
        },
        scales: {
            y: { suggestedMin: 0, suggestedMax: 100 }
        }
    };



    const recentStatus = useMemo(() => {
        return [...studentData]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }, [studentData]);


    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col h-full border border-gray-100">

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Attendance Analytics</h3>
                </div>

                <div className="flex flex-col items-end">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow ${overallBgColor}`}>
                        {Math.round(overallPercentage)}%
                    </div>
                </div>
            </div>

            <div className="h-56 mb-6">
                <Line data={lineData} options={chartOptions} />
            </div>

            <button
                onClick={() => window.location.href = "#/attendance/view"}
                className="w-full py-2 bg-sky-600 text-white rounded-xl mb-4 hover:bg-sky-700 transition"
            >
                Detailed Attendance Overview
            </button>


        </div>
    );
};



const MessMenuCard = ({ messMenu, isJain }) => {
    const [selectedDay, setSelectedDay] = useState(
        new Date().toLocaleDateString("en-US", { weekday: "long" })
    );

    if (!messMenu || !Array.isArray(messMenu) || messMenu.length === 0) {
        return <div className={CARD_CLASSES}><p className="text-center text-gray-500">Menu data loading...</p></div>;
    }

    const selectedMenu = messMenu.find((m) => m.day === selectedDay);
    const menu = isJain ? selectedMenu?.jain : selectedMenu?.non_jain;
    const menuType = isJain ? "Jain" : "Standard";

    return (
        <div className={CARD_CLASSES}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <FaUtensils className={`text-2xl ${HEADER_ICON_COLOR} mr-3`} />
                    <div>
                        <h3 className={HEADER_TEXT_CLASSES}>
                            {menuType} Mess Menu
                        </h3>
                        <p className={SUBHEADER_TEXT_CLASSES}>Daily Meal Breakdown</p>
                    </div>
                </div>
                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="border border-gray-200 bg-gray-50 rounded-lg p-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                >
                    {messMenu.map((m, idx) => (
                        <option key={idx} value={m.day}>{m.day}</option>
                    ))}
                </select>
            </div>

            <h4 className={`text-lg font-semibold mb-3 ${ACCENT_COLOR_CLASSES}`}>{selectedDay}'s Menu</h4>

            {!menu ? (
                <p className="text-gray-500 italic p-4 text-center bg-gray-50 rounded-lg">Menu not available for this day.</p>
            ) : (
                <div className="space-y-3">
                    {Object.entries(menu).map(([key, val], idx) =>
                        val ? (
                            <div key={idx} className="p-3 rounded-xl bg-gray-50 flex justify-between items-start hover:bg-sky-50 transition duration-150 border-l-4 border-sky-100">
                                <span className="font-semibold capitalize text-gray-700 pr-4">{key.replace(/_/g, " ")}:</span>{" "}
                                <span className="text-gray-800 text-right flex-1">{val}</span>
                            </div>
                        ) : null
                    )}
                </div>
            )}
            <p className="mt-4 text-xs text-gray-400 text-right">Preference: {menuType}</p>
        </div>
    );
};

const PerformanceCard = ({ performance }) => {
    const lineData = useMemo(() => ({
        labels: (performance?.subjects || []).map((s) => s.name.split(' ').map(w => w.charAt(0)).join('')), // Use initials
        datasets: [
            {
                label: "Marks",
                data: (performance?.subjects || []).map((s) => s.marks),
                fill: false,
                borderColor: '#1d4ed8',
                backgroundColor: 'rgba(29, 78, 216, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#1d4ed8',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
            },
        ],
    }), [performance]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.raw}`,
                    title: (context) => (performance?.subjects || [])[context[0].dataIndex]?.name || context[0].label
                }
            }
        },
        scales: {
            y: { suggestedMin: 0, suggestedMax: 100, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
    };

    return (
        <div className={CARD_CLASSES}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                    <FaGraduationCap className={`text-2xl ${HEADER_ICON_COLOR} mr-3`} />
                    <div>
                        <h3 className={HEADER_TEXT_CLASSES}>Academic Performance</h3>
                        <p className={SUBHEADER_TEXT_CLASSES}>Latest CGPA and Subject Scores</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-extrabold text-blue-700">{performance.cgpa}</div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">Latest CGPA</div>
                </div>
            </div>

            <div className="mb-6 h-52 flex-grow">
                <Line data={lineData} options={chartOptions} />
            </div>

            <div className="mt-auto">
                <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="font-medium text-gray-700">Semester GPA:</span> <span className="font-bold text-blue-800 text-lg ml-1">{performance.semesterGpa}</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="font-medium text-gray-700">Class Rank:</span> <span className="font-bold text-blue-800 text-lg ml-1">{performance.ranking}</span>
                    </div>
                </div>

                <ul className="mt-4 space-y-2 max-h-36 overflow-y-auto pr-2">
                    {(performance?.subjects || []).map((s, idx) => (
                        <li key={idx} className="flex justify-between p-2 bg-gray-50 rounded-lg transition duration-150 hover:bg-gray-100 border-l-2 border-gray-200">
                            <div>
                                <div className="font-medium text-sm text-gray-800">{s.name}</div>
                                <div className="text-xs text-gray-500">Grade: <span className="font-semibold text-gray-700">{s.grade}</span></div>
                            </div>
                            <div className="text-right font-bold text-lg text-blue-800">{s.marks}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};



const TimetableCard = ({ timetableToday }) => {
    const todayClasses = timetableToday || [];

    const getTimeAsDate = (timeString) => {
        if (!timeString) return null;
        const [h, m, s] = timeString.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, s, 0);
        return date;
    };

    const getStatus = (cls) => {
        const now = new Date();
        const startTime = getTimeAsDate(cls.startTime);
        const endTime = getTimeAsDate(cls.endTime);

        if (!startTime || !endTime) return { text: "N/A", color: "text-gray-400" };

        if (startTime <= now && endTime > now) {
            return { text: "Ongoing", color: "text-green-600 font-bold" };
        } else if (startTime > now) {
            const diffMs = startTime - now;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return {
                text: hours > 0 ? `${hours}h ${mins}m` : (mins > 0 ? `${mins}m` : 'Soon'),
                color: "text-sky-600 font-semibold"
            };
        } else {
            return { text: "Finished", color: "text-gray-400" };
        }
    };

    const nextClass = useMemo(() => {
        const now = new Date();
        const ongoing = todayClasses.find((cls) => {
            const startTime = getTimeAsDate(cls.startTime);
            const endTime = getTimeAsDate(cls.endTime);
            return startTime && endTime && startTime <= now && endTime > now;
        });

        if (ongoing) return ongoing;

        const upcoming = todayClasses.find((cls) => {
            const classTime = getTimeAsDate(cls.startTime);
            return classTime && classTime > now;
        });

        return upcoming;
    }, [todayClasses]);

    const nextClassStatus = nextClass ? getStatus(nextClass) : { text: "None", color: "text-gray-500" };
    const nextClassCountdown = nextClassStatus.text === "Ongoing" ? "LIVE" : nextClassStatus.text;


    return (
        <div className={CARD_CLASSES}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                    <FaCalendarAlt className={`text-2xl ${HEADER_ICON_COLOR} mr-3`} />
                    <div>
                        <h3 className={HEADER_TEXT_CLASSES}>Today's Schedule</h3>
                        <p className={SUBHEADER_TEXT_CLASSES}>{new Date().toDateString()}</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div>
                        <div className="text-sm text-gray-700">Next Class:</div>
                        <div className={`text-2xl font-extrabold ${nextClassCountdown === "LIVE" ? 'text-green-600' : ACCENT_COLOR_CLASSES}`}>
                            {nextClassCountdown}
                        </div>
                    </div>
                </div>
            </div>

            {todayClasses.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-500 text-lg font-light flex-grow flex items-center justify-center">
                    🎉 No classes scheduled today. Enjoy your break!
                </div>
            ) : (
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-2 flex-grow">
                    {todayClasses.map((cls, idx) => {
                        const status = getStatus(cls);
                        const isNext = nextClass?.startTime === cls.startTime && status.text !== "Finished";
                        return (
                            <li
                                key={idx}
                                className={`p-3 rounded-xl flex justify-between items-center border transition duration-150 ${isNext ? 'bg-sky-50 border-sky-300 shadow-md' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                            >
                                <div className='flex-1 pr-3'>
                                    <div className="font-semibold text-gray-800 text-base">{cls.subject}</div>
                                    <div className="text-xs text-gray-500 font-light mt-0.5">{cls.room}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-700 font-medium">
                                        {formatTime(cls.startTime)} <span className='text-gray-400'>-</span> {formatTime(cls.endTime)}
                                    </div>
                                    <div className={`text-xs mt-0.5 ${status.color}`}>
                                        {isNext && status.text === "Ongoing" ? "LIVE" : status.text}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            <button
                onClick={() => window.location.href = "#/Studenttimetable"}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
                View Full Timetable
            </button>
        </div>
    );
}

export const AnnouncementsCard = ({
    announcements,
    classes = [],
    onRefresh,
    refreshing = false,
}) => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <FaBell className="text-red-500 text-lg" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Announcements
                    </h3>
                    <p className="text-xs text-gray-500">
                        College & department updates
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                >
                    <FaSyncAlt
                        className={`text-gray-500 ${refreshing ? "animate-spin" : ""}`}
                    />
                </button>

                <Link
                    to="/announcement"
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
                >
                    View all
                </Link>
            </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
            {(announcements || []).length > 0 ? (
                <ul className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                    {announcements.slice(0, 6).map((a, i) => {
                        const target = getTargetLabel(a, classes);

                        return (
                            <motion.li
                                key={a.id || i}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.2 }}
                                className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:border-red-200 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {a.title}
                                    </p>

                                    <span
                                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${target.color}`}
                                    >
                                        {target.icon}
                                        {target.text}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">
                                    {a.message}
                                </p>

                                <p className="text-xs text-gray-400 mt-3">
                                    {formatdatetime(a.created_at)}
                                </p>
                            </motion.li>
                        );
                    })}
                </ul>
            ) : (
                <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-10">
                    No announcements right now
                </div>
            )}
        </div>
    </div>
);



export const AssignmentsCard = ({ assignments }) => (
    <div className={CARD_CLASSES}>
        <div className="flex items-center mb-6 border-b pb-3">
            <FaFileDownload className="text-2xl text-green-600 mr-3" />
            <h3 className={HEADER_TEXT_CLASSES}>Assignments & Due Dates</h3>
        </div>
        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2 flex-grow">
            {(assignments || []).slice(0, 5).map((a) => (
                <li key={a.id} className="p-3 rounded-xl bg-green-50 border-l-4 border-green-300 flex justify-between items-center transition duration-150 hover:bg-green-100 shadow-sm">
                    <div className='flex-1 pr-3'>
                        <div className="font-medium text-gray-800 text-sm">{a.title}</div>
                        <div className="text-xs text-gray-500 mt-1">Due: <span className="font-semibold text-green-700">{formatdatetime(a.due_date)}</span></div>
                    </div>
                    <div className={`text-sm font-bold ${a.status === "pending" ? "text-red-600" : "text-green-600"}`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </div>
                </li>
            ))}
        </ul>
        {(assignments || []).length === 0 && <p className="text-gray-500 text-sm p-4 text-center bg-gray-50 rounded-xl mt-3">No pending assignments.</p>}
    </div>
);

const FeesCard = ({ fees }) => {
    if (!fees) return <div className={CARD_CLASSES}><p className="text-center text-gray-500">Fees data loading...</p></div>;

    const statusColor =
        fees.balance > 0 ? "text-red-600 bg-red-50 border-red-200" :
            fees.payment_status === "Partial" ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                "text-green-600 bg-green-50 border-green-200";

    const balanceText = fees.balance > 0 ? "Outstanding" : "Zero Balance";

    return (
        <div className={CARD_CLASSES}>
            <div className="flex items-center mb-6 border-b pb-3">
                <FaMoneyBillAlt className="text-2xl text-teal-600 mr-3" />
                <h3 className={HEADER_TEXT_CLASSES}>Fee Status</h3>
            </div>

            <div className={`p-5 rounded-2xl border ${statusColor} text-center mb-6 shadow-lg`}>
                <div className="text-sm font-medium text-gray-600">{balanceText}</div>
                <div className="font-extrabold text-4xl sm:text-5xl my-1">
                    ₹{(fees.balance ?? 0).toLocaleString("en-IN")}
                </div>
                {/* <div className={`font-semibold text-sm mt-1 ${fees.balance > 0 ? "text-red-700" : "text-green-700"}`}>
                    {fees.payment_status || "N/A"}
                </div> */}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm flex-grow">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500">Total Paid</div>
                    <div className="font-bold text-lg text-teal-700 mt-1">
                        ₹{(fees.amount_paid ?? 0).toLocaleString("en-IN")}
                    </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500">Updated</div>
                    <div className="font-bold text-lg text-gray-800 mt-1">
                        {new Date(fees.updated_at).toLocaleDateString("en-IN")}
                    </div>
                </div>
            </div>

            {fees.remarks && fees.remarks.trim() && (
                <div className="mt-4 p-3 bg-gray-100 rounded-xl text-sm text-gray-700">
                    <span className="font-semibold text-gray-800">Note:</span> {fees.remarks}
                </div>
            )}

            {fees.balance > 0 && (
                <button
                    onClick={() =>
                        window.open(
                            "https://www.erpteamtrust.com/teamtrustonline/online/OnlinePaymentGateway.jsp",
                            "_blank"
                        )
                    }
                    className={`w-full mt-5 flex items-center justify-center py-2 rounded-xl font-medium shadow-md
                    bg-red-600 text-white hover:bg-red-700 transition`}
                >
                    Make Payment
                    <FaArrowRight className="ml-2 text-sm" />
                </button>
            )}


        </div>
    );
};



export default function StudentDashboard({
    profileData,
    profileCard,
    performance,
    timetableToday,
    assignments,
    fees,
    messMenu,
    token
}) {
    const [announcements, setAnnouncements] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setAnnouncements(data || []);
        } catch (err) {
            console.error(err);
            setAnnouncements([]);
        }
    };

    const refreshAnnouncements = async () => {
        try {
            setRefreshing(true);
            await fetchAnnouncements();
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gray-100 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tighter">
                    <span className={ACCENT_COLOR_CLASSES}>Student</span> dashboard
                </h1>

                <div className="mb-8">
                    {React.cloneElement(profileCard, {
                        className: `p-6 bg-white rounded-2xl border border-gray-100 shadow-xl transition duration-500 hover:shadow-2xl h-full flex flex-col ${profileCard.props.className}`
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                    {/* <div className="lg:col-span-2">
                        <TimetableCard timetableToday={timetableToday} />
                    </div> */}

                    <div className="lg:col-span-2">
                        <AttendanceCard profileData={profileData} token={token} />
                    </div>

                    <div className="lg:col-span-2">
                        <MessMenuCard messMenu={messMenu} isJain={profileData?.jain === 1} />
                    </div>

                    {/* <div className="lg:col-span-2">
                        <PerformanceCard performance={performance} />
                    </div> */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-3">
                        <AnnouncementsCard
                            announcements={announcements}
                            onRefresh={refreshAnnouncements}
                            refreshing={refreshing}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}