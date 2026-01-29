import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { motion } from "framer-motion";
import { FaSave, FaBookOpen, FaUserGraduate, FaMagic } from "react-icons/fa";

const EnterMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [examType, setExamType] = useState("IAT1");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);

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

        // Staff / CA → fixed dept + class
        if (["Staff", "CA"].includes(user.role)) {
          if (!user.dept_id || !user.assigned_class_id) {
            setSubjects([]);
            return;
          }

          url = `${BASE_URL}/subjects?dept_id=${user.dept_id}&class_id=${user.assigned_class_id}`;
        }

        // (Optional) HOD / Principal support if ever enabled here
        else {
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
  ;


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
        console.log("Student fetch:", data);

        if (Array.isArray(data.students)) setStudents(data.students);
        else if (Array.isArray(data)) setStudents(data);
        else Swal.fire("Error", "Unexpected student data format", "error");
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

  // Update marks
  const handleMarkChange = (studentId, value) => {
    if (value === "" || isNaN(value)) return;
    if (value > 100 || value < 0) return Swal.fire("Invalid", "0–100 only", "warning");
    setMarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  // Auto fill function for testing or practice
  const handleAutoFill = () => {
    const filled = {};
    students.forEach((s) => (filled[s.student_id] = Math.floor(Math.random() * 41) + 60));
    setMarks(filled);
  };

  // Submit marks
  const handleSubmit = async () => {
    if (!selectedSubject)
      return Swal.fire("Error", "Select a subject first", "error");
    if (students.length === 0)
      return Swal.fire("Error", "No students to save marks for", "error");

    try {
      setLoading(true);
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
        title: "Saved",
        text: "All marks saved successfully!",
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
      setMarks({});
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to save marks", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-700 flex items-center gap-2">
          <FaBookOpen className="text-blue-600" />
          Enter Marks
        </h1>

        <button
          onClick={handleAutoFill}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          <FaMagic /> Auto-Fill Marks
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 items-center">
        {/* Subject Select */}
        <div className="w-72">
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
            placeholder="Select Subject..."
          />

        </div>

        {/* Exam Type Select */}
        <div className="w-52">
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
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: "8px",
                borderColor: "#93c5fd",
                "&:hover": { borderColor: "#2563eb" },
              }),
            }}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-white font-medium transition ${loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          <FaSave /> {loading ? "Saving..." : "Save Marks"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full bg-white border border-gray-200 rounded-md shadow">
            <thead className="bg-blue-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 border">S.No</th>
                <th className="px-4 py-2 border text-left">Student Name</th>
                <th className="px-4 py-2 border text-center">Mark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={s.student_id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-blue-50"
                    } hover:bg-blue-100 transition`}
                >
                  <td className="px-4 py-2 border text-center">{i + 1}</td>
                  <td className="px-4 py-2 border font-medium text-gray-700 flex items-center gap-2">
                    <FaUserGraduate className="text-blue-500" /> {s.name}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={marks[s.student_id] || ""}
                      onChange={(e) =>
                        handleMarkChange(s.student_id, e.target.value)
                      }
                      className="border border-gray-300 rounded-md px-3 py-1 w-24 text-center focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default EnterMarks;
