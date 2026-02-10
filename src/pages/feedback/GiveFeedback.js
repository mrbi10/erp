import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { FaStar, FaSpinner, FaUserTie } from "react-icons/fa";

export default function GiveFeedback({ user }) {

  /* -------------------- STATE (ALWAYS FIRST) -------------------- */
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  /* -------------------- EFFECT -------------------- */
  useEffect(() => {
    if (user.role !== "student") return;

    const init = async () => {
      try {
        setLoading(true);

        const sess = await axios.get(
          `${BASE_URL}/feedback/student/session`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(r => r.data);

        if (!sess) {
          setSession(null);
          return;
        }

        setSession(sess);

        if (sess.already_submitted) return;

        const [staffRes, questionRes] = await Promise.all([
          axios.get(
            `${BASE_URL}/feedback/student/staff/${sess.session_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${BASE_URL}/feedback/questions`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ]);

        setStaff(staffRes.data);
        setQuestions(questionRes.data);

      } catch {
        Swal.fire("Error", "Failed to load feedback form", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user.role, token]);

  /* -------------------- ROLE GUARD (RENDER LEVEL) -------------------- */
  if (user.role !== "student") {
    return (
      <div className="p-6 text-center text-gray-500">
        Access denied. Students only.
      </div>
    );
  }

  /* -------------------- HANDLERS -------------------- */

  const handleRatingChange = (staffId, questionId, value) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [questionId]: value
      }
    }));
  };

  const handleSubmit = async () => {
    for (const s of staff) {
      for (const q of questions) {
        if (!ratings[s.staff_id]?.[q.question_id]) {
          Swal.fire("Incomplete", "Please rate all staff", "warning");
          return;
        }
      }
    }

    const confirm = await Swal.fire({
      title: "Submit Feedback?",
      text: "You cannot change it later",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit"
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);

    try {
      const payload = {
        session_id: session.session_id,
        ratings: []
      };

      staff.forEach(s => {
        questions.forEach(q => {
          payload.ratings.push({
            staff_id: s.staff_id,
            question_id: q.question_id,
            rating: ratings[s.staff_id][q.question_id]
          });
        });
      });

      await axios.post(
        `${BASE_URL}/feedback/student/submit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success", "Feedback submitted", "success");
      setSession({ ...session, already_submitted: true });

    } catch {
      Swal.fire("Error", "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- RENDER -------------------- */

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
      </div>
    );
  }

  if (!session) {
    return <div className="p-6 text-center text-gray-500">No active feedback</div>;
  }

  if (session.already_submitted) {
    return (
      <div className="p-6 text-center bg-green-50 text-green-700 rounded-xl">
        You have already submitted feedback.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {staff.map(s => (
        <div key={s.staff_id} className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <FaUserTie className="text-indigo-600" />
            <div>
              <h3 className="font-bold">{s.name}</h3>
              <p className="text-xs text-gray-500">{s.designation}</p>
            </div>
          </div>

          {questions.map(q => (
            <div key={q.question_id} className="mb-4">
              <p className="font-semibold text-sm">{q.question_text}</p>
              <div className="flex gap-2 mt-2">
                {[...Array(10)].map((_, i) => {
                  const val = i + 1;
                  const selected =
                    ratings[s.staff_id]?.[q.question_id] === val;

                  return (
                    <button
                      key={val}
                      onClick={() =>
                        handleRatingChange(s.staff_id, q.question_id, val)
                      }
                      className={`w-9 h-9 rounded-full font-bold
                        ${selected ? "bg-indigo-600 text-white" : "bg-gray-100"}
                      `}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="text-right">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}
