import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import {
  FaPlus,
  FaSpinner,
  FaLayerGroup,
  FaStar,
  FaClipboardList,
  FaTrash,
  FaPen
} from "react-icons/fa";

/* ===================== CUSTOM STYLES ===================== */

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    '&:hover': { borderColor: '#94a3b8' }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 50
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    fontSize: '0.95rem',
    padding: '12px 14px',
  }),
  placeholder: (base) => ({ ...base, color: "#64748b" }),
  singleValue: (base) => ({ ...base, color: "#1e293b", fontWeight: "600" }),
};

/* ===================== COMPONENT ===================== */

export default function ManageFeedbackQuestions() {

  /* ===================== STATE ===================== */
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Form State
  const [newQuestion, setNewQuestion] = useState("");
  const [orderNo, setOrderNo] = useState(1);
  const [maxRating, setMaxRating] = useState(10); // Default to 10 point scale
  const questionInputRef = useRef(null); // Used to auto-focus after submit

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [creatingSet, setCreatingSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");

  const token = localStorage.getItem("token");

  /* ===================== INITIAL LOAD ===================== */
  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BASE_URL}/feedback/question-sets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSets(res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire('System Error', 'Failed to load question sets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ===================== HANDLERS: SETS ===================== */
  const handleCreateSet = async (e) => {
    e.preventDefault(); // Prevent form submission reload
    if (!newSetName.trim()) {
      Swal.fire('Missing Name', 'Please enter a name for the new question set.', 'warning');
      return;
    }

    try {
      setCreatingSet(true);
      await axios.post(
        `${BASE_URL}/feedback/question-sets`,
        { name: newSetName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({ icon: 'success', title: 'Created!', text: 'New question set added.', timer: 1500, showConfirmButton: false });
      setNewSetName("");
      fetchSets();
    } catch (error) {
      Swal.fire("Error", "Failed to create question set", "error");
    } finally {
      setCreatingSet(false);
    }
  };

  const onSetChange = (opt) => {
    setSelectedSet(opt);
    if (opt) {
      fetchQuestions(opt.value);
    } else {
      setQuestions([]);
    }
  };

  /* ===================== HANDLERS: QUESTIONS ===================== */
  const fetchQuestions = async (setId) => {
    try {
      setLoadingQuestions(true);
      const res = await axios.get(
        `${BASE_URL}/feedback/question-sets/${setId}/questions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fallback for missing order_no to prevent NaN issues
      const fetchedQuestions = (res.data || []);
      setQuestions(fetchedQuestions);

      // Smart Auto-increment
      const maxOrder = fetchedQuestions.length > 0
        ? Math.max(...fetchedQuestions.map(q => q.order_no || 0))
        : 0;
      setOrderNo(maxOrder + 1);

    } catch (error) {
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault(); // Allows pressing "Enter" to submit
    if (!newQuestion.trim()) {
      Swal.fire('Missing Text', 'Question text cannot be empty.', 'warning');
      questionInputRef.current?.focus();
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${BASE_URL}/feedback/question-sets/${selectedSet.value}/questions`,
        {
          question_text: newQuestion,
          order_no: orderNo,
          max_rating: maxRating
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success UX
      setNewQuestion("");
      setOrderNo(prev => prev + 1);
      fetchQuestions(selectedSet.value);

      // Keep user in the flow
      questionInputRef.current?.focus();

    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to add question", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: 'Delete Question?',
      text: "Are you sure you want to remove this question?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, Delete'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${BASE_URL}/feedback/question-sets/${selectedSet.value}/questions/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // We already return updated_list from backend
      if (res.data?.updated_list) {
        setQuestions(res.data.updated_list);
      } else {
        fetchQuestions(selectedSet.value);
      }

    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Could not delete question.', 'error');
    }
  };


  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50 text-indigo-600">
        <FaSpinner className="animate-spin text-4xl" />
        <p className="font-bold">Loading System...</p>
      </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-left text-slate-800 tracking-tight">Manage Feedback Questions</h1>
          <p className="text-slate-500 font-medium mt-1">Design and organize questionnaires for student feedback.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* --- LEFT COLUMN: SET MANAGEMENT --- */}
          <div className="lg:col-span-4 space-y-6">

            {/* Create New Set Form */}
            <form onSubmit={handleCreateSet} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
                <FaPlus className="text-indigo-500" /> Create New Set
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Set Name</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="e.g., Faculty Evaluation 2026"
                    value={newSetName}
                    onChange={e => setNewSetName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingSet}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creatingSet ? <FaSpinner className="animate-spin" /> : "Create Set"}
                </button>
              </div>
            </form>

            {/* Select Set Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
                <FaLayerGroup className="text-indigo-500" /> Select Active Set
              </h2>
              <Select
                options={sets.map(s => ({ value: s.set_id, label: s.name }))}
                placeholder="Choose a Question Set..."
                onChange={onSetChange}
                value={selectedSet}
                styles={customSelectStyles}
              />

              {selectedSet && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                    {questions.length}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Questions</p>
                    <p className="text-sm font-bold text-slate-800">{selectedSet.label}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: QUESTIONS MANAGEMENT --- */}
          <div className="lg:col-span-8">
            {selectedSet ? (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                <div className="h-1 w-full bg-indigo-600"></div>

                {/* Toolbar / Add Form (Now a real <form> for Enter key support) */}
                <form onSubmit={handleAddQuestion} className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <FaPen className="text-indigo-500" /> Add New Question
                  </h2>

                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Question Input */}
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Question Text</label>
                      <input
                        ref={questionInputRef}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        placeholder="Type question here and hit Enter..."
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                      />
                    </div>

                    {/* Order No */}
                    <div className="w-full md:w-24">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Order No.</label>
                      <input
                        type="number"
                        className="w-full px-2 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-slate-700"
                        value={orderNo}
                        onChange={e => setOrderNo(Number(e.target.value))}
                      />
                    </div>

                    {/* Max Rating */}
                    <div className="w-full md:w-24">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Scale (Max)</label>
                      <input
                        type="number"
                        className="w-full px-2 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-slate-700"
                        value={maxRating}
                        onChange={e => setMaxRating(Number(e.target.value))}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {saving ? <FaSpinner className="animate-spin" /> : "Add"}
                    </button>
                  </div>
                </form>

                {/* Questions List Content */}
                <div className="flex-1 bg-white relative">
                  {loadingQuestions ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500 bg-white/90 z-10">
                      <FaSpinner className="animate-spin text-4xl mb-3" />
                      <span className="font-bold text-slate-600">Loading questions...</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 h-full overflow-y-auto" style={{ maxHeight: '600px' }}>
                      {questions.length > 0 ? (
                        questions.map((q) => (
                          <div key={q.question_id} className="p-5 hover:bg-indigo-50/30 transition-colors flex items-center gap-4 group">

                            {/* Order Badge */}
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-black text-sm shrink-0">
                              {q.order_no}
                            </div>

                            {/* Text & Meta */}
                            <div className="flex-1">
                              <p className="text-slate-800 font-semibold text-[15px]">
                                {q.question_text}
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                                <FaStar className="text-amber-400" /> Rated out of {q.max_rating}
                              </p>
                            </div>

                            {/* Delete Button - ALWAYS VISIBLE NOW */}
                            <button
                              onClick={() => handleDeleteQuestion(q.question_id)}
                              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-red-100 shrink-0 flex items-center gap-2"
                              title="Delete Question"
                            >
                              <FaTrash className="text-sm" />
                              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Remove</span>
                            </button>

                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                          <FaClipboardList className="text-5xl mb-4 opacity-50" />
                          <p className="font-bold text-lg text-slate-600">No questions yet.</p>
                          <p className="text-sm mt-1">Type a question above and hit Enter.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Empty State for Right Column
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400 shadow-sm">
                <FaLayerGroup className="text-6xl mb-6 text-indigo-200" />
                <h3 className="font-bold text-2xl text-slate-700">No Set Selected</h3>
                <p className="font-medium mt-2 max-w-sm text-center text-slate-500">
                  Select an existing question set from the left panel, or create a new one to begin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}