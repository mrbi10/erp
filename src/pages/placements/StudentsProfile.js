import React, { useEffect, useState, useMemo } from "react";
import {
  FaUserGraduate,
  FaSearch,
  FaFilter,
  FaFileExcel,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaBriefcase,
  FaBookDead,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaEnvelope,
  FaPhoneAlt,
  FaBirthdayCake,
  FaVenusMars,
  FaGraduationCap,
  FaPercentage
} from "react-icons/fa";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel } from "../../utils/exportHelper";
import { DEPT_MAP } from "../../constants/deptClass";

// ---------------------------
// Helpers & Utilities
// ---------------------------

const formatToApiDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

const formatToInputDate = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes("T")) return dateString.split("T")[0];
  if (dateString.split("-")[0].length === 2) {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  }
  return dateString;
};

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    padding: "2px 4px",
    borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    border: "2px solid #e2e8f0",
    "&:hover": { borderColor: "#cbd5e1" },
    fontSize: "0.95rem",
    minHeight: "44px"
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    fontSize: "0.95rem",
    padding: "10px 12px"
  }),
};

// ---------------------------
// Components
// ---------------------------

const InsightPill = ({ label, count, icon: Icon, color }) => (
  <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[180px]">
    <div className={`p-3.5 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-800">{count}</p>
    </div>
  </div>
);

const FormField = ({ label, icon: Icon, type = "text", value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon className="text-slate-400" />}
      {label}
    </label>
    <input
      type={type}
      value={value === null ? "" : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 rounded-xl border-2 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children, footer }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        />
        <div className="fixed inset-0 flex justify-center items-start z-50 pointer-events-none p-4 pt-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden pointer-events-auto border border-slate-100"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-8 max-h-[75vh] overflow-y-auto">
              {children}
            </div>
            {footer && (
              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);

// ---------------------------
// Main Component
// ---------------------------
export default function PlacementStudentsList() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    dept_id: "",
    willing_status: "", 
    arrears_status: ""  
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
  const token = localStorage.getItem("token");

  // Editing State
  const [editingStudent, setEditingStudent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({});

  // --- 1. Fetch Data ---
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/placementdrives/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch student placement data.", "error");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  // --- 2. Filter Logic ---
  useEffect(() => {
    let res = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.roll_no && s.roll_no.toLowerCase().includes(q))
      );
    }
    if (filters.dept_id) {
      res = res.filter(s => s.dept_id === Number(filters.dept_id));
    }
    if (filters.willing_status !== "") {
      const isWilling = filters.willing_status === "1";
      res = res.filter(s => Boolean(s.willing_for_placement) === isWilling);
    }
    if (filters.arrears_status !== "") {
      if (filters.arrears_status === "0") res = res.filter(s => s.current_arrears_count === 0);
      else res = res.filter(s => s.current_arrears_count > 0);
    }

    setFilteredStudents(res);
    setCurrentPage(1); 
  }, [filters, search, students]);


  // --- 3. Edit & Update Logic ---
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      personal_email: student.personal_email || "",
      personal_mobile: student.personal_mobile || "",
      gender: student.gender || "",
      dob: formatToInputDate(student.dob),
      tenth_percent: student.tenth_percent || "",
      twelfth_percent: student.twelfth_percent || "",
      diploma_percent: student.diploma_percent || "",
      ug_cgpa: student.ug_cgpa || "",
      history_of_arrears: student.history_of_arrears || 0,
      current_arrears_count: student.current_arrears_count || 0,
      willing_for_placement: student.willing_for_placement !== undefined ? student.willing_for_placement : 1
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        ...formData,
        dob: formatToApiDate(formData.dob),
        tenth_percent: parseFloat(formData.tenth_percent) || null,
        twelfth_percent: parseFloat(formData.twelfth_percent) || null,
        diploma_percent: formData.diploma_percent ? parseFloat(formData.diploma_percent) : null,
        ug_cgpa: parseFloat(formData.ug_cgpa) || null,
        history_of_arrears: parseInt(formData.history_of_arrears) || 0,
        current_arrears_count: parseInt(formData.current_arrears_count) || 0,
        willing_for_placement: formData.willing_for_placement ? 1 : 0
      };

      const res = await fetch(`${BASE_URL}/placementdrives/students/${editingStudent.roll_no}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({ title: "Updated!", text: data.message || "Student updated successfully", icon: "success", timer: 1500, showConfirmButton: false });
        
        // Update local state without refetching the whole list
        setStudents(prev => prev.map(s => s.roll_no === editingStudent.roll_no ? { ...s, ...payload } : s));
        setEditingStudent(null);
      } else {
        throw new Error(data.message || "Failed to update");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };


  // --- 4. Export Logic ---
  const handleExportExcelClick = () => {
    if (!filteredStudents.length) return Swal.fire("No Data", "No students to export", "info");

    const dataToExport = filteredStudents.map(s => ({
      "Register No": s.roll_no || "-",
      "Student Name": s.name || "-",
      "Department": DEPT_MAP[s.dept_id] || "-",
      "Mobile": s.personal_mobile || "-",
      "Email": s.personal_email || "-",
      "UG CGPA": s.ug_cgpa || "-",
      "Current Arrears": s.current_arrears_count || 0,
      "Willing": s.willing_for_placement ? "Yes" : "No"
    }));
    exportToExcel(dataToExport, "Placement_Students");
  };

  const stats = useMemo(() => ({
    total: filteredStudents.length,
    willing: filteredStudents.filter(s => s.willing_for_placement).length,
    notWilling: filteredStudents.filter(s => !s.willing_for_placement).length,
    clearStudents: filteredStudents.filter(s => s.current_arrears_count === 0 && s.willing_for_placement).length
  }), [filteredStudents]);

  const pageCount = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentData = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);
  const deptOptions = Object.entries(DEPT_MAP).map(([k, v]) => ({ value: Number(k), label: v }));

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <FaSpinner className="text-4xl text-blue-500" />
      </motion.div>
      <p className="mt-4 text-slate-500 font-semibold text-lg">Loading Placement Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><FaBriefcase className="text-xl" /></span>
              Placement Overview
            </h1>
            <p className="text-slate-500 mt-1 font-medium ml-1 text-lg">Manage and update student placement records</p>
          </div>
          <button
            onClick={handleExportExcelClick}
            disabled={!filteredStudents.length}
            className="flex items-center gap-2 bg-white text-emerald-600 border-2 border-emerald-200 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 text-lg"
          >
            <FaFileExcel /> Export
          </button>
        </div>

        {/* STATS */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <InsightPill label="Total Students" count={stats.total} icon={FaUserGraduate} color="bg-blue-50 text-blue-600" />
          <InsightPill label="Willing" count={stats.willing} icon={FaCheckCircle} color="bg-emerald-50 text-emerald-600" />
          <InsightPill label="Not Willing" count={stats.notWilling} icon={FaTimesCircle} color="bg-red-50 text-red-500" />
          <InsightPill label="Eligible (No Arrears)" count={stats.clearStudents} icon={FaBriefcase} color="bg-indigo-50 text-indigo-600" />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-4 items-center z-20 relative">
          <div className="relative w-full xl:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by name or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-blue-400 transition-all placeholder-slate-400 text-base font-medium"
            />
          </div>

          <div className="flex flex-wrap flex-1 gap-4 w-full items-center">
            <FaFilter className="text-slate-300 mx-2 hidden xl:block text-xl" />
            <div className="min-w-[200px] flex-1">
              <Select styles={selectStyles} placeholder="All Departments" options={[{ value: "", label: "All Depts" }, ...deptOptions]} value={filters.dept_id ? { value: filters.dept_id, label: DEPT_MAP[filters.dept_id] } : null} onChange={(o) => setFilters(f => ({ ...f, dept_id: o?.value || "" }))} />
            </div>
            <div className="min-w-[180px] flex-1">
              <Select styles={selectStyles} placeholder="Willingness" options={[{ value: "", label: "All Students" }, { value: "1", label: "Willing" }, { value: "0", label: "Not Willing" }]} value={filters.willing_status !== "" ? { value: filters.willing_status, label: filters.willing_status === "1" ? "Willing" : "Not Willing" } : null} onChange={(o) => setFilters(f => ({ ...f, willing_status: o?.value || "" }))} />
            </div>
            <div className="min-w-[180px] flex-1">
              <Select styles={selectStyles} placeholder="Arrears Status" options={[{ value: "", label: "All Arrears Status" }, { value: "0", label: "No Current Arrears" }, { value: "1", label: "Has Arrears" }]} value={filters.arrears_status !== "" ? { value: filters.arrears_status, label: filters.arrears_status === "0" ? "No Current Arrears" : "Has Arrears" } : null} onChange={(o) => setFilters(f => ({ ...f, arrears_status: o?.value || "" }))} />
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Student & Reg No", "Dept", "UG CGPA", "Current Arrears", "Willingness", "Action"].map(h => (
                    <th key={h} className="px-6 py-5 text-sm font-bold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {currentData.map((s, idx) => (
                    <motion.tr key={s.roll_no || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.02 }} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base">{s.name || "-"}</div>
                        <div className="text-sm font-mono text-slate-500 mt-1">{s.roll_no || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap">{DEPT_MAP[s.dept_id] || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-base font-bold ${s.ug_cgpa >= 8.0 ? 'text-emerald-600' : 'text-slate-700'}`}>{s.ug_cgpa ? parseFloat(s.ug_cgpa).toFixed(2) : "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        {s.current_arrears_count > 0 ? (
                          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-max font-bold"><FaBookDead /> {s.current_arrears_count}</div>
                        ) : <span className="text-slate-400 font-bold ml-2">0</span>}
                      </td>
                      <td className="px-6 py-4">
                        {s.willing_for_placement ? (
                          <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-max font-bold text-sm"><FaCheckCircle /> Willing</span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg w-max font-bold text-sm"><FaTimesCircle /> Not Willing</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-xl font-bold transition-all active:scale-95"
                        >
                          <FaEdit /> Edit
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="px-6 py-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-600 font-bold">Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} entries</span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm active:scale-95"><FaChevronLeft /></button>
                <button disabled={currentPage === pageCount} onClick={() => setCurrentPage(p => p + 1)} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm active:scale-95"><FaChevronRight /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title={editingStudent ? `Editing Profile: ${editingStudent.name}` : ""}
        footer={
          <>
            <button onClick={() => setEditingStudent(null)} className="px-6 py-3.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 transition-colors text-lg">Cancel</button>
            <button
              onClick={handleSaveEdit}
              disabled={isProcessing}
              className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center gap-2 text-lg"
            >
              {isProcessing ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Changes
            </button>
          </>
        }
      >
        {editingStudent && (
          <div className="space-y-8">
            <div className="bg-indigo-50 text-indigo-800 px-5 py-3 rounded-xl border border-indigo-100 font-bold text-lg inline-block">
              Reg No: <span className="font-mono">{editingStudent.roll_no}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Personal Email" icon={FaEnvelope} type="email" value={formData.personal_email} onChange={(v) => handleFormChange("personal_email", v)} />
              <FormField label="Mobile Number" icon={FaPhoneAlt} type="tel" value={formData.personal_mobile} onChange={(v) => handleFormChange("personal_mobile", v)} />
              <FormField label="Date of Birth" icon={FaBirthdayCake} type="date" value={formData.dob} onChange={(v) => handleFormChange("dob", v)} />
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2"><FaVenusMars className="text-slate-400" /> Gender</label>
                <Select styles={selectStyles} options={GENDER_OPTIONS} value={GENDER_OPTIONS.find(g => g.value === formData.gender) || null} onChange={(o) => handleFormChange("gender", o?.value || "")} placeholder="Select Gender" />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField label="10th %" icon={FaPercentage} type="number" value={formData.tenth_percent} onChange={(v) => handleFormChange("tenth_percent", v)} />
              <FormField label="12th %" icon={FaPercentage} type="number" value={formData.twelfth_percent} onChange={(v) => handleFormChange("twelfth_percent", v)} />
              <FormField label="Diploma %" icon={FaPercentage} type="number" value={formData.diploma_percent} onChange={(v) => handleFormChange("diploma_percent", v)} placeholder="If Any" />
              <FormField label="UG CGPA" icon={FaGraduationCap} type="number" value={formData.ug_cgpa} onChange={(v) => handleFormChange("ug_cgpa", v)} />
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <FormField label="Total Past Arrears" icon={FaBookDead} type="number" value={formData.history_of_arrears} onChange={(v) => handleFormChange("history_of_arrears", v)} />
              <FormField label="Current Arrears" icon={FaBookDead} type="number" value={formData.current_arrears_count} onChange={(v) => handleFormChange("current_arrears_count", v)} />
              
              <div className="space-y-4 pt-1">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2"><FaBriefcase className="text-slate-400" /> Willing For Placement?</label>
                <div 
                  onClick={() => handleFormChange("willing_for_placement", formData.willing_for_placement ? 0 : 1)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.willing_for_placement ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
                >
                  <span className={`text-lg font-bold ${formData.willing_for_placement ? "text-emerald-700" : "text-red-700"}`}>
                    {formData.willing_for_placement ? "Yes, Willing" : "Not Willing"}
                  </span>
                  <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.willing_for_placement ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${formData.willing_for_placement ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}