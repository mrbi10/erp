import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import {
  FaSpinner,
  FaUserTie,
  FaCheckCircle,
  FaPaperPlane,
  FaStar,
  FaInfoCircle,
  FaChevronLeft,
  FaHistory,
  FaCalendarAlt
} from "react-icons/fa";

export default function GiveFeedback({ user }) {

  /* ===================== STATE ===================== */
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [staff, setStaff] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  /* ===================== DATA FETCHING ===================== */

  // 1. Fetch Sessions on Mount
  useEffect(() => {
    if (user.role !== "student") return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${BASE_URL}/feedback/student/session`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSessions(res.data || []);
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Unable to load feedback sessions.',
          confirmButtonColor: '#4f46e5'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user.role, token]);

  // 2. Fetch Details when Session Selected
  useEffect(() => {
    if (!selectedSession) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setAnswers({});

        let staffData = [];
        let questionData = [];

        if (selectedSession.feedback_type === "staff") {
          const [staffRes, questionRes] = await Promise.all([
            axios.get(
              `${BASE_URL}/feedback/student/staff/${selectedSession.session_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
            axios.get(
              `${BASE_URL}/feedback/questions?sessionId=${selectedSession.session_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
          ]);

          staffData = staffRes.data || [];
          questionData = questionRes.data || [];
        } else {
          // Non-staff feedback
          const questionRes = await axios.get(
            `${BASE_URL}/feedback/questions?sessionId=${selectedSession.session_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          questionData = questionRes.data || [];
        }

        setStaff(staffData);
        setQuestions(questionData);

      } catch (error) {
        Swal.fire("Error", "Failed to load feedback form", "error");
        setSelectedSession(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [selectedSession, token]);

  const firstError = document.querySelector(".text-red-600");
  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  /* ===================== LOGIC & HELPERS ===================== */

  const handleAnswerChange = (staffId, questionId, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [questionId]: {
          ...prev[staffId]?.[questionId],
          [field]: value
        }
      }
    }));
  };

  // Calculate completion percentage
  const progress = useMemo(() => {
    if (!questions.length) return 0;

    const mandatoryQuestions = questions.filter(q => q.is_optional === 0);

    if (!mandatoryQuestions.length) return 100;

    let totalRequired = 0;
    let answeredCount = 0;

    if (selectedSession?.feedback_type === "staff") {

      staff.forEach(s => {
        mandatoryQuestions.forEach(q => {
          totalRequired++;

          const ans = answers[s.staff_id]?.[q.question_id];

          if (!ans) return;

          if (
            (q.question_type === "rating" || q.question_type === "yesno") &&
            ans.rating != null
          ) answeredCount++;

          if (
            q.question_type === "text" &&
            ans.answer_text?.trim()
          ) answeredCount++;
        });
      });

    } else {

      mandatoryQuestions.forEach(q => {
        totalRequired++;

        const ans = answers["general"]?.[q.question_id];

        if (!ans) return;

        if (
          (q.question_type === "rating" || q.question_type === "yesno") &&
          ans.rating != null
        ) answeredCount++;

        if (
          q.question_type === "text" &&
          ans.answer_text?.trim()
        ) answeredCount++;
      });
    }

    if (totalRequired === 0) return 0;

    return Math.round((answeredCount / totalRequired) * 100);

  }, [answers, staff, questions, selectedSession]);


  const isQuestionMissing = (q, staffKey) => {
    if (q.is_optional === 1) return false;

    const ans = answers[staffKey]?.[q.question_id];

    if (!ans) return true;

    if (
      (q.question_type === "rating" || q.question_type === "yesno") &&
      ans.rating == null
    ) return true;

    if (
      q.question_type === "text" &&
      !ans.answer_text?.trim()
    ) return true;

    return false;
  };

  const handleSubmit = async () => {

    // ================= VALIDATION =================
    // ================= VALIDATION =================
    if (selectedSession.feedback_type === "staff") {

      for (const s of staff) {
        for (const q of questions) {

          if (q.is_optional === 1) continue;

          const ans = answers[s.staff_id]?.[q.question_id];

          if (
            !ans ||
            ((q.question_type === "rating" || q.question_type === "yesno") && ans.rating == null) ||
            (q.question_type === "text" && !ans.answer_text?.trim())
          ) {
            Swal.fire("Incomplete", "Please answer all mandatory questions", "warning");
            return;
          }
        }
      }

    } else {

      for (const q of questions) {

        if (q.is_optional === 1) continue;

        const ans = answers["general"]?.[q.question_id];

        if (
          !ans ||
          ((q.question_type === "rating" || q.question_type === "yesno") && ans.rating == null) ||
          (q.question_type === "text" && !ans.answer_text?.trim())
        ) {
          Swal.fire("Incomplete", "Please answer all mandatory questions", "warning");
          return;
        }
      }

    }

    const confirm = await Swal.fire({
      title: "Submit Feedback?",
      text: "This action cannot be undone.",
      icon: "question",
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    try {
      setSubmitting(true);

      const payload = {
        session_id: selectedSession.session_id,
        answers: []
      };

      if (selectedSession.feedback_type === "staff") {

        staff.forEach(s => {
          questions.forEach(q => {
            const ans = answers[s.staff_id]?.[q.question_id];

            payload.answers.push({
              staff_id: s.staff_id,
              question_id: q.question_id,
              answer_value: ans?.rating ?? null,
              answer_text: ans?.answer_text ?? null
            });
          });
        });

      } else {

        questions.forEach(q => {
          const ans = answers["general"]?.[q.question_id];

          payload.answers.push({
            staff_id: null,
            question_id: q.question_id,
            answer_value: ans?.rating ?? null,
            answer_text: ans?.answer_text ?? null
          });
        });

      }

      await axios.post(
        `${BASE_URL}/feedback/student/submit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Submitted!", "Thank you for your feedback.", "success");

      const updatedSessions = sessions.map(s =>
        s.session_id === selectedSession.session_id
          ? { ...s, already_submitted: 1 }
          : s
      );

      setSessions(updatedSessions);
      setSelectedSession(prev => ({ ...prev, already_submitted: 1 }));

    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q, qIdx, staffKey) => {
    return (
      <div key={q.question_id}>

        <div className="flex items-start gap-3 mb-4">
          <span className="text-slate-300 font-bold text-sm mt-0.5">
            Q{qIdx + 1}
          </span>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-700">
              {q.question_text}
            </p>
            {q.is_optional === 1 ? (
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase">
                Optional
              </span>
            ) : (
              <span className="text-red-500 text-xs font-bold">
                *
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        {q.question_type === "rating" && (
          <div className="flex gap-2">
            {Array.from({ length: q.max_rating || 5 }).map((_, i) => {
              const val = i + 1;
              const isSelected =
                answers[staffKey]?.[q.question_id]?.rating === val;

              return (
                <button
                  key={val}
                  onClick={() =>
                    handleAnswerChange(
                      staffKey,
                      q.question_id,
                      "rating",
                      val
                    )
                  }
                  className={`w-10 h-10 rounded-lg border ${isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-white"
                    }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* Text */}
        {q.question_type === "text" && (
          <textarea
            value={answers[staffKey]?.[q.question_id]?.answer_text || ""}
            onChange={(e) =>
              handleAnswerChange(
                staffKey,
                q.question_id,
                "answer_text",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3 mt-2"
            rows={3}
          />
        )}

        {/* Yes / No */}
        {q.question_type === "yesno" && (
          <div className="flex gap-3">
            {[1, 0].map(val => (
              <button
                key={val}
                onClick={() =>
                  handleAnswerChange(
                    staffKey,
                    q.question_id,
                    "rating",
                    val
                  )
                }
                className={`px-4 py-2 rounded-lg border ${answers[staffKey]?.[q.question_id]?.rating === val
                  ? "bg-indigo-600 text-white"
                  : "bg-white"
                  }`}
              >
                {val === 1 ? "Yes" : "No"}
              </button>
            ))}
          </div>
        )}

      </div>
    );
  };

  /* ===================== RENDER: ACCESS DENIED ===================== */
  if (user.role !== "student") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FaInfoCircle className="text-3xl opacity-50" />
        </div>
        <h2 className="text-xl font-bold text-slate-600">Access Restricted</h2>
        <p className="text-sm">This module is only available for students.</p>
      </div>
    );
  }

  /* ===================== RENDER: LOADING ===================== */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaStar className="text-indigo-200 text-xl" />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-bold animate-pulse tracking-wide">
          {selectedSession ? "Loading Feedback Form..." : "Loading Sessions..."}
        </p>
      </div>
    );
  }

  /* ===================== RENDER: SESSION LIST (DASHBOARD) ===================== */
  if (!selectedSession || selectedSession.already_submitted) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Feedback Sessions</h1>
              <p className="text-slate-500 mt-2">Rate your academic experience and help us improve.</p>
            </div>
            {selectedSession?.already_submitted && (
              <button
                onClick={() => setSelectedSession(null)}
                className="text-indigo-600 font-semibold hover:underline flex items-center gap-2"
              >
                <FaChevronLeft size={12} /> Back to List
              </button>
            )}
          </div>

          {/* Empty State */}
          {sessions.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 shadow-sm mt-10">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FaCheckCircle className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">All Caught Up!</h3>
              <p className="text-slate-500 mt-2">There are no pending feedback sessions at this moment.</p>
            </div>
          )}

          {/* Session Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(s => {
              const isSubmitted = s.already_submitted === 1;
              return (
                <div
                  key={s.session_id}
                  className={`
                                group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[220px]
                                ${isSubmitted
                      ? "bg-slate-50 border-slate-200 opacity-80 hover:opacity-100"
                      : "bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 hover:border-indigo-100"
                    }
                            `}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isSubmitted ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {isSubmitted ? "Completed" : "Active"}
                      </span>
                      {isSubmitted && <FaCheckCircle className="text-green-500 text-xl" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-indigo-700 transition-colors">
                      {s.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <FaCalendarAlt className="text-slate-400" />
                      <span>Due: {new Date(s.end_date).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => !isSubmitted && setSelectedSession(s)}
                    disabled={isSubmitted}
                    className={`
                                    w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-6
                                    ${isSubmitted
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-slate-900 text-white hover:bg-indigo-600 shadow-lg"
                      }
                                `}
                  >
                    {isSubmitted ? (
                      <> <FaHistory /> Viewed </>
                    ) : (
                      <> Start Feedback <FaPaperPlane className="text-xs" /> </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ===================== RENDER: FEEDBACK FORM (WIZARD) ===================== */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">

      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                title="Back to Sessions"
              >
                <FaChevronLeft />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide opacity-50">Feedback Session</h2>
                <h1 className="text-lg font-bold text-slate-800 leading-none">{selectedSession.title}</h1>
              </div>
            </div>

            {/* Circular Progress */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{progress}% Complete</p>
                <p className="text-[10px] text-slate-400">{progress === 100 ? "Ready to submit" : "Keep going"}</p>
              </div>
              <div className="relative w-10 h-10">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="text-indigo-600 transition-all duration-500 ease-out"
                    strokeDasharray={`${progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-indigo-800">
                  {progress}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 pb-32 space-y-8">

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <p>Your feedback is <strong>anonymous</strong>. Please rate each faculty member honestly to help improve teaching quality.</p>
        </div>

        {/* Staff Cards Loop */}
        {selectedSession.feedback_type === "staff" ? (

          /* ================= STAFF BASED ================= */
          staff.map((s, index) => (
            <div
              key={s.staff_id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >

              {/* Staff Header */}
              <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-200">
                  <FaUserTie className="text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {s.subject_name ? `${s.subject_name} - ${s.subject_code}` : "Faculty"}
                  </span>
                </div>
              </div>

              {/* Questions */}
              <div className="p-6 space-y-8">
                {questions.map((q, qIdx) => renderQuestion(q, qIdx, s.staff_id))}
              </div>
            </div>
          ))

        ) : (

          /* ================= NON-STAFF BASED ================= */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-8">
            {questions.map((q, qIdx) => renderQuestion(q, qIdx, "general"))}
          </div>

        )}

        {/* --- FIXED SUBMIT FOOTER --- */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-5px_30px_rgba(0,0,0,0.05)] z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-700">Finished Rating?</p>
              <p className="text-xs text-slate-400">Review your answers before submitting.</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`
                    flex-1 md:flex-none md:w-64 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all transform
                    ${submitting
                  ? "bg-slate-100 text-slate-400 cursor-wait"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-indigo-200"
                }
                `}
            >
              {submitting ? (
                <> <FaSpinner className="animate-spin" /> Processing... </>
              ) : (
                <> Submit Feedback <FaPaperPlane /> </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}