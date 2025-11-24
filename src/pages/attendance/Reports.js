import React, { useState, useEffect } from "react";
import { BASE_URL } from '../../constants/API';
import { FaFilter, FaDownload, FaSearch, FaChevronDown, FaSpinner, FaChartLine } from 'react-icons/fa';
import jsPDF from "jspdf";
import "jspdf-autotable";
import Swal from 'sweetalert2';

function ReportsPage({ user }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const [filters, setFilters] = useState({
    classId: "",
    studentId: "",
    date: "",
  });

  const token = localStorage.getItem("token");

  // --- Data Fetching Hooks (Remaining the same) ---
  // ... (useEffect for classes)
  useEffect(() => {
    if (!token) return;

    const url = `${BASE_URL}/staff/classes`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setClasses(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 1) {
          setFilters(prev => ({ ...prev, classId: data[0].class_id }));
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));
  }, [token, user.role]);

  // ... (useEffect for students)
  useEffect(() => {
    if (!filters.classId || !token) {
      setStudents([]);
      return;
    }

    setStudents([]);
    setFilters((prev) => ({ ...prev, studentId: "" }));

    fetch(`${BASE_URL}/classes/${filters.classId}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        const classSpecificStudents = Array.isArray(data) ? data.filter(st => st.class_id === parseInt(filters.classId)) : [];
        setStudents(classSpecificStudents);
      })
      .catch((err) => console.error("Error fetching students:", err));
  }, [filters.classId, token]);

  // ... (handleFilterChange and filtered lists)
  const handleFilterChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const filteredClasses = classes;
  const filteredStudents = students;

  // ... (handleFetchAttendance)
  const handleFetchAttendance = () => {
    setLoading(true);
    setAttendanceData([]);
    setDataFetched(false);

    const queryParams = new URLSearchParams();

    if (filters.classId) queryParams.append("classId", filters.classId);
    if (filters.studentId) queryParams.append("studentId", filters.studentId);
    if (filters.date) queryParams.append("date", filters.date);

    const url = `${BASE_URL}/attendance?${queryParams.toString()}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setAttendanceData(Array.isArray(data) ? data : []);
        setDataFetched(true);
      })
      .catch(err => console.error("Error fetching attendance data:", err))
      .finally(() => setLoading(false));
  };


  // --- PDF Export Logic (FIXED) ---
  const handleExportPDF = () => {
    if (attendanceData.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No records to export',
        text: 'Please fetch data first.',
        confirmButtonText: 'OK'
      });
      return;
    }

    const doc = new jsPDF();
    const collegeHeader = `
      MISRIMAL NAVAJEE MUNOTH JAIN ENGINEERING COLLEGE
      (A Jain Minority Institution)
      Affiliated to Anna University, Chennai
  `;

    // Header Text
    doc.setFontSize(14);
    doc.text(collegeHeader, 105, 15, { align: "center" });

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("Detailed Attendance Report", 105, 50, { align: "center" });

    // Filter Summary Block
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    let y = 60;
    const classInfo = filters.classId ? filteredClasses.find(c => c.class_id === filters.classId)?.year || 'N/A' : 'All';
    const studentInfo = filters.studentId ? filteredStudents.find(s => s.student_id === filters.studentId)?.name || 'N/A' : 'All Students';

    doc.text(`Class Filter: ${classInfo}`, 14, y);
    doc.text(`Student Filter: ${studentInfo}`, 14, y + 6);
    doc.text(`Date Filter: ${filters.date ? new Date(filters.date).toLocaleDateString("en-IN") : 'All Dates'}`, 14, y + 12);

    y += 20;

    // Table Data and AutoTable (✅ Correct)
    const tableData = attendanceData.map(a => [
      a.regNo || a.roll_no || "N/A",
      a.student_name || "N/A",
      a.date ? new Date(a.date).toLocaleDateString("en-IN") : "N/A",
      a.status?.toUpperCase() || "N/A",
    ]);

    doc.autoTable({
      startY: y,
      head: [["Register No", "Student Name", "Date", "Status"]],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
    });

    // Footer Signature
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Report Generated by: ${user.name} (${user.role})`, 14, finalY);
    doc.text(`Generation Date: ${new Date().toLocaleString()}`, 14, finalY + 5);


    const now = new Date();
    const dateStr = now.toISOString().replace(/[:]/g, "-"); 
    doc.save(`Attendance_Report_${dateStr}.pdf`);
  };


  // --- UI Render (Remaining the same) ---
  const renderAttendanceTable = () => {
    if (loading) {
      return (
        <div className="text-center p-10 text-xl text-sky-600">
          <FaSpinner className="animate-spin inline mr-2" /> Loading attendance records...
        </div>
      );
    }

    if (dataFetched && attendanceData.length === 0) {
      return (
        <div className="text-center p-10 text-xl text-gray-500 bg-gray-50 rounded-lg">
          <FaChartLine className="inline mr-2 text-red-500" /> No attendance data found for the selected filters.
        </div>
      );
    }

    if (!dataFetched) {
      return (
        <div className="text-center p-10 text-xl text-gray-500 bg-gray-50 rounded-lg">
          <FaFilter className="inline mr-2 text-sky-500" /> Apply filters and click 'Fetch' to view the report.
        </div>
      );
    }

    return (
      <div className="overflow-auto bg-white shadow-2xl rounded-xl border border-gray-200">
        <table className="min-w-full text-left table-auto divide-y divide-gray-200">
          <thead className="bg-sky-600 sticky top-0 shadow-md">
            <tr>
              <th className="p-3 text-sm font-extrabold text-white uppercase tracking-wider">Register No</th>
              <th className="p-3 text-sm font-extrabold text-white uppercase tracking-wider">Student Name</th>
              <th className="p-3 text-sm font-extrabold text-white uppercase tracking-wider">Date</th>
              <th className="p-3 text-sm font-extrabold text-white uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendanceData.map((a, idx) => {
              const formattedDate = a.date
                ? new Date(a.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "N/A";

              const statusClass = a.status === "present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

              return (
                <tr key={idx} className="hover:bg-sky-50 transition duration-150">
                  <td className="p-3 text-sm font-medium text-gray-900">{a.regNo || a.roll_no || "N/A"}</td>
                  <td className="p-3 text-sm text-gray-700">{a.student_name || "N/A"}</td>
                  <td className="p-3 text-sm text-gray-500">{formattedDate}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize shadow-sm ${statusClass}`}>
                      {a.status || "N/A"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center mb-6 pb-4 border-b-4 border-indigo-500">
        <FaChartLine className="text-4xl text-indigo-600 mr-3" />
        <h1 className="text-3xl font-extrabold text-gray-900">Attendance Reports & Exports</h1>
      </div>

      {/* Filter Panel Card */}
      <div className="bg-white p-6 rounded-xl shadow-2xl mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
          <FaFilter className="text-sky-500" /> Apply Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">

          {/* Class Dropdown */}
          {(user.role === "HOD" || user.role === "CA" || user.role === "Staff") && (
            <div className="relative">
              <select
                name="classId"
                value={filters.classId}
                onChange={handleFilterChange}
                className="p-3 w-full border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="">Select Class</option>
                {filteredClasses.map(c => <option key={c.class_id} value={c.class_id}>{c.class_id} Year</option>)}
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Student Dropdown */}
          {filters.classId && (
            <div className="relative">
              <select
                name="studentId"
                value={filters.studentId}
                onChange={handleFilterChange}
                className="p-3 w-full border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-sky-500 transition"
                disabled={filteredStudents.length === 0}
              >
                <option value="">Select Student </option>
                {filteredStudents.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.roll_no})</option>)}
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Date Picker */}
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 transition"
            title="Filter by specific date"
          />

          {/* Fetch Button */}
          <button
            onClick={handleFetchAttendance}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-150"
            disabled={!filters.classId || loading}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Fetch Report
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-150"
            disabled={attendanceData.length === 0}
            title={attendanceData.length === 0 ? "Fetch data before exporting" : "Download current report as PDF"}
          >
            <FaDownload /> Export PDF
          </button>
        </div>
      </div>

      {/* Attendance Table Section */}
      {renderAttendanceTable()}

    </div>
  );
}

export default ReportsPage;