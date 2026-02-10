import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { 
  FaSpinner, 
  FaUserTie, 
  FaCheckCircle, 
  FaPaperPlane, 
  FaStar,
  FaInfoCircle
} from "react-icons/fa";

export default function GiveFeedback({ user }) {

  /* ===================== STATE ===================== */
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    if (user.role !== "student") return;

    const init = async () => {
      try {
        setLoading(true);

        // 1️⃣ Active session
        const sessionRes = await axios.get(
          `${BASE_URL}/feedback/student/session`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const sess = sessionRes.data;
        if (!sess) {
          setSession(null);
          return;
        }

        setSession(sess);

        if (sess.already_submitted) return;

        // 2️⃣ Staff + questions
        const [staffRes, questionRes] = await Promise.all([
          axios.get(
            `${BASE_URL}/feedback/student/staff/${sess.session_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${BASE_URL}/feedback/questions?sessionId=${sess.session_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ]);

        setStaff(staffRes.data || []);
        setQuestions(questionRes.data || []);

      } catch (err) {
        Swal.fire("Error", "Failed to load feedback form", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user.role, token]);

  /* ===================== ROLE GUARD ===================== */
  if (user.role !== "student") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 p-6 text-center">
        <FaInfoCircle className="text-4xl mb-4 opacity-20" />
        <p className="font-medium">Access Restricted</p>
        <p className="text-sm">Only students can access this feedback module.</p>
      </div>
    );
  }

  /* ===================== HANDLERS ===================== */

  const handleRatingChange = (staffId, questionId, value) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [questionId]: value
      }
    }));
  };

  const getProgress = () => {
    if (!staff.length || !questions.length) return 0;
    let totalRequired = staff.length * questions.length;
    let answered = 0;
    
    staff.forEach(s => {
      questions.forEach(q => {
        if (ratings[s.staff_id]?.[q.question_id]) answered++;
      });
    });
    
    return Math.round((answered / totalRequired) * 100);
  };

  const handleSubmit = async () => {
    // Validate
    for (const s of staff) {
      for (const q of questions) {
        if (!ratings[s.staff_id]?.[q.question_id]) {
          Swal.fire({
            title: "Incomplete Feedback",
            text: `Please rate ${s.name} for "${q.question_text}"`,
            icon: "warning",
            confirmButtonColor: "#4f46e5"
          });
          return;
        }
      }
    }

    const confirm = await Swal.fire({
      title: "Submit Feedback?",
      text: "You cannot edit your response after submission.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444"
    });

    if (!confirm.isConfirmed) return;

    try {
      setSubmitting(true);

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

      Swal.fire({
        title: "Success!",
        text: "Your feedback has been submitted successfully.",
        icon: "success",
        confirmButtonColor: "#4f46e5"
      });
      setSession(prev => ({ ...prev, already_submitted: true }));

    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Submission failed",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <FaUserTie className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
        </div>
        <p className="text-slate-500 text-sm font-bold animate-pulse">Loading Staff List...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-slate-50">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <FaCheckCircle className="text-slate-300 text-5xl" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">All Caught Up!</h3>
        <p className="text-slate-500 mt-2 max-w-md">There are no active feedback sessions currently scheduled for your class.</p>
      </div>
    );
  }

  if (session.already_submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-indigo-50">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
          <p className="text-slate-500 mb-6">Your feedback has been securely recorded. You cannot modify it after submission.</p>
          <div className="p-4 bg-slate-50 rounded-xl text-xs font-mono text-slate-400">
            Session ID: #{session.session_id}
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FaStar className="text-indigo-500" /> Staff Feedback
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Anonymous Evaluation • {session.title}</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{progress}% Complete</p>
                <p className="text-[10px] text-slate-400">Keep going!</p>
             </div>
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-indigo-600"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${progress}, 100`}
                  />
                </svg>
                <span className="text-[10px] font-bold text-indigo-700">{progress}%</span>
             </div>
          </div>
        </div>
        
        {/* Mobile Sub-header */}
        <div className="sm:hidden px-4 pb-2 text-xs text-slate-500 border-t border-slate-50 pt-2 flex justify-between">
           <span>{session.title}</span>
           <span>{staff.length} Faculty Members</span>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-32 space-y-8">
        
        {staff.map((s, index) => (
          <div 
            key={s.staff_id} 
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-transform active:scale-[0.99] sm:active:scale-100 duration-200"
          >
            {/* Staff Card Header */}
            <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100 flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <FaUserTie className="text-xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-lg truncate">{s.name}</h3>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide bg-indigo-50 inline-block px-2 py-0.5 rounded-md mt-1">
                  {s.designation}
                </p>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="p-5 md:p-6 space-y-8 md:space-y-6">
              {questions.map((q, qIdx) => (
                <div key={q.question_id} className="group">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-slate-300 font-bold text-sm mt-0.5">Q{qIdx + 1}.</span>
                    <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed group-hover:text-indigo-800 transition-colors">
                      {q.question_text}
                    </p>
                  </div>

                  {/* Rating Buttons - Responsive Layout */}
                  <div className="pl-7 md:pl-8">
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {Array.from({ length: q.max_rating }).map((_, i) => {
                        const val = i + 1;
                        const isSelected = ratings[s.staff_id]?.[q.question_id] === val;
                        
                        // Color logic based on rating value (Red -> Green)
                        const getColorClass = () => {
                           if (!isSelected) return "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100";
                           if (val <= 3) return "bg-rose-500 text-white border-rose-600 shadow-rose-200";
                           if (val <= 7) return "bg-amber-500 text-white border-amber-600 shadow-amber-200";
                           return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-200";
                        };

                        return (
                          <button
                            key={val}
                            onClick={() => handleRatingChange(s.staff_id, q.question_id, val)}
                            className={`
                              flex-1 sm:flex-none w-10 h-10 md:w-11 md:h-11 rounded-xl
                              flex items-center justify-center
                              text-sm md:text-base font-bold
                              border transition-all duration-200 transform
                              ${getColorClass()}
                              ${isSelected ? "shadow-lg scale-110 -translate-y-1 ring-2 ring-offset-2 ring-transparent" : ""}
                            `}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Labels for scale */}
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1 font-medium uppercase tracking-wider">
                       <span>Poor</span>
                       <span>Excellent</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>

      {/* --- FLOATING ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
           
           <div className="hidden sm:block text-xs text-slate-500">
              <strong className="text-slate-800 block">Almost Done?</strong>
              Ensure all questions are answered before submitting.
           </div>

           <button
             onClick={handleSubmit}
             disabled={submitting}
             className={`
               w-full sm:w-auto flex-1 sm:flex-none
               flex items-center justify-center gap-3
               py-3.5 px-8 rounded-xl
               bg-indigo-600 text-white font-bold text-sm tracking-wide
               shadow-xl shadow-indigo-200
               transform transition-all active:scale-95
               hover:bg-indigo-700
               disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
             `}
           >
             {submitting ? (
               <>
                 <FaSpinner className="animate-spin text-lg" />
                 <span>Processing...</span>
               </>
             ) : (
               <>
                 <span>Submit Feedback</span>
                 <FaPaperPlane />
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
}