import React, { useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPeopleGroup, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import {
  FaPlusCircle,
  FaEye,
  FaUsers,
  FaUserTie,
  FaUniversity,
  FaChartLine,
  FaCertificate,
  FaArrowRight,
  FaShapes,
  FaLaptopCode
} from "react-icons/fa";

// ---------------------------
// Components
// ---------------------------

// 1. Stat/Insight Pill (Reused from Style Guide)
const InsightPill = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
    className="bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-5 min-w-[200px] hover:shadow-lg transition-all duration-300 group"
  >
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.split("-")[1]}-600 group-hover:scale-110 transition-transform`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
    </div>
  </motion.div>
);

// 2. Action Card (Apple-style Dashboard Card)
const ActionCard = ({ label, subtext, to, icon: Icon, color, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      onClick={() => navigate(to)}
      className="group relative overflow-hidden bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Background Decor */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-5 group-hover:scale-150 transition-transform duration-500`} />

      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 text-${color.split("-")[1]}-600 flex items-center justify-center mb-6 text-2xl group-hover:rotate-6 transition-transform`}>
          <Icon />
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
          {label}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          {subtext}
        </p>

        <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors gap-2">
          <span>Proceed</span>
          <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

// ---------------------------
// Main Layout Component
// ---------------------------

export default function ProfileHub({ user }) {
  const location = useLocation();
  const basePath = "/profilehub";

  // Check if we are on the main dashboard view
  const isDashboardView = location.pathname === basePath || location.pathname === basePath + "/";

  // --- CONFIGURATION ---

  const roleCards = useMemo(() => ({
    Principal: [
      {
        label: "Institution Overview",
        subtext: "View comprehensive activity reports across all departments.",
        to: `${basePath}/view?scope=all`,
        icon: FaUniversity,
        color: "bg-indigo-500" // Indigo theme
      },
    ],
    HOD: [
      {
        label: "Department Review",
        subtext: "Monitor and verify student activities within your department.",
        to: `${basePath}/view?scope=dept`,
        icon: FaUsers,
        color: "bg-emerald-500" // Emerald theme
      },
    ],
    Staff: [
      {
        label: "Class Verification",
        subtext: "Verify proofs submitted by students in your assigned classes.",
        to: `${basePath}/view`,
        icon: FaEye,
        color: "bg-blue-500" // Blue theme
      },
    ],
    CA: [
      {
        label: "Class Portfolio",
        subtext: "Track the progress of your Students and approve entries.",
        to: `${basePath}/view`,
        icon: FaArrowRight,
        color: "bg-purple-500" 
      },
    ],
    student: [
      {
        label: "Add Activity",
        subtext: "Submit a new certification, project, or achievement.",
        to: `${basePath}/add`,
        icon: FaPlusCircle,
        color: "bg-blue-500"
      },
      {
        label: "My Portfolio",
        subtext: "View status of submitted activities and history.",
        to: `${basePath}/activities`,
        icon: FaCertificate,
        color: "bg-orange-500"
      },
    ],
  }), [basePath]);

  const cards = roleCards[user?.role] || roleCards.Staff;



  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">

      {/* Conditional Rendering: Dashboard vs Outlet */}
      {isDashboardView ? (
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-10">

          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faUserGraduate}
                  className="text-emerald-500 text-3xl"
                />
                Profile Hub
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl">
                Welcome back, <span className="font-semibold text-slate-700">{user?.name || "User"}</span>.
                Manage your achievements.
              </p>
            </motion.div>

            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-slate-600 shadow-sm flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {user?.role || "Guest"} Portal
            </motion.span>
          </div>

          {/* 3. Action Grid */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Actions</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card, index) => (
                <ActionCard
                  key={index}
                  index={index}
                  label={card.label}
                  subtext={card.subtext}
                  to={card.to}
                  icon={card.icon}
                  color={card.color}
                />
              ))}
            </div>
          </section>

        </main>
      ) : (
        /* Full Page Sub-route Render with Animation */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-screen"
        >
          <Outlet />
        </motion.div>
      )}
    </div>
  );
}