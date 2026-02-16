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
  const [ratings, setRatings] = useState({});
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
        setRatings({}); // Reset ratings

        const [staffRes, questionRes] = await Promise.all([
          axios.get(`${BASE_URL}/feedback/student/staff/${selectedSession.session_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/feedback/questions?sessionId=${selectedSession.session_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setStaff(staffRes.data || []);
        setQuestions(questionRes.data || []);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load feedback form", "error");
        setSelectedSession(null); // Go back if error
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [selectedSession, token]);

  /* ===================== LOGIC & HELPERS ===================== */

  const handleRatingChange = (staffId, questionId, value) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [questionId]: value
      }
    }));
  };

  // Calculate completion percentage
  const progress = useMemo(() => {
    if (!staff.length || !questions.length) return 0;
    const totalRequired = staff.length * questions.length;
    
    let answeredCount = 0;
    Object.values(ratings).forEach(staffRatings => {
        answeredCount += Object.keys(staffRatings).length;
    });

    return Math.min(100, Math.round((answeredCount / totalRequired) * 100));
  }, [ratings, staff.length, questions.length]);

  const handleSubmit = async () => {
    // 1. Validation
    for (const s of staff) {
      for (const q of questions) {
        if (!ratings[s.staff_id]?.[q.question_id]) {
          Swal.fire({
            title: "Incomplete Feedback",
            html: `Please rate <b>${s.name}</b> for <br/>"<i>${q.question_text}</i>"`,
            icon: "warning",
            confirmButtonColor: "#4f46e5"
          });
          return;
        }
      }
    }

    // 2. Confirmation
    const confirm = await Swal.fire({
      title: "Submit Feedback?",
      text: "This action cannot be undone.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8"
    });

    if (!confirm.isConfirmed) return;

    // 3. Submission
    try {
      setSubmitting(true);

      const payload = {
        session_id: selectedSession.session_id,
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

      // 4. Success State
      Swal.fire({
        title: "Submitted!",
        text: "Thank you for your valuable feedback.",
        icon: "success",
        confirmButtonColor: "#4f46e5"
      });

      // Update local state to show "Submitted" without refetching
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
                                    <span>Due: {new Date(s.end_date).toLocaleDateString()}</span>
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
        {staff.map((s, index) => (
          <div
            key={s.staff_id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Staff Header */}
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-200">
                  <FaUserTie className="text-xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                  {index + 1}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {s.subject_name || s.designation || "Faculty"}
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="p-6 space-y-8">
              {questions.map((q, qIdx) => (
                <div key={q.question_id} className="group">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-slate-300 font-bold text-sm mt-0.5">Q{qIdx + 1}</span>
                    <p className="font-medium text-slate-700 group-hover:text-indigo-800 transition-colors">
                      {q.question_text}
                    </p>
                  </div>

                  {/* Rating Block Interactive Component */}
                  <div className="pl-8">
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: q.max_rating || 5 }).map((_, i) => {
                        const val = i + 1;
                        const isSelected = ratings[s.staff_id]?.[q.question_id] === val;
                        
                        // Dynamic Color Logic (Red -> Yellow -> Green)
                        let activeColorClass = "bg-indigo-500 border-indigo-600 shadow-indigo-200";
                        if (q.max_rating >= 5) {
                             if (val / q.max_rating <= 0.4) activeColorClass = "bg-rose-500 border-rose-600 shadow-rose-200";
                             else if (val / q.max_rating <= 0.7) activeColorClass = "bg-amber-400 border-amber-500 shadow-amber-200";
                             else activeColorClass = "bg-emerald-500 border-emerald-600 shadow-emerald-200";
                        }

                        return (
                          <button
                            key={val}
                            onClick={() => handleRatingChange(s.staff_id, q.question_id, val)}
                            className={`
                              w-10 h-10 md:w-12 md:h-12 rounded-lg text-sm font-bold border-b-4 transition-all duration-150 active:border-b-0 active:translate-y-1
                              ${isSelected 
                                ? `${activeColorClass} text-white translate-y-0.5 border-b-0 shadow-inner scale-105` 
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                              }
                            `}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                    {/* <div className="flex justify-between w-full max-w-[280px] mt-2 px-1">
                        <span className="text-[10px] uppercase font-bold text-slate-300">Poor</span>
                        <span className="text-[10px] uppercase font-bold text-slate-300">Excellent</span>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
  );
}