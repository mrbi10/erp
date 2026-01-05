import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowLeft, FaSave } from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function TrainerAddQuestions() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Fetch existing questions
  // -----------------------------
  const fetchQuestions = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/tests/${testId}/questions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  // -----------------------------
  // Add new question (client-side)
  // -----------------------------
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        marks: 1,
        isNew: true
      },
    ]);
  };

  // -----------------------------
  // Update local state
  // -----------------------------
  const update = (i, field, value) => {
    const updated = [...questions];
    updated[i][field] = value;
    setQuestions(updated);
  };

  // -----------------------------
  // Save existing question
  // -----------------------------
  const saveQuestion = async (q) => {

    if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      return Swal.fire("Invalid", "Fill all fields", "warning");
    }

    try {
      await fetch(
        `${BASE_URL}/placement-training/questions/${q.question_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(q),
        }
      );

      Swal.fire("Saved", "Question updated", "success");

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update question", "error");
    }
  };

  // -----------------------------
  // Submit only NEW questions
  // -----------------------------
  const submitNewQuestions = async () => {



    const newQuestions = questions
      .filter(q => q.isNew)
      .map(({ isNew, ...rest }) => rest);

    if (newQuestions.length === 0) {
      return Swal.fire("Nothing to submit", "No new questions added", "info");
    }

    try {
      await fetch(
        `${BASE_URL}/placement-training/tests/${testId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ questions: newQuestions }),
        }
      );

      Swal.fire("Success", "New questions added", "success");
      fetchQuestions();

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add questions", "error");
    }
  };


  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-200 rounded-full">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Manage Questions</h1>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading questions...</p>
      ) : (
        <>
          {questions.map((q, i) => (
            <div key={q.question_id || `new-${i}`} className="bg-white p-5 rounded-xl shadow mb-4">
              <input
                className="w-full border p-2 rounded mb-2"
                placeholder="Question"
                value={q.question}
                onChange={(e) => update(i, "question", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                {["a", "b", "c", "d"].map(opt => (
                  <input
                    key={opt}
                    className="border p-2 rounded"
                    placeholder={`Option ${opt.toUpperCase()}`}
                    value={q[`option_${opt}`]}
                    onChange={(e) =>
                      update(i, `option_${opt}`, e.target.value)
                    }
                  />
                ))}
              </div>

              <div className="flex gap-4 mt-3 items-center">
                <select
                  className="border p-2 rounded"
                  value={q.correct_option}
                  onChange={(e) =>
                    update(i, "correct_option", e.target.value)
                  }
                >
                  <option value="A">Correct: A</option>
                  <option value="B">Correct: B</option>
                  <option value="C">Correct: C</option>
                  <option value="D">Correct: D</option>
                </select>

                <input
                  type="number"
                  className="border p-2 rounded w-24"
                  value={q.marks}
                  onChange={(e) => update(i, "marks", e.target.value)}
                />

                {!q.isNew && (
                  <button
                    onClick={() => saveQuestion(q)}
                    className="flex items-center gap-1 text-green-600"
                  >
                    <FaSave /> Save
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-4 mt-6">
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2 border rounded"
            >
              <FaPlus /> Add Question
            </button>

            <button
              onClick={submitNewQuestions}
              className="px-6 py-2 bg-sky-600 text-white rounded"
            >
              Submit New Questions
            </button>
          </div>
        </>
      )}
    </div>
  );
}
