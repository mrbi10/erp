import React, { useState, useEffect, useMemo } from "react";
import Swal from 'sweetalert2';
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChartPie,
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaPercentage,
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaChartLine
} from 'react-icons/fa';
import { BASE_URL } from '../../constants/API';
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

// ---------------------------
// Styles & Utils (Matches Students.js)
// ---------------------------

// Apple-style Select Styles
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    padding: "2px 4px",
    borderColor: state.isFocused ? "#3b82f6" : "transparent",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    "&:hover": { borderColor: "#cbd5e1" },
    fontSize: "0.9rem",
    minHeight: "42px"
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    overflow: "hidden",
    zIndex: 50
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    fontSize: "0.9rem"
  }),
  menuPortal: (base) => ({ ...base, zIndex: 999999 }),
};

const getInitials = (name) => {
  const parts = name?.split(" ") || [];
  return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
};

// Insight Pill Component (Matches Students.js)
const InsightPill = ({ label, count, icon: Icon, color }) => (
  <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[160px] hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      <Icon className="text-lg" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-800">{count}</p>
    </div>
  </div>
);

function ReportsPage({ user }) {
  const token = localStorage.getItem("token");

  // --- State ---
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const [filters, setFilters] = useState({
    deptId: user.role === "Principal" ? "" : user.dept_id || "",
    classId: user.role === "CA" ? user.assigned_class_id || "" : "",
    studentId: "",
    fromDate: "",
    toDate: ""
  });

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    if (!attendanceData.length) return { total: 0, present: 0, absent: 0, percentage: 0 };
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'Present').length;
    const absent = total - present;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    return { total, present, absent, percentage };
  }, [attendanceData]);

  // --- Effects ---

  // Fetch Students when Dept/Class changes
  useEffect(() => {
    if (!filters.deptId || !filters.classId) {
      setStudents([]);
      return;
    }

    // Logic to populate students dropdown
    const fetchStudents = async () => {
      try {
        const params = new URLSearchParams({
          dept_id: filters.deptId,
          classId: filters.classId
        });
        const res = await fetch(`${BASE_URL}/students?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setStudents(Array.isArray(json) ? json : (json.data || [])); 
      } catch (err) {
        setStudents([]);
      }
    };

    fetchStudents();
  }, [filters.deptId, filters.classId, token]);

  // Auto-fetch if Date Range changes and basics are selected
  useEffect(() => {
    if (filters.deptId && filters.classId && filters.fromDate && filters.toDate) {
      handleFetchAttendance();
    }
  }, [filters.fromDate, filters.toDate]);

  // --- Handlers ---

  const handleFetchAttendance = () => {
    if (!filters.deptId || !filters.classId) {
      Swal.fire({
        title: "Missing Information",
        text: "Please select both Department and Class.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
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
      .catch(err => Swal.fire("Error", "Failed to fetch data.", "error"))
      .finally(() => setLoading(false));
  };

  const handleExportExcelClick = () => {
    if (attendanceData.length === 0) return;
    
    const dataToExport = attendanceData.map(a => ({
      "Register No": a.regNo || a.roll_no || "N/A",
      "Student Name": a.student_name || "N/A",
      "Date": a.date ? new Date(a.date).toLocaleDateString("en-IN") : "N/A",
      "Status": a.status || "N/A",
      "Department": DEPT_MAP[filters.deptId] || "N/A",
      "Year": CLASS_MAP[filters.classId] || "N/A"
    }));

    exportToExcel(dataToExport, "Attendance_Report");
  };

  const handleExportPDFClick = () => {
    if (attendanceData.length === 0) return;

    const tableData = attendanceData.map(a => [
      a.regNo || a.roll_no || "N/A",
      a.student_name || "N/A",
      a.date ? new Date(a.date).toLocaleDateString("en-IN") : "N/A",
      a.status?.toUpperCase() || "N/A",
    ]);

    const config = {
      title: "ATTENDANCE REPORT",
      subTitle: "Misrimal Navajee Munoth Jain Engineering College",
      generatedBy: user.name,
      fileName: "Attendance_Report",
      tableHeaders: ["Register No", "Student Name", "Date", "Status"],
      tableData: tableData,
      filters: [
        { label: "Department", value: DEPT_MAP[filters.deptId] || "-" },
        { label: "Class / Year", value: CLASS_MAP[filters.classId] || "-" },
        { label: "Date Range", value: filters.fromDate ? `${filters.fromDate} to ${filters.toDate}` : "All Records" }
      ],
      stats: [
        { label: "Total", value: stats.total, color: [67, 56, 202] },
        { label: "Present", value: stats.present, color: [22, 163, 74] },
        { label: "Absent", value: stats.absent, color: [220, 38, 38] },
        { label: "Percentage", value: `${stats.percentage}%`, color: [37, 99, 235] }
      ]
    };

    generatePDFReport(config);
  };

  const setDateRange = (type) => {
    const today = new Date();
    let from = new Date();
    const to = new Date();
    const format = (d) => d.toISOString().split("T")[0];

    if (type === "7days") from.setDate(today.getDate() - 6);
    if (type === "month") from = new Date(today.getFullYear(), today.getMonth(), 1);

    setFilters(prev => ({
      ...prev,
      fromDate: format(from),
      toDate: format(to)
    }));
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><FaChartPie className="text-xl" /></span>
              Analytics & Reports
            </h1>
            <p className="text-slate-500 mt-1 font-medium ml-1">Generate insights and export records</p>
          </div>
          
          <div className="flex gap-2">
             <button
              onClick={handleExportPDFClick}
              disabled={!attendanceData.length}
              className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <FaFilePdf /> PDF
            </button>
            <button
              onClick={handleExportExcelClick}
              disabled={!attendanceData.length}
              className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        {/* --- STATS PILLS (Visible only when data fetched) --- */}
        <AnimatePresence>
          {dataFetched && attendanceData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            >
              <InsightPill label="Total Records" count={stats.total} icon={FaUserGraduate} color="bg-indigo-50 text-indigo-600" />
              <InsightPill label="Present" count={stats.present} icon={FaCheckCircle} color="bg-emerald-50 text-emerald-600" />
              <InsightPill label="Absent" count={stats.absent} icon={FaTimesCircle} color="bg-rose-50 text-rose-600" />
              <InsightPill label="Rate" count={`${stats.percentage}%`} icon={FaPercentage} color="bg-blue-50 text-blue-600" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FILTERS (Control Panel) --- */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative z-20">
          <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
            <FaFilter /> Configuration
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Dept Select */}
            <div>
              <Select
                styles={selectStyles}
                placeholder="Department"
                isDisabled={user.role !== "Principal"}
                value={filters.deptId ? { value: filters.deptId, label: DEPT_MAP[filters.deptId] } : null}
                options={Object.entries(DEPT_MAP).map(([id, name]) => ({ value: id, label: name }))}
                onChange={opt => setFilters({ ...filters, deptId: opt?.value || "", classId: "", studentId: "" })}
              />
            </div>

            {/* Class Select */}
            <div>
              <Select
                styles={selectStyles}
                placeholder="Class / Year"
                isDisabled={!filters.deptId || user.role === "CA"}
                value={filters.classId ? { value: filters.classId, label: CLASS_MAP[filters.classId] } : null}
                options={Object.entries(CLASS_MAP).map(([id, label]) => ({ value: id, label }))}
                onChange={opt => setFilters(prev => ({ ...prev, classId: opt?.value || "", studentId: "" }))}
              />
            </div>

            {/* Student Select */}
            <div>
              <Select
                styles={selectStyles}
                placeholder={students.length ? "Search Student..." : "Select Class First"}
                isDisabled={!students.length}
                isClearable
                options={students.map(s => ({ value: s.student_id, label: `${s.name} (${s.roll_no})` }))}
                onChange={opt => setFilters(prev => ({ ...prev, studentId: opt?.value || "" }))}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
               <button onClick={() => setDateRange("today")} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">Today</button>
               <button onClick={() => setDateRange("7days")} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">7 Days</button>
               <button onClick={() => setDateRange("month")} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">Month</button>
            </div>
          </div>

          {/* Date Row & Fetch */}
          <div className="flex flex-col lg:flex-row gap-4 mt-4 pt-4 border-t border-gray-50 items-center">
             <div className="flex flex-1 gap-4 w-full">
                <div className="relative w-full">
                  <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    value={filters.fromDate}
                    onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-sm font-medium text-gray-600"
                  />
                </div>
                <div className="relative w-full">
                  <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date"
                    value={filters.toDate}
                    min={filters.fromDate}
                    onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-sm font-medium text-gray-600"
                  />
                </div>
             </div>

             <button 
               onClick={handleFetchAttendance}
               disabled={loading || !filters.classId}
               className="w-full lg:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
             >
               {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Fetch Report
             </button>
          </div>
        </div>

        {/* --- DATA GRID --- */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden min-h-[400px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-[400px]">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                 <FaSpinner className="text-4xl text-blue-500" />
               </motion.div>
               <p className="mt-4 text-gray-400 font-medium">Processing Data...</p>
             </div>
           ) : !dataFetched ? (
             <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <FaChartLine className="text-3xl opacity-20" />
               </div>
               <p className="text-lg font-medium">Ready to generate report</p>
               <p className="text-sm">Apply filters above to view data.</p>
             </div>
           ) : attendanceData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FaSearch className="text-3xl opacity-20" />
                </div>
                <p className="text-lg font-medium">No records found</p>
                <p className="text-sm">Try adjusting your date range.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50/50 border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Profile</th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                     <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {attendanceData.map((row, idx) => {
                      const isPresent = row.status === 'Present';
                      return (
                       <tr key={idx} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${isPresent ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                               {getInitials(row.student_name || "?")}
                             </div>
                             <div>
                               <p className="font-bold text-gray-800 text-sm">{row.student_name}</p>
                               <p className="text-xs text-gray-500 font-mono mt-0.5">{row.regNo || row.roll_no}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {row.date ? new Date(row.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isPresent ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                               {isPresent ? <FaCheckCircle /> : <FaTimesCircle />}
                               {row.status?.toUpperCase()}
                            </span>
                         </td>
                       </tr>
                      );
                   })}
                 </tbody>
               </table>
             </div>
           )}
           
           {/* Footer Stats */}
           {dataFetched && attendanceData.length > 0 && (
             <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs font-medium text-gray-500">
               <span>Showing {attendanceData.length} records</span>
               <span>Generated on {new Date().toLocaleDateString()}</span>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}

export default ReportsPage;