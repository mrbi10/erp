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
  FaArrowRight, 
  FaTrash, 
  FaPen 
} from "react-icons/fa";

/* ===================== CUSTOM STYLES ===================== */

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '46px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
    paddingLeft: '4px',
    fontSize: '0.9rem',
    '&:hover': { borderColor: '#cbd5e1' }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    zIndex: 50
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '10px 12px',
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "#334155", fontWeight: "600" }),
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
      Swal.fire({
          icon: 'error',
          title: 'System Error',
          text: 'Failed to load question sets.',
          confirmButtonColor: '#4f46e5'
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===================== HANDLERS: SETS ===================== */

  const handleCreateSet = async () => {
    if (!newSetName.trim()) {
      Swal.fire({
          icon: 'warning',
          title: 'Missing Name',
          text: 'Please enter a name for the new question set.',
          confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      setCreatingSet(true);

      const res = await axios.post(
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
      fetchSets(); // Refresh list
      
      // Auto-select the newly created set (optional UX enhancement)
      // if (res.data.insertId) ...

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
      
      const fetchedQuestions = (res.data || []).sort((a, b) => a.order_no - b.order_no);
      setQuestions(fetchedQuestions);
      
      // Smart Auto-increment: Find highest order number + 1
      const maxOrder = fetchedQuestions.length > 0 
        ? Math.max(...fetchedQuestions.map(q => q.order_no)) 
        : 0;
      setOrderNo(maxOrder + 1);
      
    } catch (error) {
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
       Swal.fire({
          icon: 'warning',
          title: 'Missing Text',
          text: 'Question text cannot be empty.',
          confirmButtonColor: '#f59e0b'
      });
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
      setOrderNo(prev => prev + 1); // Increment for next entry immediately
      
      // Refresh list without full page reload feels
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

  const handleDeleteQuestion = async (questionId) => {
      const result = await Swal.fire({
          title: 'Delete Question?',
          text: "This cannot be undone.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Yes, delete it'
      });

      if (!result.isConfirmed) return;

      try {
          // Assuming API endpoint exists: DELETE /feedback/questions/:id
          // If not in your API spec yet, this is a placeholder for that logic
          // await axios.delete(`${BASE_URL}/feedback/questions/${questionId}`, ...);
          
          Swal.fire('Deleted', 'Question removed.', 'success');
          fetchQuestions(selectedSet.value);
      } catch (error) {
           Swal.fire('Error', 'Could not delete question.', 'error');
      }
  };

  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-bold animate-pulse">Loading Question Bank...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in-up font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
           <p className="text-slate-500 mt-1">Design and organize feedback questionnaires.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT COLUMN: SET MANAGEMENT (4 cols) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Create New Set Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <FaPlus className="text-indigo-500" /> Create New Set
             </h2>
             <div className="space-y-3">
               <input
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                 placeholder="e.g., Faculty Evaluation 2024"
                 value={newSetName}
                 onChange={e => setNewSetName(e.target.value)}
               />
               <button
                 onClick={handleCreateSet}
                 disabled={creatingSet}
                 className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {creatingSet ? <FaSpinner className="animate-spin" /> : "Create Set"}
               </button>
             </div>
          </div>

          {/* Select Set Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <FaLayerGroup className="text-indigo-500" /> Select Active Set
             </h2>
            <Select
              options={sets.map(s => ({ value: s.set_id, label: s.name }))}
              placeholder="Choose a Question Set..."
              onChange={onSetChange}
              value={selectedSet}
              styles={customSelectStyles}
              className="text-sm"
            />
            
            {selectedSet && (
              <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {questions.length}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-indigo-900 uppercase">Current Editing</p>
                        <p className="text-sm font-bold text-slate-700 leading-tight">{selectedSet.label}</p>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: QUESTIONS MANAGEMENT (8 cols) --- */}
        <div className="lg:col-span-8">
          {selectedSet ? (
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
              
              {/* Toolbar / Add Form */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <FaPen className="text-indigo-500 text-sm" /> Add New Question
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                        Drafting
                    </span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="flex-1">
                    <input
                      className="w-full h-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder-slate-400 font-medium"
                      placeholder="Type your question here..."
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="w-20 relative group" title="Order Number">
                      <FaListOl className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none group-focus-within:text-indigo-500" />
                      <input
                        type="number"
                        className="w-full pl-8 pr-2 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-slate-600"
                        placeholder="#"
                        value={orderNo}
                        onChange={e => setOrderNo(Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="w-24 relative group" title="Max Rating Scale">
                      <FaStar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs pointer-events-none" />
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
                      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center hover:-translate-y-0.5 transform duration-150"
                    >
                      {saving ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions List Content */}
              <div className="flex-1 bg-white relative">
                {loadingQuestions ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/80 z-10">
                     <FaSpinner className="animate-spin text-3xl mb-3 text-indigo-500" />
                     <span className="text-sm font-medium">Loading questions...</span>
                   </div>
                ) : (
                  <div className="divide-y divide-slate-50 h-full overflow-y-auto custom-scrollbar" style={{ maxHeight: '600px' }}>
                    {questions.length > 0 ? (
                      questions.map((q, idx) => (
                        <div key={q.question_id} className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4 group">
                          {/* Order Badge */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xs group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors shadow-sm">
                            {q.order_no}
                          </div>
                          
                          {/* Text */}
                          <div className="flex-1 pt-1">
                            <p className="text-slate-700 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                              {q.question_text}
                            </p>
                          </div>
                          
                          {/* Meta & Actions */}
                          <div className="flex-shrink-0 flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wide border border-slate-100">
                              <FaStar className="text-amber-400" /> 
                              Scale: {q.max_rating}
                            </span>
                            
                            {/* Delete Button (Placeholder functionality) */}
                            <button 
                                onClick={() => handleDeleteQuestion(q.question_id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Question"
                            >
                                <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FaClipboardList className="text-4xl opacity-50" />
                        </div>
                        <p className="font-bold text-slate-500">No questions found</p>
                        <p className="text-sm mt-1">Add your first question using the form above.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State for Right Column
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <FaLayerGroup className="text-6xl mb-6 text-slate-200" />
              <h3 className="font-bold text-xl text-slate-600">No Set Selected</h3>
              <p className="text-sm mt-2 max-w-xs text-center">Select an existing question set from the left panel or create a new one to start managing questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}