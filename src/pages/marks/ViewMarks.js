import React, { useEffect, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { motion } from "framer-motion";
import {
  FaEye,
  FaSearch,
  FaFilter,
  FaFilePdf,
  FaFileExcel,
  FaSpinner,
  FaSortAlphaDown,
} from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

const ViewMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examType, setExamType] = useState("IAT1");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Professional Select Styles (Matching your theme)
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "0.75rem",
      padding: "2px",
      borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": { borderColor: "#d1d5db" },
      minHeight: "42px",
      fontSize: "0.875rem",
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
      fontSize: "0.875rem",
      padding: "10px 12px",
    }),
  };

  const fetchData = async (url) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  };

  useEffect(() => {
    setSelectedSubject(null);
  }, [selectedDept, subjects, selectedClass]);

  // Fetch subjects when class changes
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        let url = "";

        if (user.role === "Principal") {
          if (!selectedDept || !selectedClass) {
            setSubjects([]);
            return;
          }
          url = `${BASE_URL}/subjects?dept_id=${selectedDept.value}&class_id=${selectedClass.value}`;
        } else if (user.role === "HOD") {
          if (!selectedClass) {
            setSubjects([]);
            return;
          }
          url = `${BASE_URL}/subjects?dept_id=${user.dept_id}&class_id=${selectedClass.value}`;
        } else if (["Staff", "CA"].includes(user.role)) {
          if (!user.dept_id || !user.assigned_class_id) {
            setSubjects([]);
            return;
          }
          url = `${BASE_URL}/subjects?dept_id=${user.dept_id}&class_id=${user.assigned_class_id}`;
        } else {
          setSubjects([]);
          return;
        }

        const data = await fetchData(url);
        setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load subjects", "error");
      }
    };

    fetchSubjects();
  }, [
    user.role,
    user.dept_id,
    user.assigned_class_id,
    selectedDept,
    selectedClass,
  ]);

  // Fetch students when class changes (for HOD/Principal)
  useEffect(() => {
    if (
      selectedClass &&
      (user.role === "Principal" || user.role === "HOD")
    ) {
      fetchData(`${BASE_URL}/classes/${selectedClass.value}/students`).then(
        (data) => {
          setStudents(data);
        }
      );
    }
  }, [selectedClass]);

  // Fetch marks
  const fetchMarks = async () => {
    try {
      setLoading(true);

      let url = "";
      if (user.role === "student") {
        return fetchStudentMarks();
      } else if (selectedClass) {
        url = `${BASE_URL}/marks/class/${selectedClass.value}`;
      } else if (selectedSubject) {
        url = `${BASE_URL}/marks/class/${selectedSubject.class_id}`;
      } else {
        Swal.fire("Incomplete", "Please select a class or subject first.", "warning");
        return;
      }

      const data = await fetchData(url);
      const marksArray = Array.isArray(data.marks) ? data.marks : data;
      const filtered = marksArray.filter(
        (m) =>
          (!selectedSubject || m.subject_id === selectedSubject.value) &&
          m.exam_type?.toUpperCase() === examType.toUpperCase()
      );
      setMarksData(filtered);
    } catch (err) {
      Swal.fire("Error", "Failed to load marks", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentMarks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/marks/student/${user.roll_no}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.marks)) {
        setMarksData(data.marks);
        setStudents([data.student]);
      } else {
        setMarksData([]);
      }
    } catch (err) {
      Swal.fire("Error", "Failed to load your marks", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Export Logic ---
  const exportCSV = () => {
    if (!marksData || marksData.length === 0) return;

    const dataToExport = marksData.map((m, i) => ({
      "S.No": i + 1,
      "Student Name":
        user.role === "student" ? students[0]?.name || "-" : m.student_name,
      Subject: m.subject_name,
      Exam: m.exam_type,
      Marks: m.marks,
      Total: m.total,
    }));

    exportToExcel(dataToExport, `${user.role}_Marks`);
  };

  const exportPDF = () => {
    if (!marksData || marksData.length === 0) return;

    const tableData = marksData.map((m, i) => [
      i + 1,
      user.role === "student" ? students[0]?.name || "-" : m.student_name,
      m.subject_name,
      m.exam_type,
      m.marks,
      m.total,
    ]);

    const title =
      user.role === "student"
        ? `Mark Report - ${students[0]?.name || "Student"}`
        : `Mark Report - ${selectedSubject?.label || "All Subjects"}`;

    generatePDFReport({
      title: title,
      subTitle: "Exam Performance Report",
      generatedBy: user.name,
      fileName: `${user.role}_Marks`,
      tableHeaders: ["#", "Student Name", "Subject", "Exam", "Marks", "Total"],
      tableData: tableData,
      filters: [
        selectedDept && { label: "Department", value: selectedDept.label },
        selectedClass && { label: "Class", value: selectedClass.label },
        { label: "Exam Type", value: examType },
      ].filter(Boolean),
    });
  };

  const filteredData = marksData.filter((m) =>
    searchTerm
      ? m.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <FaEye className="text-xl" />
              </span>
              View Marks
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              {user.role === "student"
                ? "Your academic performance overview."
                : "Analyze student performance across subjects."}
            </p>
          </div>

          {user.role !== "student" && (
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                disabled={marksData.length === 0}
                className="group flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <FaFilePdf /> PDF
              </button>
              <button
                onClick={exportCSV}
                disabled={marksData.length === 0}
                className="group flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <FaFileExcel /> Excel
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {user.role !== "student" && (
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative z-20">
            <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <FaFilter /> Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Department */}
              {user.role === "Principal" && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">
                    Department
                  </label>
                  <Select
                    styles={selectStyles}
                    placeholder="Select Dept"
                    options={Object.entries(DEPT_MAP).map(([id, name]) => ({
                      value: Number(id),
                      label: name,
                    }))}
                    value={selectedDept}
                    onChange={(opt) => {
                      setSelectedDept(opt);
                      setSelectedClass(null);
                      setSelectedSubject(null);
                    }}
                  />
                </div>
              )}

              {/* Class */}
              {(user.role === "HOD" || user.role === "Principal") && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">
                    Class
                  </label>
                  <Select
                    styles={selectStyles}
                    placeholder="Select Class"
                    options={Object.entries(CLASS_MAP)
                      .filter(([id]) => {
                        if (user.role === "Principal" && selectedDept) return true;
                        return true;
                      })
                      .map(([id, label]) => ({
                        value: Number(id),
                        label,
                      }))}
                    value={selectedClass}
                    onChange={(opt) => {
                      setSelectedClass(opt);
                      setSelectedSubject(null);
                    }}
                  />
                </div>
              )}

              {/* Subject */}
              <div className="lg:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">
                  Subject
                </label>
                <Select
                  styles={selectStyles}
                  placeholder="Select Subject"
                  options={subjects.map((s) => ({
                    value: s.subject_id,
                    label: s.subject_code
                      ? `${s.subject_code.toUpperCase()} - ${s.subject_name}`
                      : s.subject_name,
                    class_id: s.class_id,
                  }))}
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                />
              </div>

              {/* Exam Type */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">
                  Exam Type
                </label>
                <Select
                  styles={selectStyles}
                  options={[
                    { value: "IAT1", label: "IAT 1" },
                    { value: "IAT2", label: "IAT 2" },
                    { value: "MODEL", label: "Model Exam" },
                    { value: "FINAL", label: "Final Semester" },
                  ]}
                  value={{
                    value: examType,
                    label: examType.replace("IAT", "IAT "),
                  }}
                  onChange={(opt) => setExamType(opt.value)}
                />
              </div>

              {/* Fetch Button */}
              <button
                onClick={fetchMarks}
                className="h-[42px] px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <FaSearch /> View Marks
              </button>
            </div>

            {/* Search Bar inside filters */}
            <div className="mt-4 pt-4 border-t border-gray-50">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter student results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        )}

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
              <p className="mt-4 text-gray-400 font-medium">Loading Marks...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FaSortAlphaDown className="text-3xl opacity-20" />
              </div>
              <p className="text-lg font-medium">No marks found</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-6 py-4 w-16 text-center">#</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4 text-center">Subject</th>
                    <th className="px-6 py-4 text-center">Exam</th>
                    <th className="px-6 py-4 text-center">Marks</th>
                    <th className="px-6 py-4 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((m, i) => (
                    <tr
                      key={i}
                      className="hover:bg-blue-50/40 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-center font-medium text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {user.role === "student"
                          ? students[0]?.name || "-"
                          : m.student_name}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {m.subject_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase">
                          {m.exam_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900 text-lg">
                        {m.marks ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400 font-medium">
                        {m.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;