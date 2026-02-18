import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select"; // npm install react-select
import { motion, AnimatePresence } from "framer-motion"; // npm install framer-motion
import {
  FaUserTie,
  FaLayerGroup,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaThLarge,
  FaList,
  FaBuilding,
  FaChalkboardTeacher,
  FaShieldAlt,
  FaExclamationCircle
} from "react-icons/fa";

// Import your existing constants and helpers
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

// --- STYLING CONFIGURATION ---

/**
 * Custom Styles for React Select to match Tailwind CSS 
 * and the specific Indigo/Slate theme of the application.
 */
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '46px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0', // indigo-500 : slate-200
    boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
    paddingLeft: '6px',
    '&:hover': { borderColor: '#a5b4fc' }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#4f46e5' // indigo-600
      : state.isFocused
        ? '#e0e7ff' // indigo-100
        : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    padding: '10px 12px',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#334155', // slate-700
    fontWeight: '500'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontSize: '0.95rem'
  })
};

// --- SUB-COMPONENTS ---

/**
 * StatCard: Displays a single metric at the top of the dashboard.
 */
const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"
  >
    <div className={`p-3 rounded-xl ${bgClass}`}>
      <Icon className={`text-xl ${colorClass}`} />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
    </div>
  </motion.div>
);

/**
 * SkeletonLoader: A shimmering placeholder for loading states.
 */
