import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaGraduationCap,
  FaChartLine,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function PlacementResults({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Filters
  // -----------------------------
  const [filters, setFilters] = useState({
    year: null,
    course_id: null,
    test_id: null,
    result: null,
  });

  const [courseOptions, setCourseOptions] = useState([]);
  const [testOptions, setTestOptions] = useState([]);

  const token = localStorage.getItem("token");

  // -----------------------------
  // Role based visibility
  // -----------------------------
  const filterConfigByRole = {
    Principal: { year: true, course: true, test: true, result: true },
    HOD: { year: false, course: true, test: true, result: true },
    CA: { year: false, course: true, test: true, result: true },
    student: { year: false, course: false, test: false, result: false },
  };

  const visibleFilters = filterConfigByRole[user.role] || {};

  // -----------------------------
  // Static options
  // -----------------------------
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

  // -----------------------------
  // Fetch courses
  // -----------------------------
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

  // -----------------------------
  // Fetch tests (depends on course)
  // -----------------------------
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

  // -----------------------------
  // Fetch results (API-driven)
  // -----------------------------
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filters.year) params.append("year", filters.year.value);
      if (filters.course_id)
        params.append("course_id", filters.course_id.value);
      if (filters.test_id)
        params.append("test_id", filters.test_id.value);
      if (filters.result)
        params.append("pass_status", filters.result.value);

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

  // -----------------------------
  // Effects
  // -----------------------------
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

  // -----------------------------
  // Stats
  // -----------------------------
  const stats = {
    total: results.length,
    passed: results.filter((r) => r.pass_status === "pass").length,
    avgScore: results.length
      ? (
          results.reduce(
            (sum, r) => sum + Number(r.percentage || 0),
            0
          ) / results.length
        ).toFixed(1)
      : 0,
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      borderRadius: "0.75rem",
      borderColor: "#e5e7eb",
      boxShadow: "none",
      minHeight: "42px",
    }),
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-2">Placement Analytics</h1>
      <p className="text-gray-500 mb-8">
        Viewing as <span className="font-semibold">{user.role}</span>
      </p>

      {user.role !== "student" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<FaGraduationCap />}
            label="Total Attempts"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="Passed"
            value={stats.passed}
            color="green"
          />
          <StatCard
            icon={<FaChartLine />}
            label="Avg Percentage"
            value={`${stats.avgScore}%`}
            color="purple"
          />
        </div>
      )}

      {(visibleFilters.year ||
        visibleFilters.course ||
        visibleFilters.test ||
        visibleFilters.result) && (
        <div className="bg-white p-6 rounded-xl shadow mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {visibleFilters.year && (
            <Select
              options={yearOptions}
              isClearable
              placeholder="Year"
              styles={selectStyles}
              value={filters.year}
              onChange={(v) => setFilters((f) => ({ ...f, year: v }))}
            />
          )}

          {visibleFilters.course && (
            <Select
              options={courseOptions}
              isClearable
              placeholder="Course"
              styles={selectStyles}
              value={filters.course_id}
              onChange={(v) =>
                setFilters((f) => ({ ...f, course_id: v }))
              }
            />
          )}

          {visibleFilters.test && (
            <Select
              options={testOptions}
              isClearable
              placeholder="Test"
              styles={selectStyles}
              value={filters.test_id}
              onChange={(v) =>
                setFilters((f) => ({ ...f, test_id: v }))
              }
            />
          )}

          {visibleFilters.result && (
            <Select
              options={resultOptions}
              isClearable
              placeholder="Result"
              styles={selectStyles}
              value={filters.result}
              onChange={(v) =>
                setFilters((f) => ({ ...f, result: v }))
              }
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="p-20 text-center text-gray-400">Loading…</div>
        ) : results.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            No results found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Student</th>
                <th className="p-4 text-center">Course / Test</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold">{r.student_name}</div>
                    <div className="text-xs text-gray-400">{r.roll_no}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div>{r.course_name}</div>
                    <div className="text-xs text-blue-500">{r.test_title}</div>
                  </td>
                  <td className="p-4 text-center">
                    {r.percentage}% ({r.score})
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={r.pass_status} />
                  </td>
                  <td className="p-4 text-right text-gray-500">
                    {new Date(r.submitted_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// -----------------------------
// Components
// -----------------------------
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
      <div className={`p-4 rounded-xl text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
        status === "pass"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "pass" ? <FaCheckCircle /> : <FaTimesCircle />}
      {status}
    </span>
  );
}

