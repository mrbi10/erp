import React, { useEffect, useState } from "react";
import { FaUserGraduate, FaSpinner, FaChartBar, FaUsers, FaBookReader } from "react-icons/fa";
import { AssignmentsCard, AnnouncementsCard } from "./StudentDashboard";
import { BASE_URL } from "../../constants/API";
import { motion } from "framer-motion";

// --- Design Tokens (Consistent Styling) ---
const CARD_CLASSES = "p-6 bg-white rounded-2xl border border-gray-100 shadow-xl transition duration-500 hover:shadow-2xl hover:border-sky-200 h-full flex flex-col";
const HEADER_ICON_COLOR = "text-sky-600";
const HEADER_TEXT_CLASSES = "text-xl font-semibold text-gray-800 tracking-tight";
const SUBHEADER_TEXT_CLASSES = "text-sm text-gray-500 font-light";
const ACCENT_COLOR_CLASSES = "text-sky-600 font-bold";
const PRIMARY_BUTTON_CLASSES = "px-4 py-2 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition duration-300 shadow-md";


const getYearLabel = (id) => {
  if (!id) return "";
  const suffix = ["th", "st", "nd", "rd"];
  const mod100 = id % 100;
  const mod10 = id % 10;

  const correctSuffix =
    mod10 === 1 && mod100 !== 11
      ? "st"
      : mod10 === 2 && mod100 !== 12
        ? "nd"
        : mod10 === 3 && mod100 !== 13
          ? "rd"
          : "th";

  return `${id}${correctSuffix} Year`;
};

const ClassSummaryCard = ({ classSummary }) => (


  <div className={CARD_CLASSES}>

    <div className="flex items-center mb-6 border-b pb-3">
      <FaUsers className={`text-2xl ${HEADER_ICON_COLOR} mr-3`} />
      <div>
        <h3 className={HEADER_TEXT_CLASSES}>Class Overview</h3>
        <p className={SUBHEADER_TEXT_CLASSES}>
          {getYearLabel(classSummary[0]?.class_id)}
        </p>
      </div>
    </div>


    <div className="grid grid-cols-2 gap-4 text-center mb-6">
      <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
        <div className="text-sm text-gray-600 font-medium">Total Students</div>
        <div className="text-3xl font-extrabold text-sky-700 mt-1">
          {classSummary[0]?.total_students ?? "-"}
          {console.log("Class Summary Data 22222222:", classSummary?.total_students)}
        </div>
      </div>

      <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
        <div className="text-sm text-gray-600 font-medium">Avg. Attendance</div>
        <div className="text-3xl font-extrabold text-sky-700 mt-1">
          {classSummary[0]?.overall_attendance_percentage ?? "-"}%
        </div>
      </div>
    </div>

    {classSummary[0]?.subjectsHandled?.length > 0 && (
      <div className="mt-auto border-t pt-4">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
          <FaBookReader className="mr-2 text-purple-500" /> Subjects Handled
        </h4>
        <div className="flex flex-wrap gap-2">
          {classSummary[0].subjectsHandled.map((subject, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-200"
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="mb-6"
        >
          <FaSpinner className="text-6xl text-sky-600 shadow-lg rounded-full" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="text-xl font-light text-gray-700 tracking-wide"
        >
          Synchronizing Staff Dashboard...
        </motion.h2>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tighter">
        <span className={ACCENT_COLOR_CLASSES}>Faculty</span> dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          {profileCard}
        </div>

        <div className="lg:col-span-3">
          <ClassSummaryCard classSummary={classSummary} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:col-span-3">
          {/* <div className="md:col-span-1">
            <AssignmentsCard assignments={assignments} />
          </div> */}

          <div className="md:col-span-2">
            <AnnouncementsCard announcements={announcements} />
          </div>
        </div>


      </div>

    </div>
  );
}