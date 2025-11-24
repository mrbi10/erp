import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { FaChartBar } from "react-icons/fa";

const DEPT_MAP = {
  1: "CSE",
  2: "ECE",
  3: "EEE",
  4: "MECH",
  5: "CIVIL",
  6: "IT",
};

export default function DepartmentAnalysis() {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/marks/department-analysis`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) setData(result.data);
        else Swal.fire("Error", "Failed to fetch analysis", "error");
      } catch (err) {
        Swal.fire("Error", "Unable to load department analysis", "error");
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaChartBar className="text-purple-600" /> Department Performance Analysis
      </h1>

      {data.length === 0 ? (
        <div className="text-gray-500 text-center mt-10">
          No data available for department analysis.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white shadow-md rounded-xl p-5 border-t-4 border-purple-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Average Marks by Department
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="IAT1" fill="#60a5fa" />
                <Bar dataKey="IAT2" fill="#34d399" />
                <Bar dataKey="MODEL" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow-md rounded-xl p-5 border-t-4 border-indigo-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Pass Percentage Trend
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pass_rate" stroke="#4f46e5" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
