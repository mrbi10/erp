import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import { FaClock, FaUserClock, FaSyncAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function Late({ user }) {
  const [lateStudents, setLateStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const DEPT_MAP = {
    1: "CSE",
    2: "IT",
    3: "ADS",
    4: "CSBS",
    5: "ECE",
    6: "EEE",
    7: "MECH",
    8: "CIVIL",
  };

  const getOrdinalSuffix = (n) => {
    const j = n % 10,
      k = n % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const convertToRoman = (num) => {
    const romanMap = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV",
      5: "V",
      6: "VI",
      7: "VII",
      8: "VIII",
      9: "IX",
      10: "X",
    };
    return romanMap[num] || num;
  };

  // Fetch late entries
  const fetchLateStudents = async (showToast = false) => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/lateentry/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setLateStudents(data);
        if (showToast) {
          Swal.fire({
            title: "Updated!",
            text: "Late entries have been refreshed.",
            icon: "success",
            timer: 600,
            showConfirmButton: false,
            customClass: {
              confirmButton:
                "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded",
              cancelButton:
                "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded ml-2",
            },
            buttonsStyling: false,
          });
        }
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to load data",
          icon: "error",
          customClass: {
            confirmButton: "!bg-blue-600 hover:!bg-blue-700 text-white font-semibold px-4 py-2 rounded transition",
            cancelButton:
              "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded ml-2",
          },
          buttonsStyling: false,
        });
      }
    } catch (err) {
      console.error("Error fetching late students:", err);
      Swal.fire({
        title: "Error",
        text: "Server unreachable",
        icon: "error",
        customClass: {
          confirmButton:
            "bg-blue-600 text-white font-semibold px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-700 transition",
          cancelButton:
            "bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded ml-2 hover:bg-gray-300 transition",
        },
        buttonsStyling: false,
      });

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLateStudents();
    const interval = setInterval(fetchLateStudents, 20000);
    return () => clearInterval(interval);
  }, []);

  const filtered = lateStudents.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
      DEPT_MAP[s.dept_id]?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center text-gray-600 min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 mb-4"></div>
        <span>Loading late students...</span>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaUserClock className="text-blue-600" />
          Late Students
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Auto-refreshes every <strong>10s</strong>
          </span>
          <button
            onClick={() => fetchLateStudents(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold ${refreshing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } transition`}
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, reg no, or dept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:max-w-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-100">
        <table className="min-w-full border-collapse">
          <thead className="bg-blue-50 text-gray-700 text-sm uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Reg No</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Year</th>
              <th className="px-4 py-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center text-gray-500 py-8 italic"
                  >
                    No late students recorded today
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <motion.tr
                    key={s.roll_no}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="border-b hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {s.roll_no}
                    </td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">
                      {DEPT_MAP[s.dept_id] || "CSE"}
                    </td>
                    {/* <td className="px-4 py-3">
                      {s.year ? `${s.year}${getOrdinalSuffix(s.year)}` : "-"}
                    </td> */}
                    <td className="px-4 py-3">
                      {s.year ? `${convertToRoman(s.year)}` : "-"}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2 text-gray-700">
                      <FaClock className="text-blue-500" />
                      {s.entry_time ? s.entry_time.slice(0, 5) : "-"}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Count footer */}
      {filtered.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing <strong>{filtered.length}</strong> late{" "}
          {filtered.length === 1 ? "student" : "students"} today
        </div>
      )}
    </div>
  );
}
