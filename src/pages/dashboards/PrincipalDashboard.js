import React, { useEffect, useState } from "react";
import { FaChartLine, FaUsers, FaChalkboardTeacher, FaGraduationCap } from "react-icons/fa";
import { AnnouncementsCard } from "./StudentDashboard";
import { BASE_URL } from "../../constants/API";
import Select from "react-select";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// -----------------------------
// Admin Stats Card
// -----------------------------
const AdminStatsCard = ({ overview }) => {
  const total = overview?.total_students || 0;
  const present = overview?.present_today || 0;
  const absent = total - present;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  const COLORS =
    percentage >= 85
      ? ["#22c55e", "#dcfce7"] // green
      : percentage >= 70
        ? ["#f59e0b", "#fef3c7"] // orange
        : ["#ef4444", "#fee2e2"]; // red

  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  return (
    <div className="p-5 sm:p-6 bg-white rounded-xl shadow-md sm:shadow-lg transition duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex items-center mb-4 border-b pb-2">
        <FaChartLine className="text-xl sm:text-2xl text-red-600 mr-2 sm:mr-3" />
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          Attendance Overview
        </h3>
      </div>

      {/* Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
        {/* Text Stats */}
        <div className="space-y-3 text-center lg:text-left">
          <div>
            <div className="text-xs sm:text-sm text-gray-500">
              Total Students
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700">
              {total}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-500">
              Present Today
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700">
              {present}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {percentage}% Attendance Today
          </div>
        </div>

        {/* Additional Sub Stats */}
        {/* Sub stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-500">Jain</div>
            <div className="text-lg font-bold text-green-700">
              {overview?.jain_students?.present}/{overview?.jain_students?.total}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500">Hostel</div>
            <div className="text-lg font-bold text-blue-700">
              {overview?.hostel_students?.present}/{overview?.hostel_students?.total}
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-xs text-gray-500">College Bus</div>
            <div className="text-lg font-bold text-yellow-700">
              {overview?.bus_students?.present}/{overview?.bus_students?.total}
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>


          </ResponsiveContainer>

        </div>
      </div>
    </div>
  );
};

// -----------------------------
// Admin Dashboard
// -----------------------------
export default function AdminDashboard({ profileCard, announcements }) {
  const [overview, setOverview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch class list
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error("Error fetching class list:", err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch overview stats
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const url = selectedClass
          ? `${BASE_URL}/admin/overview?classId=${selectedClass}`
          : `${BASE_URL}/admin/overview`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOverview(data);
      } catch (err) {
        console.error("Error fetching admin overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [selectedClass]);

  const DEPT_MAP = {
    1: "CSE",
    2: "ECE",
    3: "EEE",
    4: "MECH",
    5: "CIVIL",
    6: "IT",
  };




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
          Loading Principal Dashboard...
        </motion.h2>
      </div>
    );
  }


  return (


    <div className="p-6 min-h-screen bg-gray-50">
      {/* Global Student Search */}
      <div className="w-full flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search student by name or reg no…"
          className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
          onChange={(e) => console.log("search", e.target.value)}
        />
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Administrator Dashboard
      </h1>

      {/* Quick Actions */}
    


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile */}
        <div className="lg:col-span-1">{profileCard}</div>

        {/* Overview + Class Filter */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Filter by Class</h2>
            <div className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h2 className="font-semibold text-gray-700">Filter by Class</h2>
                <div className="w-full sm:w-64">
                  <Select
                    options={[
                      { value: "", label: "All Classes" },
                      ...classes.map((c) => ({
                        value: c.class_id,
                        label: `Year ${c.year} - ${DEPT_MAP[c.dept_id] || "CSE"}`,
                      })),
                    ]}
                    value={
                      selectedClass
                        ? {
                          value: selectedClass,
                          label:
                            classes.find((cls) => cls.class_id === selectedClass)?.year
                              ? `Year ${classes.find((cls) => cls.class_id === selectedClass)
                                ?.year
                              } - ${DEPT_MAP[
                              classes.find((cls) => cls.class_id === selectedClass)
                                ?.dept_id
                              ] || "CSE"
                              }`
                              : "Select Class",
                        }
                        : { value: "", label: "All Classes" }
                    }
                    onChange={(option) => setSelectedClass(option?.value || "")}
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        borderColor: "#d1d5db",
                        boxShadow: "none",
                        "&:hover": { borderColor: "#9ca3af" },
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? "#f3f4f6" : "white",
                        color: "#111827",
                      }),
                    }}
                    isSearchable
                  />
                </div>
              </div>
            </div>

          </div>

          <AdminStatsCard overview={overview} />
        </div>

        {/* Announcements */}
        <div className="lg:col-span-2">
          <AnnouncementsCard announcements={announcements} />
        </div>

        {/* Admin Tools */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Link
            to="/Erp_Mnmjec/faculty"
            className="p-6 bg-blue-100 rounded-xl shadow-md flex flex-col items-center justify-center hover:bg-blue-200 transition transform hover:scale-105 cursor-pointer"
          >
            <FaChalkboardTeacher className="text-4xl text-blue-700 mb-2" />
            <span className="font-semibold text-blue-800">Manage Faculty</span>
          </Link>

          <div className="p-6 bg-purple-100 rounded-xl shadow-md flex flex-col items-center justify-center hover:bg-purple-200 transition transform hover:scale-105 cursor-pointer">
            <FaGraduationCap className="text-4xl text-purple-700 mb-2" />
            <span className="font-semibold text-purple-800">System Setup</span>
          </div>
        </div>


      </div>
    </div>
  );
}
