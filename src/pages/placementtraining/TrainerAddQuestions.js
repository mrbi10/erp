import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaArrowLeft, 
  FaSave, 
  FaCheckCircle, 
  FaCloudUploadAlt, 
  FaLayerGroup, 
  FaTrash, 
  FaPen,
  FaGripVertical 
} from "react-icons/fa";
import Swal from "sweetalert2";
import Select from "react-select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { BASE_URL } from "../../constants/API";

export default function TrainerAddQuestions() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("");

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

  const fetchTestName = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/courses/5/tests`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      const matched = (data.tests || []).find(
        t => String(t.test_id) === String(testId)
      );

      if (matched) {
        setTestName(matched.title.toUpperCase());
      }
    } catch (err) {
      console.error("Failed to load test name", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchTestName();
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
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const addQuestionAfter = (index) => {
    const newQ = {
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
      marks: 1,
      isNew: true
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, newQ);
    setQuestions(updated);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  const correctOptions = [
    { value: "A", label: "Option A" },
    { value: "B", label: "Option B" },
    { value: "C", label: "Option C" },
    { value: "D", label: "Option D" },
  ];

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
      fetchQuestions();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add questions", "error");
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
          <div className="h-6 bg-slate-100 rounded-full w-1/4 mb-6"></div>
          <div className="h-20 bg-slate-50 rounded-2xl w-full mb-6"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-slate-50 rounded-xl"></div>
            <div className="h-12 bg-slate-50 rounded-xl"></div>
            <div className="h-12 bg-slate-50 rounded-xl"></div>
            <div className="h-12 bg-slate-50 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {testName} <span className="text-slate-400 font-semibold">  QUESTION BUILDER</span>
              </h1>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {questions.length} Questions
                </span>

                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">
                  {questions.reduce((acc, q) => acc + Number(q.marks || 0), 0)} Total Marks
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm active:scale-95"
            >
              <FaPlus className="text-indigo-500" />
              <span className="hidden sm:inline">Add Question</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={submitNewQuestions}
              disabled={questions.filter(q => q.isNew).length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 ${questions.filter(q => q.isNew).length === 0
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300"
                }`}
            >
              <FaCloudUploadAlt size={16} />
              <span>Save {questions.filter(q => q.isNew).length > 0 ? `(${questions.filter(q => q.isNew).length})` : "Drafts"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div
                  className="space-y-8"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {questions.map((q, i) => (
                    <Draggable
                      key={q.question_id || `new-${i}`}
                      draggableId={String(q.question_id || `new-${i}`)}
                      index={i}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group relative bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${q.isNew
                            ? "border-indigo-200 shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-50"
                            : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                            } ${snapshot.isDragging ? "scale-[1.01] shadow-2xl z-50" : ""}`}
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent group-hover:via-indigo-400 transition-all duration-500"></div>

                          <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-2 -ml-2"
                                >
                                  <FaGripVertical />
                                </div>
                                <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${q.isNew ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                                  {i + 1}
                                </span>
                                {q.isNew ? (
                                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-100">
                                    New Draft
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                                    <FaCheckCircle /> Synced
                                  </span>
                                )}
                              </div>
                              {!q.isNew && (
                                <button
                                  onClick={() => saveQuestion(q)}
                                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                                >
                                  <FaSave /> Update
                                </button>
                              )}
                            </div>

                            <div className="mb-8">
                              <div className="relative">
                                <textarea
                                  className="w-full bg-[#F8FAFC] border-0 rounded-2xl p-5 text-slate-700 text-lg font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-100 transition-all resize-y min-h-[100px] hover:bg-slate-50"
                                  placeholder="Type the question statement here..."
                                  value={q.question}
                                  onChange={(e) => update(i, "question", e.target.value)}
                                />
                                <FaPen className="absolute top-5 right-5 text-slate-300 pointer-events-none" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                              {["a", "b", "c", "d"].map((opt) => {
                                const isCorrect = q.correct_option === opt.toUpperCase();
                                return (
                                  <div key={opt} className={`relative flex items-center group/opt rounded-xl border-2 transition-all duration-200 ${isCorrect
                                    ? "border-emerald-400 bg-emerald-50/20"
                                    : "border-slate-100 bg-white hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50"
                                    }`}>
                                    <div className={`w-12 h-full flex items-center justify-center border-r-2 font-bold text-sm ${isCorrect
                                      ? "border-emerald-400 text-emerald-600 bg-emerald-100/50"
                                      : "border-slate-100 text-slate-400 bg-slate-50"
                                      }`}>
                                      {opt.toUpperCase()}
                                    </div>
                                    <input
                                      className="w-full bg-transparent border-0 px-4 py-3 text-slate-700 font-medium placeholder:text-slate-300 focus:ring-0 focus:outline-none"
                                      placeholder={`Option ${opt.toUpperCase()}`}
                                      value={q[`option_${opt}`]}
                                      onChange={(e) => update(i, `option_${opt}`, e.target.value)}
                                    />
                                    {isCorrect && (
                                      <div className="absolute right-3 text-emerald-500 animate-in zoom-in duration-200">
                                        <FaCheckCircle />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100 bg-slate-50/30 -mx-8 -mb-8 px-8 py-4 mt-4">
                              <div className="flex-1 w-full sm:w-auto">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Correct Answer</label>
                                <Select
                                  value={correctOptions.find(o => o.value === q.correct_option)}
                                  onChange={(opt) => update(i, "correct_option", opt.value)}
                                  options={correctOptions}
                                  isSearchable={false}
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                  menuPlacement="auto"
                                  className="font-bold text-sm"
                                  styles={{
                                    control: (base, state) => ({
                                      ...base,
                                      border: "none",
                                      boxShadow: "none",
                                      backgroundColor: "white",
                                      borderRadius: "12px",
                                      padding: "2px",
                                      border: "1px solid #e2e8f0"
                                    }),
                                    singleValue: (base) => ({ ...base, color: "#475569" }),
                                    option: (base, state) => ({
                                      ...base,
                                      backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#eef2ff" : "white",
                                      color: state.isSelected ? "white" : "#1e293b",
                                      fontWeight: "600"
                                    })
                                  }}
                                />
                              </div>

                              <div className="w-full sm:w-32">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Marks</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={1}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                    value={q.marks}
                                    onChange={(e) => update(i, "marks", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-center mt-6">
                              <button
                                onClick={() => addQuestionAfter(i)}
                                className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-all"
                              >
                                <FaPlus />
                                Add question below
                              </button>
                            </div>

                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {questions.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-300 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <FaLayerGroup className="text-slate-300 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Questions Yet</h3>
            <p className="text-slate-500 max-w-sm mb-8">Start building your assessment by adding your first question.</p>
            <button
              onClick={addQuestion}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Add Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}