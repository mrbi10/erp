import React, { useMemo } from 'react';
import { FaBook, FaCalendarAlt, FaClock, FaEnvelopeOpenText, FaFileDownload, FaGraduationCap, FaMoneyBillAlt, FaBell } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import { useState, useEffect } from "react";
import { FaUtensils } from "react-icons/fa";
import axios from "axios";

// ATTENDANCE CARD
const AttendanceCard = ({ attendance }) => {
    const pct = attendance?.totalPercentage ?? 0;
    const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";

    const barData = useMemo(() => ({
        labels: (attendance?.subjectWise || []).map((s) => s.name),
        datasets: [
            {
                label: "Attendance %",
                data: (attendance?.subjectWise || []).map((s) => s.percent),
                backgroundColor: "#0ea5e9", // Tailwind sky-500
            },
        ],
    }), [attendance]);

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <FaClock className="text-2xl text-sky-600 mr-3" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Attendance Overview</h3>
                        <p className="text-sm text-gray-600">Subject-wise and overall record</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-white font-bold text-lg ${color}`}>{pct}%</div>
                    <div className="text-xs text-gray-500">Overall</div>
                </div>
            </div>

            <div className="mb-4 h-48">
                <Bar
                    data={barData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { suggestedMin: 0, suggestedMax: 100, ticks: { callback: (val) => val + "%" } },
                            x: { grid: { display: false } }
                        },
                    }}
                />
            </div>

            <div>
                <h4 className="font-semibold text-gray-700 mb-2 border-t pt-2">Recent Attendance</h4>
                <ul className="space-y-2 max-h-36 overflow-y-auto">
                    {(attendance?.recent || []).slice(0, 5).map((r, idx) => (
                        <li key={idx} className={`p-2 rounded flex justify-between items-center transition duration-150 ${r.status === "Present" ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"}`}>
                            <span className="text-sm">{new Date(r.date).toLocaleDateString()}</span>
                            <span className={`${r.status === "Present" ? "text-green-700" : "text-red-700"} font-semibold text-sm`}>{r.status}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const MessMenuCard = ({ messMenu, isJain }) => {
    console.log("Rendering MessMenuCard with isJain:", messMenu, isJain);
    const [selectedDay, setSelectedDay] = useState(
        new Date().toLocaleDateString("en-US", { weekday: "long" })
    );

    if (!messMenu) return <div className="p-6 bg-white rounded-xl shadow-lg">Loading menu...</div>;

    if (!Array.isArray(messMenu) || messMenu.length === 0) {
        return <div className="p-6 bg-white rounded-xl shadow-lg">Loading menu...</div>;
    }

    const selectedMenu = messMenu.find((m) => m.day === selectedDay);
    const menu = isJain ? selectedMenu?.jain : selectedMenu?.non_jain;

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <FaUtensils className="text-2xl text-sky-600 mr-3" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isJain ? "Jain Mess Menu" : "Non-Jain Mess Menu"}
                        </h3>
                        <p className="text-sm text-gray-600">Select day to view menu</p>
                    </div>
                </div>
                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    {messMenu.map((m, idx) => (
                        <option key={idx} value={m.day}>{m.day}</option>
                    ))}
                </select>
            </div>

            {!menu ? (
                <p className="text-gray-500 italic">Menu not available</p>
            ) : (
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    {Object.entries(menu).map(([key, val], idx) =>
                        val ? (
                            <div key={idx} className="p-2 rounded-lg bg-gray-50 hover:bg-sky-50 transition duration-150">
                                <span className="font-semibold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                                <span className="text-gray-800">{val}</span>
                            </div>
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
};




const PerformanceCard = ({ performance }) => {
    const lineData = useMemo(() => ({
        labels: (performance?.subjects || []).map((s) => s.name),
        datasets: [
            {
                label: "Marks",
                data: (performance?.subjects || []).map((s) => s.marks),
                fill: false,
                borderColor: '#1d4ed8', 
                tension: 0.1,
            },
        ],
    }), [performance]);

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <FaGraduationCap className="text-2xl text-sky-600 mr-3" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Academic Performance</h3>
                        <p className="text-sm text-gray-600">Latest CGPA and subject scores</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-extrabold text-blue-700">{performance.cgpa}</div>
                    <div className="text-xs text-gray-500">Latest CGPA</div>
                </div>
            </div>

            <div className="mb-4 h-48">
                <Line
                    data={lineData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { suggestedMin: 0, suggestedMax: 100 },
                            x: { grid: { display: false } }
                        }
                    }}
                />
            </div>

            <div>
                <h4 className="font-semibold text-gray-700 mb-2 border-t pt-2">Semester Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-blue-50 rounded">Semester GPA: <span className="font-bold text-blue-800">{performance.semesterGpa}</span></div>
                    <div className="p-2 bg-blue-50 rounded">Class Rank: <span className="font-bold text-blue-800">{performance.ranking}</span></div>
                </div>

                <ul className="mt-4 space-y-2">
                    {(performance?.subjects || []).map((s, idx) => (
                        <li key={idx} className="flex justify-between p-2 bg-gray-50 rounded transition duration-150 hover:bg-gray-100">
                            <div>
                                <div className="font-medium">{s.name}</div>
                                <div className="text-xs text-gray-500">Grade: <span className="font-semibold text-gray-700">{s.grade}</span></div>
                            </div>
                            <div className="text-right font-bold text-gray-800">{s.marks}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const formatdatetime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        weekday: "short",
    });
}


const TimetableCard = ({ timetableToday }) => {
    console.log("Rendering TimetableCard with timetableToday:", timetableToday);
    const todayClasses = timetableToday || [];

    const getTimeAsDate = (timeString) => {
        if (!timeString) return null;
        const [h, m, s] = timeString.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, s, 0);
        return date;
    };

    const nextClass = useMemo(() => {
        const now = new Date();
        const upcoming = todayClasses.find((cls) => {
            const classTime = getTimeAsDate(cls.startTime);
            return classTime && classTime > now;
        });

        if (!upcoming) {
            return todayClasses.find((cls) => {
                const startTime = getTimeAsDate(cls.startTime);
                const endTime = getTimeAsDate(cls.endTime);
                return startTime && endTime && startTime <= now && endTime > now;
            });
        }
        return upcoming;
    }, [todayClasses]);

    const formatTime = (time) => {
        const [h, m] = time.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${m} ${ampm}`;
    };

    const getStatus = (cls) => {
        const now = new Date();
        const startTime = getTimeAsDate(cls.startTime);
        const endTime = getTimeAsDate(cls.endTime);

        if (!startTime || !endTime) return "N/A";

        if (startTime <= now && endTime > now) {
            return { text: "Ongoing", color: "text-green-600 font-bold" };
        } else if (startTime > now) {
            const diffMs = startTime - now;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return { text: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`, color: "text-blue-600 font-medium" };
        } else {
            return { text: "Finished", color: "text-gray-400" };
        }
    };

    const nextClassCountdown = useMemo(() => {
        if (!nextClass || getStatus(nextClass).text === "Ongoing") return "Now";
        if (getStatus(nextClass).text === "Finished") return "N/A";
        return getStatus(nextClass).text;
    }, [nextClass]);

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <FaCalendarAlt className="text-2xl text-sky-600 mr-3" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Today's Timetable</h3>
                        <p className="text-sm text-gray-600">{new Date().toDateString()}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-700">
                        Next Class: <span className="font-bold text-lg text-blue-700">{nextClassCountdown}</span>
                    </div>
                </div>
            </div>

            {todayClasses.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
                    🎉 No classes scheduled today. Enjoy!
                </div>
            ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {todayClasses.map((cls, idx) => {
                        const status = getStatus(cls);
                        const isNext = nextClass?.startTime === cls.startTime && status.text !== "Finished";
                        return (
                            <li
                                key={idx}
                                className={`p-3 rounded flex justify-between items-center border ${isNext ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'} transition duration-150 hover:shadow-md`}
                            >
                                <div>
                                    <div className="font-semibold text-gray-800">{cls.subject}</div>
                                    <div className="text-xs text-gray-500">{cls.room}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-700 font-mono">
                                        {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                    </div>
                                    <div className={`text-xs ${status.color}`}>
                                        {isNext && status.text === "Ongoing" ? "LIVE" : status.text}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );

}



// ANNOUNCEMENTS CARD


export const AnnouncementsCard = ({ announcements }) => (
    <div className="p-6 bg-white rounded-xl shadow-lg">
        <div className="flex items-center mb-4 border-b pb-2">
            <FaBell className="text-2xl text-red-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-800">Latest Announcements</h3>
        </div>
        <ul className="space-y-3 max-h-64 overflow-y-auto">
            {(announcements || []).slice(0, 5).map((a) => (
                <li key={a.id || a.title} className="p-3 bg-red-50 rounded border-l-4 border-red-300 transition duration-150 hover:bg-red-100">
                    <div className="flex justify-between items-start">
                        <div className="pr-2">
                            <div className="font-semibold text-red-800">{a.title}</div>
                            <div className="text-sm mt-2 text-gray-700">{a.message}</div>
                            <div className="text-xs text-red-500 mt-1">{formatdatetime(a.created_at)}</div>
                        </div>
                        <div>
                            {/* <button className="text-xs underline text-red-600 hover:text-red-800">View</button> */}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
        {(announcements || []).length === 0 && <p className="text-gray-500 text-sm p-2 text-center">No new announcements.</p>}
    </div>
);

// ASSIGNMENTS CARD
export const AssignmentsCard = ({ assignments }) => (
    <div className="p-6 bg-white rounded-xl shadow-lg">
        <div className="flex items-center mb-4 border-b pb-2">
            <FaFileDownload className="text-2xl text-green-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-800">Assignments & Due Dates</h3>
        </div>
        <ul className="space-y-3 max-h-64 overflow-y-auto">
            {(assignments || []).slice(0, 5).map((a) => (
                <li key={a.id} className="p-3 rounded bg-green-50 border-l-4 border-green-300 flex justify-between items-center transition duration-150 hover:bg-green-100">
                    <div>
                        <div className="font-medium text-gray-800">{a.title}</div>
                        <div className="text-xs text-gray-500">Due: <span className="font-semibold text-green-700">{formatdatetime(a.due_date)}</span></div>
                    </div>
                    <div className={`text-sm font-semibold ${a.status === "pending" ? "text-red-600" : "text-green-600"}`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </div>
                </li>
            ))}
        </ul>
        {(assignments || []).length === 0 && <p className="text-gray-500 text-sm p-2 text-center">No pending assignments.</p>}
    </div>
);

// FEES CARD
const FeesCard = ({ fees }) => {
  if (!fees) return null;

  return (
    <div className="p-5 sm:p-6 bg-white rounded-xl shadow-lg w-full max-w-md sm:max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center mb-4 border-b pb-2">
        <FaMoneyBillAlt className="text-2xl text-teal-600 mr-3" />
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Fee Status</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 text-center divide-y sm:divide-y-0 sm:divide-x">
        <div className="py-2 sm:py-0">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="font-bold text-xl sm:text-2xl text-teal-700">
            ₹{(fees.amount_paid ?? 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="py-2 sm:py-0 px-0 sm:px-4">
          <div className="text-sm text-gray-500">Balance</div>
          <div
            className={`font-bold text-xl sm:text-2xl ${
              fees.balance > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            ₹{(fees.balance ?? 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="py-2 sm:py-0">
          <div className="text-sm text-gray-500">Status</div>
          <div
            className={`font-semibold ${
              fees.payment_status === "Paid"
                ? "text-green-600"
                : fees.payment_status === "Partial"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {fees.payment_status || "N/A"}
          </div>
        </div>
      </div>

      {/* Remarks */}
      {fees.remarks && fees.remarks.trim() && (
        <div className="mt-4 text-sm text-gray-600">
          <p className="mt-1 break-words">
            <span className="font-semibold text-gray-700">Remarks:</span>{" "}
            {fees.remarks}
          </p>
        </div>
      )}

      {/* Updated Date */}
      <div className="mt-3 text-xs text-gray-400 text-right">
        Updated: {new Date(fees.updated_at).toLocaleDateString("en-IN")}
      </div>
    </div>
  );
};


// LIBRARY CARD
// const LibraryCard = ({ library }) => (
//     <div className="p-6 bg-white rounded-xl shadow-lg">
//         <div className="flex items-center mb-4 border-b pb-2">
//             <FaBook className="text-2xl text-purple-600 mr-3" />
//             <h3 className="text-xl font-bold text-gray-800">Library Summary</h3>
//         </div>
//         <div className="space-y-3">
//             {(library?.borrowed || []).map((b, idx) => (
//                 <div key={idx} className="p-3 bg-purple-50 rounded flex justify-between items-center border-l-4 border-purple-300 transition duration-150 hover:bg-purple-100">
//                     <div>
//                         <div className="font-medium text-gray-800">{b.title}</div>
//                         <div className="text-xs text-gray-500">Due: <span className="font-semibold">{b.dueDate}</span></div>
//                     </div>
//                     <div className="text-sm font-semibold text-red-600">Fines: ₹{(library?.fines ?? 0).toLocaleString('en-IN')}</div>
//                 </div>
//             ))}
//             {(library?.borrowed || []).length === 0 && <p className="text-gray-500 text-sm p-2 text-center">No books currently borrowed.</p>}
//         </div>
//     </div>
// );


// Main Student Dashboard Component

export default function StudentDashboard({
    profileData,
    profileCard,
    attendanceSummary,
    performance,
    timetableToday,
    announcements,
    assignments,
    fees,
    library,
    messMenu
}) {
    console.log("Rendering StudentDashboard with props:", {
        profileData,
        attendanceSummary,
    });
    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Student Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Profile */}
                <div className="lg:col-span-4">{profileCard}</div>

                {/* Timetable */}
                <div className="lg:col-span-2">
                    <TimetableCard timetableToday={timetableToday} />
                </div>

                {/* Mess Menu */}
                <div className="lg:col-span-2">
                    <MessMenuCard messMenu={messMenu} isJain={profileData?.jain === 1} />
                </div>

                {/* Attendance */}
                {/* <div className="lg:col-span-2">
                    <AttendanceCard attendance={attendanceSummary} />
                </div> */}

                {/* Performance */}
                <div className="lg:col-span-2">
                    <PerformanceCard performance={performance} />
                </div>

                {/* Announcements */}
                <div className="lg:col-span-2">
                    <AnnouncementsCard announcements={announcements} />
                </div>

                {/* Assignments */}
                <div className="lg:col-span-2">
                    <AssignmentsCard assignments={assignments} />
                </div>

                {/* Fees */}
                <div className="lg:col-span-2">
                    <FeesCard fees={fees} />
                </div>

                {/* Library */}
                {/* <div className="lg:col-span-2">
                    <LibraryCard library={library} />
                </div> */}
            </div>
        </div>
    );
}
