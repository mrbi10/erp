import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaCheck,
  FaPaperPlane,
  FaExclamationCircle,
  FaListUl,
  FaChevronLeft,
  FaChevronRight,
  FaTh
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function StudentTestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // New State for Pagination & Palette
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPalette, setShowPalette] = useState(false);

  const timerRef = useRef(null);

  // --- Logic: Security Check ---
  const checkTestStillLive = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/student/tests/${testId}/status`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await res.json();
      if (!res.ok) return false;
      return data.is_live === true;
    } catch (err) {
      console.error("Status check failed", err);
      return false;
    }
  };

  // --- Logic: Navigation ---
  const handleNext = async () => {
    // Optional: Check if test is live every few clicks to prevent cheating
    if(currentIndex % 5 === 0) {
        const stillLive = await checkTestStillLive();
        if (!stillLive) {
            return Swal.fire({
                title: "Test Closed",
                text: "The test has ended.",
                icon: "warning",
                allowOutsideClick: false,
            }).then(() => handleSubmit(true));
        }
    }
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
    setShowPalette(false);
  };

  // --- Logic: Initialization ---
  useEffect(() => {
    Swal.fire({
      title: "Ready to Begin?",
      html: `
        <div class="text-left text-sm space-y-3 text-slate-600">
          <p class="font-medium text-slate-800">⚠️ Important Instructions:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>The timer starts immediately after you click 'Start'.</li>
            <li>Do not refresh or close the window.</li>
            <li>The test will <strong>auto-submit</strong> when time runs out.</li>
          </ul>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Start Assessment",
      confirmButtonColor: "#4f46e5",
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: "#fff",
      customClass: {
        popup: "rounded-3xl",
        confirmButton: "rounded-xl px-6 py-3 font-bold"
      },
      backdrop: `rgba(15, 23, 42, 0.9)`
    }).then((res) => {
      if (res.isConfirmed) startTest();
      else navigate(-1);
    });

    return () => clearInterval(timerRef.current);
  }, []);

  const startTest = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/student/tests/${testId}/start`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        return Swal.fire("Error", data.message, "error").then(() => navigate(-1));
      }

      setAttemptId(data.attempt_id);
      setQuestions(data.questions || []);
      const durationMinutes = data.test.duration_minutes || 30;
      setTimeLeft(durationMinutes * 60);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Logic: Timer ---
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const selectOption = (qid, option) => {
    setAnswers({ ...answers, [qid]: option });
  };

  // --- Logic: Submit ---
  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const answeredCount = Object.keys(answers).length;
      const totalCount = questions.length;
      const result = await Swal.fire({
        title: "Submit Assessment?",
        html: `<p class="text-slate-500">You have answered <b class="text-indigo-600">${answeredCount} / ${totalCount}</b> questions.</p>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "Yes, Submit",
        cancelButtonText: "Review",
        customClass: {
          popup: "rounded-3xl",
          confirmButton: "rounded-xl font-bold",
          cancelButton: "rounded-xl font-bold"
        }
      });
      if (!result.isConfirmed) return;
    }

    const payload = {
      attempt_id: attemptId,
      answers: Object.entries(answers).map(([qid, selected]) => ({
        question_id: Number(qid),
        selected_option: selected,
      })),
    };

    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/student/tests/${testId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) return Swal.fire("Error", data.message, "error");

      Swal.fire({
        title: "Assessment Complete!",
        html: `
            <div class="flex flex-col items-center gap-2 mt-2">
                <div class="text-4xl font-black text-slate-800">${data.score}%</div>
                <div class="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${data.pass_status === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                    ${data.pass_status}
                </div>
            </div>
        `,
        icon: data.pass_status === 'pass' ? "success" : "info",
        confirmButtonText: "View Results",
        confirmButtonColor: "#4f46e5",
        customClass: { popup: "rounded-3xl", confirmButton: "rounded-xl" }
      }).then(() => {
        navigate("/placementtraining/results");
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  // --- Helpers ---
  const progressPercentage = questions.length > 0
    ? (Object.keys(answers).length / questions.length) * 100
    : 0;
  const isLowTime = timeLeft < 300;
  const q = questions[currentIndex];
  const isAnswered = q && answers[q.question_id] !== undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-slate-800">Loading Test...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-32 selection:bg-indigo-100">

      {/* ========================================
          STICKY HEADER
         ======================================== */}
      <div className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Progress Pill */}
          <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
             <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
               <FaListUl />
               <span>{currentIndex + 1} <span className="text-slate-300">/</span> {questions.length}</span>
             </div>
             <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
             </div>
          </div>

          {/* Right: Timer & Submit */}
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${isLowTime ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
                <FaClock /> {formatTime(timeLeft)}
             </div>
             <button 
                onClick={() => handleSubmit(false)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
             >
                Submit <FaPaperPlane className="text-xs" />
             </button>
          </div>
        </div>
      </div>

      {/* ========================================
          QUESTION CARD (Single View)
         ======================================== */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {q && (
          <div key={q.question_id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`group bg-white rounded-[2rem] border transition-all duration-300 ${isAnswered ? "border-indigo-100 shadow-xl shadow-indigo-100/40" : "border-slate-100 shadow-lg shadow-slate-200/50"}`}>
              
              {/* Question Text */}
              <div className="p-6 md:p-8 border-b border-slate-50">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-bold ${isAnswered ? "bg-indigo-600 text-white shadow-indigo-200 shadow-lg" : "bg-slate-100 text-slate-400"}`}>
                    {isAnswered ? <FaCheck /> : currentIndex + 1}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed pt-1">
                    {q.question}
                  </h3>
                </div>
              </div>

              {/* Options */}
              <div className="p-6 md:p-8 bg-slate-50/50 rounded-b-[2rem]">
                <div className="grid grid-cols-1 gap-3">
                  {["A", "B", "C", "D"].map((opt) => {
                    const key = `option_${opt.toLowerCase()}`;
                    const isSelected = answers[q.question_id] === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => selectOption(q.question_id, opt)}
                        className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 active:scale-[0.99] ${isSelected ? "border-indigo-500 bg-indigo-50/60 shadow-sm" : "border-white bg-white hover:border-indigo-100 shadow-sm"}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-[3px] flex items-center justify-center ${isSelected ? "border-indigo-500" : "border-slate-200 bg-slate-50"}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                        </div>
                        <span className={`font-medium ${isSelected ? "text-indigo-900" : "text-slate-600"}`}>{q[key]}</span>
                        <span className="absolute right-4 text-5xl font-black text-slate-900 opacity-[0.03] pointer-events-none">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================
          BOTTOM NAVIGATION BAR (Fixed)
         ======================================== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
           
           {/* Prev Button */}
           <button
             onClick={handlePrev}
             disabled={currentIndex === 0}
             className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${currentIndex === 0 ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"}`}
           >
             <FaChevronLeft />
           </button>

           {/* Palette Toggle */}
           <button 
             onClick={() => setShowPalette(!showPalette)}
             className="flex-1 h-12 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
           >
             <FaTh /> Question {currentIndex + 1}
           </button>

           {/* Next Button */}
           <button
             onClick={handleNext}
             disabled={currentIndex === questions.length - 1}
             className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${currentIndex === questions.length - 1 ? "border-slate-100 text-slate-300 cursor-not-allowed" : "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-300 active:scale-95"}`}
           >
             <FaChevronRight />
           </button>
        </div>
      </div>

      {/* ========================================
          QUESTION PALETTE (Drawer/Modal)
         ======================================== */}
      {showPalette && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPalette(false)}></div>
            
            {/* Content */}
            <div className="relative bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Question Palette</h3>
                    <button onClick={() => setShowPalette(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Close</button>
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto p-1">
                    {questions.map((_, idx) => {
                        const status = answers[questions[idx].question_id] !== undefined ? "answered" : "unanswered";
                        const isCurrent = idx === currentIndex;
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => jumpToQuestion(idx)}
                                className={`
                                    h-12 rounded-xl font-bold text-sm transition-all border-2
                                    ${isCurrent 
                                        ? "border-indigo-600 text-indigo-700 bg-indigo-50" 
                                        : status === "answered" 
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200" 
                                            : "bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200"}
                                `}
                            >
                                {idx + 1}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-6 flex gap-4 text-xs font-bold text-slate-500 justify-center">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Answered</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-indigo-600 rounded-full"></div> Current</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-full"></div> Skipped</div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}