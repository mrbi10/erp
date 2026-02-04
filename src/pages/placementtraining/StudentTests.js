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
  FaWifi,
  FaExpand,
  FaLock,
  FaSpinner
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";


/* ------------------------------------------------------------------
 * STYLES & ANIMATIONS
 * ------------------------------------------------------------------ */
const GLOBAL_STYLES = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse-subtle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-up {
    animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
  
  /* Prevent text selection during exam */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
`;

/* ------------------------------------------------------------------
 * WRAPPER: FULLSCREEN OVERLAY
 * ------------------------------------------------------------------ */
const FullScreenOverlay = ({ children, className = "" }) => (
  <div className={`fixed inset-0 z-[50] bg-slate-50 overflow-y-auto overflow-x-hidden hide-scrollbar ${className}`}>
    <style>{GLOBAL_STYLES}</style>
    {children}
  </div>
);

/* ------------------------------------------------------------------
 * SUB-COMPONENT: LOADING VIEW
 * ------------------------------------------------------------------ */
const LoadingView = () => (
  <FullScreenOverlay className="flex flex-col items-center justify-center p-4 z-[100]">
    <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center border border-slate-100 animate-slide-up">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
        <FaLock className="absolute inset-0 m-auto text-indigo-600 text-lg" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Securing Environment</h2>
      <p className="text-slate-500 text-sm mt-3 leading-relaxed">
        Initializing secure connection and loading assessment data...
      </p>
    </div>
  </FullScreenOverlay>
);

/* ------------------------------------------------------------------
 * SUB-COMPONENT: START SCREEN
 * ------------------------------------------------------------------ */
const MIN_SPEED_MBPS = 2;
const READ_TIME = 2;

const StartScreen = ({ onStart, onCancel }) => {
  const [countdown, setCountdown] = useState(READ_TIME);
  const [speed, setSpeed] = useState(null);
  const [speedStatus, setSpeedStatus] = useState("checking");
  const [testing, setTesting] = useState(true);

  const checkInternetSpeed = async () => {
    try {
      const imageUrl =
        "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg";
      const startTime = new Date().getTime();

      await fetch(imageUrl, { cache: "no-store" });

      const endTime = new Date().getTime();
      const duration = (endTime - startTime) / 1000;

      const fileSizeMB = 5.3;
      const speedMbps = ((fileSizeMB * 8) / duration).toFixed(2);

      setSpeed(speedMbps);
      setSpeedStatus(speedMbps >= MIN_SPEED_MBPS ? "ok" : "slow");
    } catch {
      setSpeed(null);
      setSpeedStatus("slow");
    } finally {
      setTesting(false);
    }
  };



  useEffect(() => {
    if (countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    checkInternetSpeed();
  }, []);



  const canStart =
    countdown === 0 && speedStatus === "ok" && !testing;

  return (
    <FullScreenOverlay className="flex items-center justify-center p-4 bg-slate-100 overflow-hidden">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-slate-200 flex flex-col">

        {/* Header */}
        <div className="bg-slate-900 px-8 py-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FaShieldAlt className="text-4xl text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Examination Disclaimer
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Please read carefully before starting
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6 text-sm text-slate-700">

          {/* Rule Block */}
          <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center gap-3 mb-3">
              <FaShieldAlt className="text-indigo-500 text-lg" />
              <h3 className="font-bold text-slate-800 text-base">
                Secure Exam Environment
              </h3>
            </div>
            <p className="leading-relaxed text-slate-600">
              This examination is actively monitored. Once started, it must be
              completed in a single uninterrupted session.
            </p>
          </div>

          {/* Critical Warning */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <FaExclamationTriangle />
              </div>
              <div>
                <h4 className="font-bold text-red-700 mb-1">
                  Auto-Submission Warning
                </h4>
                <p className="text-red-700 leading-relaxed">
                  If your internet connection becomes slow or disconnected,
                  the exam may be automatically submitted and will be treated
                  as a <strong>completed attempt</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Violation Notice */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <FaLock />
              </div>
              <div>
                <h4 className="font-bold text-amber-800 mb-1">
                  Exam Integrity
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  Any suspicious activity or rule violation detected by the system
                  will result in <strong>immediate termination</strong> of the exam.
                </p>
              </div>
            </div>
          </div>

          {/* Internet Speed Status */}
          <div className="rounded-2xl border p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaWifi className="text-indigo-500 text-xl" />
              <div>
                <p className="font-semibold text-slate-800">
                  Internet Readiness Check
                </p>
                <p className="text-xs text-slate-500">
                  Minimum required speed: {MIN_SPEED_MBPS} Mbps
                </p>
              </div>
            </div>

            <div className="text-right">
              {testing ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <FaSpinner className="animate-spin" />
                  Checking…
                </div>
              ) : (
                <>
                  <p
                    className={`font-bold ${speedStatus === "ok"
                      ? "text-green-600"
                      : "text-red-600"
                      }`}
                  >
                    {speed ? `${speed} Mbps` : "Unavailable"}
                  </p>
                  <p className="text-xs">
                    {speedStatus === "ok"
                      ? "Connection Ready"
                      : "Connection Too Slow"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
          >
            Cancel
          </button>

          <button
            disabled={!canStart}
            onClick={onStart}
            className={`flex-[2] py-3.5 rounded-xl font-semibold text-white transition
              ${canStart
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-slate-400 cursor-not-allowed"
              }`}
          >
            {countdown > 0
              ? `Please wait ${countdown}s`
              : speedStatus !== "ok"
                ? "Internet too slow"
                : "Start Exam"}
          </button>
        </div>
      </div>
    </FullScreenOverlay>
  );
};



export default function StudentTestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [examStarted, setExamStarted] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPalette, setShowPalette] = useState(false);

  const timerRef = useRef(null);
  const warningRef = useRef(0);
  const submittingRef = useRef(false);
  const examEndedRef = useRef(false);

  const MAX_WARNINGS = 2;



  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log("Fullscreen request denied:", err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };


  useEffect(() => {
    if (!examStarted) return;

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      forceSubmit("PAGE_UNLOAD");
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [examStarted]);

  const lastViolationRef = useRef(0);

  const handleViolation = useCallback((type, source) => {
    if (!examStarted || examEndedRef.current) return;

    const now = Date.now();
    if (type !== "EXIT_FULLSCREEN") {
      if (now - lastViolationRef.current < 1500) return;
    }
    lastViolationRef.current = now;

    warningRef.current += 1;
    setWarningCount(warningRef.current);

    logViolation(type, source);

    if (warningRef.current >= MAX_WARNINGS) {
      Swal.fire({
        title: "Exam Terminated",
        text: `Violation limit exceeded (${type})`,
        icon: "error",
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: "Submit & Close"
      }).then(() => forceSubmit(type));
    } else {
      Swal.fire({
        title: "Security Warning",
        text: `${type} detected. One more violation will end the exam.`,
        icon: "warning",
        confirmButtonText: "Return to Exam",
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => enterFullscreen());
    }
  }, [examStarted]);


  useEffect(() => {
    if (!examStarted) return;

    const showLocalWarning = () => {
      if (Swal.isVisible()) return;
      Swal.fire({
        title: "Action Blocked",
        text: "This action is not allowed during the exam",
        icon: "warning",
        timer: 1200,
        showConfirmButton: false
      });
    };

    const keyHandler = (e) => {
      const blocked =
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key === "Escape" ||
        e.key === "Tab" ||
        e.key === "F4" ||
        e.key === "PrintScreen" ||
        // e.key === "F12" ||
        e.key === "F11";

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        showLocalWarning();
      }
    };

    const blurHandler = () => handleViolation("WINDOW_BLUR", "blur");

    const visibilityHandler = () => {
      if (document.hidden) {
        handleViolation("TAB_SWITCH", "visibility");
      }
    };

    const fullscreenHandler = () => {
      if (!document.fullscreenElement) {
        handleViolation("EXIT_FULLSCREEN", "fullscreen");
        enterFullscreen();
      }
    };

    window.addEventListener("keydown", keyHandler, true);
    window.addEventListener("blur", blurHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    document.addEventListener("fullscreenchange", fullscreenHandler);
    document.addEventListener("contextmenu", e => e.preventDefault());

    return () => {
      window.removeEventListener("keydown", keyHandler, true);
      window.removeEventListener("blur", blurHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      document.removeEventListener("fullscreenchange", fullscreenHandler);
      document.removeEventListener("contextmenu", e => e.preventDefault());
    };
  }, [examStarted, handleViolation]);


  const logViolation = async (type, source = null, extra = null) => {
    if (!attemptId || examEndedRef.current) return;

    fetch(`${BASE_URL}/placement-training/student/tests/log-violation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        attempt_id: attemptId,
        violation_type: type,
        violation_source: source,
        extra_payload: extra
      })
    });
  };

  const handleContextMenu = (e) => e.preventDefault();

  const forceSubmit = async (reason) => {
    if (examEndedRef.current) return;

    examEndedRef.current = true;

    // await logViolation("UNKNOWN", "auto_submit");

    handleSubmit(true);
  };


  useEffect(() => {
    if (!examStarted) return;

    if (!document.fullscreenElement) {
      enterFullscreen();
    }

    return () => {
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
    await flushPendingAnswer();
    if (currentIndex % 5 === 0) {
      const stillLive = await checkTestStillLive();
      if (!stillLive) {
        return Swal.fire({
          title: "Test Closed",
          text: "The exam window has ended.",
          icon: "info",
          allowOutsideClick: false,
          confirmButtonText: "Submit & Finish"
        }).then(() => forceSubmit("PUBLISH_WINDOW_ENDED"));
      }
    }
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

const jumpToQuestion = async (index) => {
  await flushPendingAnswer();
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
        if (document.fullscreenElement) document.exitFullscreen();
        return Swal.fire("Error", data.message || "Failed to start exam", "error").then(() => navigate(-1));
      }

      setAttemptId(data.attempt_id);
      setQuestions(data.questions || []);

      setTimeLeft(data.remaining_seconds);
      setExamStarted(true);

    } catch (err) {
      console.error(err);
      Swal.fire("Connection Error", "Could not start the exam. Please check your internet.", "error");
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
          forceSubmit("TIME_ENDED");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [examStarted, loading]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const flushPendingAnswer = async () => {
    if (!pendingAnswerRef.current || !attemptId) return;

    const { qid, option } = pendingAnswerRef.current;
    pendingAnswerRef.current = null;

    await fetch(`${BASE_URL}/placement-training/student/tests/${testId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: qid,
        selected_option: option
      })
    });
  };

  const pendingAnswerRef = useRef(null);

  const selectOption = (qid, option) => {
    if (examEndedRef.current) return;

    setAnswers(prev => ({ ...prev, [qid]: option }));
    pendingAnswerRef.current = { qid, option };
  };

  const handleSubmit = async (auto = false) => {
    await flushPendingAnswer();


    if (!auto) {
      const answeredCount = Object.keys(answers).length;
      const totalCount = questions.length;

      const result = await Swal.fire({
        title: "Submit Assessment?",
        html: `
          <div class="text-slate-600">
            You have answered <b class="text-indigo-600 text-lg">${answeredCount}</b> out of <b class="text-slate-800 text-lg">${totalCount}</b> questions.
          </div>
          <p class="text-xs text-slate-400 mt-2">Action cannot be undone.</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "Yes, Submit Exam",
        cancelButtonText: "Keep Reviewing",
      });
      if (!result.isConfirmed) return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    examEndedRef.current = true;

    if (document.exitFullscreen && document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (e) { }
    }

    const payload = {
      attempt_id: attemptId,
      forced_submission: auto ? 1 : 0
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
      if (!res.ok) throw new Error(data.message);

      Swal.fire({
        title: "Assessment Complete!",
        html: `
            <div class="flex flex-col items-center gap-3 mt-4">
              <!--  <div class="w-20 h-20 rounded-full flex items-center justify-center ${data.pass_status === 'pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}">
                    ${data.pass_status === 'pass' ? '<svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : '<svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'}
                </div> -->
                <div class="text-center">
                    <div class="text-5xl font-black text-slate-800 tracking-tighter">${Number(data.percentage || 0).toFixed(2)}%</div>
                    <div class="text-slate-500 font-medium">Final Score</div>
                </div>
                <div class="px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mt-2 ${data.pass_status === 'pass' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}">
                    ${data.pass_status === 'pass' ? 'PASSED' : 'FAILED'}
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "View Detailed Results",
        confirmButtonColor: "#1e293b",
        allowOutsideClick: false,
        padding: "2em"
      }).then(() => {
        navigate("/placementtraining/result");
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Submission Error", err.message || "Could not submit results. Please contact admin.", "error");
    }
  };

  const progressPercentage = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isLowTime = timeLeft < 300;
  const q = questions[currentIndex];
  const isAnswered = q && answers[q.question_id] !== undefined;

  if (loading) return <LoadingView />;
  if (!examStarted) return <StartScreen onStart={initiateExam} onCancel={() => navigate(-1)} />;

  return (
    <FullScreenOverlay className="p-10 bg-[#F8FAFC] font-sans text-slate-800 pb-32 no-select overflow-hidden">

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: Progress & Warnings */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-3 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <FaListUl className="text-slate-400" />
                <span>{currentIndex + 1} <span className="text-slate-300">/</span> {questions.length}</span>
              </div>
              <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
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
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-base transition-colors ${isLowTime ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
              <FaClock className={isLowTime ? "text-red-500" : "text-slate-400"} />
              {formatTime(timeLeft)}
            </div>

            <button
              onClick={() => handleSubmit(false)}
              className="hidden sm:flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
            >
              Submit <FaPaperPlane className="text-xs opacity-80" />
            </button>
          </div>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {q && (
          <div key={q.question_id} className="animate-slide-up">
            <div className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${isAnswered ? "border-indigo-100 shadow-xl shadow-indigo-100/40 ring-1 ring-indigo-50" : "border-slate-100 shadow-lg shadow-slate-200/50"}`}>

              {/* Question Text */}
              <div className="p-6 md:p-10 border-b border-slate-50">
                <div className="flex gap-5 items-start">
                  <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl text-lg font-bold transition-all duration-300 ${isAnswered ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110" : "bg-slate-100 text-slate-400"}`}>
                    {isAnswered ? <FaCheck /> : currentIndex + 1}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed pt-1 select-none">
                    {q.question}
                  </h3>
                </div>
              </div>

              {/* Options */}
              <div className="p-6 md:p-10 bg-slate-50/50">
                <div className="grid grid-cols-1 gap-4">
                  {["A", "B", "C", "D"].map((opt) => {
                    const key = `option_${opt.toLowerCase()}`;
                    const isSelected = answers[q.question_id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectOption(q.question_id, opt)}
                        className={`group relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-5 outline-none focus:ring-4 focus:ring-indigo-100/50 ${isSelected
                          ? "border-indigo-500 bg-white shadow-md shadow-indigo-100 z-10 scale-[1.01]"
                          : "border-transparent bg-white shadow-sm hover:border-indigo-200 hover:shadow-md"
                          }`}
                      >
                        <div className={`w-7 h-7 rounded-full border-[2px] flex items-center justify-center transition-all ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50 group-hover:border-indigo-300"}`}>
                          <div className={`w-3 h-3 bg-indigo-500 rounded-full transition-transform duration-200 ${isSelected ? "scale-100" : "scale-0"}`} />
                        </div>
                        <span className={`font-medium text-base md:text-lg transition-colors ${isSelected ? "text-indigo-900 font-bold" : "text-slate-600 group-hover:text-slate-900"}`}>
                          {q[key]}
                        </span>

                        {/* Background Letter Watermark */}
                        <span className="absolute right-6 text-6xl font-black text-slate-900 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none font-serif">
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-40 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all ${currentIndex === 0 ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm"}`}
            aria-label="Previous Question"
          >
            <FaChevronLeft size={20} />
          </button>

          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center gap-2.5 text-slate-600 font-bold text-sm transition-all active:scale-[0.98]"
          >
            <FaTh className="text-slate-400" />
            <span className="hidden sm:inline">Question Palette</span>
            <span className="sm:hidden">Q {currentIndex + 1}</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all ${currentIndex === questions.length - 1 ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50" : "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-300 hover:shadow-xl hover:bg-slate-800 active:scale-95"}`}
            aria-label="Next Question"
          >
            <FaChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* QUESTION PALETTE DRAWER */}
      {showPalette && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowPalette(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl animate-slide-up flex flex-col max-h-[80vh] border border-slate-100">
            <div className="flex justify-between items-center mb-6 px-1">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Question Palette</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Jump to any question instantly</p>
              </div>
              <button
                onClick={() => setShowPalette(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <span className="font-bold text-lg">×</span>
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 gap-3 overflow-y-auto p-1 hide-scrollbar">              {questions.map((_, idx) => {
              const status = answers[questions[idx].question_id] !== undefined ? "answered" : "unanswered";
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => jumpToQuestion(idx)}
                  className={`
                      aspect-square rounded-xl font-bold text-sm transition-all border-2 flex items-center justify-center
                      ${isCurrent
                      ? "border-indigo-600 text-indigo-700 bg-indigo-50 ring-2 ring-indigo-200 z-10"
                      : status === "answered"
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white"}
                    `}
                >
                  {idx + 1}
                </button>
              )
            })}
            </div>

            <div className="mt-6 flex flex-wrap gap-6 text-xs font-bold text-slate-500 justify-center pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div> Answered</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-50 border-2 border-indigo-600 rounded-full"></div> Current</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-50 border-2 border-slate-200 rounded-full"></div> Not Visited</div>
            </div>
          </div>
        </div>
      )}
    </FullScreenOverlay>
  );
}