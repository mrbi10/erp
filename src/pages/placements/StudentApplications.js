import React, { useState, useEffect, useMemo } from "react";
import Swal from 'sweetalert2';
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChartPie,
  FaCheckCircle,
  FaTimesCircle,
  FaFilePdf,
  FaFileExcel,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaBuilding,
  FaClock,
  FaBriefcase,
  FaClipboardList
} from 'react-icons/fa';
import { BASE_URL } from '../../constants/API';
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

// ---------------------------
// Styles & Utils
// ---------------------------

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    padding: "2px 4px",
    borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
    backgroundColor: "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "0 2px 5px rgba(0,0,0,0.02)",
    "&:hover": { borderColor: "#cbd5e1" },
    fontSize: "0.95rem",
    fontWeight: "500",
    minHeight: "46px"
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
    fontSize: "0.95rem",
    padding: "12px 16px"
  })
};

const getInitials = (name) => {
  if (!name) return "C";
  return name.substring(0, 2).toUpperCase();
};

const InsightPill = ({ label, count, icon: Icon, color }) => (
  <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 min-w-[200px] flex-1">
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 shadow-inner`}>
      <Icon className="text-2xl" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800 leading-none">{count}</p>
    </div>
  </div>
);

// ---------------------------
// Main Component
// ---------------------------

export default function StudentApplications({ user }) {
  const token = localStorage.getItem("token");

  // --- State ---
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    deptId: "",
    classId: "",
    status: "",
    search: ""
  });

  // --- Filter Options ---
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "Applied", label: "Applied / Pending" },
    { value: "Selected", label: "Selected" },
    { value: "Rejected", label: "Rejected" }
  ];

  // --- Fetch Data ---
  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        // Note: If you are an admin, you might change this URL to fetch ALL applications
        const res = await fetch(`${BASE_URL}/placementdrives/student/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      } catch {
        Swal.fire("Error", "Failed to load applications data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [token]);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    return applications.filter(app => {
      const matchDept = filters.deptId ? String(app.dept_id) === String(filters.deptId) : true;
      const matchClass = filters.classId ? String(app.class_id) === String(filters.classId) : true;
      const matchStatus = filters.status ? app.status?.toLowerCase() === filters.status.toLowerCase() : true;
      const matchSearch = filters.search ? 
        app.company_name?.toLowerCase().includes(filters.search.toLowerCase()) || 
        app.role?.toLowerCase().includes(filters.search.toLowerCase()) : true;
      
      return matchDept && matchClass && matchStatus && matchSearch;
    });
  }, [applications, filters]);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const selected = filteredData.filter(a => a.status?.toLowerCase() === 'selected').length;
    const rejected = filteredData.filter(a => a.status?.toLowerCase() === 'rejected').length;
    const pending = total - selected - rejected;
    return { total, selected, rejected, pending };
  }, [filteredData]);

  // --- Export Handlers ---
  const handleExportExcelClick = () => {
    if (filteredData.length === 0) return;
    
    const dataToExport = filteredData.map(a => ({
      "Company Name": a.company_name || "N/A",
      "Role": a.role || "N/A",
      "Status": a.status || "Applied",
      "Applied Date": a.applied_date ? new Date(a.applied_date).toLocaleDateString("en-IN") : "N/A",
    }));

    exportToExcel(dataToExport, "Applications_Report", "Applications");
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Excel Downloaded', showConfirmButton: false, timer: 2000 });
  };

  const handleExportPDFClick = () => {
    if (filteredData.length === 0) return;

    const tableData = filteredData.map(a => [
      a.company_name || "N/A",
      a.role || "N/A",
      a.applied_date ? new Date(a.applied_date).toLocaleDateString("en-IN") : "-",
      a.status?.toUpperCase() || "APPLIED",
    ]);

    const config = {
      title: "PLACEMENT APPLICATIONS REPORT",
      subTitle: "Detailed view of placement drive applications",
      generatedBy: user?.name || "System User",
      fileName: "Applications_Report",
      tableHeaders: ["Company Name", "Role", "Applied Date", "Status"],
      tableData: tableData,
      filters: [
        { label: "Status", value: filters.status || "All" }
      ],
      stats: [
        { label: "Total Applications", value: stats.total, color: [59, 130, 246] },
        { label: "Selected", value: stats.selected, color: [16, 185, 129] },
        { label: "Pending", value: stats.pending, color: [245, 158, 11] },
      ]
    };

    generatePDFReport(config);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'PDF Generated', showConfirmButton: false, timer: 2000 });
  };

  // --- Helper for Status Badges ---
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'applied';
    if (s === 'selected' || s === 'accepted') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200"><FaCheckCircle /> Selected</span>;
    if (s === 'rejected') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200"><FaTimesCircle /> Rejected</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200"><FaClock /> Pending</span>;
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 rounded-xl text-indigo-600">
              <FaClipboardList className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 text-left tracking-tight">Application Reports</h1>
              <p className="text-slate-500 font-medium mt-1">Track, filter, and export placement application statuses.</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
             <button
              onClick={handleExportPDFClick}
              disabled={!filteredData.length || loading}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white text-red-600 border-2 border-red-100 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50"
            >
              <FaFilePdf /> Export PDF
            </button>
            <button
              onClick={handleExportExcelClick}
              disabled={!filteredData.length || loading}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white text-emerald-600 border-2 border-emerald-100 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition-colors active:scale-95 disabled:opacity-50"
            >
              <FaFileExcel /> Export Excel
            </button>
          </div>
        </div>

        {/* --- STATS PILLS --- */}
        {!loading && applications.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <InsightPill label="Total Applied" count={stats.total} icon={FaBriefcase} color="bg-blue-50 text-blue-600" />
            <InsightPill label="Selected" count={stats.selected} icon={FaCheckCircle} color="bg-emerald-50 text-emerald-600" />
            <InsightPill label="Pending Review" count={stats.pending} icon={FaClock} color="bg-amber-50 text-amber-600" />
            <InsightPill label="Rejected" count={stats.rejected} icon={FaTimesCircle} color="bg-rose-50 text-rose-600" />
          </div>
        )}

        {/* --- FILTERS --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative z-20">
          <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-3">
            <FaFilter /> Filter Records
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
           

           

            {/* Status Select */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">Application Status</label>
              <Select
                styles={selectStyles}
                placeholder="Any Status"
                isClearable
                value={filters.status ? { value: filters.status, label: filters.status } : null}
                options={statusOptions}
                onChange={opt => setFilters(prev => ({ ...prev, status: opt?.value || "" }))}
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">Search Company</label>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. Zoho, Software..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-[400px] text-indigo-600">
               <FaSpinner className="animate-spin text-5xl mb-4" />
               <p className="font-bold text-slate-700">Fetching Applications...</p>
             </div>
           ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 bg-slate-50/50">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                 <FaSearch className="text-4xl text-slate-300" />
               </div>
               <p className="text-xl font-bold text-slate-700">No applications found</p>
               <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-100 border-b-2 border-slate-200">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Company Details</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Role Applied</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Target Dept</th>
                     <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      
                      {/* Company Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm">
                            {getInitials(row.company_name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base">{row.company_name}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Applied: {row.applied_date ? new Date(row.applied_date).toLocaleDateString("en-IN") : "Recently"}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Role Info */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{row.role}</p>
                      </td>

                      {/* Dept Info (Useful for Staff View) */}
                      <td className="px-6 py-4">
                         {row.dept_id ? (
                           <div className="flex flex-col text-xs font-bold text-slate-600">
                             <span>{DEPT_MAP[row.dept_id] || "All"}</span>
                             <span className="text-[10px] text-slate-400">{CLASS_MAP[row.class_id] || ""}</span>
                           </div>
                         ) : (
                           <span className="text-xs text-slate-400 italic">Self</span>
                         )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                         {getStatusBadge(row.status)}
                      </td>
                    </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
           
           {/* Footer Stats */}
           {!loading && filteredData.length > 0 && (
             <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm font-bold text-slate-500">
               <span>Showing {filteredData.length} total records</span>
               <span>Generated on {new Date().toLocaleDateString("en-IN")}</span>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}