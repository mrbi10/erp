import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaCheck,
  FaPaperPlane,
  FaListUl,
  FaChevronLeft,
  FaChevronRight,
  FaTh,
  FaExclamationTriangle,
  FaShieldAlt,
  FaExpand
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

/* ------------------------------------------------------------------
 * WRAPPER: FULLSCREEN OVERLAY (Fixes Scroll & Z-Index issues)
 * ------------------------------------------------------------------ */
const FullScreenOverlay = ({ children, className = "" }) => (
  <div className={`fixed inset-0 z-[9999] bg-slate-50 overflow-y-auto overflow-x-hidden ${className}`}>
    {children}
  </div>
);

/* ------------------------------------------------------------------
 * SUB-COMPONENT: LOADING VIEW
 * ------------------------------------------------------------------ */
const LoadingView = () => (
  <FullScreenOverlay className="flex flex-col items-center justify-center p-4">
    <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-slate-100">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-bold text-slate-900">Securing Environment</h2>
      <p className="text-slate-500 text-sm mt-2 leading-relaxed">
        Please wait while we establish a secure connection for your assessment.
      </p>
    </div>
  </FullScreenOverlay>
);

/* ------------------------------------------------------------------
 * SUB-COMPONENT: START SCREEN
 * ------------------------------------------------------------------ */
const StartScreen = ({ onStart, onCancel }) => (
  <FullScreenOverlay className="flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50/50">
    <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden border border-white/60 my-auto">
      {/* Header */}
      <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner">
          <FaShieldAlt className="text-4xl text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Secure Assessment Environment</h1>
        <p className="text-slate-400 mt-2 text-sm font-medium">Strict Malpractice Monitoring Enabled</p>
      </div>

      {/* Body */}
      <div className="p-8 space-y-8">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-5">
          <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-amber-600">
            <FaExclamationTriangle />
          </div>
          <div className="text-sm text-amber-900">
            <h3 className="font-bold mb-1 text-base">Two-Strike Policy</h3>
            <p className="leading-relaxed opacity-90">
              You are allowed exactly <b>one warning</b>. The second violation (tab switch, exit fullscreen, loss of focus) will <b className="text-red-600">immediately terminate</b> your exam.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">Security Protocols</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 mt-0.5">1</span>
              <span>Must remain in <strong className="text-slate-800">Fullscreen</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 mt-0.5">2</span>
              <span><strong className="text-red-600">Alt+Tab</strong> is detected instantly.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 mt-0.5">3</span>
              <span>Shortcuts (Ctrl+C/V) disabled.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 mt-0.5">4</span>
              <span>Right-click menu disabled.</span>
            </li>
          </ul>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            className="flex-[2] py-4 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm"
          >
            I Agree & Start Exam <FaExpand className="opacity-70" />
          </button>
        </div>
      </div>
    </div>
  </FullScreenOverlay>
);

/* ------------------------------------------------------------------
 * MAIN COMPONENT: STUDENT TEST ATTEMPT
 * ------------------------------------------------------------------ */
export default function StudentTestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Security & UX State
  const [examStarted, setExamStarted] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pagination & Palette State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPalette, setShowPalette] = useState(false);

  const timerRef = useRef(null);
  const MAX_WARNINGS = 2;

  // --- Logic: Security & Malpractice ---

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log(err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const logViolation = async (type) => {
    if (!attemptId) return;
    try {
      fetch(`${BASE_URL}/placement-training/student/tests/log-violation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ attempt_id: attemptId, violation_type: type, timestamp: new Date() })
      });
    } catch (err) {
      console.error("Failed to log violation", err);
    }
  };

  const handleViolation = useCallback((type) => {
    if (!examStarted) return;
    if (Swal.isVisible()) return;

    const newCount = warningCount + 1;
    setWarningCount(newCount);
    logViolation(type);

    if (newCount >= MAX_WARNINGS) {
      Swal.fire({
        title: "Exam Terminated",
        html: `
          <div class="text-center">
            <p class="text-lg font-bold text-red-600 mb-2">Malpractice Detected</p>
            <p class="text-sm text-slate-600 mb-4">Reason: <b>${type}</b></p>
            <p class="text-xs text-slate-500">Multiple violations detected. Auto-submitting...</p>
          </div>
        `,
        icon: "error",
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Submit & Close"
      }).then(() => {
        handleSubmit(true);
      });
    } else {
      Swal.fire({
        title: "Security Warning",
        html: `
          <div class="text-center">
            <p class="text-lg font-bold text-amber-600 mb-2">${type} Detected</p>
            <p class="text-sm text-slate-600 mb-4">Focus lost or fullscreen exited.</p>
            <div class="bg-red-50 border border-red-100 p-3 rounded-lg">
                <p class="text-red-700 font-bold text-xs">⚠ ONE VIOLATION REMAINING</p>
                <p class="text-red-500 text-[10px] mt-1">Next violation will terminate the exam.</p>
            </div>
          </div>
        `,
        icon: "warning",
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "Return to Exam",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => {
        enterFullscreen();
      });
    }
  }, [examStarted, warningCount, attemptId]);

  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("Tab Switch / App Backgrounded");
    };

    const handleBlur = () => {
      handleViolation("Window Focus Lost (Alt+Tab)");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        handleViolation("Exited Fullscreen Mode");
      } else {
        setIsFullscreen(true);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['r', 'p', 's', 'w', 't', 'n'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
      }
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        Swal.fire({ title: "Action Blocked", text: "Clipboard is disabled", timer: 1000, showConfirmButton: false, icon: 'error' });
      }
      if ((e.ctrlKey || e.metaKey) && (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key) || e.key === 'Tab')) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [examStarted, handleViolation]);

  const checkTestStillLive = async () => {
    try {
      const res = await fetch(`${BASE_URL}/placement-training/student/tests/${testId}/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (!res.ok) return false;
      return data.is_live === true;
    } catch (err) {
      return false;
    }
  };

  const handleNext = async () => {
    if (currentIndex % 5 === 0) {
      const stillLive = await checkTestStillLive();
      if (!stillLive) {
        return Swal.fire({
          title: "Test Closed",
          text: "The publish window for this test has ended.",
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

  const initiateExam = async () => {
    enterFullscreen();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/placement-training/student/tests/${testId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return Swal.fire("Error", data.message, "error").then(() => navigate(-1));
      }
      setAttemptId(data.attempt_id);
      setQuestions(data.questions || []);
      const durationMinutes = data.test.duration_minutes || 30;
      setTimeLeft(durationMinutes * 60);
      setExamStarted(true);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!examStarted || loading || timeLeft <= 0) return;
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
  }, [examStarted, loading, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const selectOption = (qid, option) => {
    setAnswers({ ...answers, [qid]: option });
  };

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

    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(err => { });
    }

    const payload = {
      attempt_id: attemptId,
      answers: Object.entries(answers).map(([qid, selected]) => ({
        question_id: Number(qid),
        selected_option: selected,
      })),
      forced_submission: auto
    };

    try {
      const res = await fetch(`${BASE_URL}/placement-training/student/tests/${testId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
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
        allowOutsideClick: false,
        customClass: { popup: "rounded-3xl", confirmButton: "rounded-xl" }
      }).then(() => {
        navigate("/placementtraining/results");
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  const progressPercentage = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isLowTime = timeLeft < 300;
  const q = questions[currentIndex];
  const isAnswered = q && answers[q.question_id] !== undefined;

  // --- RENDER FLOW ---
  if (loading) return <LoadingView />;
  if (!examStarted) return <StartScreen onStart={initiateExam} onCancel={() => navigate(-1)} />;

  return (
    <FullScreenOverlay className="bg-[#F8FAFC] font-sans text-slate-800 pb-32 select-none">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: Progress & Warnings */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <FaListUl />
                <span>{currentIndex + 1} <span className="text-slate-300">/</span> {questions.length}</span>
              </div>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            {warningCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-xs font-bold text-red-600 animate-pulse">
                <FaExclamationTriangle />
                <span>Last Warning</span>
              </div>
            )}
          </div>

          {/* Right: Timer & Submit */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${isLowTime ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
              <FaClock /> {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => handleSubmit(false)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Submit <FaPaperPlane className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {q && (
          <div key={q.question_id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`bg-white rounded-[2rem] border transition-all duration-300 ${isAnswered ? "border-indigo-100 shadow-xl shadow-indigo-100/40" : "border-slate-100 shadow-lg shadow-slate-200/50"}`}>
              
              {/* Question Text */}
              <div className="p-6 md:p-8 border-b border-slate-50">
                <div className="flex gap-5">
                  <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl text-base font-bold transition-colors ${isAnswered ? "bg-indigo-600 text-white shadow-indigo-200 shadow-lg" : "bg-slate-100 text-slate-400"}`}>
                    {isAnswered ? <FaCheck /> : currentIndex + 1}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed pt-1.5 select-none">
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
                      <button
                        key={opt}
                        onClick={() => selectOption(q.question_id, opt)}
                        className={`group relative w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 active:scale-[0.99] outline-none focus:ring-4 focus:ring-indigo-100 ${isSelected ? "border-indigo-500 bg-indigo-50/60 shadow-sm z-10" : "border-white bg-white hover:border-indigo-100 shadow-sm hover:z-10"}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-[3px] flex items-center justify-center transition-colors ${isSelected ? "border-indigo-500" : "border-slate-200 bg-slate-50 group-hover:border-indigo-200"}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                        </div>
                        <span className={`font-medium select-none text-base ${isSelected ? "text-indigo-900" : "text-slate-600"}`}>
                          {q[key]}
                        </span>
                        <span className="absolute right-4 text-5xl font-black text-slate-900 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all ${currentIndex === 0 ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50" : "border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm"}`}
            aria-label="Previous Question"
          >
            <FaChevronLeft size={18} />
          </button>

          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex-1 h-14 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors shadow-inner"
            aria-label="Toggle Question Palette"
          >
            <FaTh /> Question {currentIndex + 1}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all ${currentIndex === questions.length - 1 ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50" : "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-300 active:scale-95 hover:bg-slate-800"}`}
            aria-label="Next Question"
          >
            <FaChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* QUESTION PALETTE DRAWER */}
      {showPalette && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowPalette(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-lg font-bold text-slate-800">Question Palette</h3>
              <button onClick={() => setShowPalette(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">Close</button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 overflow-y-auto p-2 custom-scrollbar">
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
                        ? "border-indigo-600 text-indigo-700 bg-indigo-50 ring-2 ring-indigo-200"
                        : status === "answered"
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"}
                    `}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-slate-500 justify-center pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div> Answered</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-50 border-2 border-indigo-600 rounded-full"></div> Current</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-full"></div> Skipped</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>
    </FullScreenOverlay>
  );
}