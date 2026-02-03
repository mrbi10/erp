import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { motion } from "framer-motion";
import {
  FaSave,
  FaBookOpen,
  FaUserGraduate,
  FaMagic,
  FaClipboardList,
  FaGraduationCap,
  FaSpinner,
} from "react-icons/fa";

// Professional Select Styles
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    padding: "4px",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    backgroundColor: "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.1)" : "none",
    "&:hover": { borderColor: "#d1d5db" },
    minHeight: "46px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    zIndex: 50,
    marginTop: "4px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#1f2937",
    cursor: "pointer",
    padding: "10px 12px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#111827",
    fontWeight: "500",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
};

const EnterMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [examType, setExamType] = useState("IAT1");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    setStudents([]);
    setMarks({});
  }, [selectedSubject]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        let url = "";

        if (["Staff", "CA"].includes(user.role)) {
          if (!user.dept_id || !user.assigned_class_id) {
            setSubjects([]);
            return;
          }
          url = `${BASE_URL}/subjects?dept_id=${user.dept_id}&class_id=${user.assigned_class_id}`;
        } else {
          return;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        Swal.fire("Error", "Failed to load subjects", "error");
      }
    };

    fetchSubjects();
  }, [user.role, user.dept_id, user.assigned_class_id, token]);

  // Fetch students when subject is selected
  useEffect(() => {
    if (!selectedSubject) return;
    const subject = subjects.find(
      (s) => s.subject_id === Number(selectedSubject)
    );
    if (!subject) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}/classes/${subject.class_id}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (data?.success && Array.isArray(data.data)) {
          setStudents(data.data);
        } else {
          Swal.fire("Error", "Unexpected student data format", "error");
        }
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: "Failed to fetch students.",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedSubject, subjects, token]);

  const handleMarkChange = (studentId, value) => {
    // allow clearing
    if (value === "") {
      setMarks((prev) => {
        const copy = { ...prev };
        delete copy[studentId]; // optional: keeps Marks Entered count clean
        return copy;
      });
      return;
    }

    // block invalid typing
    if (isNaN(value)) return;

    if (value < 0 || value > 100) {
      Swal.fire("Invalid", "Marks must be between 0–100", "warning");
      return;
    }

    setMarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  useEffect(() => {
  const hasUnsavedChanges = Object.keys(marks).length > 0 && !isSaving;

  const handleBeforeUnload = (e) => {
    if (!hasUnsavedChanges) return;

    e.preventDefault();
    e.returnValue = ""; // required for Chrome
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [marks, isSaving]);


  const enteredCount = Object.keys(marks).length;
  const remainingCount = Math.max(0, students.length - enteredCount);


  const handleSubmit = async () => {
    if (!selectedSubject)
      return Swal.fire("Error", "Select a subject first", "error");
    if (students.length === 0)
      return Swal.fire("Error", "No students to save marks for", "error");

    try {
      setIsSaving(true);
      for (const [student_id, mark] of Object.entries(marks)) {
        const res = await fetch(`${BASE_URL}/marks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_id,
            subject_id: selectedSubject,
            exam_type: examType,
            mark,
            total: 100,
          }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      }

      Swal.fire({
        title: "Success!",
        text: "All marks saved successfully.",
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
      setMarks({});
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to save marks", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <FaGraduationCap className="text-xl" />
              </span>
              Enter Exam Marks
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Input and manage student performance records.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSaving || loading || students.length === 0}
            className="group flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:shadow-none"
          >
            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            <span>{isSaving ? "Saving..." : "Save All Marks"}</span>
          </button>
        </div>

        {/* Filters Card */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative z-20">
          <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
            <FaClipboardList /> Configuration
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Subject
              </label>
              <Select
                options={subjects.map((s) => ({
                  value: s.subject_id,
                  label: s.subject_code
                    ? `${s.subject_code.toUpperCase()} - ${s.subject_name}`
                    : s.subject_name,
                }))}
                value={
                  selectedSubject
                    ? {
                      value: selectedSubject,
                      label: (() => {
                        const subj = subjects.find(
                          (s) => s.subject_id === Number(selectedSubject)
                        );
                        return subj?.subject_code
                          ? `${subj.subject_code.toUpperCase()} - ${subj.subject_name}`
                          : subj?.subject_name || "";
                      })(),
                    }
                    : null
                }
                onChange={(opt) => setSelectedSubject(opt?.value || "")}
                styles={selectStyles}
                placeholder="Select Subject..."
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Exam Type
              </label>
              <Select
                options={[
                  { value: "IAT1", label: "IAT 1" },
                  { value: "IAT2", label: "IAT 2" },
                  { value: "MODEL", label: "Model Exam" },
                  { value: "FINAL", label: "Final Semester" },
                ]}
                value={{
                  value: examType,
                  label:
                    examType === "MODEL"
                      ? "Model Exam"
                      : examType.replace("IAT", "IAT "),
                }}
                onChange={(option) => setExamType(option.value)}
                styles={selectStyles}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
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
                    <th className="px-6 py-4 w-32 text-center">Roll No</th>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4 w-48 text-center">Marks (100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => (
                    <tr
                      key={s.student_id}
                      className="hover:bg-blue-50/30 transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4 text-center font-mono text-sm text-gray-600 bg-gray-50/50">
                        {s.roll_no}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all">
                            {s.roll_no.slice(9, 12)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                            {/* <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                              Student ID: {s.student_id}
                            </p> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={marks[s.student_id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleMarkChange(
                              s.student_id,
                              val === "" ? "" : Number(val)
                            );
                          }}
                          placeholder="--"
                          className="w-24 px-3 py-2 text-center font-bold text-gray-700 bg-white border border-gray-200 rounded-lg rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all shadow-sm placeholder-gray-300"
                        />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Stats */}
          {!loading && students.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs font-medium text-gray-500">
              <span>Total Students: {students.length}</span>
              <span className="text-blue-600">
                Marks Entered: {enteredCount}
              </span>

              <span className={remainingCount === 0 ? "text-green-600" : "text-orange-500"}>
                Remaining: {remainingCount}
              </span>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterMarks;