import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function PlacementResults({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Fetch results (ROLE AWARE)
  // -----------------------------
  const fetchResults = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/results`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire(
          "Error",
          data.message || "Failed to load results",
          "error"
        );
      }

      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // -----------------------------
  // Helpers
  // -----------------------------
  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("en-GB") : "-";

  const pageTitleByRole = {
    student: "My Test Results",
    trainer: "Student Results",
    CA: "Class Results",
    HOD: "Department Results",
    Principal: "Institution Results",
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {pageTitleByRole[user.role] || "Results"}
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading results...</p>
      ) : results.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          No results available
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Test</th>

                {user.role !== "student" && (
                  <th className="px-4 py-3 text-left">Student</th>
                )}

                <th className="px-4 py-3 text-center">Attempt</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Percentage</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Submitted At</th>
              </tr>
            </thead>

            <tbody>
              {results.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">
                    {r.course_name}
                  </td>
                  <td className="px-4 py-3">
                    {r.test_title}
                  </td>

                  {user.role !== "student" && (
                    <td className="px-4 py-3">
                      {r.student_name} ({r.roll_no})
                    </td>
                  )}

                  <td className="px-4 py-3 text-center">
                    {r.attempt_no}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.score}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.percentage != null ? `${r.percentage}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.pass_status === "pass" ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <FaCheckCircle /> Pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <FaTimesCircle /> Fail
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {formatDate(r.submitted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
