import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { FaUniversity, FaChartLine, FaPercentage } from "react-icons/fa";


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

export default function PrincipalOverview() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${BASE_URL}/marks/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSummary(data.departments || []);
        else Swal.fire("Error", "Failed to load overview", "error");
      } catch (err) {
        Swal.fire("Error", "Unable to fetch marks overview", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Loading overview...
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaUniversity className="text-blue-600" /> Department Marks Overview
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary.map((dept, i) => (
          <div
            key={i}
            className="bg-white shadow-md rounded-xl p-5 border-l-4 border-blue-400 hover:border-blue-600 transition"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {DEPT_MAP[dept.department_name]}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{dept.total_students} Students</p>

            <div className="flex items-center justify-between text-gray-700">
              <div className="flex items-center gap-2">
                <FaChartLine className="text-blue-500" />
                <span className="font-medium">Avg Mark:</span>
              </div>
              <span className="font-bold text-blue-700">
                {Number(dept.avg_mark || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 text-gray-700">
              <div className="flex items-center gap-2">
                <FaPercentage className="text-green-500" />
                <span className="font-medium">Pass Rate:</span>
              </div>
              <span className="font-bold text-green-700">{Number(dept.pass_rate || 0).toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
