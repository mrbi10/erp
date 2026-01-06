import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaArrowLeft, 
  FaSave, 
  FaLayerGroup, 
  FaCheckCircle, 
  FaCloudUploadAlt,
  FaPen,
  FaListOl
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function TrainerAddQuestions() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Logic (Unchanged)
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
    // Scroll to bottom smoothly
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const update = (i, field, value) => {
    const updated = [...questions];
    updated[i][field] = value;
    setQuestions(updated);
  };

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
      fetchQuestions(); // Refresh to remove isNew flags
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add questions", "error");
    }
  };

  // -----------------------------
  // UI Components
  // -----------------------------
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-800">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
            >
              <FaArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FaListOl className="text-indigo-600"/> Question Builder
              </h1>
              <p className="text-xs text-slate-500 font-medium">Test ID: {testId} • {questions.length} Questions</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
             {/* Stats Pill */}
             <div className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
               Total Marks: {questions.reduce((acc, q) => acc + Number(q.marks || 0), 0)}
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-8">
            {questions.map((q, i) => (
              <div 
                key={q.question_id || `new-${i}`} 
                className={`group relative bg-white rounded-2xl shadow-sm border transition-all duration-300 ${
                  q.isNew 
                    ? "border-indigo-200 shadow-indigo-100 ring-1 ring-indigo-50" 
                    : "border-slate-200 hover:shadow-md"
                }`}
              >
                {/* Status Badge */}
                <div className="absolute -top-3 left-6">
                  {q.isNew ? (
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-lg shadow-indigo-200 flex items-center gap-1">
                      <FaPlus size={8} /> New Draft
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] uppercase font-bold tracking-wider rounded-full flex items-center gap-1">
                      <FaCheckCircle size={10} /> Synced
                    </span>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  {/* Question Number & Input */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                      <span>Question {i + 1}</span>
                      {q.isNew && <span className="text-indigo-500">Unsaved changes</span>}
                    </label>
                    <div className="relative">
                        <FaPen className="absolute top-4 left-4 text-slate-300" />
                        <textarea
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-y min-h-[80px]"
                        placeholder="Type your question here..."
                        value={q.question}
                        onChange={(e) => update(i, "question", e.target.value)}
                        />
                    </div>
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {["a", "b", "c", "d"].map((opt) => (
                      <div key={opt} className="relative group/opt">
                        <span className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center font-bold text-sm border-r border-slate-200 rounded-l-xl transition-colors ${
                            q.correct_option === opt.toUpperCase() 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-slate-100 text-slate-500 group-focus-within/opt:bg-indigo-50 group-focus-within/opt:text-indigo-600"
                        }`}>
                          {opt.toUpperCase()}
                        </span>
                        <input
                          className={`w-full border pl-12 pr-4 py-2.5 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${
                             q.correct_option === opt.toUpperCase() 
                             ? "border-green-300 bg-green-50/30 ring-green-200" 
                             : "border-slate-200 bg-white focus:ring-indigo-500"
                          }`}
                          placeholder={`Option ${opt.toUpperCase()}`}
                          value={q[`option_${opt}`]}
                          onChange={(e) => update(i, `option_${opt}`, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Footer Controls */}
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-50">
                    
                    <div className="flex gap-4 w-full md:w-auto">
                        {/* Correct Option Selector */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-full md:w-auto">
                            <span className="text-xs font-bold text-slate-500 uppercase">Correct:</span>
                            <select
                                className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer w-full md:w-auto"
                                value={q.correct_option}
                                onChange={(e) => update(i, "correct_option", e.target.value)}
                            >
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        </div>

                        {/* Marks Input */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase">Marks:</span>
                            <input
                                type="number"
                                className="bg-transparent text-sm font-bold text-slate-800 outline-none w-12 text-center"
                                value={q.marks}
                                onChange={(e) => update(i, "marks", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Individual Save Button (Only for existing) */}
                    {!q.isNew && (
                      <button
                        onClick={() => saveQuestion(q)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-white hover:bg-indigo-600 px-4 py-2 rounded-lg transition-all text-sm font-bold border border-indigo-100 hover:border-indigo-600 w-full md:w-auto justify-center"
                      >
                        <FaSave /> Save Changes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {questions.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaLayerGroup className="text-slate-300 text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-600">No questions yet</h3>
                <p className="text-slate-400 mb-6">Start building your test by adding a question.</p>
                <button 
                  onClick={addQuestion}
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                    Add First Question
                </button>
            </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] p-4 z-40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <button
            onClick={addQuestion}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded-xl font-bold transition-all group"
          >
            <FaPlus className="text-slate-400 group-hover:text-slate-900 transition-colors" /> 
            Add Question
          </button>

          <div className="flex items-center gap-4 w-full sm:w-auto">
             <span className="hidden sm:block text-xs text-slate-400 font-medium">
                {questions.filter(q => q.isNew).length} unsaved questions
             </span>
             <button
                onClick={submitNewQuestions}
                disabled={questions.filter(q => q.isNew).length === 0}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${
                    questions.filter(q => q.isNew).length === 0 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                }`}
            >
                <FaCloudUploadAlt size={18} />
                Submit New Questions
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}