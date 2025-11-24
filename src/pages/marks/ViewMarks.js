import React, { useEffect, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { motion } from "framer-motion";
import { FaEye, FaSearch } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";



const getOrdinalSuffix = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
};


export default function ViewMarks() {
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);
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

    // 🔹 Common fetch wrapper
    const fetchData = async (url) => {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return res.json();
    };

    // 🔹 Load initial data based on role
    useEffect(() => {
        if (["Staff", "CA"].includes(user.role)) {
            fetchData(`${BASE_URL}/subjects/staff`).then((data) => {
                setSubjects(data.success ? data.subjects : []);
            });
        } else if (user.role === "HOD") {
            fetchData(`${BASE_URL}/classes`).then((data) => {
                const deptClasses = data.filter((c) => c.dept_id === user.dept_id);
                setClasses(deptClasses);
            });
        } else if (user.role === "Principal") {
            fetchData(`${BASE_URL}/classes`).then(setClasses);
        } else if (user.role === "student") {
            fetchStudentMarks();
        }
    }, []);

    // 🔹 Fetch subjects when class changes (for HOD/Principal)
    useEffect(() => {
        if (selectedClass) {
            fetchData(`${BASE_URL}/subjects?class_id=${selectedClass.value}`).then((data) => {
                setSubjects(Array.isArray(data) ? data : data.subjects || []);
            });
        }
    }, [selectedClass]);

    // 🔹 Fetch students when class changes (for HOD/Principal)
    useEffect(() => {
        if (selectedClass && (user.role === "Principal" || user.role === "HOD")) {
            fetchData(`${BASE_URL}/classes/${selectedClass.value}/students`).then((data) => {
                setStudents(data);
            });
        }
    }, [selectedClass]);

    // 🔹 Fetch subjects dynamically based on selected class or department
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                let url = "";

                // Principal can filter by dept + class
                if (user.role === "Principal" && selectedDept && selectedClass) {
                    url = `${BASE_URL}/subjects?dept_id=${selectedDept.value}&class_id=${selectedClass.value}`;
                }
                // HOD can filter by class only (since dept is already known)
                else if (user.role === "HOD" && selectedClass) {
                    url = `${BASE_URL}/subjects?dept_id=${user.dept_id}&class_id=${selectedClass.value}`;
                }
                // Staff or CA can load only their handled subjects
                else if (["Staff", "CA"].includes(user.role)) {
                    url = `${BASE_URL}/subjects/staff`;
                }

                if (url) {
                    const data = await fetchData(url);
                    setSubjects(Array.isArray(data) ? data : data.subjects || []);
                }
            } catch (err) {
                console.error("Error fetching subjects:", err);
                Swal.fire("Error", "Failed to load subjects", "error");
            }
        };

        fetchSubjects();
    }, [selectedDept, selectedClass]);


    // 🔹 Fetch marks
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
                Swal.fire("Error", "Please select class or subject", "error");
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

    // 🔹 Fetch student’s own marks
    const fetchStudentMarks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/marks/student/${user.roll_no}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success && Array.isArray(data.marks)) {
                setMarksData(data.marks);
                // Optional: Store student info for header display
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

    // 🔹 Export Marks as CSV
    const exportCSV = () => {
        if (!marksData || marksData.length === 0) {
            Swal.fire("No Data", "No marks available to export", "info");
            return;
        }

        const headers = [
            "S.No",
            "Student Name",
            "Subject",
            "Exam",
            "Marks",
            "Total",
        ];

        const rows = marksData.map((m, i) => [
            i + 1,
            user.role === "student" ? students[0]?.name || "-" : m.student_name,
            m.subject_name,
            m.exam_type,
            m.marks,
            m.total,
        ]);

        const csvContent =
            [headers, ...rows].map((row) => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `${user.role}_marks_${new Date().toISOString().split("T")[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 🔹 Export Marks as PDF
    const exportPDF = () => {
        if (!marksData || marksData.length === 0) {
            Swal.fire("No Data", "No marks available to export", "info");
            return;
        }

        const doc = new jsPDF();
        const title =
            user.role === "student"
                ? `Mark Report - ${students[0]?.name || "Student"}`
                : `Mark Report - ${selectedSubject?.label || "All Subjects"}`;

        doc.setFontSize(14);
        doc.text(title, 14, 15);

        const tableData = marksData.map((m, i) => [
            i + 1,
            user.role === "student" ? students[0]?.name || "-" : m.student_name,
            m.subject_name,
            m.exam_type,
            m.marks,
            m.total,
        ]);

        doc.autoTable({
            head: [["#", "Student Name", "Subject", "Exam", "Marks", "Total"]],
            body: tableData,
            startY: 25,
            theme: "grid",
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 102, 204] },
        });

        doc.save(`${user.role}_marks_${new Date().toISOString().split("T")[0]}.pdf`);
    };


    const filteredData = marksData;

    return (
        <motion.div
            className="p-6 bg-gray-50 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
                    <FaEye className="mr-3 text-blue-600" />
                    View Marks
                </h1>
                <p className="text-gray-600 text-sm mb-6">
                    {user.role === "Principal"
                        ? "View and analyze marks across all departments."
                        : user.role === "HOD"
                            ? "View marks for all students in your department."
                            : user.role === "student"
                                ? "Your performance overview across all exams."
                                : "View marks for subjects you handle or advise."}
                </p>

                {/* Filters */}
                {user.role !== "student" && (
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        {user.role === "Principal" && (
                            <Select
                                placeholder="Select Department..."
                                options={[
                                    { value: 1, label: "CSE" },
                                    { value: 2, label: "ECE" },
                                    { value: 3, label: "EEE" },
                                    { value: 4, label: "MECH" },
                                ]}
                                value={selectedDept}
                                onChange={setSelectedDept}
                                className="min-w-[180px]"
                            />
                        )}

                        {(user.role === "HOD" || user.role === "Principal") && (
                            <Select
                                placeholder="Select Class..."
                                options={classes
                                    .filter(c =>
                                        !selectedDept ? true : c.dept_id === selectedDept.value // filters by dept
                                    )
                                    .map(c => ({
                                        value: c.class_id,
                                        label: c.year
                                            ? `${c.year}${getOrdinalSuffix(c.year)} Year`
                                            : `Class ${c.class_id}`
                                    }))}
                                value={selectedClass}
                                onChange={setSelectedClass}
                                className="min-w-[200px]"
                            />
                        )}


                        <Select
                            placeholder="Select Subject..."
                            options={subjects.map((s) => ({
                                value: s.subject_id,
                                label: s.subject_name,
                                class_id: s.class_id,
                            }))}
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            className="min-w-[250px]"
                        />

                        <Select
                            options={[
                                { value: "IAT1", label: "IAT 1" },
                                { value: "IAT2", label: "IAT 2" },
                                { value: "MODEL", label: "Model Exam" },
                            ]}
                            value={{ value: examType, label: examType.replace("IAT", "IAT ") }}
                            onChange={(opt) => setExamType(opt.value)}
                            className="min-w-[180px]"
                        />

                        <button
                            onClick={fetchMarks}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                        >
                            View Marks
                        </button>

                        <div className="relative">
                            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        {/* Export buttons */}
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"
                            >
                                Export CSV
                            </button>

                            <button
                                onClick={exportPDF}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
                            >
                                Export PDF
                            </button>
                        </div>

                    </div>
                )}
            </div>

            {/* Table */}



            <div className="bg-white rounded-xl shadow overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center text-gray-500">Loading marks...</div>
                ) : filteredData.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No marks available. Try another subject or exam type.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-blue-100 text-gray-700 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 border text-center">#</th>
                                    <th className="px-4 py-3 border text-left">Student Name</th>
                                    <th className="px-4 py-3 border text-center">Subject</th>
                                    <th className="px-4 py-3 border text-center">Exam</th>
                                    <th className="px-4 py-3 border text-center">Mark</th>
                                    <th className="px-4 py-3 border text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((m, i) => (
                                    <tr
                                        key={i}
                                        className="hover:bg-gray-50 transition border-b last:border-none"
                                    >
                                        <td className="px-4 py-3 text-center font-medium text-gray-600">
                                            {i + 1}
                                        </td>

                                        {/* Dynamically show student name based on role */}
                                        <td className="px-4 py-3">
                                            {user.role === "student"
                                                ? students[0]?.name || "-"
                                                : m.student_name || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-center">{m.subject_name}</td>
                                        <td className="px-4 py-3 text-center">{m.exam_type}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-800">
                                            {m.marks ?? "-"}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">{m.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
