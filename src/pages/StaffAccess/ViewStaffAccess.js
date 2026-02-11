import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import {
  FaUserTie,
  FaSpinner,
  FaLayerGroup,
  FaInfoCircle
} from "react-icons/fa";

export default function ViewStaffAccess() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    dept_id: "",
    year: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccess();
  }, [filters]);

  const fetchAccess = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/staffClassAccess`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch {
      Swal.fire("Error", "Failed to load staff access", "error");
    } finally {
      setLoading(false);
    }
  };

  const groupedData = useMemo(() => {
    const grouped = {};

    data.forEach(item => {
      const deptName = DEPT_MAP[item.dept_id];
      const yearName = CLASS_MAP[item.year];
      const key = `${deptName} - ${yearName}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return grouped;
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow border">

        <div className="p-5 border-b flex items-center gap-3 bg-slate-50">
          <FaLayerGroup className="text-indigo-600" />
          <h2 className="text-lg font-bold">Staff Class Access</h2>
        </div>

        {/* FILTERS */}
        <div className="p-4 flex gap-4 border-b bg-white">

          <select
            className="border p-2 rounded-lg"
            value={filters.dept_id}
            onChange={(e) =>
              setFilters({ ...filters, dept_id: e.target.value })
            }
          >
            <option value="">All Departments</option>
            {Object.entries(DEPT_MAP).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded-lg"
            value={filters.year}
            onChange={(e) =>
              setFilters({ ...filters, year: e.target.value })
            }
          >
            <option value="">All Years</option>
            {Object.entries(CLASS_MAP).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">

          {Object.keys(groupedData).length === 0 && (
            <div className="text-center text-slate-500">
              <FaInfoCircle className="text-4xl mx-auto mb-3" />
              No staff assigned.
            </div>
          )}

          {Object.entries(groupedData).map(([groupKey, staffList]) => (
            <div key={groupKey} className="border rounded-xl p-4 bg-slate-50">

              <h3 className="font-bold text-slate-800 mb-3">
                {groupKey}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {staffList.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <FaUserTie className="text-indigo-500" />
                      <span className="font-semibold">
                        {item.name}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        item.access_type === "ca"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {item.access_type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
