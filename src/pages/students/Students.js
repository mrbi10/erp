import React, { useEffect, useState, useMemo } from "react";
import {
  FaUserGraduate,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPhoneAlt,
  FaEnvelope,
  FaBus,
  FaBed,
  FaPrayingHands,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaRegStar
} from "react-icons/fa";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------
// Constants & Utils
// ---------------------------
const DEPT_MAP = { 1: "CSE", 2: "ECE", 3: "EEE", 4: "MECH", 5: "CIVIL", 6: "IT" };
const ROMAN_MAP = { 1: "I", 2: "II", 3: "III", 4: "IV" };
const YEAR_MAP = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV"
};


const getInitials = (name) => {
  const parts = name?.split(" ") || [];
  return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
};

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
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#eff6ff",
    borderRadius: "6px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1d4ed8",
    fontWeight: 600
  }),
};

// ---------------------------
// Components
// ---------------------------

// 1. Status Badge
const StatusIcon = ({ active, icon: Icon, colorClass, tooltip }) => (
  <div
    className={`p-2 rounded-lg transition-all duration-300 group relative ${active ? colorClass : "bg-gray-100 text-gray-300"}`}
  >
    <Icon className="text-sm" />
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
      {active ? tooltip : `Not a  ${tooltip}`}
    </span>
  </div>
);

// 2. Insight Pill
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

// 3. Modal Component
const Modal = ({ isOpen, onClose, title, children, footer }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity"
        />
        <div className="fixed inset-0 flex justify-center items-start z-50 pointer-events-none p-4 pt-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto border border-gray-100"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-8 max-h-[150%] overflow-y-auto custom-scrollbar">
              {children}
            </div>
            {footer && (
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
export default function Students({ user }) {
  // State
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ dept: "", year: "", classId: "", multiFilters: [] });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 7;

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "", roll_no: "", email: "", mobile: "", class_id: "", dept_id: "",
    jain: false, hostel: false, bus: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const token = localStorage.getItem("token");

  // --- 1. Data Fetching (Matches Original Logic) ---
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch Classes based on Role
        let classUrl = `${BASE_URL}/classes`;
        if (user.role === "HOD") classUrl += `?dept_id=${user.dept_id}`;
        else if (user.role === "CA") classUrl = `${BASE_URL}/classes/${user.assigned_class_id}/students`;

        const classRes = await fetch(classUrl, { headers: { Authorization: `Bearer ${token}` } });
        const classData = await classRes.json();
        const classList = Array.isArray(classData) ? classData : [classData];
        setClasses(classList);

        // Fetch Students based on Role
        let studentUrl = `${BASE_URL}/students`;
        if (user.role === "HOD") studentUrl = `${BASE_URL}/departments/${user.dept_id}/students`;
        else if (user.role === "CA") studentUrl = `${BASE_URL}/classes/${user.assigned_class_id}/students`;

        const studentRes = await fetch(studentUrl, { headers: { Authorization: `Bearer ${token}` } });
        const studentData = await studentRes.json();
        setStudents(studentData);
        setFilteredStudents(studentData);

        // Initial Filter Setup
        if (user.role === "HOD") setFilters(f => ({ ...f, dept: user.dept_id }));
        if (user.role === "CA") setFilters(f => ({ ...f, dept: user.dept_id, classId: user.assigned_class_id }));

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, token]);

  // --- 2. Filtering Logic (Matches Original) ---
  useEffect(() => {
    let res = [...students];
    const { dept, year, classId, multiFilters } = filters;

    if (dept) res = res.filter(s => s.dept_id === Number(dept));
    if (classId) res = res.filter(s => s.class_id === Number(classId));
    if (year) {
      res = res.filter(s => {
        const cls = classes.find(c => c.class_id === s.class_id);
        return cls?.year === Number(year);
      });
    }

    if (multiFilters.length > 0) {
      res = res.filter(s => {
        const isJain = s.jain === 1 || s.jain === true;
        const isHostel = s.hostel === 1 || s.hostel === true;
        const isBus = s.bus === 1 || s.bus === true;

        return multiFilters.every(f => {
          if (f === "Jain") return isJain;
          if (f === "Non-Jain") return !isJain;
          if (f === "Hostel") return isHostel;
          if (f === "DayScholar") return !isHostel;
          if (f === "Bus") return isBus;
          if (f === "NoBus") return !isBus;
          return true;
        });
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(s => s.name?.toLowerCase().includes(q) || s.roll_no?.toLowerCase().includes(q));
    }

    setFilteredStudents(res);
    setCurrentPage(1);
  }, [filters, search, students, classes]);


  // --- 3. CRUD Handlers ---

  // Handle Input Changes in Modal
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add Student
  const handleAddStudent = async () => {
    setIsProcessing(true);
    try {
      let finalDept = formData.dept_id;
      let finalClass = formData.class_id;

      if (user.role === "HOD") finalDept = user.dept_id;
      if (user.role === "CA") { finalDept = user.dept_id; finalClass = user.assigned_class_id; }

      const payload = {
        ...formData,
        name: formData.name.trim().toUpperCase(),
        dept_id: finalDept,
        class_id: finalClass
      };

      const res = await fetch(`${BASE_URL}/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        // EXACT DUPLICATE LOGIC FROM ORIGINAL
        if (data.code === "DUPLICATE") {
          const ex = data.existingStudent;
          Swal.fire({
            title: "Student Already Exists",
            html: `
               <div class="text-left leading-relaxed">
                 <p class="text-gray-700 mb-3">A student with the same <b>email</b> or <b>register number</b> already exists.</p>
                 <div class="p-3 bg-gray-100 rounded border">
                   <p><b>Name:</b> ${ex?.name || "-"}</p>
                   <p><b>Reg No:</b> ${ex?.roll_no || "-"}</p>
                   <p><b>Email:</b> ${ex?.email || "-"}</p>
                 </div>
               </div>
             `,
            icon: "warning",
            confirmButtonText: "OK",
            confirmButtonColor: "#3b82f6"
          });
          setIsProcessing(false);
          return;
        }
        throw new Error(data.message);
      }

      Swal.fire({ title: "Added!", text: `${payload.name} added successfully`, icon: "success", timer: 1500, showConfirmButton: false });
      setStudents(prev => [...prev, { ...payload, student_id: data.student_id }]);
      handleCloseModal();

    } catch (err) {
      Swal.fire("Error", err.message || "Failed to add student", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit Student
  const handleEditSave = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/student/${editingStudent.student_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jain: formData.jain,
          hostel: formData.hostel,
          bus: formData.bus
        }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({ title: "Updated!", text: "Student details updated.", icon: "success", timer: 1500, showConfirmButton: false });
        setStudents(prev => prev.map(s => s.student_id === editingStudent.student_id ? { ...s, ...formData } : s));
        handleCloseModal();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire("Error", "Failed to update student.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Student
  const handleDelete = async (student) => {
    const confirm = await Swal.fire({
      title: `Delete ${student.name}?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#e5e7eb"
    });

    if (!confirm.isConfirmed) return;

    try {
      await fetch(`${BASE_URL}/student/${student.student_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(prev => prev.filter(st => st.student_id !== student.student_id));
      Swal.fire({ title: "Deleted!", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", "Something went wrong.", "error");
    }
  };

  // Open/Close Handlers
  const handleOpenAdd = () => {
    setFormData({ name: "", roll_no: "", email: "", mobile: "", class_id: "", dept_id: "", jain: false, hostel: false, bus: false });
    setEditingStudent(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      ...student,
      jain: !!student.jain,
      hostel: !!student.hostel,
      bus: !!student.bus
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingStudent(null);
  };


  // --- 4. Render Helpers ---
  const stats = useMemo(() => ({
    total: filteredStudents.length,
    hostel: filteredStudents.filter(s => s.hostel).length,
    bus: filteredStudents.filter(s => s.bus).length,
    jain: filteredStudents.filter(s => s.jain).length
  }), [filteredStudents]);

  const deptOptions = Object.entries(DEPT_MAP).map(([k, v]) => ({ value: Number(k), label: v }));
  const classOptions = classes.map(c => ({ value: c.class_id, label: `${ROMAN_MAP[c.year]} - ${DEPT_MAP[c.dept_id]}` }));

  // Logic for filtered year options based on current class list
  const yearOptions = [...new Set(
    classes
      .filter(c => !filters.dept || c.dept_id === Number(filters.dept))
      .map(c => c.year)
  )].map(y => ({ value: y, label: `${ROMAN_MAP[y]} Year` }));

  const pageCount = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentData = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);


  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <FaSpinner className="text-4xl text-blue-500" />
      </motion.div>
      <p className="mt-4 text-gray-400 font-medium">Loading Records...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">

      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-xl text-blue-600"><FaUserGraduate className="text-xl" /></span>
              {user.role === "Principal" ? "Students Overview" : "My Students"}
            </h1>
            <p className="text-slate-500 mt-1 font-medium ml-1">Manage student details</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="group flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <FaPlus className="text-sm group-hover:rotate-90 transition-transform" />
            <span>Add Student</span>
          </button>
        </div>

        {/* --- STATS PILLS --- */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <InsightPill label="Total Students" count={stats.total} icon={FaUserGraduate} color="bg-indigo-50 text-indigo-600" />
          <InsightPill label="Hostel" count={stats.hostel} icon={FaBed} color="bg-blue-50 text-blue-600" />
          <InsightPill label="Bus Users" count={stats.bus} icon={FaBus} color="bg-yellow-50 text-yellow-600" />
          <InsightPill label="Jain" count={stats.jain} icon={FaRegStar} color="bg-emerald-50 text-emerald-600" />
        </div>

        {/* --- FILTERS --- */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-row lg:flex-row gap-4 items-center z-20 relative">
          <div className="relative w-full lg:w-80">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input

              type="text"
              placeholder="Search by name, reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-sm font-medium"
            />
          </div>

          <div className="flex flex-1 gap-3 w-full overflow-x-auto pb-1 lg:pb-0 items-center ">
            <FaFilter className="text-gray-300 mx-2 hidden lg:block" />

            {user.role === "Principal" && (
              <div className="min-w-[180px]">
                <Select
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuShouldBlockScroll={false}
                  placeholder="All Departments"
                  options={[{ value: "", label: "All Depts" }, ...deptOptions]}
                  value={
                    filters.dept
                      ? { value: filters.dept, label: DEPT_MAP[filters.dept] }
                      : null
                  }
                  onChange={(o) =>
                    setFilters((f) => ({
                      ...f,
                      dept: o?.value || "",
                      year: "",
                      classId: "",
                    }))
                  }
                />
              </div>
            )}

            {(user.role === "Principal" || user.role === "HOD") && (
              <div className="min-w-[140px]">
                <Select
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuShouldBlockScroll={false}
                  placeholder="All Years"
                  options={[{ value: "", label: "All Years" }, ...yearOptions]}
                  value={yearOptions.find(o => o.value === filters.year) || null}
                  onChange={(o) => setFilters(f => ({ ...f, year: o?.value || "", classId: "" }))}
                />
              </div>
            )}

            <div className="min-w-[220px]">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuShouldBlockScroll={false}
                isMulti
                placeholder="Categories..."
                options={[
                  { value: "Jain", label: "Jain" },
                  { value: "Non-Jain", label: "Non-Jain" },
                  { value: "Hostel", label: "Hostel" },
                  { value: "DayScholar", label: "Day Scholar" },
                  { value: "Bus", label: "Bus" },
                  { value: "NoBus", label: "No Bus" },
                ]}
                value={filters.multiFilters.map(f => ({ value: f, label: f }))}
                onChange={(vals) => setFilters(f => ({ ...f, multiFilters: vals ? vals.map(v => v.value) : [] }))}
              />
            </div>
          </div>
        </div>

        {/* --- DATA GRID --- */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="text-3xl opacity-20" />
              </div>
              <p className="text-lg font-medium">No students found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    {["Student", "Reg No", "Class",
                      // "Mobile", 
                      "Email", "Category", "Actions"].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {currentData.map((s, idx) => (
                      <motion.tr
                        key={s.student_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        {/* Student Profile */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                              {getInitials(s.name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                              <p className="text-xs text-gray-400">{s.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-gray-600 font-mono">{s.roll_no || "-"}</td>

                        {/* CLASS Badge */}
                        <td className="px-6 py-4">
                          {(() => {
                            const dept = DEPT_MAP[s.dept_id];
                            const year = YEAR_MAP[s.class_id]; 

                            if (!dept && !year) return null;

                            return (
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200 whitespace-nowrap">
                                {dept && year ? `${dept} • ${year}` : dept || year}
                              </span>
                            );
                          })()}
                        </td>


                        {/* MOBILE COLUMN
                        <td className="px-6 py-4">
                          {s.mobile ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${s.mobile}`}
                                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                title={s.mobile}
                              >
                                <FaPhoneAlt className="text-xs" />
                              </a>
                              <span className="text-xs text-gray-600 font-medium">{s.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td> */}

                        {/* EMAIL COLUMN */}
                        <td className="px-6 py-4">
                          {s.email ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`mailto:${s.email}`}
                                className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                title={s.email}
                              >
                                <FaEnvelope className="text-xs" />
                              </a>
                              <span className="text-xs text-gray-600 font-medium">{s.email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        {/* Status Icons */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <StatusIcon active={s.jain} icon={FaRegStar} colorClass="bg-emerald-100 text-emerald-600" tooltip="Jain Student" />
                            <StatusIcon active={s.hostel} icon={FaBed} colorClass="bg-blue-100 text-blue-600" tooltip="Hostel Student" />
                            <StatusIcon active={s.bus} icon={FaBus} colorClass="bg-yellow-100 text-yellow-600" tooltip="Bus Student" />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 transition-opacity">
                            <button onClick={() => handleOpenEdit(s)} className="text-gray-400 hover:text-blue-600 transition-colors"><FaEdit /></button>
                            <button onClick={() => handleDelete(s)} className="text-gray-400 hover:text-red-500 transition-colors"><FaTrash /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {pageCount}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <button
                  disabled={currentPage === pageCount}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL (Dynamic Content) --- */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingStudent ? "Edit Student Details" : "Add New Student"}
        footer={
          <>
            <button
              onClick={handleCloseModal}
              className="px-5 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={editingStudent ? handleEditSave : handleAddStudent}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium shadow-lg 
                 hover:shadow-xl hover:bg-slate-800 transition-all 
                 disabled:opacity-70 flex items-center gap-2"
            >
              {isProcessing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              )}
              {editingStudent ? "Save Changes" : "Add Student"}
            </button>
          </>
        }
      >
        {/* ---------------------- */}
        {/* YOUR FORM CONTENT HERE */}
        {/* ---------------------- */}

        {/* Edit Indicator */}
        {editingStudent && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
            <p className="text-sm text-blue-800 font-medium">
              Editing Profile: <span className="font-bold">{formData.name}</span> ({formData.roll_no})
            </p>
          </div>
        )}

        {/* Identity Fields */}
        {!editingStudent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Full Name
              </label>
              <input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter student full name"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 
                     focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Register Number
              </label>
              <input
                value={formData.roll_no}
                onChange={(e) => handleInputChange("roll_no", e.target.value)}
                placeholder="Enter register number"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 
                     focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Email ID
              </label>
              <input
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter student email address"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 
                     focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Mobile Number
              </label>
              <input
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                placeholder="Enter mobile number"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 
                     focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Department + Class */}
        {!editingStudent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Department</label>
              {user.role === "Principal" ? (
                <Select
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuShouldBlockScroll={false}
                  options={deptOptions}
                  onChange={(o) => handleInputChange("dept_id", o.value)}
                  value={deptOptions.find((d) => d.value === formData.dept_id)}
                  placeholder="Select department"
                />
              ) : (
                <input
                  disabled
                  value={DEPT_MAP[user.dept_id]}
                  className="w-full p-3 bg-gray-100 text-gray-500 rounded-xl border-none"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</label>
              {user.role === "CA" ? (
                <input
                  disabled
                  value={classOptions.find((c) => c.value === user.assigned_class_id)?.label || "Assigned Class"}
                  className="w-full p-3 bg-gray-100 text-gray-500 rounded-xl border-none"
                />
              ) : (
                <Select
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuShouldBlockScroll={false}
                  options={classOptions}
                  onChange={(o) => handleInputChange("class_id", o.value)}
                  value={classOptions.find((c) => c.value === formData.class_id)}
                  placeholder="Select class"
                />
              )}
            </div>

          </div>
        )}

        {/* Status Switches */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status Details</label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["jain", "hostel", "bus"].map((key) => (
              <div
                key={key}
                onClick={() => handleInputChange(key, !formData[key])}
                className={`cursor-pointer select-none border p-4 rounded-xl 
            flex items-center justify-between transition-all
            ${formData[key]
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <span className="capitalize font-semibold text-gray-700">
                  {key}
                </span>

                <div
                  className={`w-10 h-6 rounded-full p-1 transition-colors 
              ${formData[key] ? "bg-blue-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform 
                ${formData[key] ? "translate-x-4" : ""}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </Modal>

    </div>
  );
}