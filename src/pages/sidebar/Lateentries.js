import React, { useEffect, useState, useMemo, useCallback } from "react";
import Select from "react-select";
import { FaSearch, FaSyncAlt, FaClock, FaUserClock, FaExclamationTriangle, FaFilter } from "react-icons/fa";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

const LateEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [personType, setPersonType] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const personTypeOptions = [
    { value: "ALL", label: "All Types" },
    { value: "student", label: "Students" },
    { value: "staff", label: "Staff" },
  ];

  const deptOptions = [
    { value: "ALL", label: "All Departments" },
    ...Object.entries(DEPT_MAP).map(([id, name]) => ({
      value: String(id),
      label: name,
    })),
  ];

  const classOptions = [
    { value: "ALL", label: "All Classes" },
    ...Object.entries(CLASS_MAP).map(([id, name]) => ({
      value: String(id),
      label: name,
    })),
  ];

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "0.75rem",
      padding: "2px",
      borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": { borderColor: "#d1d5db" },
      minHeight: "42px",
      fontSize: "0.875rem",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.75rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      zIndex: 50,
      marginTop: "4px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#1f2937",
      cursor: "pointer",
      fontSize: "0.875rem",
      padding: "10px 12px",
    }),
  };

  // ---------------------------
  // Fetch Logic
  // ---------------------------
  const fetchLateEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/attendance-logs/late/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch late entries");
      }

      setEntries(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const scopedEntries = useMemo(() => {
    if (!user) return [];

    return entries.filter((e) => {
      if (user.role === "Principal") return true;

      if (user.role === "CA") {
        return (
          e.person_type?.toLowerCase() === "student" &&
          e.dept_id === user.dept_id &&
          e.class_id === user.class_id
        );
      }

      if (user.role === "HOD") {
        return e.dept_id === user.dept_id;
      }

      return false;
    });
  }, [entries, user]);

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    fetchLateEntries();
    const interval = setInterval(fetchLateEntries, 20000);
    return () => clearInterval(interval);
  }, [fetchLateEntries]);

  useEffect(() => {
    if (personType === "staff") {
      setClassFilter("ALL");
    }
  }, [personType]);

  // ---------------------------
  // Filter Logic
  // ---------------------------
  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();

    return scopedEntries.filter((e) => {
      // Person type check
      if (
        personType !== "ALL" &&
        e.person_type?.toLowerCase() !== personType
      ) {
        return false;
      }

      // Dept check
      if (deptFilter !== "ALL" && e.dept_id !== Number(deptFilter)) {
        return false;
      }

      // Class check
      if (
        classFilter !== "ALL" &&
        e.person_type?.toLowerCase() === "student" &&
        e.class_id !== Number(classFilter)
      ) {
        return false;
      }

      return (
        e.name?.toLowerCase().includes(q) ||
        e.roll_no?.toLowerCase().includes(q) ||
        e.person_type?.toLowerCase().includes(q) ||
        DEPT_MAP[e.dept_id]?.toLowerCase().includes(q) ||
        CLASS_MAP[e.class_id]?.toLowerCase().includes(q)
      );
    });
  }, [scopedEntries, search, personType, deptFilter, classFilter]);

  // ---------------------------
  // Render Helpers
  // ---------------------------
  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 rounded-xl border border-dashed border-gray-300 m-6">
        <FaClock className="text-4xl text-blue-400 mb-4 animate-pulse" />
        <p className="text-gray-500 font-medium">Loading late entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <FaExclamationTriangle />
          <div>
            <span className="font-bold">Error loading data:</span> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                <FaUserClock className="text-xl" />
              </span>
              Late Entries
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Real-time monitoring of today's late arrivals.
            </p>
          </div>
          <button
            onClick={fetchLateEntries}
            disabled={loading}
            className="group flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-70"
          >
            <FaSyncAlt className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col xl:flex-row gap-4 z-10 relative">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-sm font-medium h-[42px]"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <div className="w-full sm:w-[180px]">
              <Select
                options={personTypeOptions}
                styles={selectStyles}
                value={personTypeOptions.find((o) => o.value === personType)}
                onChange={(opt) => setPersonType(opt.value)}
                isDisabled={user?.role === "CA"}
                placeholder="Type"
              />
            </div>

            {user?.role !== "CA" && (
              <div className="w-full sm:w-[200px]">
                <Select
                  options={deptOptions}
                  styles={selectStyles}
                  value={deptOptions.find((o) => o.value === deptFilter)}
                  onChange={(opt) => setDeptFilter(opt.value)}
                  placeholder="Department"
                />
              </div>
            )}

            {personType !== "staff" && user?.role !== "CA" && (
              <div className="w-full sm:w-[160px]">
                <Select
                  options={classOptions}
                  styles={selectStyles}
                  value={classOptions.find((o) => o.value === classFilter)}
                  onChange={(opt) => setClassFilter(opt.value)}
                  placeholder="Class"
                />
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Person
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    ID / Roll No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Class / Desig
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <FaFilter className="text-2xl text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          No late entries found
                        </h3>
                        <p className="text-gray-500 mt-1">
                          Everyone seems to be on time matching your criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, i) => (
                    <tr
                      key={`${e.person_type}-${e.person_id}-${i}`}
                      className="hover:bg-gray-50/80 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {e.name}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-1 ${
                                e.person_type === "student"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {e.person_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono bg-gray-50/30">
                        {e.roll_no || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {DEPT_MAP[e.dept_id] || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {e.person_type?.toLowerCase() === "student"
                          ? CLASS_MAP[e.class_id] || "—"
                          : e.designation || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-700">
                        {e.entry_time?.slice(0, 5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-sm font-bold border border-rose-100">
                          <span>{e.late_minutes || 0}m</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredEntries.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Total Late Entries: <span className="text-gray-900">{filteredEntries.length}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LateEntries;