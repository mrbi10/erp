import React, { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import Select from "react-select";
import {
  FaFilter, FaDownload, FaSearch, FaChevronDown, FaSpinner,
  FaChartLine, FaUserGraduate, FaCheckCircle, FaTimesCircle,
  FaPercentage, FaFilePdf, FaFileExcel
} from 'react-icons/fa';
import { BASE_URL } from '../../constants/API';
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

function ReportsPage({ user }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const [filters, setFilters] = useState({
    deptId: "",
    classId: "",
    studentId: "",
    fromDate: "",
    toDate: ""
  });


  const selectStyles = {
    control: (base, state) => ({
      ...base,
      padding: "2px",
      borderRadius: "0.75rem",
      borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(99,102,241,.2)" : "none",
      backgroundColor: "#f9fafb",
      cursor: "pointer",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#6366f1"
        : state.isFocused
          ? "#eef2ff"
          : "white",
      color: state.isSelected ? "white" : "#111827",
      cursor: "pointer",
    }),
    menu: base => ({ ...base, zIndex: 50 }),
  };

  const token = localStorage.getItem("token");

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    if (!attendanceData.length) return { total: 0, present: 0, absent: 0, percentage: 0 };
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'Present').length;
    const absent = total - present;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    return { total, present, absent, percentage };
  }, [attendanceData]);

  // --- Fetch Students on Dept/Class Change ---
  useEffect(() => {
    if (!filters.deptId || !filters.classId) return;

    fetch(`${BASE_URL}/students?deptId=${filters.deptId}&classId=${filters.classId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setStudents([]);
      });
  }, [filters.deptId, filters.classId, token]);

  useEffect(() => {
    if (!filters.deptId || !filters.classId) return;
    if (!filters.fromDate || !filters.toDate) return;

    handleFetchAttendance();
  }, [filters.fromDate, filters.toDate]);


  // --- Handlers ---

  const handleFetchAttendance = () => {
    if (!filters.deptId && !filters.classId) {
      Swal.fire("Missing Filters", "Select department and year", "warning");
      return;
    }

    setLoading(true);
    setAttendanceData([]);
    setDataFetched(false);

    const queryParams = new URLSearchParams({
      deptId: filters.deptId,
      classId: filters.classId
    });

    if (filters.studentId) queryParams.append("studentId", filters.studentId);
    if (filters.fromDate) queryParams.append("fromDate", filters.fromDate);
    if (filters.toDate) queryParams.append("toDate", filters.toDate);

    fetch(`${BASE_URL}/attendance?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAttendanceData(Array.isArray(data) ? data : []);
        setDataFetched(true);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // --- Excel Export Handler ---
  const handleExportExcel = () => {
    if (attendanceData.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'Please fetch data first.', confirmButtonText: 'OK' });
      return;
    }

    // 1. Format data for Excel
    const excelData = attendanceData.map(a => ({
      "Register No": a.regNo || a.roll_no || "N/A",
      "Student Name": a.student_name || "N/A",
      "Date": a.date ? new Date(a.date).toLocaleDateString("en-IN") : "N/A",
      "Status": a.status || "N/A",
      "Department": DEPT_MAP[filters.deptId] || "N/A",
      "Year": CLASS_MAP[filters.classId] || "N/A"
    }));

    // 2. Create Sheet and Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    // 3. Auto-width columns (Optional polish)
    const max_width = excelData.reduce((w, r) => Math.max(w, r["Student Name"].length), 10);
    worksheet["!cols"] = [{ wch: 15 }, { wch: max_width + 2 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 10 }];

    // 4. Download
    XLSX.writeFile(workbook, `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- World-Class PDF Export Handler ---
  const handleExportPDF = () => {
    if (attendanceData.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'Please fetch data first.', confirmButtonText: 'OK' });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString("en-IN");

    // --- 1. Header Design (Blue Top Bar) ---
    doc.setFillColor(67, 56, 202); // Indigo 700
    doc.rect(0, 0, pageWidth, 40, "F"); // Top colored bar

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("ATTENDANCE ANALYTICS REPORT", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Misrimal Navajee Munoth Jain Engineering College", 14, 28);
    doc.text(`Generated By: ${user.name}  |  Date: ${today}`, 14, 34);

    // --- 2. Filter Summary Box ---
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252); // Very light gray
    doc.roundedRect(14, 45, pageWidth - 28, 22, 2, 2, "FD");

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text("DEPARTMENT", 20, 52);
    doc.text("CLASS / YEAR", 80, 52);
    doc.text("DATE RANGE", 140, 52);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(DEPT_MAP[filters.deptId] || "-", 20, 59);
    doc.text(CLASS_MAP[filters.classId] || "-", 80, 59);

    const rangeText = (filters.fromDate && filters.toDate)
      ? `${new Date(filters.fromDate).toLocaleDateString()} to ${new Date(filters.toDate).toLocaleDateString()}`
      : "All Records";
    doc.text(rangeText, 140, 59);

    // --- 3. Statistical Dashboard in PDF ---
    const statY = 75;
    const boxWidth = (pageWidth - 28) / 4;

    // Helper to draw stat item
    const drawStat = (label, value, x, color) => {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, statY);

      doc.setFontSize(14);
      doc.setTextColor(...color);
      doc.setFont("helvetica", "bold");
      doc.text(value.toString(), x, statY + 7);
    };

    drawStat("TOTAL RECORDS", stats.total, 14, [67, 56, 202]); // Indigo
    drawStat("PRESENT", stats.present, 14 + boxWidth, [22, 163, 74]); // Green
    drawStat("ABSENT", stats.absent, 14 + (boxWidth * 2), [220, 38, 38]); // Red
    drawStat("ATTENDANCE %", `${stats.percentage}%`, 14 + (boxWidth * 3), [37, 99, 235]); // Blue

    // --- 4. The Table ---
    const tableData = attendanceData.map(a => [
      a.regNo || a.roll_no || "N/A",
      a.student_name || "N/A",
      a.date ? new Date(a.date).toLocaleDateString("en-IN") : "N/A",
      a.status?.toUpperCase() || "N/A",
    ]);

    doc.autoTable({
      startY: 90,
      head: [["Register No", "Student Name", "Date", "Status"]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        valign: 'middle',
        halign: 'left',
        lineWidth: 0.1,
        lineColor: [230, 230, 230]
      },
      headStyles: {
        fillColor: [67, 56, 202], // Indigo header
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 255] // Slight blue tint for alternate rows
      },
      columnStyles: {
        3: { halign: 'center', fontStyle: 'bold' } // Center status column
      },
      didParseCell: function (data) {
        // Color code the Status column text
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'PRESENT') {
            data.cell.styles.textColor = [22, 163, 74]; // Green
          } else {
            data.cell.styles.textColor = [220, 38, 38]; // Red
          }
        }
      },
      // --- 5. Footer on every page ---
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${pageCount}`,
          pageWidth - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
    });

    doc.save(`Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const setDateRange = (type) => {
    const today = new Date();
    let from = null;
    let to = new Date(today);

    if (type === "today") {
      from = new Date(today);
    }

    if (type === "7days") {
      from = new Date();
      from.setDate(today.getDate() - 6);
    }

    if (type === "month") {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const format = (d) => d.toISOString().split("T")[0];

    setFilters(prev => ({
      ...prev,
      fromDate: format(from),
      toDate: format(to)
    }));
  };


  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 font-sans text-gray-800">

      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-500 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            Generate detailed attendance insights and export records.
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Logged in as: <span className="font-bold text-indigo-700">{user.name}</span>
        </div>
      </div>

      {/* --- Control Panel (Filters) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-xl shadow-indigo-100/50 mb-8 border border-white">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="bg-indigo-50 p-2 rounded-lg"><FaFilter className="text-indigo-600" /></div>
          <h2 className="text-lg font-bold text-gray-700">Report Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Department Select */}
          <div className="relative group">
            <Select
              styles={selectStyles}
              placeholder="Select Department"
              value={
                filters.deptId
                  ? { value: filters.deptId, label: DEPT_MAP[filters.deptId] }
                  : null
              }
              options={Object.entries(DEPT_MAP).map(([id, name]) => ({
                value: id,
                label: name,
              }))}
              onChange={(opt) => {
                setFilters({
                  deptId: opt?.value || "",
                  classId: "",
                  studentId: "",
                  fromDate: "",
                  toDate: "",
                });
                setStudents([]);
              }}
              isClearable
            />

          </div>

          {/* Class Select */}
          <div className="relative group">
            <Select
              styles={selectStyles}
              placeholder="Select Year"
              isDisabled={!filters.deptId}
              value={
                filters.classId
                  ? { value: filters.classId, label: CLASS_MAP[filters.classId] }
                  : null
              }
              options={Object.entries(CLASS_MAP).map(([id, label]) => ({
                value: id,
                label,
              }))}
              onChange={(opt) => {
                setFilters(prev => ({
                  ...prev,
                  classId: opt?.value || "",
                  studentId: "",
                }));
                setStudents([]);
              }}
              isClearable
            />

          </div>

          {/* Student Select */}
          <div className="relative group">
            <Select
              styles={selectStyles}
              placeholder="All Students"
              isDisabled={!students.length}
              value={
                filters.studentId
                  ? students
                    .map(s => ({
                      value: s.student_id,
                      label: `${s.name} (${s.roll_no})`,
                    }))
                    .find(o => o.value === filters.studentId)
                  : null
              }
              options={students.map(s => ({
                value: s.student_id,
                label: `${s.name} (${s.roll_no})`,
              }))}
              onChange={(opt) =>
                setFilters(prev => ({
                  ...prev,
                  studentId: opt?.value || "",

                }))
              }
              isClearable
              isSearchable
            />

          </div>

          {/* Date Pickers */}
          {/* Date Range */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Date Range
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setDateRange("today")}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 transition"
              >
                Today
              </button>

              <button
                onClick={() => setDateRange("7days")}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 transition"
              >
                Last 7 Days
              </button>

              <button
                onClick={() => setDateRange("month")}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 transition"
              >
                This Month
              </button>
            </div>

            {/* Optional manual override */}
            <div className="flex gap-2 mt-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">
                  From
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, fromDate: e.target.value }))
                  }
                  className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="w-1/2">
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">
                  To
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  min={filters.fromDate || undefined}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, toDate: e.target.value }))
                  }
                  className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
            <button
              onClick={handleFetchAttendance}
              disabled={!filters.classId || loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Fetch Report
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleExportPDF}
                disabled={attendanceData.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                title="Download PDF"
              >
                <FaFilePdf size={18} /> PDF
              </button>

              <button
                onClick={handleExportExcel}
                disabled={attendanceData.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                title="Download Excel"
              >
                <FaFileExcel size={18} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Analytics Dashboard --- */}
      {dataFetched && attendanceData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
          <StatCard
            label="Total Records"
            value={stats.total}
            color="indigo"
            icon={<FaUserGraduate />}
          />
          <StatCard
            label="Present"
            value={stats.present}
            color="green"
            icon={<FaCheckCircle />}
          />
          <StatCard
            label="Absent"
            value={stats.absent}
            color="red"
            icon={<FaTimesCircle />}
          />
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Attendance %</p>
              <FaPercentage className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-700">{stats.percentage}%</p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* --- Results Section --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-indigo-500">
            <FaSpinner className="animate-spin text-4xl mb-4" />
            <p className="font-medium animate-pulse">Processing data...</p>
          </div>
        ) : !dataFetched ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <FaChartLine className="text-4xl text-gray-300" />
            </div>
            <p className="text-lg font-medium">No report generated yet.</p>
            <p className="text-sm">Select filters above and click "Fetch Report".</p>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <FaUserGraduate className="text-5xl mb-4 opacity-20" />
            <p className="text-lg font-medium">No records found</p>
            <p className="text-sm">Try adjusting your date range or filters.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <span className="text-sm text-indigo-800 font-bold uppercase tracking-wide">
                {DEPT_MAP[filters.deptId]} <span className="text-indigo-300 mx-2">|</span> {CLASS_MAP[filters.classId]}
              </span>
              <span className="text-xs font-semibold bg-white text-indigo-600 px-3 py-1 rounded-full shadow-sm">
                {attendanceData.length} Rows
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-4 pl-6 border-b border-gray-200">Student Details</th>
                    <th className="p-4 border-b border-gray-200">Date</th>
                    <th className="p-4 border-b border-gray-200 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {attendanceData.map((a, idx) => {
                    const isPresent = a.status === "Present";
                    const initial = (a.student_name || "?").charAt(0).toUpperCase();

                    return (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition-colors duration-200 group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${isPresent ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                              {initial}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm group-hover:text-indigo-700 transition-colors">{a.student_name || "Unknown"}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{a.regNo || a.roll_no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600 font-medium">
                          {a.date ? new Date(a.date).toLocaleDateString("en-IN", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isPresent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {isPresent ? <FaCheckCircle /> : <FaTimesCircle />}
                            {a.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper Component for Stat Cards ---
const StatCard = ({ label, value, color, icon }) => {
  const c = {
    indigo: {
      border: "border-indigo-500",
      text: "text-indigo-600",
      bg: "bg-indigo-100"
    },
    green: {
      border: "border-green-500",
      text: "text-green-600",
      bg: "bg-green-100"
    },
    red: {
      border: "border-red-500",
      text: "text-red-600",
      bg: "bg-red-100"
    }
  }[color];

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 ${c.border} hover:-translate-y-1 transition-transform flex items-center justify-between`}>
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase mb-1">{label}</p>
        <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full text-xl ${c.bg} ${c.text}`}>
        {icon}
      </div>
    </div>
  );
};

export default ReportsPage;