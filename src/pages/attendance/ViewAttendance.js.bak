import React, { useEffect, useState } from "react";
import { BASE_URL } from '../../constants/API';
import axios from "axios";
import { FaUserGraduate, FaClipboardList, FaCheckCircle, FaTimesCircle, FaPercentage, FaAward, FaCalendarAlt } from 'react-icons/fa';
// import '../../styles/attendance.css';

export default function StudentAttendance() {
  const [student, setStudent] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [datewiseAttendance, setDatewiseAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // Utility function to decode JWT payload (kept as is)
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const studentData = decodeToken(token);
    if (!studentData) {
      setLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        // Ensure studentData.roll_no is correctly mapped to the backend expectation
        const res = await axios.get(
          `${BASE_URL}/attendance/student/${studentData.roll_no}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const attendance = Array.isArray(res.data) ? res.data : [];

        // --- Core Concept Logic ---
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === "Present").length;
        const absentCount = attendance.filter(a => a.status === "Absent").length;
        const percentage = totalClasses ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

        setAttendanceSummary({
          total: totalClasses,
          present: presentCount,
          absent: absentCount,
          percentage
        });

        const datewise = attendance
          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort newest first
          .map(a => ({
            date: new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: a.status
          }));
        setDatewiseAttendance(datewise);

        setStudent({ name: studentData.name, email: studentData.email, roll_no: studentData.roll_no });
        // --- End Core Concept Logic ---

      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [token]);


  // --- Streak Calculation Logic (Kept as is) ---
  let streak = 0, maxStreak = 0;
  for (let a of datewiseAttendance) {
    if (a.status === "Present") {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  }
  // --- End Streak Calculation Logic ---
  
  // Custom Card Data Structure with Rich Styling
  const cardData = [
    { title: "Total Classes", value: attendanceSummary?.total ?? 0, icon: FaClipboardList, color: "bg-indigo-600", iconColor: "text-indigo-200" },
    { title: "Present Days", value: attendanceSummary?.present ?? 0, icon: FaCheckCircle, color: "bg-green-600", iconColor: "text-green-200" },
    { title: "Absent Days", value: attendanceSummary?.absent ?? 0, icon: FaTimesCircle, color: "bg-red-600", iconColor: "text-red-200" },
    { 
      title: "Attendance %", 
      value: `${attendanceSummary?.percentage ?? 0}%`, 
      icon: FaPercentage, 
      // Dynamic Color based on percentage
      color: (attendanceSummary?.percentage >= 75) ? "bg-sky-600" : (attendanceSummary?.percentage >= 50 ? "bg-yellow-600" : "bg-red-600"),
      iconColor: "text-sky-200"
    },
    { title: "Max Present Streak", value: maxStreak, icon: FaAward, color: "bg-purple-600", iconColor: "text-purple-200" }
  ];

  // --- Render Logic ---

  if (loading) return (
    <div className="p-10 text-center text-xl font-semibold text-blue-600">
      <FaCalendarAlt className="inline mr-2 animate-pulse" /> Loading attendance records...
    </div>
  );
  
  if (!student) return (
    <div className="p-10 text-center text-xl font-semibold text-red-600 bg-red-50 rounded-lg m-5">
      <FaTimesCircle className="inline mr-2" /> Authentication failed. Please log in again.
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="mb-8 border-b-4 border-indigo-500 pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
          <FaUserGraduate className="mr-4 text-indigo-600" /> 
          Attendance Report
        </h1>
        <p className="text-lg text-gray-600 mt-1 ml-10">Welcome back, <span className="font-semibold text-indigo-700">{student.name}</span> (Roll No: {student.roll_no})</p>
      </div>

      {/* Summary Cards Grid */}
      <h2 className="text-2xl font-bold text-gray-700 mb-5 border-l-4 border-sky-500 pl-3">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        {cardData.map((card, idx) => (
          <div key={idx} className={`p-6 rounded-xl shadow-2xl text-white transform transition duration-500 hover:scale-[1.03] ${card.color}`}>
            <div className="flex justify-between items-start">
              <card.icon className={`text-4xl ${card.iconColor}`} />
              <div className="text-right">
                <p className="text-4xl font-extrabold">{card.value}</p>
              </div>
            </div>
            <h4 className="text-sm font-light mt-3 border-t border-white border-opacity-30 pt-2">{card.title}</h4>
          </div>
        ))}
      </div>

      {/* Date-wise Attendance Table */}
      <div className="bg-white p-6 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 border-l-4 border-green-500 pl-3">Detailed Day History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tl-lg">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tr-lg">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datewiseAttendance.map((record, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span 
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-md ${
                        record.status === "Present" 
                          ? "bg-green-100 text-green-800 border border-green-300" 
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {datewiseAttendance.length === 0 && (
                <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500">No attendance records found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}