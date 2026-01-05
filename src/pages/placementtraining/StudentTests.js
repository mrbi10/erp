import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  // Start test
  // -----------------------------



  useEffect(() => {
    Swal.fire({
      title: "Test Instructions",
      html: `
      <ul style="text-align:left">
        <li>⏱ Timed test</li>
        <li>❌ No refresh allowed</li>
        <li>✔ Auto submit on timeout</li>
      </ul>
    `,
      icon: "info",
      confirmButtonText: "Start Test",
      allowOutsideClick: false,
      allowEscapeKey: false
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
  // Timer
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
  // Answer select
  // -----------------------------
  const selectOption = (qid, option) => {
    setAnswers({ ...answers, [qid]: option });
  };

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const result = await Swal.fire({
        title: "Submit Test?",
        text: "You cannot change answers after submitting",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Submit",
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

      Swal.fire(
        "Submitted",
        `Score: ${data.score} | ${data.pass_status.toUpperCase()}`,
        "success"
      ).then(() => {
        navigate("/placementtraining/results");
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return <p className="p-6 text-gray-500">Starting test...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Timer */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Online Test</h1>
        <div className="px-4 py-2 bg-red-600 text-white rounded-lg font-mono">
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.question_id}
            className="bg-white p-5 rounded-xl shadow"
          >
            <p className="font-semibold mb-3">
              {index + 1}. {q.question}
            </p>

            <div className="space-y-2">
              {["A", "B", "C", "D"].map((opt) => {
                const key = `option_${opt.toLowerCase()}`;
                return (
                  <label
                    key={opt}
                    className={`block border rounded p-3 cursor-pointer
                      ${answers[q.question_id] === opt
                        ? "border-sky-600 bg-sky-50"
                        : "hover:bg-gray-50"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      className="mr-2"
                      name={`q-${q.question_id}`}
                      checked={answers[q.question_id] === opt}
                      onChange={() =>
                        selectOption(q.question_id, opt)
                      }
                    />
                    {q[key]}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-8 flex justify-end">
        <button
          disabled={!attemptId}
          onClick={() => handleSubmit(false)}
          className={`px-6 py-3 rounded-lg text-white
    ${!attemptId
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"}
  `}
        >
          Submit Test
        </button>

      </div>
    </div>
  );
}
