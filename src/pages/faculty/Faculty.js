import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaChalkboardTeacher,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaUserTie,
  FaUserShield,
  FaUserGraduate,
  FaIdBadge
} from "react-icons/fa";
import Select from "react-select";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP } from "../../constants/deptClass";

// ---------------------------
// Constants & Utils
// ---------------------------

const ROLE_OPTIONS = [
  { value: "All", label: "All Roles" },
  { value: "Staff", label: "Staff" },
  { value: "CA", label: "CA" },
  { value: "HOD", label: "HOD" },
];

const FORM_ROLE_OPTIONS = [
  { value: "Staff", label: "Staff" },
  { value: "HOD", label: "HOD" },
];

const DEPT_OPTIONS = [
  { value: "All", label: "All Departments" },
  ...Object.entries(DEPT_MAP).map(([id, name]) => ({
    value: id,
    label: name,
  })),
];

const getInitials = (name) => {
  const parts = name?.split(" ") || [];
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
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
    minHeight: "42px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    fontSize: "0.9rem",
  }),
};

const modalSelectProps = {
  menuPortalTarget: document.body,
  menuPosition: "fixed",
  styles: {
    ...selectStyles,
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999999,
    }),
  },
};


// ---------------------------
// Components
// ---------------------------

// 1. Insight Pill
const InsightPill = ({ label, count, icon: Icon, color }) => (
  <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[160px] hover:shadow-md transition-shadow">
    <div
      className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split("-")[1]}-600`}
    >
      <Icon className="text-lg" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-800">{count}</p>
    </div>
  </div>
);

// 2. Modal Component
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
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto border border-gray-100"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
export default function Faculty() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role;
  const userDeptId = String(user.dept_id);
  const isDeptScoped = userRole === "HOD" || userRole === "DeptAdmin";

  // State
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Filters
  const [deptFilter, setDeptFilter] = useState(
    isDeptScoped ? userDeptId : "All"
  );
  const [roleFilter, setRoleFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",

    dept_id: isDeptScoped ? userDeptId : "",
    role: "Staff",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */

  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (deptFilter !== "All") params.append("dept_id", deptFilter);
      if (roleFilter !== "All") params.append("role", roleFilter);

      const res = await fetch(`${BASE_URL}/faculty?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setFaculty(json.data);
      setCurrentPage(1); // Reset to page 1 on fetch
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [deptFilter, roleFilter, token]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  /* ================= COMPUTED DATA ================= */

  // Filter by search (Client-side)
  const filteredData = useMemo(() => {
    let data = faculty;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.name?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.designation?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [faculty, search]);

  // Pagination Logic
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(
    () => ({
      total: faculty.length,
      staff: faculty.filter((f) => f.role === "Staff").length,
      hod: faculty.filter((f) => f.role === "HOD").length,
      ca: faculty.filter((f) => f.role === "CA").length,
    }),
    [faculty]
  );

  /* ================= HANDLERS ================= */

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreate = () => {
    setEditingFaculty(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      designation: "",
      dept_id: isDeptScoped ? userDeptId : "",
      role: "Staff",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f) => {
    setEditingFaculty(f);
    setFormData({
      name: f.name || "",
      email: f.email || "",
      password: "",
      designation: f.designation || "",
      dept_id: isDeptScoped ? userDeptId : f.dept_id,
      role: f.role,
    });
    setShowModal(true);
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaculty(null);
  };

  /* ================= CRUD OPERATIONS ================= */

  const handleCreate = async () => {
    // Basic Validation
    if (!formData.name || !formData.email || !formData.designation) {
      Swal.showValidationMessage("Name, Email and Designation are required");
      return;
    }
    if (!formData.dept_id || !formData.role) {
      Swal.fire("Error", "Department and Role are required", "warning");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/faculty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password || "Staff@2026",
          designation: formData.designation,
          role: formData.role,
          dept_id: formData.dept_id,
        }),
      });



      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      fetchFaculty();
      Swal.fire({
        title: "Success",
        text: "Faculty created successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      handleCloseModal();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.designation) {
      Swal.fire("Error", "Name and Designation cannot be empty", "warning");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/faculty/${editingFaculty.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          designation: formData.designation,
          email: formData.email,
          dept_id: formData.dept_id,
          role: formData.role,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      fetchFaculty();
      Swal.fire({
        title: "Updated",
        text: "Faculty details updated",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      handleCloseModal();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (user_id, name) => {
    const confirm = await Swal.fire({
      title: `Delete ${name}?`,
      text: "This will delete the faculty member.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#e5e7eb",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/faculty/${user_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      fetchFaculty();
      Swal.fire({
        title: "Deleted",
        text: "Faculty has been deleted",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ================= RENDER ================= */

  if (loading && faculty.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
        <p className="mt-4 text-gray-400 font-medium">Loading Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <FaChalkboardTeacher className="text-xl" />
              </span>
              Faculty Management
            </h1>
            <p className="text-slate-500 mt-1 font-medium ml-1">
              Manage staff, roles, and designations
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="group flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <FaPlus className="text-sm group-hover:rotate-90 transition-transform" />
            <span>Add Faculty</span>
          </button>
        </div>

        {/* --- STATS PILLS --- */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <InsightPill
            label="Total Faculty"
            count={stats.total}
            icon={FaUserTie}
            color="bg-indigo-50 text-indigo-600"
          />
          <InsightPill
            label="Staff"
            count={stats.staff}
            icon={FaUserGraduate}
            color="bg-blue-50 text-blue-600"
          />
          <InsightPill
            label="Class Advisors"
            count={stats.ca}
            icon={FaIdBadge}
            color="bg-purple-50 text-purple-600"
          />
          <InsightPill
            label="HODs"
            count={stats.hod}
            icon={FaUserShield}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* --- FILTERS & TOOLBAR --- */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col lg:flex-row gap-4 items-center z-20 relative">
          <div className="relative w-full lg:w-80">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-sm font-medium"
            />
          </div>

          <div className="flex flex-1 gap-3 w-full overflow-x-auto pb-1 lg:pb-0 items-center">
            <FaFilter className="text-gray-300 mx-2 hidden lg:block" />

            <div className="min-w-[180px]">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                options={DEPT_OPTIONS}
                value={DEPT_OPTIONS.find((o) => o.value === deptFilter)}
                onChange={(o) => setDeptFilter(o.value)}
                isDisabled={isDeptScoped}
                isClearable={!isDeptScoped}
              />
            </div>

            <div className="min-w-[150px]">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                placeholder="Role"
                options={ROLE_OPTIONS}
                value={ROLE_OPTIONS.find((o) => o.value === roleFilter)}
                onChange={(o) => setRoleFilter(o.value)}
              />
            </div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="text-3xl opacity-20" />
              </div>
              <p className="text-lg font-medium">
                No faculty found matching criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    {["Faculty Name", "Role", "Department", "Designation", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {currentData.map((f, idx) => (
                      <motion.tr
                        key={f.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Name & Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                              {getInitials(f.name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">
                                {f.name}
                              </p>
                              {f.email && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <FaEnvelope className="text-[10px]" />{" "}
                                  {f.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${f.role === "HOD"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : f.role === "CA"
                                ? "bg-purple-50 text-purple-600 border-purple-100"
                                : "bg-blue-50 text-blue-600 border-blue-100"
                              }`}
                          >
                            {f.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-600">
                            {DEPT_MAP[f.dept_id] || "Unknown"}
                          </span>
                        </td>

                        {/* Designation */}
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {f.designation}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleOpenEdit(f)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Faculty"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(f.user_id, f.name)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Faculty"
                            >
                              <FaTrash />
                            </button>
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
              <span className="text-xs text-gray-500 font-medium">
                Page {currentPage} of {pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <button
                  disabled={currentPage === pageCount}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL --- */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingFaculty ? "Edit Faculty Details" : "Add New Faculty"}
        footer={
          <>
            <button
              onClick={handleCloseModal}
              className="px-5 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingFaculty ? handleUpdate : handleCreate}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {isProcessing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              )}
              {editingFaculty ? "Save Changes" : "Create Faculty"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Full Name */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Full Name
            </label>
            <input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter the faculty member's full name"
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
            />
          </div>

          {/* Email (Create only) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Email Address
              </label>
              <input
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
              />
            </div>
          

          {/* Password (Create only) */}
          {!editingFaculty && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Optional - Default is 'Staff@2026'"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Designation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Designation
            </label>
            <input
              value={formData.designation}
              onChange={(e) => handleInputChange("designation", e.target.value)}
              placeholder="ASP / AP / Proff / HOD"
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Department
            </label>

            {isDeptScoped ? (
              <div className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">
                {DEPT_MAP[userDeptId]}
              </div>
            ) : (
              <Select
                styles={selectStyles}
                {...modalSelectProps}
                options={DEPT_OPTIONS.filter(d => d.value !== "All")}
                value={DEPT_OPTIONS.find(o => o.value === formData.dept_id)}
                onChange={(o) => handleInputChange("dept_id", o.value)}
                placeholder="Select Department"
              />
            )}
          </div>

          {/* Role */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Role
            </label>
            <Select
              styles={selectStyles}
              {...modalSelectProps}
              options={FORM_ROLE_OPTIONS.filter(r => r.value !== "All")}
              value={FORM_ROLE_OPTIONS.find(o => o.value === formData.role)}
              onChange={(o) => handleInputChange("role", o.value)}
              placeholder="Select Role"
            />
          </div>

        </div>
      </Modal>
    </div>
  );
}