import React, { useEffect, useState } from "react";
import { FaFilter, FaUsers, FaSearch } from "react-icons/fa";
import { BASE_URL } from "../constants/API";

export default function Fees({ user }) {
  const [filters, setFilters] = useState({
    dept_id: "",
    year: "",
    class_id: "",
    jain: "",
    bus: "",
    hostel: "",
    search: "",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const allowDept = ["Principal", "HOD", "Staff", "CA"].includes(user?.role);
  const allowYear = ["Principal", "HOD", "CA"].includes(user?.role);
  const allowClass = ["Principal", "CA"].includes(user?.role);

  const token = localStorage.getItem("token");


  const fetchData = async () => { 
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${BASE_URL}/fees/list?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 mb-6 rounded-xl shadow-lg border-t-4 border-green-600">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <FaUsers className="text-green-600 mr-3" /> Fees List
        </h1>
        <p className="text-gray-600 mb-4">Filtered fee details based on your role.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {allowDept && (
            <select
              className="p-3 border rounded-lg"
              value={filters.dept_id}
              onChange={(e) => setFilters({ ...filters, dept_id: e.target.value })}
            >
              <option value="">Department</option>
              <option value="1">CSE</option>
              <option value="2">ECE</option>
              <option value="3">MECH</option>
            </select>
          )}

          {allowYear && (
            <select
              className="p-3 border rounded-lg"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            >
              <option value="">Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          )}

          {allowClass && (
            <select
              className="p-3 border rounded-lg"
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
            >
              <option value="">Class</option>
              <option value="101">CSE-A</option>
              <option value="102">CSE-B</option>
            </select>
          )}

          <select
            className="p-3 border rounded-lg"
            value={filters.jain}
            onChange={(e) => setFilters({ ...filters, jain: e.target.value })}
          >
            <option value="">Jain / Non-Jain</option>
            <option value="1">Jain</option>
            <option value="0">Non-Jain</option>
          </select>

          <select
            className="p-3 border rounded-lg"
            value={filters.bus}
            onChange={(e) => setFilters({ ...filters, bus: e.target.value })}
          >
            <option value="">Bus</option>
            <option value="1">Bus Student</option>
            <option value="0">No Bus</option>
          </select>

          <select
            className="p-3 border rounded-lg"
            value={filters.hostel}
            onChange={(e) => setFilters({ ...filters, hostel: e.target.value })}
          >
            <option value="">Hostel</option>
            <option value="1">Hosteller</option>
            <option value="0">Day Scholar</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="px-5 py-3 bg-green-600 text-white rounded-lg shadow flex items-center"
          >
            <FaFilter className="mr-2" /> Apply Filters
          </button>

          <button
            onClick={() => setFilters({ dept_id: "", year: "", class_id: "", jain: "", bus: "", hostel: "", search: "" })}
            className="px-5 py-3 bg-gray-200 rounded-lg shadow"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Students</h2>

          <div className="flex items-center gap-3">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              className="p-2 border rounded-lg"
              placeholder="Search by Reg No / Name"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">Reg No</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Semester Fee</th>
                  <th className="p-3 border">Hostel Fee</th>
                  <th className="p-3 border">Transport Fee</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="p-3 border">{s.reg_no}</td>
                    <td className="p-3 border">{s.name}</td>
                    <td className="p-3 border">₹{s.semester_fee}</td>
                    <td className="p-3 border">{s.hostel ? `₹${s.hostel_fee}` : "-"}</td>
                    <td className="p-3 border">{s.bus ? `₹${s.transport_fee}` : "-"}</td>
                    <td className="p-3 border text-blue-600 cursor-pointer underline">View</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}