import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

export default function TrainerResults() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const totalStudents = results.length;
  const passed = results.filter(r => r.pass_status === "pass").length;
  const failed = totalStudents - passed;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Fetch results
  // -----------------------------
  const fetchResults = async () => {
    try {
      const res = await fetch(
        // `${BASE_URL}/placement-training/tests/${testId}/results`,
        `${BASE_URL}/placement-training/results`,

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


  const tableHeaders = [
    "Roll No",
    "Name",
    "Attempt",
    "Score",
    "Percentage",
    "Status",
    "Submitted At"
  ];


  const tableData = results.map(r => ([
    r.roll_no,
    r.name,
    r.attempt_no,
    r.score,
    `${r.percentage}%`,
    r.pass_status.toUpperCase(),
    new Date(r.submitted_at).toLocaleString("en-GB"),
  ]));


  const handleExcelExport = () => {
    const excelData = results.map(r => ({
      "Roll No": r.roll_no,
      "Name": r.name,
      "Attempt": r.attempt_no,
      "Score": r.score,
      "Percentage": `${r.percentage}%`,
      "Status": r.pass_status,
      "Submitted At": new Date(r.submitted_at).toLocaleString("en-GB"),
    }));

    exportToExcel(excelData, "Test_Results", "Results");
  };


  const handlePDFExport = () => {
    generatePDFReport({
      title: "Test Results",
      subTitle: `Test ID: ${testId}`,
      generatedBy: "Trainer",
      filters: [
        { label: "Test ID", value: testId },
        { label: "Total Students", value: totalStudents }
      ],
      stats: [
        { label: "Total", value: totalStudents, color: [79, 70, 229] },
        { label: "Passed", value: passed, color: [22, 163, 74] },
        { label: "Failed", value: failed, color: [220, 38, 38] },
      ],
      tableHeaders,
      tableData,
      fileName: "Test_Results"
    });
  };

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

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleExcelExport}
            className="px-4 py-2 text-sm font-semibold rounded-lg
      bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            Download Excel
          </button>

          <button
            onClick={handlePDFExport}
            className="px-4 py-2 text-sm font-semibold rounded-lg
      bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Download PDF
          </button>
        </div>

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
