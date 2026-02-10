import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import {
  FaSpinner,
  FaChartBar,
  FaUserTie,
  FaListUl
} from "react-icons/fa";

export default function FeedbackAnalysis({ user }) {
  /* -------------------- STATE (ALWAYS FIRST) -------------------- */
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const [staffSummary, setStaffSummary] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [questionBreakdown, setQuestionBreakdown] = useState([]);

  const token = localStorage.getItem("token");

  /* -------------------- EFFECT -------------------- */
  useEffect(() => {
    const init = async () => {
      if (!["HOD", "Principal"].includes(user.role)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await axios.get(
          `${BASE_URL}/feedback/sessions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSessions(res.data || []);
      } catch {
        Swal.fire("Error", "Failed to load feedback sessions", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user.role, token]);

  /* -------------------- HANDLERS -------------------- */

  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setSelectedStaff(null);
      setQuestionBreakdown([]);
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/feedback/session/${session.session_id}/staff-summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffSummary(res.data || []);
    } catch {
      Swal.fire("Error", "Failed to load staff summary", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = async (staff) => {
    try {
      setSelectedStaff(staff);
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/feedback/session/${selectedSession.session_id}/staff/${staff.staff_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuestionBreakdown(res.data?.ratings || []);
    } catch {
      Swal.fire("Error", "Failed to load question breakdown", "error");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- ACCESS GUARD (RENDER LEVEL) -------------------- */

  if (!["HOD", "Principal"].includes(user.role)) {
    return (
      <div className="p-6 text-center text-gray-500">
        Access restricted to HOD and Principal.
      </div>
    );
  }

  /* -------------------- COMMON STATES -------------------- */

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
      </div>
    );
  }

  /* -------------------- RENDER -------------------- */

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FaChartBar />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            Feedback Analysis
          </h1>
          <p className="text-sm text-gray-500">
            Staff performance and question-wise breakdown
          </p>
        </div>
      </div>

      {/* SESSION SELECT */}
      <div className="flex gap-3 flex-wrap">
        {sessions.length === 0 && (
          <p className="text-gray-400">No feedback sessions available.</p>
        )}

        {sessions.map(s => (
          <button
            key={s.session_id}
            onClick={() => handleSelectSession(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition
              ${selectedSession?.session_id === s.session_id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 hover:bg-gray-50"}
            `}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* STAFF SUMMARY */}
      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* STAFF AVERAGE TABLE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
              <FaUserTie className="text-indigo-600" />
              <h2 className="font-bold text-gray-700">
                Staff Average Ratings
              </h2>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold">
                <tr>
                  <th className="p-4 text-left">Staff</th>
                  <th className="p-4 text-right">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffSummary.map((s, i) => (
                  <tr
                    key={i}
                    onClick={() => handleSelectStaff(s)}
                    className={`cursor-pointer hover:bg-gray-50
                      ${selectedStaff?.staff_id === s.staff_id ? "bg-indigo-50" : ""}
                    `}
                  >
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4 text-right font-bold text-indigo-600">
                      {s.avg_rating}
                    </td>
                  </tr>
                ))}

                {staffSummary.length === 0 && (
                  <tr>
                    <td colSpan="2" className="p-6 text-center text-gray-400">
                      No feedback data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* QUESTION BREAKDOWN */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
              <FaListUl className="text-green-600" />
              <h2 className="font-bold text-gray-700">
                Question-wise Breakdown
              </h2>
            </div>

            {!selectedStaff && (
              <div className="p-6 text-center text-gray-400">
                Select a staff to view detailed ratings
              </div>
            )}

            {selectedStaff && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-4 text-left">Question</th>
                    <th className="p-4 text-right">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {questionBreakdown.map((q, i) => (
                    <tr key={i}>
                      <td className="p-4">{q.question}</td>
                      <td className="p-4 text-right font-bold text-green-600">
                        {q.avg_rating}
                      </td>
                    </tr>
                  ))}

                  {questionBreakdown.length === 0 && (
                    <tr>
                      <td colSpan="2" className="p-6 text-center text-gray-400">
                        No question data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
