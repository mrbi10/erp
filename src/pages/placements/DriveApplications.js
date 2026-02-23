import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";
import {
    FaUserGraduate,
    FaCheckCircle,
    FaTimesCircle,
    FaFilePdf,
    FaFileExcel,
    FaSearch,
    FaFilter,
    FaSpinner,
    FaEnvelope,
    FaPhone,
    FaBookOpen,
    FaClock
} from "react-icons/fa";

// ---------------------------
// Styles & Utils
// ---------------------------

const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: "0.75rem",
        padding: "2px 4px",
        borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
        backgroundColor: "#ffffff",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(79, 70, 229, 0.2)" : "none",
        "&:hover": { borderColor: "#cbd5e1" },
        fontSize: "0.95rem",
        fontWeight: "600",
        minHeight: "46px"
    }),
    menu: (base) => ({
        ...base,
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        overflow: "hidden",
        zIndex: 50
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#e0e7ff" : "white",
        color: state.isSelected ? "white" : "#1e293b",
        cursor: "pointer",
        fontSize: "0.95rem",
        padding: "12px 16px",
        fontWeight: "500"
    })
};

const InsightPill = ({ label, count, icon: Icon, color }) => (
    <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5 flex-1 min-w-[200px]">
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-700 shadow-inner`}>
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

export default function DriveApplications({ user }) {
    const token = localStorage.getItem("token");

    // --- State ---
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        deptId: "",
        classId: "",
        status: "",
        search: ""
    });

    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Applied", label: "Pending / Applied" },
        { value: "Selected", label: "Selected" },
        { value: "Rejected", label: "Rejected" }
    ];

    // --- Fetch Data ---
    useEffect(() => {
        const fetchApps = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${BASE_URL}/placementdrives/applications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const jsonData = await res.json();
                setData(Array.isArray(jsonData) ? jsonData : []);
            } catch {
                Swal.fire("Error", "Failed to load application data.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [token]);

    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        return data.filter(app => {
            const matchDept = filters.deptId ? String(app.dept_id) === String(filters.deptId) : true;
            const matchClass = filters.classId ? String(app.class_id) === String(filters.classId) : true;
            const matchStatus = filters.status ? app.status?.toLowerCase() === filters.status.toLowerCase() : true;
            const matchSearch = filters.search ?
                app.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                app.roll_no?.toLowerCase().includes(filters.search.toLowerCase()) : true;

            return matchDept && matchClass && matchStatus && matchSearch;
        });
    }, [data, filters]);

    // --- Statistics Calculation ---
    const stats = useMemo(() => {
        const total = filteredData.length;
        const selected = filteredData.filter(a => a.status?.toLowerCase() === 'selected').length;
        const rejected = filteredData.filter(a => a.status?.toLowerCase() === 'rejected').length;
        const pending = total - selected - rejected;
        return { total, selected, rejected, pending };
    }, [filteredData]);

    // --- Export Handlers ---
    // --- Export Handlers ---
    const handleExportExcelClick = () => {
        if (filteredData.length === 0) return;

        const dataToExport = filteredData.map((a, index) => ({
            "S.No": index + 1,
            "Registration No. ": a.roll_no || "N/A",
            "Name": a.name || "N/A",
            "D.O.B ": a.dob ? new Date(a.dob).toLocaleDateString("en-GB") : "N/A", // Assumes your API returns 'dob'
            "Gender (M/F)": a.gender || "N/A", // Assumes your API returns 'gender'
            "X %": a.tenth_percent || "N/A",
            "XII %": a.twelfth_percent || "N/A",
            "Diploma%": a.diploma_percent || "N/A",
            "UG (CGPA upto 6th sem)": a.ug_cgpa || "N/A",
            "History of Arrears": (a.history_of_arrears === 1 || a.history_of_arrears === true || String(a.history_of_arrears).toLowerCase() === 'yes') ? "Yes" : "No",
            "No.of. Backlogs": a.current_arrears_count || "0",
            "Mobile": a.personal_mobile || "N/A",
            "Email-id": a.personal_email || "N/A"
        }));

        exportToExcel(dataToExport, "Drive_Applications_Report", "Applications");
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Excel Downloaded', showConfirmButton: false, timer: 2000 });
    };

    const handleExportPDFClick = () => {
        if (filteredData.length === 0) return;

        const tableData = filteredData.map(a => [
            a.roll_no || "-",
            a.name || "-",
            DEPT_MAP[a.dept_id] || "-",
            a.ug_cgpa || "-",
            a.status?.toUpperCase() || "APPLIED",
        ]);

        const config = {
            title: "PLACEMENT APPLICATIONS REPORT",
            subTitle: "Master list of all student drive applications",
            generatedBy: user?.name || "Placement Admin",
            fileName: "Drive_Applications_Report",
            tableHeaders: ["Roll No", "Student Name", "Department", "CGPA", "Status"],
            tableData: tableData,
            filters: [
                { label: "Department", value: DEPT_MAP[filters.deptId] || "All" },
                { label: "Class / Year", value: CLASS_MAP[filters.classId] || "All" },
                { label: "Status", value: filters.status || "All" }
            ],
            stats: [
                { label: "Total Applications", value: stats.total, color: [79, 70, 229] },
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
        if (s === 'selected' || s === 'accepted') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300"><FaCheckCircle /> Selected</span>;
        if (s === 'rejected') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300"><FaTimesCircle /> Rejected</span>;
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300"><FaClock /> Pending</span>;
    };

    // --- Render ---
    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Drive Applications</h1>
                        <p className="text-slate-600 font-medium mt-1">Review student profiles and application statuses.</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportPDFClick}
                            disabled={!filteredData.length || loading}
                            className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white text-red-700 border-2 border-red-200 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <FaFilePdf /> Export PDF
                        </button>
                        <button
                            onClick={handleExportExcelClick}
                            disabled={!filteredData.length || loading}
                            className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white text-emerald-700 border-2 border-emerald-200 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                            <FaFileExcel /> Export Excel
                        </button>
                    </div>
                </div>

                {/* --- STATS PILLS --- */}
                {!loading && data.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                        <InsightPill label="Total Applied" count={stats.total} icon={FaUserGraduate} color="bg-indigo-100 text-indigo-700" />
                        <InsightPill label="Selected" count={stats.selected} icon={FaCheckCircle} color="bg-emerald-100 text-emerald-700" />
                        <InsightPill label="In Review" count={stats.pending} icon={FaClock} color="bg-amber-100 text-amber-700" />
                        <InsightPill label="Rejected" count={stats.rejected} icon={FaTimesCircle} color="bg-rose-100 text-rose-700" />
                    </div>
                )}

                {/* --- FILTERS --- */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-3">
                        <FaFilter /> Filter Applicants
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                            <Select
                                styles={selectStyles}
                                placeholder="All Departments"
                                isClearable
                                value={filters.deptId ? { value: filters.deptId, label: DEPT_MAP[filters.deptId] } : null}
                                options={Object.entries(DEPT_MAP).map(([id, name]) => ({ value: id, label: name }))}
                                onChange={opt => setFilters({ ...filters, deptId: opt?.value || "" })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Class / Year</label>
                            <Select
                                styles={selectStyles}
                                placeholder="All Classes"
                                isClearable
                                value={filters.classId ? { value: filters.classId, label: CLASS_MAP[filters.classId] } : null}
                                options={Object.entries(CLASS_MAP).map(([id, label]) => ({ value: id, label }))}
                                onChange={opt => setFilters(prev => ({ ...prev, classId: opt?.value || "" }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Application Status</label>
                            <Select
                                styles={selectStyles}
                                placeholder="Any Status"
                                isClearable
                                value={filters.status ? { value: filters.status, label: filters.status } : null}
                                options={statusOptions}
                                onChange={opt => setFilters(prev => ({ ...prev, status: opt?.value || "" }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Search Student</label>
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Name or Roll No..."
                                    value={filters.search}
                                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-slate-800"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-indigo-600">
                            <FaSpinner className="animate-spin text-5xl mb-4" />
                            <p className="font-bold text-slate-700">Loading Applications...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 bg-slate-50/50 py-16">
                            <FaSearch className="text-6xl mb-4 text-slate-300" />
                            <p className="text-2xl font-bold text-slate-700">No records found</p>
                            <p className="text-md mt-1 font-medium">Try adjusting your filters to find what you need.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Student Profile</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Academics</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Contact Info</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredData.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">

                                            {/* Column 1: Student Profile */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-extrabold text-slate-900 text-base">{app.name}</span>
                                                    <span className="text-sm font-mono text-indigo-700 font-bold">{app.roll_no}</span>
                                                    <span className="text-xs font-bold text-slate-500 mt-1">
                                                        {DEPT_MAP[app.dept_id] || "Unknown Dept"} • {CLASS_MAP[app.class_id] || "Unknown Class"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 2: Academics */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 text-sm">
                                                    <div className="flex items-center justify-between max-w-[150px]">
                                                        <span className="font-bold text-slate-600">CGPA:</span>
                                                        <span className="font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded">{app.ug_cgpa || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between max-w-[150px]">
                                                        <span className="font-bold text-slate-600">Arrears:</span>
                                                        <span className={`font-black px-2 py-0.5 rounded ${app.current_arrears_count > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {app.current_arrears_count || "0"}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-bold mt-1">
                                                        10th: {app.tenth_percent}% | 12th: {app.twelfth_percent}%
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 3: Contact */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                                    <span className="flex items-center gap-2">
                                                        <FaEnvelope className="text-slate-400" />
                                                        {app.personal_email || "No Email"}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <FaPhone className="text-slate-400" />
                                                        {app.personal_mobile || "No Mobile"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 4: Status */}
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(app.status)}
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
                            <span>Showing {filteredData.length} records</span>
                            <span>Generated on {new Date().toLocaleDateString("en-IN")}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}