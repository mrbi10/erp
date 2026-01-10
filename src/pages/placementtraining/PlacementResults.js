import React, { useEffect, useState, useCallback, useMemo } from "react";
import Select from "react-select";
import {
FaCheckCircle,
FaTimesCircle,
FaGraduationCap,
FaChartLine,
FaFilter,
FaSearch,
FaCalendarAlt,
FaBookOpen,
FaClipboardList,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

// --- Components ---

const StatCard = ({ icon, label, value, color }) => {
const colors = {
blue: "bg-blue-50 text-blue-600 border-blue-100",
green: "bg-emerald-50 text-emerald-600 border-emerald-100",
purple: "bg-violet-50 text-violet-600 border-violet-100",
};

return (
<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 flex items-center gap-5">
<div className={`p-4 rounded-xl text-2xl border ${colors[color]}`}>
{icon}
</div>
<div>
<p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
{label}
</p>
<p className="text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
</div>
</div>
);
};

const StatusBadge = ({ status }) => {
return (
<span
className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${status === "pass" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}
>
{status === "pass" ? <FaCheckCircle /> : <FaTimesCircle />}
{status}
</span>
);
};

const LoadingSkeleton = () => (

<div className="animate-pulse space-y-4 p-6">
{[1, 2, 3, 4, 5].map((i) => (
<div key={i} className="flex gap-4">
<div className="h-12 w-12 bg-slate-100 rounded-full"></div>
<div className="flex-1 space-y-2 py-1">
<div className="h-4 bg-slate-100 rounded w-3/4"></div>
<div className="h-4 bg-slate-100 rounded w-1/2"></div>
</div>
</div>
))}
</div>
);

const EmptyState = () => (

<div className="flex flex-col items-center justify-center py-16 text-slate-400">
<div className="bg-slate-50 p-6 rounded-full mb-4">
<FaSearch className="text-3xl text-slate-300" />
</div>
<h3 className="text-lg font-semibold text-slate-600">No results found</h3>
<p className="text-sm mt-1 max-w-xs text-center">
Try adjusting your filters or check back later for new updates.
</p>
</div>
);

// --- Styles ---

const customSelectStyles = {
control: (base, state) => ({
...base,
borderRadius: "0.75rem",
borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
padding: "2px",
"&:hover": {
borderColor: "#cbd5e1",
},
backgroundColor: "#f8fafc",
fontSize: "0.875rem",
}),
menu: (base) => ({
...base,
borderRadius: "0.75rem",
boxShadow:
"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
border: "1px solid #f1f5f9",
zIndex: 50,
}),
option: (base, state) => ({
...base,
backgroundColor: state.isSelected
? "#e0e7ff"
: state.isFocused
? "#f1f5f9"
: "white",
color: state.isSelected ? "#4338ca" : "#1e293b",
cursor: "pointer",
fontSize: "0.875rem",
}),
placeholder: (base) => ({
...base,
color: "#94a3b8",
}),
};

// --- Main Component ---

export default function PlacementResults({ user }) {
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(true);

// --- Filters State ---
const [filters, setFilters] = useState({
year: null,
course_id: null,
test_id: null,
result: null,
});

const [courseOptions, setCourseOptions] = useState([]);
const [testOptions, setTestOptions] = useState([]);

const token = localStorage.getItem("token");

// --- Config ---
const filterConfigByRole = {
Principal: { year: true, course: true, test: true, result: true },
HOD: { year: false, course: true, test: true, result: true },
CA: { year: false, course: true, test: true, result: true },
student: { year: false, course: false, test: false, result: false },
};

const visibleFilters = filterConfigByRole[user.role] || {};

const yearOptions = [
{ value: "1", label: "1st Year" },
{ value: "2", label: "2nd Year" },
{ value: "3", label: "3rd Year" },
{ value: "4", label: "4th Year" },
];

const resultOptions = [
{ value: "pass", label: "Passed" },
{ value: "fail", label: "Failed" },
];

// --- API Actions ---

const fetchCourses = async () => {
try {
const res = await fetch(`${BASE_URL}/placement-training/courses`, {
headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();


  setCourseOptions(
    (data || []).map((c) => ({
      value: c.id,
      label: c.course_name,
    }))
  );
} catch {
  Swal.fire("Error", "Failed to load courses", "error");
}



};

const fetchTests = async (courseId) => {
try {
const res = await fetch(
`${BASE_URL}/placement-training/tests?course_id=${courseId}`,
{
headers: { Authorization: `Bearer ${token}` },
}
);
const data = await res.json();


  setTestOptions(
    (data || []).map((t) => ({
      value: t.id,
      label: t.test_title,
    }))
  );
} catch {
  Swal.fire("Error", "Failed to load tests", "error");
}



};

const fetchResults = useCallback(async () => {
try {
setLoading(true);


  const params = new URLSearchParams();

  if (filters.year) params.append("year", filters.year.value);
  if (filters.course_id)
    params.append("course_id", filters.course_id.value);
  if (filters.test_id) params.append("test_id", filters.test_id.value);
  if (filters.result) params.append("pass_status", filters.result.value);

  const res = await fetch(
    `${BASE_URL}/placement-training/results?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load results");
  }

  setResults(data.results || []);
} catch (err) {
  Swal.fire("Error", err.message, "error");
} finally {
  setLoading(false);
}



}, [filters, token]);

// --- Effects ---

useEffect(() => {
fetchResults();
}, [fetchResults]);

useEffect(() => {
if (visibleFilters.course) fetchCourses();
}, []);

useEffect(() => {
if (filters.course_id) {
fetchTests(filters.course_id.value);
setFilters((f) => ({ ...f, test_id: null }));
} else {
setTestOptions([]);
}
}, [filters.course_id]);

// --- Stats Calculation ---

const stats = useMemo(() => {
return {
total: results.length,
passed: results.filter((r) => r.pass_status === "pass").length,
avgScore: results.length
? (
results.reduce((sum, r) => sum + Number(r.percentage || 0), 0) /
results.length
).toFixed(1)
: 0,
};
}, [results]);

// --- Render ---

return (
<div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
<div className="max-w-7xl mx-auto space-y-8">
{/* Header Section */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
Placement Analytics
</h1>
<p className="text-slate-500 mt-2 flex items-center gap-2">
<span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
{user.role} View
</span>
<span>Monitor student performance and assessment outcomes.</span>
</p>
</div>
</div>


    {/* Stats Section (Non-Student) */}
    {user.role !== "student" && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
        <StatCard
          icon={<FaGraduationCap />}
          label="Total Attempts"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<FaCheckCircle />}
          label="Passed Candidates"
          value={stats.passed}
          color="green"
        />
        <StatCard
          icon={<FaChartLine />}
          label="Average Score"
          value={`${stats.avgScore}%`}
          color="purple"
        />
      </div>
    )}

    {/* Filters Section */}
    {(visibleFilters.year ||
      visibleFilters.course ||
      visibleFilters.test ||
      visibleFilters.result) && (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">
          <FaFilter className="text-indigo-500" /> Filter Results
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleFilters.year && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Year Level
              </label>
              <Select
                options={yearOptions}
                isClearable
                placeholder={
                  <div className="flex items-center gap-2">
                    <FaGraduationCap /> Select Year
                  </div>
                }
                styles={customSelectStyles}
                value={filters.year}
                onChange={(v) => setFilters((f) => ({ ...f, year: v }))}
              />
            </div>
          )}

          {visibleFilters.course && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Course
              </label>
              <Select
                options={courseOptions}
                isClearable
                placeholder={
                  <div className="flex items-center gap-2">
                    <FaBookOpen /> Select Course
                  </div>
                }
                styles={customSelectStyles}
                value={filters.course_id}
                onChange={(v) =>
                  setFilters((f) => ({ ...f, course_id: v }))
                }
              />
            </div>
          )}

          {visibleFilters.test && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Specific Test
              </label>
              <Select
                options={testOptions}
                isClearable
                placeholder={
                  <div className="flex items-center gap-2">
                    <FaClipboardList /> Select Test
                  </div>
                }
                styles={customSelectStyles}
                value={filters.test_id}
                onChange={(v) => setFilters((f) => ({ ...f, test_id: v }))}
                isDisabled={!filters.course_id}
              />
            </div>
          )}

          {visibleFilters.result && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Status
              </label>
              <Select
                options={resultOptions}
                isClearable
                placeholder={
                  <div className="flex items-center gap-2">
                    <FaCheckCircle /> All Statuses
                  </div>
                }
                styles={customSelectStyles}
                value={filters.result}
                onChange={(v) => setFilters((f) => ({ ...f, result: v }))}
              />
            </div>
          )}
        </div>
      </div>
    )}

    {/* Data Table Section */}
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {loading ? (
        <LoadingSkeleton />
      ) : results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-5">Student Details</th>
                <th className="p-5 text-center">Assessment Context</th>
                <th className="p-5 text-center">Performance</th>
                <th className="p-5 text-center">Outcome</th>
                <th className="p-5 text-right">Completion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r, i) => (
                <tr
                  key={i}
                  className="hover:bg-indigo-50/30 transition-colors duration-150 group"
                >
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-200 group-hover:bg-white group-hover:border-indigo-200 transition-colors">
                        {r.student_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {r.student_name}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {r.roll_no}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="inline-block text-left">
                      <div className="text-sm font-semibold text-slate-700">
                        {r.course_name}
                      </div>
                      <div className="text-xs text-indigo-500 font-medium mt-0.5">
                        {r.test_title}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-800">
                        {r.percentage}%
                      </span>
                      <span className="text-xs text-slate-400">
                        {r.score} marks
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <StatusBadge status={r.pass_status} />
                  </td>
                  <td className="p-5 text-right">
                    <div className="text-sm font-medium text-slate-600 flex items-center justify-end gap-2">
                      <FaCalendarAlt className="text-slate-300" />
                      {new Date(r.submitted_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    
    {/* Footer info */}
    {!loading && results.length > 0 && (
      <div className="text-center text-xs text-slate-400">
        Showing all {results.length} results matching your criteria.
      </div>
    )}
  </div>

  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `}</style>
</div>



);
}