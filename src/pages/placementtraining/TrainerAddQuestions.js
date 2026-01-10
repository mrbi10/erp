import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FaPlus,
  FaSave,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaTrash,
  FaGripVertical,
  FaDownload,
  FaFileExcel,
  FaExclamationCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import Select from "react-select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import * as XLSX from "xlsx";
import { BASE_URL } from "../../constants/API";

/* ------------------------------------------------------------------
 * CONSTANTS & CONFIG
 * ------------------------------------------------------------------ */
const CORRECT_OPTIONS = [
  { value: "A", label: "Option A" },
  { value: "B", label: "Option B" },
  { value: "C", label: "Option C" },
  { value: "D", label: "Option D" }
];

const REQUIRED_HEADERS = [
  "question",
  "option a",
  "option b",
  "option c",
  "option d",
  "correct option",
  "marks",
  "note"
];

// Professional Select Styles matching Tailwind UI
const SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
    "&:hover": { borderColor: "#cbd5e1" }
  }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({ ...base, zIndex: 50 })
};

/* ------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------ */
const uuid = () => Math.random().toString(36).substring(2) + Date.now();

/* ------------------------------------------------------------------
 * SUB-COMPONENT: QUESTION CARD
 * Isolated for performance and readability
 * ------------------------------------------------------------------ */