const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
      ))}
    </div>
    {/* List Skeleton */}
    {[1, 2].map(group => (
      <div key={group} className="border border-slate-200 rounded-xl p-6 bg-white space-y-4">
        <div className="h-6 w-1/3 bg-slate-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="h-20 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT ---

export default function ViewStaffAccess() {
  const token = localStorage.getItem("token");

  // --- STATE MANAGEMENT ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // UI State
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // --- DATA TRANSFORMATION FOR SELECTS ---
  const deptOptions = useMemo(() => [
    { value: "", label: "All Departments" },
    ...Object.entries(DEPT_MAP).map(([id, name]) => ({ value: id, label: name }))
  ], []);

  const classOptions = useMemo(() => [
    { value: "", label: "All Years" },
    ...Object.entries(CLASS_MAP).map(([id, name]) => ({ value: id, label: name }))
  ], []);



  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role;
  const userDeptId = user.dept_id;


  useEffect(() => {
    if (userRole === "DeptAdmin" || userRole === "HOD") {
      const deptOption = deptOptions.find(
        option => option.value === String(userDeptId)
      );
      setSelectedDept(deptOption);
    }
  }, []);

  useEffect(() => {
    fetchAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDept, selectedYear]);


  const fetchAccess = async () => {
    setLoading(true);

    // Construct filters based on React Select objects
    const apiFilters = {
      dept_id: selectedDept?.value || "",
      class_id: selectedYear?.value || ""
    };


    try {
      const res = await axios.get(`${BASE_URL}/staffClassAccess`, {
        params: apiFilters,
        headers: { Authorization: `Bearer ${token}` }
      });
      // Simulate a small delay for smoother UI transition if API is too fast
      // await new Promise(r => setTimeout(r, 400)); 
      setData(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Unable to retrieve staff access records.",
        confirmButtonColor: "#4f46e5"
      });
    } finally {
      setLoading(false);
    }
  };

  // --- COMPUTED DATA (MEMOIZATION) ---

  // 1. Filter Data based on local search query (Name or Subject)
  const filteredList = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item =>
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.subject_name?.toLowerCase().includes(lowerQuery)
    );
  }, [data, searchQuery]);

  // 2. Group Data logic (Preserved from original request)
  const groupedData = useMemo(() => {
    const grouped = {};
    filteredList.forEach(item => {
      const deptName = DEPT_MAP[item.dept_id] || "Unknown Dept";
      const yearName = CLASS_MAP[item.class_id] || "Unknown Year";
      const key = `${deptName} - ${yearName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }, [filteredList]);

  // 3. Statistics Calculation
  const stats = useMemo(() => {
    const totalStaff = filteredList.length;
    const uniqueSubjects = new Set(filteredList.map(i => i.subject_name).filter(Boolean)).size;
    const classAdvisorCount = filteredList.filter(i => i.access_type === 'ca').length;
    const adminCount = filteredList.filter(i => i.access_type === 'admin').length || 0;

    // Check departments involved in current view
    const activeDepts = new Set(filteredList.map(i => i.dept_id)).size;

    return { totalStaff, uniqueSubjects, classAdvisorCount, activeDepts };
  }, [filteredList]);

  // --- EXPORT HANDLERS ---

  const handleExportExcel = () => {
    const formattedData = filteredList.map(item => ({
      "Staff Name": item.name,
      "Department": DEPT_MAP[item.dept_id] || item.dept_id,
      "Year/Class": CLASS_MAP[item.class_id] || item.class_id,
      "Subject": item.subject_name || "N/A",
      "Access Type": item.access_type === 'ca' ? 'Class Advisor' : 'Regular',
      "Staff ID": item.id
    }));
    exportToExcel(formattedData, "Staff_Access_Report", "Staff_Access");

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: 'Excel downloaded successfully' });
  };

  const handleExportPDF = () => {
    const tableHeaders = ["Staff Name", "Department", "Class", "Subject", "Role"];
    const tableData = filteredList.map(item => [
      item.name,
      DEPT_MAP[item.dept_id] || "-",
      CLASS_MAP[item.class_id] || "-",
      item.subject_name || "-",
      item.access_type === 'ca' ? 'Class Advisor' : 'Staff'
    ]);

    const pdfStats = [
      { label: "Total Staff", value: stats.totalStaff, color: [79, 70, 229] }, // Indigo
      { label: "Class Advisors", value: stats.classAdvisorCount, color: [16, 185, 129] }, // Emerald
      { label: "Departments", value: stats.activeDepts },
    ];

    const pdfFilters = [];
    if (selectedDept?.label) pdfFilters.push({ label: "Department", value: selectedDept.label });
    if (selectedYear?.label) pdfFilters.push({ label: "Year", value: selectedYear.label });

    generatePDFReport({
      title: "Staff Access Report",
      subTitle: "Overview of Staff Assignments and Class Access Rights",
      filters: pdfFilters,
      stats: pdfStats,
      tableHeaders,
      tableData,
      fileName: "Staff_Access_Report"
    });

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: 'PDF generated successfully' });
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
              <FaLayerGroup className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Staff Class Access</h1>
              <p className="text-slate-500 text-sm mt-1">Manage and view staff permissions across departments</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <FaFilePdf /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        {/* STATISTICS DASHBOARD */}
        {!loading && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FaUserTie}
              label="Total Staff"
              value={stats.totalStaff}
              bgClass="bg-blue-50"
              colorClass="text-blue-600"
            />
            <StatCard
              icon={FaChalkboardTeacher}
              label="Class Advisors"
              value={stats.classAdvisorCount}
              bgClass="bg-emerald-50"
              colorClass="text-emerald-600"
            />
            <StatCard
              icon={FaBuilding}
              label="Departments"
              value={stats.activeDepts}
              bgClass="bg-purple-50"
              colorClass="text-purple-600"
            />
            <StatCard
              icon={FaShieldAlt}
              label="Subjects Covered"
              value={stats.uniqueSubjects}
              bgClass="bg-orange-50"
              colorClass="text-orange-600"
            />
          </div>
        )}

        {/* FILTERS & CONTROLS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

            {/* Dept Filter */}
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Department</label>
              <Select
                options={deptOptions}
                value={selectedDept}
                onChange={setSelectedDept}
                placeholder="Select Department..."
                styles={customSelectStyles}
                isClearable={!(userRole === "DeptAdmin" || userRole === "HOD")}
                isDisabled={userRole === "DeptAdmin" || userRole === "HOD"}
              />

            </div>

            {/* Year Filter */}
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Year / Class</label>
              <Select
                options={classOptions}
                value={selectedYear}
                onChange={setSelectedYear}
                placeholder="Select Year..."
                styles={customSelectStyles}
                isClearable
              />
            </div>

            {/* Text Search */}
            <div className="md:col-span-4 relative">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Search Staff</label>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or subject..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="md:col-span-2 flex justify-end items-end h-full pt-6">
              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FaThLarge />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FaList />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="min-h-[300px]">
          {loading ? (
            <SkeletonLoader />
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
              <FaExclamationCircle className="text-5xl mb-4 text-slate-200" />
              <h3 className="text-lg font-semibold text-slate-600">No records found</h3>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedData).map(([groupKey, staffList], index) => (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  {/* Group Header */}
                  <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                      <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
                      {groupKey}
                    </h3>
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                      {staffList.length} Staff
                    </span>
                  </div>

                  {/* Cards Grid/List */}
                  <div className={`p-5 ${viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'flex flex-col gap-3'
                    }`}>
                    <AnimatePresence>
                      {staffList.map((item) => (
                        <StaffCard
                          key={item.id}
                          data={item}
                          viewMode={viewMode}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- INTERNAL CARD COMPONENT ---

/**
 * StaffCard: Renders individual staff details.
 * Adapts styling based on 'viewMode' prop.
 */
const StaffCard = ({ data, viewMode }) => {
  const isCA = data.access_type === "ca";

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`
        relative group hover:shadow-md transition-all duration-200 border border-slate-100 rounded-xl bg-white
        ${viewMode === 'list' ? 'flex items-center justify-between p-4' : 'p-5 flex flex-col gap-3'}
        ${isCA ? 'bg-gradient-to-br from-white to-emerald-50/30 border-l-4 border-l-emerald-400' : 'border-l-4 border-l-indigo-400'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-lg
          ${isCA ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}
        `}>
          <FaUserTie />
        </div>

        <div>
          <h4 className="font-bold text-slate-800 leading-tight">{data.name}</h4>
          {data.subject_name ? (
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{data.subject_name}</p>
          ) : (
            <p className="text-xs text-slate-400 italic mt-0.5">No Subject Assigned</p>
          )}
        </div>
      </div>

      <div className={`
        ${viewMode === 'list' ? 'text-right' : 'mt-2 flex justify-between items-center border-t border-slate-100 pt-3'}
      `}>
        {/* Chips for mobile or extra info */}
        <div className="flex gap-2">
          <span className={`
            px-3 py-1 text-[10px] uppercase font-bold tracking-wide rounded-full
            ${isCA ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}
          `}>
            {isCA ? 'Class Advisor' : 'Staff Access'}
          </span>
        </div>

        {viewMode === 'grid' && (
          <span className="text-[10px] text-slate-400 font-mono">ID: {data.id}</span>
        )}
      </div>
    </motion.div>
  );
};