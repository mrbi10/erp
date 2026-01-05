import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function TrainerResults() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Fetch results
  // -----------------------------
  const fetchResults = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/tests/${testId}/results`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire("Error", data.message || "Failed to fetch results", "error");
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
  }, [testId]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          <FaArrowLeft />
        </button>

        <h1 className="text-2xl font-bold">
          Test Results
        </h1>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading results...</p>
      ) : results.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          No students have attempted this test yet
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Roll No</th>
                <th className="px-4 py-3 text-left">Name</th>
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
                    {r.roll_no}
                  </td>
                  <td className="px-4 py-3">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.attempt_no}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.score}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.percentage}%
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
                    {new Date(r.submitted_at).toLocaleString("en-GB")}
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
