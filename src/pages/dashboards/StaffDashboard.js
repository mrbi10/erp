import React, { useEffect, useState } from "react";
import { FaUserGraduate, FaSpinner, FaChartBar } from "react-icons/fa";
import { AssignmentsCard, AnnouncementsCard } from "./StudentDashboard";
import { BASE_URL } from "../../constants/API";
import {motion} from "framer-motion";

const ClassSummaryCard = ({ classSummary }) => (
  <div className="p-5 sm:p-6 bg-white rounded-xl shadow-md sm:shadow-lg transition duration-300 hover:shadow-2xl">
    {/* Header */}
    <div className="flex items-center mb-4 border-b pb-2">
      <FaUserGraduate className="text-xl sm:text-2xl text-blue-600 mr-2 sm:mr-3" />
      <h3 className="text-lg sm:text-xl font-bold text-gray-800">Class Overview</h3>
    </div>

    {/* Summary Grid */}
    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
        <div className="text-xs sm:text-sm text-gray-500">Total Students</div>
        <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">
          {classSummary?.total_students ?? "-"}
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
        <div className="text-xs sm:text-sm text-gray-500">Avg. Attendance</div>
        <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">
          {classSummary?.overall_attendance_percentage ?? "-"}%
        </div>
      </div>
    </div>

    {/* Subjects Handled */}
    {classSummary?.subjectsHandled?.length > 0 && (
      <div className="mt-4 border-t pt-3 sm:pt-4">
        <div className="flex flex-wrap gap-2">
          {classSummary.subjectsHandled.map((subject, index) => (
            <span
              key={index}
              className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm bg-purple-100 text-purple-800 rounded-full font-medium"
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default function StaffDashboard({
  profileCard,
  assignments,
  announcements,
}) {
  const [classSummary, setClassSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/attendance/classsummary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClassSummary(data);
      } catch (err) {
        console.error("Error fetching class summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClassSummary();
  }, []);

 if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-4"
        >
          <FaSpinner className="text-5xl text-blue-600 dark:text-blue-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          className="text-lg font-semibold tracking-wide"
        >
          Loading Staff Dashboard...
        </motion.h2>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Staff Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-3">{profileCard}</div>

        {/* Class Summary */}
        <div className="lg:col-span-3">
          <ClassSummaryCard classSummary={classSummary} />
        </div>

        {/* Announcements + Assignments Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:col-span-3">
          {/* Assignments */}
          {/* <div className="col-span-1 lg:col-span-1">
      <AssignmentsCard assignments={assignments} />
    </div> */}

          {/* Announcements */}
          <div className="lg:col-span-3">
            <AnnouncementsCard announcements={announcements} />
          </div>
        </div>

        {/* Optional Info / Placeholder */}
        {/* <div className="p-6 bg-white rounded-xl shadow-lg text-center text-gray-500 lg:col-span-3">
    <FaChartBar className="inline text-4xl mb-2 text-gray-400" />
    <p>
      Access attendance logging, grade submission, and student reports from the sidebar.
    </p>
  </div> */}
      </div>

    </div>
  );
}
