import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { FaAward, FaMedal } from "react-icons/fa";


const DEPT_MAP = {
  1: "CSE",
  2: "ECE",
  3: "EEE",
  4: "MECH",
  5: "CIVIL",
  6: "IT",
};

export default function TopPerformers() {
  const [toppers, setToppers] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchToppers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/marks/top-performers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setToppers(data.students);
        else Swal.fire("Error", "Failed to fetch top performers", "error");
      } catch (err) {
        Swal.fire("Error", "Unable to load toppers", "error");
      }
    };
    fetchToppers();
  }, [token]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaAward className="text-yellow-500" /> College Top Performers
      </h1>

      {toppers.length === 0 ? (
        <div className="text-gray-500 text-center mt-10">
          No top performers data available yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-yellow-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 border text-center">Rank</th>
                <th className="px-4 py-3 border text-left">Name</th>
                <th className="px-4 py-3 border text-left">Department</th>
                <th className="px-4 py-3 border text-center">Average Mark</th>
                <th className="px-4 py-3 border text-center">Exam Type</th>
              </tr>
            </thead>
            <tbody>
              {toppers.map((t, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition border-b last:border-none"
                >
                  <td className="px-4 py-3 text-center font-semibold text-gray-800 flex justify-center items-center gap-2">
                    {i < 3 ? (
                      <FaMedal
                        className={`${
                          i === 0
                            ? "text-yellow-500"
                            : i === 1
                            ? "text-gray-400"
                            : "text-amber-700"
                        }`}
                      />
                    ) : null}
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">{DEPT_MAP[t.department_name]}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-700">
                     {Number(t.avg_mark || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">{t.exam_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
