import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import {
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
  FaClipboardList,
  FaHistory,
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../../constants/API";
import { formatSubmittedAt } from "../../constants/dateUtils";
import { DEPT_MAP, yearoptions } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

// ---------------------------
// Styles & Utils
// ---------------------------

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    padding: "2px 4px",
    borderColor: state.isFocused ? "#3b82f6" : "transparent",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    "&:hover": { borderColor: "#cbd5e1" },
    fontSize: "0.9rem",
    minHeight: "42px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    overflow: "hidden",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    fontSize: "0.9rem",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 999999 }),
};

const StatusBadge = ({ status }) => {
  const pass = status === "pass";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider
        ${pass
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200"
        }`}
    >
      {pass ? <FaCheckCircle /> : <FaTimesCircle />}
      {status}
    </span>
  );
};

const ScoreBar = ({ percentage }) => {
  const val = Number(percentage || 0);
  let color = "bg-rose-500";
  if (val >= 75) color = "bg-emerald-500";
  else if (val >= 50) color = "bg-amber-500";

  return (
    <div className="w-full max-w-[140px]">
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs font-bold text-slate-700">{val}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${val}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
};

// ---------------------------
// Main Component
// ---------------------------
export default function PlacementResults() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "guest";

  const [rawResults, setRawResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    dept_id: "",
    class_id: "",
    course_id: "",
    test_id: "",
    result: "",
    search: "",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "rollno",
    direction: "asc",
  });

  // --- Fetch Data ---
  useEffect(() => {
    if (!token) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/placement-training/results`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setRawResults(data.results || []);
      } catch (err) {
        Swal.fire("Error", err.message || "Failed to load results", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [token]);

  useEffect(() => {
    if (role === "hod" && user.dept_id) {
      setFilters((f) => ({ ...f, dept_id: user.dept_id }));
    }
  }, [role, user.dept_id]);

  // --- Process Data ---
  const groupedResults = useMemo(() => {
    const map = {};

    rawResults.forEach((r) => {
      const key = `${r.student_id}_${r.test_id}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });

    return Object.values(map).map((group) => {
      const sorted = [...group].sort((a, b) => b.attempt_no - a.attempt_no);
      const passed = sorted.filter((a) => a.pass_status === "pass");
      const best = passed.length
        ? passed.reduce((a, b) => (a.percentage > b.percentage ? a : b))
        : sorted.reduce((a, b) => (a.percentage > b.percentage ? a : b));

      return {
        key: `${sorted[0].student_id}_${sorted[0].test_id}`,
        latest: sorted[0],
        attempts: sorted,
        bestScore: best.percentage,
      };
    });
  }, [rawResults]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredResults = useMemo(() => {
    let data = [...groupedResults];

    if (filters.dept_id)
      data = data.filter((r) => r.latest.dept_id === Number(filters.dept_id));
    if (filters.class_id)
      data = data.filter((r) => r.latest.class_id === Number(filters.class_id));
    if (filters.test_id)
      data = data.filter((r) => r.latest.test_id === Number(filters.test_id));
    if (filters.course_id)
      data = data.filter(
        (r) => r.latest.course_id === Number(filters.course_id)
      );
    if (filters.result)
      data = data.filter((r) => r.latest.pass_status === filters.result);
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.latest.student_name.toLowerCase().includes(q) ||
          r.latest.roll_no.toLowerCase().includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      let av, bv;
      switch (sortConfig.key) {
        case "student":
          av = a.latest.student_name;
          bv = b.latest.student_name;
          break;
        case "rollno":
          av = Number(a.latest.roll_no);
          bv = Number(b.latest.roll_no);
          break;
        case "test_title":
          av = a.latest.test_title;
          bv = b.latest.test_title;
          break;
        case "score":
          av = a.latest.percentage;
          bv = b.latest.percentage;
          break;
        case "pass_status":
          av = a.latest.pass_status;
          bv = b.latest.pass_status;
          break;
        case "attempts":
          av = a.attempts.length;
          bv = b.attempts.length;
          break;
        case "submitted_at":
          av = new Date(a.latest.submitted_at);
          bv = new Date(b.latest.submitted_at);
          break;
        default:
          return 0;
      }
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [groupedResults, filters, sortConfig]);

  // --- Exports ---
  const exportRows = useMemo(() => {
    return filteredResults.map((item) => {
      const r = item.latest;
      return {
        "Student Name": r.student_name,
        "Roll No": r.roll_no,
        Department: DEPT_MAP[r.dept_id],
        Year: r.class_id,
        Course: r.course_name,
        Test: r.test_title,
        "Attempt No": r.attempt_no,
        Score: r.score,
        Percentage: `${r.percentage || 0}%`,
        Result: r.pass_status,
        "Submitted At": formatSubmittedAt(r.submitted_at),
      };
    });
  }, [filteredResults]);

  const handleExcelExport = () => {
    if (exportRows.length === 0)
      return Swal.fire("No data", "Nothing to export", "info");
    exportToExcel(exportRows, "Placement_Results", "Results");
  };

  const handlePDFExport = () => {
    if (exportRows.length === 0)
      return Swal.fire("No data", "Nothing to export", "info");

    const passed = exportRows.filter((r) => r.Result === "pass").length;
    const failed = exportRows.filter((r) => r.Result === "fail").length;

    generatePDFReport({
      title: "PLACEMENT RESULTS",
      subTitle: "Assessment Performance Report",
      generatedBy: user.name || role,
      fileName: "Placement_Results",
      filters: [
        filters.dept_id && {
          label: "Department",
          value: DEPT_MAP[filters.dept_id],
        },
        filters.class_id && { label: "Year", value: filters.class_id },
        filters.result && { label: "Result", value: filters.result },
      ].filter(Boolean),
      stats: [
        { label: "Total", value: exportRows.length, color: [79, 70, 229] },
        { label: "Passed", value: passed, color: [22, 163, 74] },
        { label: "Failed", value: failed, color: [220, 38, 38] },
      ],
      tableHeaders: Object.keys(exportRows[0]),
      tableData: exportRows.map(Object.values),
    });
  };

  // --- Dynamic Options ---
  const testOptions = useMemo(() => {
    const map = new Map();
    rawResults.forEach((r) => {
      if (
        filters.course_id &&
        r.course_id !== Number(filters.course_id)
      )
        return;
      if (!map.has(r.test_id)) {
        map.set(r.test_id, { value: r.test_id, label: r.test_title });
      }
    });
    return Array.from(map.values());
  }, [rawResults, filters.course_id]);

  const courseOptions = useMemo(() => {
    const map = new Map();
    rawResults.forEach((r) => {
      if (!map.has(r.course_id)) {
        map.set(r.course_id, { value: r.course_id, label: r.course_name });
      }
    });
    return Array.from(map.values());
  }, [rawResults]);

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const canSelectDept = role === "Principal" || role === "trainer";
  const canSelectClass =
    role === "Principal" || role === "trainer" || role === "HOD";

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <FaTrophy className="text-xl" />
              </span>
              Placement Results
            </h1>
            <p className="text-slate-500 mt-1 font-medium ml-1">
              Analyze student performance across assessments
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePDFExport}
              disabled={filteredResults.length === 0}
              className="group flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <FaFilePdf /> PDF
            </button>
            <button
              onClick={handleExcelExport}
              disabled={filteredResults.length === 0}
              className="group flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative z-20">
          <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
            <FaFilter /> Filters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Student..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium h-[42px]"
              />
            </div>

            {canSelectDept && (
              <Select
                styles={selectStyles}
                placeholder="Department"
                options={[
                  { value: "", label: "All Departments" },
                  ...Object.entries(DEPT_MAP).map(([id, name]) => ({
                    value: Number(id),
                    label: name,
                  })),
                ]}
                value={
                  filters.dept_id
                    ? { value: filters.dept_id, label: DEPT_MAP[filters.dept_id] }
                    : null
                }
                onChange={(o) =>
                  setFilters({ ...filters, dept_id: o?.value || "" })
                }
              />
            )}

            {canSelectClass && (
              <Select
                styles={selectStyles}
                placeholder="Class / Year"
                options={yearoptions}
                value={
                  yearoptions.find((o) => o.value === filters.class_id) || null
                }
                onChange={(o) =>
                  setFilters({ ...filters, class_id: o?.value || "" })
                }
              />
            )}

            {role !== "STUDENT" && (
              <Select
                styles={selectStyles}
                placeholder="Course"
                options={[
                  { value: "", label: "All Courses" },
                  ...courseOptions,
                ]}
                value={
                  filters.course_id
                    ? courseOptions.find(
                      (o) => o.value === Number(filters.course_id)
                    )
                    : null
                }
                onChange={(o) =>
                  setFilters({
                    ...filters,
                    course_id: o?.value || "",
                    test_id: "",
                  })
                }
              />
            )}

            {role !== "STUDENT" && (
              <Select
                styles={selectStyles}
                placeholder="Test"
                isDisabled={!filters.course_id && testOptions.length === 0}
                options={[
                  { value: "", label: "All Tests" },
                  ...testOptions,
                ]}
                value={
                  filters.test_id
                    ? testOptions.find((o) => o.value === Number(filters.test_id))
                    : null
                }
                onChange={(o) =>
                  setFilters({ ...filters, test_id: o?.value || "" })
                }
              />
            )}

            <Select
              styles={selectStyles}
              placeholder="Result Status"
              options={[
                { value: "pass", label: "Pass" },
                { value: "fail", label: "Fail" },
              ]}
              value={
                filters.result
                  ? { value: filters.result, label: filters.result }
                  : null
              }
              onChange={(o) =>
                setFilters({ ...filters, result: o?.value || "" })
              }
              isClearable
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <FaTrophy className="text-4xl text-indigo-200" />
              </motion.div>
              <p className="mt-4 text-gray-400 font-medium">Loading Results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="text-2xl text-gray-300" />
              </div>
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-xs uppercase font-bold text-gray-500">
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                      onClick={() => handleSort("student")}
                    >
                      <div className="flex items-center gap-2">
                        Student
                        {sortConfig.key === "student" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                      onClick={() => handleSort("rollno")}
                    >
                      <div className="flex items-center gap-2">
                        Reg no
                        {sortConfig.key === "rollno" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort("test_title")}
                    >
                      <div className="flex items-center gap-2">
                        Assessment
                        {sortConfig.key === "test_title" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort("score")}
                    >
                      <div className="flex items-center gap-2">
                        Score
                        {sortConfig.key === "score" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort("pass_status")}
                    >
                      <div className="flex items-center gap-2">
                        Result
                        {sortConfig.key === "pass_status" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort("attempts")}
                    >
                      <div className="flex items-center gap-2">
                        Attempts
                        {sortConfig.key === "attempts" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort("submitted_at")}
                    >
                      <div className="flex items-center gap-2">
                        Completed
                        {sortConfig.key === "submitted_at" &&
                          (sortConfig.direction === "asc" ? (
                            <FaSortAmountUp className="text-indigo-500" />
                          ) : (
                            <FaSortAmountDown className="text-indigo-500" />
                          ))}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredResults.map((item) => {
                    const r = item.latest;
                    const isOpen = expanded[item.key];

                    return (
                      <React.Fragment key={item.key}>
                        <tr
                          onClick={() => toggle(item.key)}
                          className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {r.student_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800 text-sm">
                                  {r.student_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-gray-800 text-sm">
                                  {r.roll_no}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-sm text-gray-800">
                              {r.course_name}
                            </div>
                            <div className="text-xs text-indigo-500 flex items-center gap-1 mt-1 font-medium">
                              <FaClipboardList /> {r.test_title}
                            </div>
                          </td>
                          <td className="p-4">
                            <ScoreBar percentage={r.percentage} />
                          </td>
                          <td className="p-4">
                            <StatusBadge status={r.pass_status} />
                          </td>
                          <td className="p-4 ">
                            <span className="text-sm font-medium text-gray-700">
                              {r.attempt_no}
                            </span>
                            {item.attempts.length > 1 && (
                              <span className="ml-2 text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                +{item.attempts.length - 1} History
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                              <FaCalendarAlt className="text-gray-300" />
                              {formatSubmittedAt(r.submitted_at)}
                              <div className="ml-2 text-gray-300 group-hover:text-indigo-500 transition-colors">
                                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDED HISTORY */}
                        <AnimatePresence>
                          {isOpen && (
                            <tr>
                              <td colSpan="6" className="p-0 border-none">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-gray-50 border-b border-gray-100 shadow-inner"
                                >
                                  <div className="p-4 pl-14">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">
                                      <FaHistory /> Attempt History
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                                          <tr>
                                            <th className="p-3 pl-4">Attempt</th>
                                            <th className="p-3">Date & Time</th>
                                            <th className="p-3">Score</th>
                                            <th className="p-3">Result</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                          {item.attempts.map((a) => (
                                            <tr
                                              key={a.attempt_id}
                                              className="hover:bg-gray-50 transition-colors"
                                            >
                                              <td className="p-3 pl-4 font-bold text-gray-700">
                                                Attempt {a.attempt_no}
                                              </td>
                                              <td className="p-3 text-gray-600 font-mono">
                                                {formatSubmittedAt(a.submitted_at)}
                                              </td>
                                              <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-gray-800">
                                                    {a.percentage}%
                                                  </span>
                                                  {a.percentage === item.bestScore && (
                                                    <FaTrophy
                                                      className="text-amber-400"
                                                      title="Best Score"
                                                    />
                                                  )}
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <StatusBadge status={a.pass_status} />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER STATS */}
        {!loading && filteredResults.length > 0 && (
          <div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 flex justify-between items-center text-sm font-medium text-gray-500 shadow-sm">
            <span>Showing {filteredResults.length} students</span>
            <span>
              Top Score:{" "}
              <span className="text-emerald-600 font-bold">
                {Math.max(...filteredResults.map((r) => r.bestScore))}%
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}