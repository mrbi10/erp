import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSave,
  FaBookOpen,
  FaFileImport,
  FaFileExport,
  FaFileDownload,
  FaGraduationCap,
  FaSpinner,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Select Styles ────────────────────────────────────────────────────────────
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    padding: "4px",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    backgroundColor: "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59,130,246,0.1)" : "none",
    "&:hover": { borderColor: "#d1d5db" },
    minHeight: "46px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    overflow: "hidden",
    zIndex: 50,
    marginTop: "4px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
    color: state.isSelected ? "white" : "#1f2937",
    cursor: "pointer",
    padding: "10px 12px",
  }),
  singleValue: (base) => ({ ...base, color: "#111827", fontWeight: "500" }),
  placeholder: (base) => ({ ...base, color: "#9ca3af" }),
};

const EXAM_OPTIONS = [
  { value: "IAT1", label: "IAT 1" },
  { value: "IAT2", label: "IAT 2" },
  { value: "MODEL", label: "Model Exam" },
  { value: "FINAL", label: "Final Semester" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const EnterMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examType, setExamType] = useState("IAT1");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importPreview, setImportPreview] = useState(null); // { rows, errors }
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Reset table when subject changes
  useEffect(() => {
    setStudents([]);
    setMarks({});
    setImportPreview(null);
  }, [selectedSubject]);

  // Warn on unsaved changes
  useEffect(() => {
    const hasChanges = Object.keys(marks).length > 0 && !isSaving;
    const handler = (e) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [marks, isSaving]);

  // Fetch subjects
  useEffect(() => {
    if (!["Staff", "CA"].includes(user.role)) return;
    if (!user.dept_id || !user.assigned_class_id) return;

    const fetchSubjects = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/subjects?dept_id=${user.dept_id}&class_id=${user.assigned_class_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
      } catch {
        Swal.fire("Error", "Failed to load subjects", "error");
      }
    };
    fetchSubjects();
  }, [user.role, user.dept_id, user.assigned_class_id, token]);

  // Fetch students when subject selected
  useEffect(() => {
    if (!selectedSubject) return;
    const subject = subjects.find((s) => s.subject_id === selectedSubject.value);
    if (!subject) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/classes/${subject.class_id}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setStudents(data.data);
          // Pre-fill existing marks if any
          const existingMarks = {};
          data.data.forEach((s) => {
            if (s.existing_mark !== undefined && s.existing_mark !== null) {
              existingMarks[s.student_id] = s.existing_mark;
            }
          });
          if (Object.keys(existingMarks).length) setMarks(existingMarks);
        } else {
          Swal.fire("Error", "Unexpected student data format", "error");
        }
      } catch {
        Swal.fire("Error", "Failed to fetch students.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedSubject, subjects, token]);

  // ─── Mark Change Handler ──────────────────────────────────────────────────
  const handleMarkChange = useCallback((studentId, value) => {
    if (value === "") {
      setMarks((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
      return;
    }
    if (isNaN(value)) return;
    const clamped = Math.max(0, Math.min(100, Number(value)));
    setMarks((prev) => ({ ...prev, [studentId]: clamped }));
  }, []);

  // ─── Keyboard Navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      document.querySelector(`input[data-index="${idx + 1}"]`)?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      document.querySelector(`input[data-index="${idx - 1}"]`)?.focus();
    }
  };

  // ─── Excel Paste Handler ──────────────────────────────────────────────────
  const handlePaste = useCallback(
    (e, startIdx) => {
      const clipText = e.clipboardData.getData("text");
      if (!clipText.includes("\n") && !clipText.includes("\t")) return;

      e.preventDefault();
      const pastedRows = clipText.trim().split("\n");
      const updates = {};
      pastedRows.forEach((row, offset) => {
        const targetIdx = startIdx + offset;
        const student = students[targetIdx];
        if (!student) return;
        const val = row.split("\t")[0].trim();
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          updates[student.student_id] = num;
        }
      });

      if (Object.keys(updates).length > 0) {
        setMarks((prev) => ({ ...prev, ...updates }));
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Pasted ${Object.keys(updates).length} marks`,
          showConfirmButton: false,
          timer: 2000,
        });
      }
    },
    [students]
  );

  // ─── Submit Handler ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedSubject)
      return Swal.fire("Error", "Select a subject first", "error");
    if (Object.keys(marks).length === 0)
      return Swal.fire("Error", "No marks entered", "error");

    const confirm = await Swal.fire({
      title: "Save Marks?",
      text: `Saving marks for ${Object.keys(marks).length} students.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      confirmButtonText: "Yes, Save",
    });
    if (!confirm.isConfirmed) return;

    try {
      setIsSaving(true);
      const payload = Object.entries(marks).map(([student_id, mark]) => ({
        student_id: Number(student_id),
        subject_id: selectedSubject.value,
        exam_type: examType,
        mark,
        total: 100,
      }));

      const res = await fetch(`${BASE_URL}/marks/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      Swal.fire({ icon: "success", title: "Marks Saved", text: "All marks saved successfully.", confirmButtonColor: "#2563eb" });
      setMarks({});
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to save marks", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Import: File Chosen ──────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileInputRef.current.value = "";

    if (!selectedSubject || !examType) {
      return Swal.fire("Error", "Please select a subject and exam type before importing.", "error");
    }

    // Client-side preview parse
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const previewRows = rows.slice(0, 5).map((row) => {
          const keys = Object.keys(row).map((k) => k.trim().toLowerCase().replace(/\s+/g, "_"));
          const normalised = {};
          keys.forEach((k, i) => (normalised[k] = Object.values(row)[i]));
          return {
            rollNo: String(normalised["roll_no"] || normalised["rollno"] || "").trim(),
            marks: normalised["marks"] ?? normalised["mark"] ?? "",
          };
        });

        setImportPreview({ rows: previewRows, total: rows.length, file });
      } catch {
        Swal.fire("Error", "Could not read file. Please use .xlsx or .csv format.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = async () => {
    if (!importPreview?.file) return;
    setIsImporting(true);

    const formData = new FormData();
    formData.append("file", importPreview.file);
    formData.append("subject_id", selectedSubject.value);
    formData.append("exam_type", examType);

    try {
      const res = await fetch(`${BASE_URL}/marks/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setImportPreview(null);
      Swal.fire({
        icon: "success",
        title: "Import Complete",
        html: `<b>${data.inserted}</b> marks imported.<br/>${data.failed ? `<span class='text-red-500'>${data.failed} failed</span>` : ""}`,
        confirmButtonColor: "#2563eb",
      });
    } catch (err) {
      Swal.fire("Error", err.message || "Import failed", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Export to Excel ──────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!selectedSubject)
      return Swal.fire("Info", "Select a subject to export its marks.", "info");

    try {
      const params = new URLSearchParams({ subjectId: selectedSubject.value, examType });
      const res = await fetch(`${BASE_URL}/marks/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marks_${selectedSubject.label}_${examType}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ─── Download Template ────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`${BASE_URL}/marks/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download template");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "marks_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ─── Export to PDF ────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!selectedSubject || students.length === 0)
      return Swal.fire("Info", "Load a class first to export PDF.", "info");

    const doc = new jsPDF();
    const subjectLabel = selectedSubject?.label || "Subject";

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Marks Report", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Subject: ${subjectLabel}`, 14, 26);
    doc.text(`Exam Type: ${examType}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    const tableData = students.map((s, i) => [
      i + 1,
      s.roll_no,
      s.name,
      marks[s.student_id] !== undefined ? marks[s.student_id] : "-",
      marks[s.student_id] !== undefined
        ? marks[s.student_id] >= 50
          ? "Pass"
          : "Fail"
        : "-",
    ]);

    autoTable(doc, {
      startY: 44,
      head: [["#", "Roll No", "Student Name", "Marks", "Status"]],
      body: tableData,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      styles: { fontSize: 9 },
    });

    const entered = Object.keys(marks).length;
    const passed = Object.values(marks).filter((m) => m >= 50).length;
    const avg = entered > 0 ? (Object.values(marks).reduce((a, b) => a + b, 0) / entered).toFixed(2) : "-";

    const finalY = doc.lastAutoTable?.finalY || 44;
    doc.setFontSize(9);
    doc.text(`Total Students: ${students.length}   |   Entered: ${entered}   |   Avg: ${avg}   |   Pass: ${passed}`, 14, finalY + 8);

    doc.save(`marks_report_${subjectLabel}_${examType}.pdf`);
  };

  // ─── Derived State ────────────────────────────────────────────────────────
  const subjectOptions = subjects.map((s) => ({
    value: s.subject_id,
    label: s.subject_code ? `${s.subject_code.toUpperCase()} – ${s.subject_name}` : s.subject_name,
  }));
  const enteredCount = Object.keys(marks).length;
  const remainingCount = Math.max(0, students.length - enteredCount);
  const passCount = Object.values(marks).filter((m) => m >= 50).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <FaGraduationCap className="text-xl" />
              </span>
              Enter Exam Marks
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Input, import and manage student performance records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Download Template */}
            <button
              onClick={handleDownloadTemplate}
              title="Download Excel Template"
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all"
            >
              <FaFileDownload /> Template
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedSubject}
              title="Import marks from Excel/CSV"
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:border-green-400 hover:text-green-600 transition-all disabled:opacity-50"
            >
              <FaFileImport /> Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Export Excel */}
            <button
              onClick={handleExport}
              disabled={!selectedSubject}
              title="Export to Excel"
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-50"
            >
              <FaFileExport /> Export
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={!selectedSubject || students.length === 0}
              title="Export PDF report"
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:border-red-400 hover:text-red-600 transition-all disabled:opacity-50"
            >
              <FaEye /> PDF
            </button>

            {/* Save */}
            <button
              onClick={handleSubmit}
              disabled={isSaving || loading || students.length === 0 || enteredCount === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 disabled:shadow-none"
            >
              {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {isSaving ? "Saving..." : "Save Marks"}
            </button>
          </div>
        </div>

        {/* ── Config Card ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative z-20">
          <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
            <FaClipboardList /> Configuration
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Subject</label>
              <Select
                placeholder="Select Subject..."
                className="text-sm font-medium"
                options={subjectOptions}
                value={selectedSubject}
                onChange={(opt) => setSelectedSubject(opt)}
                styles={selectStyles}
                isDisabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Exam Type</label>
              <Select
                options={EXAM_OPTIONS}
                value={EXAM_OPTIONS.find((o) => o.value === examType)}
                onChange={(opt) => setExamType(opt.value)}
                styles={selectStyles}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* ── Import Preview Modal ── */}
        <AnimatePresence>
          {importPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-yellow-200 rounded-2xl shadow-sm p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FaEye className="text-yellow-500" /> Import Preview
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    (showing first 5 of {importPreview.total} rows)
                  </span>
                </h3>
                <button
                  onClick={() => setImportPreview(null)}
                  className="text-gray-400 hover:text-gray-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-2">Roll No</th>
                      <th className="px-4 py-2">Marks</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.rows.map((r, i) => {
                      const valid = r.rollNo && !isNaN(parseFloat(r.marks)) && parseFloat(r.marks) >= 0 && parseFloat(r.marks) <= 100;
                      return (
                        <tr key={i} className={valid ? "" : "bg-red-50"}>
                          <td className="px-4 py-2 font-mono">{r.rollNo || <span className="text-gray-400 italic">—</span>}</td>
                          <td className="px-4 py-2">{String(r.marks)}</td>
                          <td className="px-4 py-2">
                            {valid
                              ? <span className="text-green-600 flex items-center gap-1"><FaCheckCircle /> Valid</span>
                              : <span className="text-red-500 flex items-center gap-1"><FaTimesCircle /> Invalid</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setImportPreview(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  disabled={isImporting}
                  className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isImporting ? <FaSpinner className="animate-spin" /> : <FaFileImport />}
                  {isImporting ? "Importing..." : `Import All ${importPreview.total} Rows`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <FaSpinner className="text-4xl text-blue-500" />
              </motion.div>
              <p className="mt-4 text-gray-400 font-medium">Fetching Students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FaBookOpen className="text-3xl opacity-20" />
              </div>
              <p className="text-lg font-medium">No subject selected</p>
              <p className="text-sm">Please select a subject to enter marks.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-4 w-10 text-center">#</th>
                    <th className="px-6 py-4 w-32 text-center">Roll No</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4 w-48 text-center">Marks /100</th>
                    <th className="px-4 py-4 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => {
                    const m = marks[s.student_id];
                    const hasValue = m !== undefined && m !== "";
                    const passed = hasValue && Number(m) >= 50;
                    return (
                      <tr
                        key={s.student_id}
                        className="hover:bg-blue-50/30 transition-colors duration-150 group"
                      >
                        <td className="px-4 py-3 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-6 py-3 text-center font-mono text-sm text-gray-600 bg-gray-50/50">
                          {s.roll_no}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all">
                              {s.roll_no?.slice(-3)}
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={m ?? ""}
                            data-index={idx}
                            disabled={isSaving}
                            onChange={(e) => handleMarkChange(s.student_id, e.target.value === "" ? "" : Number(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            onPaste={(e) => handlePaste(e, idx)}
                            placeholder="—"
                            className="w-24 px-3 py-2 text-center font-bold text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all shadow-sm placeholder-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasValue ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                              }`}
                            >
                              {passed ? <FaCheckCircle /> : <FaTimesCircle />}
                              {passed ? "Pass" : "Fail"}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Stats */}
          {!loading && students.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center text-xs font-semibold text-gray-500 gap-3">
              <span>Total: <b className="text-gray-700">{students.length}</b></span>
              <span className="text-blue-600">Entered: <b>{enteredCount}</b></span>
              <span className={remainingCount === 0 ? "text-green-600" : "text-orange-500"}>
                Remaining: <b>{remainingCount}</b>
              </span>
              {enteredCount > 0 && (
                <>
                  <span className="text-green-600">Pass: <b>{passCount}</b></span>
                  <span className="text-red-500">Fail: <b>{enteredCount - passCount}</b></span>
                  <span className="text-gray-600">
                    Avg:{" "}
                    <b>
                      {(Object.values(marks).reduce((a, b) => a + Number(b), 0) / enteredCount).toFixed(1)}
                    </b>
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterMarks;