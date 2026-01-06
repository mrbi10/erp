import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaClock, 
  FaCheckCircle, 
  FaPaperPlane, 
  FaExclamationTriangle,
  FaListOl,
  FaHourglassHalf
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function StudentTestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef(null);

  // -----------------------------
  // Logic: Start Test & Fetch
  // -----------------------------
  useEffect(() => {
    Swal.fire({
      title: "Ready to Begin?",
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>⚠️ Instructions:</strong></p>
          <ul class="list-disc pl-5 space-y-1">
            <li>The timer starts immediately after you click 'Start'.</li>
            <li>Do not refresh or close the window.</li>
            <li>The test will <strong>auto-submit</strong> when time runs out.</li>
          </ul>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Start Test",
      confirmButtonColor: "#4f46e5", // Indigo-600
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: `rgba(15, 23, 42, 0.9)` // Dark slate backdrop
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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire("Error", data.message, "error").then(() =>
          navigate(-1)
        );
      }

      setAttemptId(data.attempt_id);
      setQuestions(data.questions || []);

      const durationMinutes = data.duration_minutes || 30;
      setTimeLeft(durationMinutes * 60);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Logic: Timer
  // -----------------------------
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

  // -----------------------------
  // Logic: Selection & Submit
  // -----------------------------
  const selectOption = (qid, option) => {
    setAnswers({ ...answers, [qid]: option });
  };

  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const answeredCount = Object.keys(answers).length;
      const totalCount = questions.length;
      
      const result = await Swal.fire({
        title: "Submit Test?",
        html: `You have answered <b>${answeredCount} / ${totalCount}</b> questions.<br>This action cannot be undone.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#10b981", // Green
        confirmButtonText: "Yes, Submit",
        cancelButtonText: "Review Answers"
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

      if (!res.ok) {
        return Swal.fire("Error", data.message, "error");
      }

      Swal.fire({
        title: "Test Submitted!",
        html: `<div class="text-xl">Score: <b>${data.score}</b></div><div class="mt-2 badge badge-${data.pass_status === 'passed' ? 'success' : 'error'}">${data.pass_status.toUpperCase()}</div>`,
        icon: data.pass_status === 'passed' ? "success" : "info",
        confirmButtonText: "View Results"
      }).then(() => {
        navigate("/placementtraining/results");
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  // -----------------------------
  // Helper: Progress Calculation
  // -----------------------------
  const progressPercentage = questions.length > 0 
    ? (Object.keys(answers).length / questions.length) * 100 
    : 0;

  // -----------------------------
  // UI Components
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <FaHourglassHalf className="text-4xl text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Preparing your test environment...</p>
      </div>
    );
  }

  const isLowTime = timeLeft < 300; // Less than 5 mins

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20 selection:bg-indigo-100">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaListOl className="text-indigo-600" />
              Test
            </h1>
            {/* Progress Bar */}
            <div className="hidden sm:flex flex-col w-32 md:w-48 gap-1">
               <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Progress</span>
                  <span>{Object.keys(answers).length} / {questions.length}</span>
               </div>
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
               </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg shadow-inner transition-colors ${
            isLowTime ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" : "bg-slate-50 text-slate-700 border border-slate-200"
          }`}>
            <FaClock className={isLowTime ? "animate-bounce" : ""} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {questions.map((q, index) => {
          const isAnswered = answers[q.question_id] !== undefined;

          return (
            <div 
              key={q.question_id}
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${
                isAnswered ? "border-indigo-200 shadow-md" : "border-slate-200"
              }`}
            >
              <div className="p-6 md:p-8">
                {/* Question Text */}
                <div className="flex gap-4 mb-6">
                  <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    isAnswered ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {index + 1}
                  </span>
                  <p className="text-lg font-medium text-slate-800 leading-relaxed pt-1">
                    {q.question}
                  </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-12">
                  {["A", "B", "C", "D"].map((opt) => {
                    const key = `option_${opt.toLowerCase()}`;
                    const isSelected = answers[q.question_id] === opt;
                    
                    return (
                      <div
                        key={opt}
                        onClick={() => selectOption(q.question_id, opt)}
                        className={`relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected 
                            ? "border-indigo-500 bg-indigo-50/50" 
                            : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className={`font-medium ${isSelected ? "text-indigo-900" : "text-slate-600"}`}>
                            {q[key]}
                          </span>
                        </div>
                        
                        {/* Option Letter Watermark */}
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-4xl font-black opacity-5 pointer-events-none ${
                            isSelected ? "text-indigo-900" : "text-slate-900"
                        }`}>
                            {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
          <div className="text-sm text-slate-500 flex items-center gap-2">
             <FaExclamationTriangle className="text-amber-500" />
             <span>Review your answers before submitting.</span>
          </div>

          <button
            disabled={!attemptId}
            onClick={() => handleSubmit(false)}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 ${
              !attemptId
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            }`}
          >
            <FaPaperPlane />
            Submit Test
          </button>
        </div>
      </div>

    </div>
  );
}