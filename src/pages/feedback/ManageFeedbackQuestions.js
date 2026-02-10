import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { 
  FaPlus, 
  FaSpinner, 
  FaLayerGroup, 
  FaListOl, 
  FaStar, 
  FaClipboardList,
  FaArrowRight
} from "react-icons/fa";

/* ===================== CUSTOM STYLES ===================== */

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    padding: "6px",
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px #c7d2fe" : "none",
    "&:hover": { borderColor: "#cbd5e1" },
    backgroundColor: "#f8fafc"
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "#334155", fontWeight: "600" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#e0e7ff" : "white",
    color: state.isSelected ? "white" : "#334155",
    cursor: "pointer"
  })
};

/* ===================== COMPONENT ===================== */

export default function ManageFeedbackQuestions() {

  /* ===================== STATE ===================== */
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [newQuestion, setNewQuestion] = useState("");
  const [orderNo, setOrderNo] = useState(1);
  const [maxRating, setMaxRating] = useState(5);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [newSetName, setNewSetName] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);

  const token = localStorage.getItem("token");

  /* ===================== EFFECT ===================== */
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
    } catch {
      Swal.fire("Error", "Failed to load question sets", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim()) {
      Swal.fire("Required", "Please enter a name for the question set.", "warning");
      return;
    }

    try {
      setCreatingSet(true);

      await axios.post(
        `${BASE_URL}/feedback/question-sets`,
        { name: newSetName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: 'success',
        title: 'Created!',
        text: 'New question set added successfully.',
        timer: 1500,
        showConfirmButton: false
      });
      
      setNewSetName("");
      fetchSets(); 
    } catch {
      Swal.fire("Error", "Failed to create question set", "error");
    } finally {
      setCreatingSet(false);
    }
  };

  const fetchQuestions = async (setId) => {
    try {
      setLoadingQuestions(true);
      const res = await axios.get(
        `${BASE_URL}/feedback/question-sets/${setId}/questions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const fetchedQuestions = res.data || [];
      setQuestions(fetchedQuestions);
      
      // Auto-increment order number based on existing count
      setOrderNo(fetchedQuestions.length + 1);
      
    } catch {
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  /* ===================== HANDLERS ===================== */

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      Swal.fire("Required", "Question text cannot be empty.", "warning");
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

      setNewQuestion("");
      // Smart increment for next input
      setOrderNo(prev => prev + 1);

      fetchQuestions(selectedSet.value);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to add question",
        "error"
      );
    } finally {
      setSaving(false);
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

  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading Question Sets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in-up">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
        <p className="text-slate-500 mt-1">Create and manage feedback questionnaires.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: SET MANAGEMENT */}
        <div className="space-y-6">
          
          {/* Create Set Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <FaPlus className="text-xs" /> New Set
             </h2>
             <div className="space-y-3">
               <input
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                 placeholder="e.g., Faculty Evaluation 2025"
                 value={newSetName}
                 onChange={e => setNewSetName(e.target.value)}
               />
               <button
                 onClick={handleCreateSet}
                 disabled={creatingSet}
                 className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {creatingSet ? <FaSpinner className="animate-spin" /> : "Create Set"}
               </button>
             </div>
          </div>

          {/* Select Set Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <FaLayerGroup className="text-xs" /> Select Set
             </h2>
            <Select
              options={sets.map(s => ({
                value: s.set_id,
                label: s.name
              }))}
              placeholder="Choose a Question Set..."
              onChange={onSetChange}
              value={selectedSet}
              styles={customSelectStyles}
              className="text-sm"
            />
            {selectedSet && (
              <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium border border-blue-100">
                Editing: <span className="font-bold">{selectedSet.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTIONS MANAGEMENT */}
        <div className="lg:col-span-2">
          {selectedSet ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
              
              {/* Add Question Form */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                  <FaPlus className="text-indigo-600" /> Add New Question
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
                      placeholder="Type your question here..."
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="w-20 relative" title="Order Number">
                      <FaListOl className="absolute left-3 top-3.5 text-slate-400 text-xs" />
                      <input
                        type="number"
                        className="w-full pl-8 pr-2 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-slate-600"
                        placeholder="#"
                        value={orderNo}
                        onChange={e => setOrderNo(Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="w-24 relative" title="Max Rating Scale">
                      <FaStar className="absolute left-3 top-3.5 text-amber-400 text-xs" />
                      <input
                        type="number"
                        className="w-full pl-8 pr-2 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-slate-600"
                        placeholder="Max"
                        value={maxRating}
                        onChange={e => setMaxRating(Number(e.target.value))}
                      />
                    </div>

                    <button
                      onClick={handleAddQuestion}
                      disabled={saving}
                      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center"
                    >
                      {saving ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 p-0">
                {loadingQuestions ? (
                   <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                     <FaSpinner className="animate-spin text-2xl mb-2" />
                     <span className="text-sm">Loading questions...</span>
                   </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {questions.length > 0 ? (
                      questions.map((q) => (
                        <div key={q.question_id} className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4 group">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200">
                            {q.order_no}
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-slate-800 font-medium leading-relaxed group-hover:text-indigo-700 transition-colors">
                              {q.question_text}
                            </p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                              <FaStar className="text-[10px]" /> 
                              Max: {q.max_rating}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <FaClipboardList className="text-5xl mb-4 opacity-10" />
                        <p className="font-medium">No questions in this set yet.</p>
                        <p className="text-xs mt-1 opacity-60">Add a question above to get started.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State for Right Column
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <FaLayerGroup className="text-6xl mb-4 opacity-20" />
              <p className="font-bold text-lg text-slate-500">No Question Set Selected</p>
              <p className="text-sm">Please select or create a set from the left menu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}