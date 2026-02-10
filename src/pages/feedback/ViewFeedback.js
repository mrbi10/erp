import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import {
  FaSpinner,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaStar
} from "react-icons/fa";

export default function ViewFeedback({ user }) {
  /* -------------------- STATE (ALWAYS FIRST) -------------------- */
  const [loading, setLoading] = useState(true);

  // student
  const [myFeedback, setMyFeedback] = useState([]);

  // CA
  const [submissionSummary, setSubmissionSummary] = useState(null);

  // HOD / Principal
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [staffSummary, setStaffSummary] = useState([]);

  const token = localStorage.getItem("token");

  /* -------------------- EFFECT -------------------- */
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // ===== STUDENT =====
        if (user.role === "student") {
          const res = await axios.get(
            `${BASE_URL}/feedback/student/my-feedback`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMyFeedback(res.data || []);
        }

        // ===== CA =====
        else if (user.role === "CA") {
          const res = await axios.get(
            `${BASE_URL}/feedback/class/submission-summary`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSubmissionSummary(res.data);
        }

        // ===== HOD / PRINCIPAL =====
        else if (["HOD", "Principal"].includes(user.role)) {
          const sessRes = await axios.get(
            `${BASE_URL}/feedback/sessions`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSessions(sessRes.data || []);
        }

      } catch {
        Swal.fire("Error", "Failed to load feedback data", "error");
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
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/feedback/session/${session.session_id}/staff-summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffSummary(res.data || []);
    } catch {
      Swal.fire("Error", "Failed to load session data", "error");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- COMMON STATES -------------------- */

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
      </div>
    );
  }

  /* ============================================================
     STUDENT VIEW
     ============================================================ */
  if (user.role === "student") {
    if (myFeedback.length === 0) {
      return (
        <div className="p-6 text-center text-gray-500">
          You have not submitted feedback yet.
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
          <FaStar className="text-yellow-500" /> My Feedback
        </h1>

        {myFeedback.map((staff, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border">
            <h3 className="font-bold text-gray-800">{staff.staff_name}</h3>

            <ul className="mt-3 space-y-2">
              {staff.ratings.map((r, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{r.question}</span>
                  <span className="font-bold text-indigo-600">
                    {r.rating}/10
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  /* ============================================================
     CA VIEW (COUNT ONLY)
     ============================================================ */
  if (user.role === "CA") {
    if (!submissionSummary) return null;

    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
          <FaUsers className="text-indigo-600" /> Class Feedback Status
        </h1>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-xl text-center">
            <FaCheckCircle className="text-green-600 text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Submitted</p>
            <p className="text-3xl font-extrabold text-green-700">
              {submissionSummary.submitted}
            </p>
          </div>

          <div className="bg-red-50 p-6 rounded-xl text-center">
            <FaTimesCircle className="text-red-600 text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">Not Submitted</p>
            <p className="text-3xl font-extrabold text-red-700">
              {submissionSummary.not_submitted}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     HOD / PRINCIPAL VIEW (ACTUAL DATA)
     ============================================================ */
  if (["HOD", "Principal"].includes(user.role)) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        <h1 className="text-xl font-extrabold text-gray-800">
          Feedback Overview
        </h1>

        {/* SESSION SELECT */}
        <div className="flex gap-3 flex-wrap">
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSelectSession(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border
                ${selectedSession?.session_id === s.session_id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"}
              `}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* STAFF SUMMARY */}
        {selectedSession && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4 text-left">Staff</th>
                  <th className="p-4 text-right">Average Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffSummary.map((s, i) => (
                  <tr key={i}>
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4 text-right font-bold text-indigo-600">
                      {s.avg_rating}
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

  /* ============================================================
     FALLBACK
     ============================================================ */
  return (
    <div className="p-6 text-center text-gray-500">
      No access to feedback data.
    </div>
  );
}
