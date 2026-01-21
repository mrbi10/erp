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
  FaTimesCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { formatSubmittedAt } from "../../constants/dateUtils";
import { DEPT_MAP, yearoptions } from "../../constants/deptClass";

/* -----------------------------
   Select Styles (same feel)
-------------------------------- */
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    minHeight: "42px",
    borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
    boxShadow: "none",
    "&:hover": { borderColor: "#c7d2fe" }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    zIndex: 50
  })
};

/* -----------------------------
   Small UI helpers
-------------------------------- */
const StatusBadge = ({ status }) => {
  const pass = status === "pass";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
        ${pass
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200"
        }`}
    >
      {pass ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
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
    <div className="w-36">
      <div className="text-xs font-bold text-slate-700 mb-1">{val}%</div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${val}%` }} />
      </div>
    </div>
  );
};

/* =====================================================
   MAIN COMPONENT
===================================================== */
export default function PlacementResults() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "guest";

  const [rawResults, setRawResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  /* -----------------------------
     Filters (frontend)
  -------------------------------- */
  const [filters, setFilters] = useState({
    dept_id: "",
    class_id: "",
    course_id: "",
    test_id: "",
    result: "",
    search: ""
  });

  const [sortConfig, setSortConfig] = useState({
    key: "submitted_at",
    direction: "desc"
  });

  /* -----------------------------
     Fetch once
  -------------------------------- */
  useEffect(() => {
    if (!token) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${BASE_URL}/placement-training/results`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
      setFilters(f => ({
        ...f,
        dept_id: user.dept_id
      }));
    }
  }, [role, user.dept_id]);


  /* -----------------------------
     Group by student + test
  -------------------------------- */
  const groupedResults = useMemo(() => {
    const map = {};

    rawResults.forEach(r => {
      const key = `${r.student_id}_${r.test_id}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });

    return Object.values(map).map(group => {
      const sorted = [...group].sort(
        (a, b) => b.attempt_no - a.attempt_no
      );

      const passed = sorted.filter(a => a.pass_status === "pass");
      const best = passed.length
        ? passed.reduce((a, b) => a.percentage > b.percentage ? a : b)
        : sorted.reduce((a, b) => a.percentage > b.percentage ? a : b);

      return {
        key: `${sorted[0].student_id}_${sorted[0].test_id}`,
        latest: sorted[0],
        attempts: sorted,
        bestScore: best.percentage
      };
    });
  }, [rawResults]);


  const handleSort = key => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc"
        };
      }
      return { key, direction: "asc" };
    });
  };


  /* -----------------------------
     Frontend filtering (like Students page)
  -------------------------------- */
  const filteredResults = useMemo(() => {
    let data = [...groupedResults];

    // filters (existing)
    if (filters.dept_id) {
      data = data.filter(r => r.latest.dept_id === Number(filters.dept_id));
    }

    if (filters.class_id) {
      data = data.filter(r => r.latest.class_id === Number(filters.class_id));
    }

    if (filters.test_id) {
      data = data.filter(r => r.latest.test_id === Number(filters.test_id));
    }

    if (filters.course_id) {
      data = data.filter(r => r.latest.course_id === Number(filters.course_id));
    }

    if (filters.result) {
      data = data.filter(r => r.latest.pass_status === filters.result);
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter(r =>
        r.latest.student_name.toLowerCase().includes(q) ||
        r.latest.roll_no.toLowerCase().includes(q)
      );
    }

    // 🔽 SORTING
    data.sort((a, b) => {
      let av, bv;

      switch (sortConfig.key) {
        case "student":
          av = a.latest.student_name;
          bv = b.latest.student_name;
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


  const testOptions = useMemo(() => {
    const map = new Map();

    rawResults.forEach(r => {
      if (filters.course_id && r.course_id !== Number(filters.course_id)) {
        return;
      }

      if (!map.has(r.test_id)) {
        map.set(r.test_id, {
          value: r.test_id,
          label: r.test_title
        });
      }
    });

    return Array.from(map.values());
  }, [rawResults, filters.course_id]);


  const courseoptions = useMemo(() => {
    const map = new Map();

    rawResults.forEach(r => {
      if (!map.has(r.course_id)) {
        map.set(r.course_id, {
          value: r.course_id,
          label: r.course_name
        });
      }
    });

    return Array.from(map.values());
  }, [rawResults]);

  const toggle = key =>
    setExpanded(p => ({ ...p, [key]: !p[key] }));

  /* -----------------------------
     Role visibility
  -------------------------------- */
  const canSelectDept = role === "Principal" || role === "trainer";
  const canSelectClass = role === "Principal" || role === "trainer" || role === "HOD";


  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Placement Results
          </h1>
          <p className="text-slate-500 mt-1">
            {role} view – assessment performance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
          <FaFilter className="text-slate-300" />

          <div className="relative w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={e =>
                setFilters(f => ({ ...f, search: e.target.value }))
              }
              placeholder="Search student or reg no"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg text-sm"
            />
          </div>
          {canSelectDept && (
            <Select
              styles={selectStyles}
              placeholder="All Departments"
              options={[
                { value: "", label: "All Depts" },
                ...Object.entries(DEPT_MAP).map(([id, name]) => ({
                  value: Number(id),
                  label: name
                }))
              ]}
              value={
                filters.dept_id
                  ? { value: filters.dept_id, label: DEPT_MAP[filters.dept_id] }
                  : null
              }
              onChange={o =>
                setFilters(f => ({
                  ...f,
                  dept_id: o?.value || "",
                }))
              }
            />
          )}

          {canSelectClass && (
            <Select
              styles={selectStyles}
              placeholder="All Years"
              options={yearoptions}
              value={
                yearoptions.find(o => o.value === filters.class_id) || null
              }
              onChange={o =>
                setFilters(f => ({
                  ...f,
                  class_id: o?.value || ""
                }))
              }
            />
          )}


          {role !== "STUDENT" && (
            <Select
              styles={selectStyles}
              placeholder="All COURSES"
              options={[
                { value: "", label: "All COURSES" },
                ...courseoptions
              ]}
              value={
                filters.course_id
                  ? courseoptions.find(o => o.value === Number(filters.course_id))
                  : null
              }
              onChange={o =>
                setFilters(f => ({
                  ...f,
                  course_id: o?.value || "",
                  test_id: ""
                }))
              }
            />
          )}

          {role !== "STUDENT" && (
            <Select
              styles={selectStyles}
              placeholder="All Tests"
              isDisabled={!!filters.course_id && testOptions.length === 0}
              options={[
                { value: "", label: "All Tests" },
                ...testOptions
              ]}
              value={
                filters.test_id
                  ? testOptions.find(o => o.value === Number(filters.test_id))
                  : null
              }
              onChange={o =>
                setFilters(f => ({
                  ...f,
                  test_id: o?.value || ""
                }))
              }
            />
          )}

          <Select
            styles={selectStyles}
            placeholder="Result"
            options={[
              { value: "pass", label: "Pass" },
              { value: "fail", label: "Fail" }
            ]}
            value={
              filters.result
                ? { value: filters.result, label: filters.result }
                : null
            }
            onChange={o =>
              setFilters(f => ({ ...f, result: o?.value || "" }))
            }
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading…</div>
          ) : filteredResults.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              No results found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="p-4 cursor-pointer select-none"
                    onClick={() => handleSort("student")}>Student {sortConfig.key === "student" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}</th>
                  <th className="p-4 cursor-pointer select-none"
                    onClick={() => handleSort("test_title")}>Assessment{sortConfig.key === "test_title" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}</th>
                  <th className="p-4 cursor-pointer select-none"
                    onClick={() => handleSort("score")}>Score{sortConfig.key === "score" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}</th>
                  <th className="p-4 cursor-pointer select-none"
                    onClick={() => handleSort("pass_status")}>Result{sortConfig.key === "pass_status" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}</th>
                  <th className="p-4 cursor-pointer select-none"
                    onClick={() => handleSort("attempts")}>Attempts{sortConfig.key === "attempts" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}</th>
                  <th className="p-4 cursor-pointer select-none"
                    onClick={() => handleSort("submitted_at")}>Completed{sortConfig.key === "submitted_at" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map(item => {
                  const r = item.latest;
                  const open = expanded[item.key];

                  return (
                    <React.Fragment key={item.key}>
                      <tr
                        onClick={() => toggle(item.key)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="p-4">
                          <div className="font-bold">{r.student_name}</div>
                          <div className="text-xs text-slate-400">
                            {r.roll_no}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold">{r.course_name}</div>
                          <div className="text-xs text-indigo-500 flex items-center gap-1">
                            <FaClipboardList />
                            {r.test_title}
                          </div>
                        </td>

                        <td className="p-4">
                          <ScoreBar percentage={r.percentage} />
                        </td>

                        <td className="p-4">
                          <StatusBadge status={r.pass_status} />
                        </td>

                        <td className="p-4">
                          #{r.attempt_no}
                          {item.attempts.length > 1 && (
                            <span className="ml-2 text-xs text-indigo-500">
                              +{item.attempts.length - 1}
                            </span>
                          )}
                        </td>

                        <td className="p-4 flex items-center gap-2">
                          <FaCalendarAlt className="text-slate-300" />
                          {formatSubmittedAt(r.submitted_at)}
                          {open ? <FaChevronUp /> : <FaChevronDown />}
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-slate-50">
                          <td colSpan="6" className="p-4">
                            <div className="bg-white rounded-lg border">
                              <div className="p-3 text-xs font-bold text-slate-600 flex items-center gap-2">
                                <FaHistory />
                                Attempt History
                              </div>

                              <table className="w-full text-xs">
                                <tbody>
                                  {item.attempts.map(a => (
                                    <tr key={a.attempt_id} className="border-t">
                                      <td className="p-3">
                                        Attempt {a.attempt_no}
                                      </td>
                                      <td className="p-3">
                                        {formatSubmittedAt(a.submitted_at)}
                                      </td>
                                      <td className="p-3">
                                        {a.score}
                                        {a.percentage === item.bestScore && (
                                          <FaTrophy className="inline ml-2 text-amber-400" />
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <StatusBadge status={a.pass_status} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
