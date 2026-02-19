import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import {
  FaUserTie,
  FaLayerGroup,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaBuilding,
  FaChalkboardTeacher,
  FaShieldAlt,
  FaExclamationCircle,
  FaSpinner
} from "react-icons/fa";

// Import your existing constants and helpers
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

// --- STYLING CONFIGURATION ---
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    '&:hover': { borderColor: '#818cf8' }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    padding: '10px 14px',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1e293b',
    fontWeight: '600'
  })
};

// --- SUB-COMPONENTS ---
const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${bgClass}`}>
      <Icon className={`text-2xl ${colorClass}`} />
    </div>
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-800 leading-none">{value}</h4>
    </div>
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

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role;
  const userDeptId = user.dept_id;

  // --- DATA TRANSFORMATION FOR SELECTS ---
  const deptOptions = useMemo(() => [
    { value: "", label: "All Departments" },
    ...Object.entries(DEPT_MAP).map(([id, name]) => ({ value: id, label: name }))
  ], []);

  const classOptions = useMemo(() => [
    { value: "", label: "All Years" },
    ...Object.entries(CLASS_MAP).map(([id, name]) => ({ value: id, label: name }))
  ], []);

  useEffect(() => {
    if (userRole === "DeptAdmin" || userRole === "HOD") {
      const deptOption = deptOptions.find(option => option.value === String(userDeptId));
      setSelectedDept(deptOption);
    }
  }, [deptOptions, userDeptId, userRole]);

  useEffect(() => {
    fetchAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDept, selectedYear]);

  const fetchAccess = async () => {
    setLoading(true);
    const apiFilters = {
      dept_id: selectedDept?.value || "",
      class_id: selectedYear?.value || ""
    };

    try {
      const res = await axios.get(`${BASE_URL}/staffClassAccess`, {
        params: apiFilters,
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (error) {
      Swal.fire('Connection Error', 'Unable to retrieve staff access records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- COMPUTED DATA (MEMOIZATION) ---
  const filteredList = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item =>
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.subject_name?.toLowerCase().includes(lowerQuery)
    );
  }, [data, searchQuery]);

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

  const stats = useMemo(() => {
    const totalStaff = filteredList.length;
    const uniqueSubjects = new Set(filteredList.map(i => i.subject_name).filter(Boolean)).size;
    const classAdvisorCount = filteredList.filter(i => i.access_type === 'ca').length;
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
      "Role": item.access_type === 'ca' ? 'Class Advisor' : 'Teaching Staff',
      "Staff ID": item.id
    }));
    exportToExcel(formattedData, "Staff_Access_Report", "Staff_Access");
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
      { label: "Total Staff", value: stats.totalStaff, color: [79, 70, 229] },
      { label: "Class Advisors", value: stats.classAdvisorCount, color: [16, 185, 129] },
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
      fileName: "Staff_Access_Report",
      generatedBy: user.name,

    });
  };

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <FaLayerGroup className="text-indigo-700 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">View Staff Access</h1>
            <p className="text-slate-500 font-medium mt-1">Review permissions and roles across all classes.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <FaFilePdf /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <FaFileExcel /> Export Excel
          </button>
        </div>
      </div>

      {/* STATISTICS DASHBOARD */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={FaUserTie} label="Total Staff Assigned" value={stats.totalStaff} bgClass="bg-blue-100" colorClass="text-blue-700" />
          <StatCard icon={FaChalkboardTeacher} label="Class Advisors" value={stats.classAdvisorCount} bgClass="bg-emerald-100" colorClass="text-emerald-700" />
          <StatCard icon={FaBuilding} label="Active Departments" value={stats.activeDepts} bgClass="bg-purple-100" colorClass="text-purple-700" />
          <StatCard icon={FaShieldAlt} label="Subjects Covered" value={stats.uniqueSubjects} bgClass="bg-orange-100" colorClass="text-orange-700" />
        </div>
      )}

      {/* FILTERS & CONTROLS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Filter by Department</label>
            <Select
              options={deptOptions}
              value={selectedDept}
              onChange={setSelectedDept}
              placeholder="All Departments"
              styles={customSelectStyles}
              isClearable={!(userRole === "DeptAdmin" || userRole === "HOD")}
              isDisabled={userRole === "DeptAdmin" || userRole === "HOD"}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Filter by Year / Class</label>
            <Select
              options={classOptions}
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="All Years"
              styles={customSelectStyles}
              isClearable
            />
          </div>

          <div className="relative">
            <label className="text-sm font-bold text-slate-700 mb-2 block">Search Faculty</label>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Type name or subject..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA (Grouped Tables) */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-indigo-600">
            <FaSpinner className="animate-spin text-5xl mb-4" />
            <p className="font-bold text-slate-600">Loading Records...</p>
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm">
            <FaExclamationCircle className="text-6xl mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700">No Records Found</h3>
            <p className="text-md mt-1">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedData).map(([groupKey, staffList]) => (
              <div key={groupKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                {/* Table Header / Group Title */}
                <div className="bg-slate-800 p-4 flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg flex items-center gap-3">
                    <FaBuilding className="text-indigo-400" />
                    {groupKey}
                  </h3>
                  <span className="bg-slate-700 text-slate-200 text-sm font-bold px-3 py-1 rounded-lg border border-slate-600">
                    {staffList.length} Staff Assigned
                  </span>
                </div>

                {/* Clean Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-4 font-bold">Faculty Name</th>
                        <th className="p-4 font-bold">Assigned Role</th>
                        <th className="p-4 font-bold">Subject Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((item) => (
                        <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="p-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                                <FaUserTie />
                              </div>
                              {item.name}
                            </div>
                          </td>
                          <td className="p-4">
                            {item.access_type === "ca" ? (
                              <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-emerald-200">
                                Class Advisor
                              </span>
                            ) : (
                              <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-indigo-200">
                                Teaching Staff
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            {item.subject_name && item.subject_id ? `${item.subject_name} (${item.subject_code})` : <span className="text-slate-400 italic">Not Applicable</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}