const QuestionCard = React.memo(({
  q,
  index,
  provided,
  snapshot,
  update,
  addQuestionAfter,
  markDelete,
  isPublished
}) => {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`group bg-white border rounded-xl transition-all duration-200 ${
        snapshot.isDragging 
          ? "shadow-2xl ring-2 ring-indigo-500 rotate-1 z-50 border-transparent" 
          : "shadow-sm border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="p-5">
        {/* Card Header: Drag Handle, Title, Status, Actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              {...provided.dragHandleProps}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to reorder"
            >
              <FaGripVertical />
            </div>
            
            <div className="flex flex-col">
              <span className="font-bold text-slate-700 text-sm">Question {index + 1}</span>
              {q.isNew ? (
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                  Draft
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                  <FaCheckCircle size={8} /> Synced
                </span>
              )}
            </div>
          </div>

          <button
            disabled={isPublished}
            onClick={() => markDelete(q.question_id || q.__tempId)}
            className={`p-2 rounded-lg transition-colors ${
              isPublished
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-400 hover:text-red-600 hover:bg-red-50"
            }`}
            title="Delete Question"
          >
            <FaTrash size={14} />
          </button>
        </div>

        {/* Question Body */}
        <div className="space-y-4">
          <textarea
            disabled={isPublished}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 min-h-[80px] resize-y"
            placeholder="Type your question here..."
            value={q.question}
            onChange={(e) => update(q, "question", e.target.value)}
          />

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["a", "b", "c", "d"].map((opt) => (
              <div key={opt} className="relative flex items-center">
                <div className="absolute left-3 w-6 h-6 rounded flex items-center justify-center bg-slate-100 text-slate-500 text-xs font-bold uppercase pointer-events-none">
                  {opt}
                </div>
                <input
                  disabled={isPublished}
                  className="w-full border border-slate-200 rounded-lg py-2.5 pl-11 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder={`Option ${opt.toUpperCase()}`}
                  value={q[`option_${opt}`]}
                  onChange={(e) => update(q, `option_${opt}`, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Footer Controls: Note, Correct Option, Marks */}
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
             <div className="flex-1 w-full">
                <input
                  disabled={isPublished}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Add a note or explanation (Optional)"
                  value={q.note || ""}
                  onChange={(e) => update(q, "note", e.target.value)}
                />
             </div>

             <div className="flex gap-3 w-full md:w-auto">
               <div className="w-32">
                 <Select
                   isDisabled={isPublished}
                   value={CORRECT_OPTIONS.find((o) => o.value === q.correct_option)}
                   onChange={(opt) => update(q, "correct_option", opt.value)}
                   options={CORRECT_OPTIONS}
                   styles={SELECT_STYLES}
                   isSearchable={false}
                   placeholder="Correct Answer"
                 />
               </div>

               <div className="relative w-20">
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">Marks</span>
                  <input
                    disabled={isPublished}
                    type="number"
                    min={1}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={q.marks}
                    onChange={(e) => update(q, "marks", e.target.value)}
                  />
               </div>
             </div>
          </div>

          {/* Quick Add Action */}
          {!isPublished && (
            <div className="flex justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                 onClick={() => addQuestionAfter(q)}
                 className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
               >
                 <FaPlus /> Insert Question Below
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------
 * MAIN COMPONENT: TRAINER ADD QUESTIONS
 * ------------------------------------------------------------------ */
export default function TrainerAddQuestions() {
  const { testId } = useParams();

  // --- State ---
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("");
  const [totalMarks, setTotalMarks] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  // --- API: Fetch Test Metadata ---
  useEffect(() => {
    fetch(`${BASE_URL}/placement-training/tests/${testId}/meta`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setTestName(data.test?.test_name || "Test");
        setTotalMarks(data.test?.total_marks || 0);
        setIsPublished(data.test?.published === 1);
      });
  }, [testId]);

  // --- API: Fetch Questions ---
  useEffect(() => {
    fetch(`${BASE_URL}/placement-training/tests/${testId}/questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []))
      .finally(() => setLoading(false));
  }, [testId]);

  // --- Logic: Local Updates ---
  const update = useCallback((ref, field, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        (q.question_id || q.__tempId) === (ref.question_id || ref.__tempId)
          ? { ...q, [field]: value }
          : q
      )
    );
  }, []);

  const markDelete = useCallback((key) => {
    setQuestions((prev) =>
      prev.map((q) =>
        (q.question_id || q.__tempId) === key
          ? { ...q, isDeleted: true }
          : q
      )
    );
  }, []);

  const addQuestionAfter = useCallback((ref) => {
    setQuestions((prev) => {
      const idx = prev.findIndex(
        (q) => (q.question_id || q.__tempId) === (ref.question_id || ref.__tempId)
      );
      const copy = [...prev];
      copy.splice(idx + 1, 0, {
        __tempId: uuid(),
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        marks: 1,
        note: "",
        isNew: true,
        isDeleted: false
      });
      return copy;
    });
  }, []);

  // --- Logic: Excel Handlers ---
  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "question",
        "option A",
        "option B",
        "option C",
        "option D",
        "correct option",
        "marks",
        "note"
      ]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "question_template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      Swal.fire("Invalid file", "Only Excel or CSV allowed", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = rows[0]?.map((h) => String(h).trim().toLowerCase());
      if (!headers || headers.join() !== REQUIRED_HEADERS.join()) {
        Swal.fire("Invalid format", "Excel header format mismatch", "error");
        return;
      }

      try {
        const imported = rows.slice(1).map((row, idx) => {
          const correct = String(row[5]).trim().toUpperCase();
          const marks = Number(row[6]);

          if (!["A", "B", "C", "D"].includes(correct)) {
            throw new Error(`Row ${idx + 2}: Invalid correct option`);
          }

          if (isNaN(marks) || marks <= 0) {
            throw new Error(`Row ${idx + 2}: Marks must be positive`);
          }

          return {
            __tempId: uuid(),
            question: row[0],
            option_a: row[1],
            option_b: row[2],
            option_c: row[3],
            option_d: row[4],
            correct_option: correct,
            marks,
            note: row[7] || "",
            isNew: true,
            isDeleted: false
          };
        });

        setQuestions((prev) => [...prev, ...imported]);
        Swal.fire("Success", `${imported.length} questions added`, "success");
      } catch (err) {
        Swal.fire("Excel error", err.message, "error");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // --- Logic: Submit Changes ---
  const submitAllChanges = async () => {
    if (isPublished) return;

    const toDelete = questions.filter((q) => q.question_id && q.isDeleted);
    const toAdd = questions.filter((q) => q.isNew && !q.isDeleted);

    // Alert if nothing to save
    if (toDelete.length === 0 && toAdd.length === 0) {
        return Swal.fire("No Changes", "There are no new changes to save.", "info");
    }

    try {
        // 1. Delete Removed Questions
        for (const q of toDelete) {
            await fetch(`${BASE_URL}/placement-training/questions/${q.question_id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
        }

        // 2. Add New Questions
        if (toAdd.length) {
            await fetch(`${BASE_URL}/placement-training/tests/${testId}/questions`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ questions: toAdd })
            });
        }

        Swal.fire("Saved", "All changes applied successfully", "success");
        window.location.reload();

    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to save changes. Please try again.", "error");
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* ----------------------------------------------------
          STICKY HEADER TOOLBAR
         ---------------------------------------------------- */}
      <div className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto h-16 px-4 lg:px-8 flex justify-between items-center">
          
          {/* Test Info */}
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              {testName}
              {isPublished && (
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider border border-amber-200">
                    Published
                 </span>
              )}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Total Marks: <span className="text-indigo-600 font-bold">{totalMarks}</span> • Questions: <span className="text-slate-700">{questions.filter(q => !q.isDeleted).length}</span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3">
            {!isPublished && (
              <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={downloadExcelTemplate}
                  className="px-3 py-1.5 rounded text-xs font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all flex items-center gap-2"
                  title="Download Template"
                >
                  <FaDownload /> <span className="hidden sm:inline">Template</span>
                </button>

                <div className="w-px h-4 bg-slate-200 mx-1"></div>

                <input
                  type="file"
                  hidden
                  id="excelUpload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                />
                <button
                  onClick={() => document.getElementById("excelUpload").click()}
                  className="px-3 py-1.5 rounded text-xs font-bold text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all flex items-center gap-2"
                  title="Import from Excel"
                >
                  <FaFileExcel /> <span className="hidden sm:inline">Import</span>
                </button>
              </div>
            )}

            <button
              disabled={isPublished}
              onClick={submitAllChanges}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
                isPublished 
                  ? "bg-slate-300 shadow-none cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              <FaSave /> Save All
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          CONTENT AREA
         ---------------------------------------------------- */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {isPublished && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800">
                <FaExclamationCircle className="mt-0.5" />
                <div className="text-sm">
                    <strong>Read-Only Mode:</strong> This test has been published. Questions cannot be edited or deleted to preserve historical result integrity.
                </div>
            </div>
        )}

        

        {!loading && (
          <DragDropContext onDragEnd={() => {}}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-6 min-h-[200px]"
                >
                  {questions
                    .filter((q) => !q.isDeleted)
                    .map((q, i) => (
                      <Draggable
                        key={q.question_id || q.__tempId}
                        draggableId={String(q.question_id || q.__tempId)}
                        index={i}
                        isDragDisabled={isPublished}
                      >
                        {(provided, snapshot) => (
                          <QuestionCard
                            q={q}
                            index={i}
                            provided={provided}
                            snapshot={snapshot}
                            update={update}
                            addQuestionAfter={addQuestionAfter}
                            markDelete={markDelete}
                            isPublished={isPublished}
                          />
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Empty State */}
        {!loading && questions.filter(q => !q.isDeleted).length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl">
                <p className="text-slate-400 font-medium mb-4">No questions added yet.</p>
                <button 
                    onClick={() => document.getElementById("excelUpload").click()}
                    className="text-indigo-600 font-bold hover:underline"
                >
                    Upload Excel
                </button>
            </div>
        )}
      </div>
    </div>
  );
}