import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaLayerGroup,
  FaBook,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaTimes,
  FaUniversity,
  FaSave,
  FaBan,
  FaExclamationCircle
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";

// --- Constants ---
const EMPTY_FORM = {
  subject_code: "",
  subject_name: "",
  regulation: "",
};

const REGULATION_OPTIONS = [
  { value: "R2017", label: "R2017" },
  { value: "R2021", label: "R2021" },
  { value: "R2025", label: "R2025" },
];

// Professional Select Styles (Enterprise Grade)
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem", // rounded-xl
    padding: "2px 4px",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    backgroundColor: "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.1)" : "none",
    "&:hover": { borderColor: "#d1d5db" },
    fontSize: "0.875rem",
    minHeight: "46px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    zIndex: 50,
    marginTop: "4px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#1f2937",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: "10px 12px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#111827",
    fontWeight: "500",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
};

function ManageSubjects({ user }) {
  const token = localStorage.getItem("token");

  // --- State ---
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filter State
  const [searchText, setSearchText] = useState("");



  // --- API Actions ---
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      Swal.fire("Error", "Could not load subjects.", "error");
    } finally {
      setLoading(false);
    }
  };

  const canModify = () => {
    return (
      user.role === "Principal" ||
      user.role === "DeptAdmin" ||
      user.role === "HOD"
    );
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async () => {
    // Validation
    const required = [
      "subject_code",
      "subject_name",
      "regulation"
    ];
    const missing = required.filter((k) => !form[k]);

    if (missing.length > 0) {
      Swal.fire(
        "Incomplete Form",
        "Please fill in all mandatory fields.",
        "warning"
      );
      return;
    }

    const url = editingId
      ? `${BASE_URL}/subjects/${editingId}`
      : `${BASE_URL}/subjects`;
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      console.log("Form Data Sent:", JSON.stringify(form));
      if (!res.ok) throw new Error("API Error");

      Swal.fire({
        icon: "success",
        title: editingId ? "Updated!" : "Created!",
        text: `Subject has been ${editingId ? "updated" : "added"
          } successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      resetForm();
      fetchSubjects();
    } catch {
      Swal.fire("Error", "Operation failed. Please try again.", "error");
    }
  };

const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This subject will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Delete",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${BASE_URL}/subjects/${id}/delete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Delete failed");
    }

    fetchSubjects();

    Swal.fire("Deleted", data.message || "Subject removed.", "success");

  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
};

  // --- Helpers ---
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);

  };

  const handleEditClick = (s) => {
    setEditingId(s.subject_id);
    setForm({
      subject_code: s.subject_code || "",
      subject_name: s.subject_name || "",
      regulation: s.regulation || "",
    });
    setShowForm(true);
  };



  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    return subjects.filter((item) => {
      const searchQ = searchText.toLowerCase().trim();

      return (
        !searchQ ||
        String(item.subject_code).toLowerCase().includes(searchQ) ||
        String(item.subject_name).toLowerCase().includes(searchQ) ||
        String(item.regulation).toLowerCase().includes(searchQ)
      );
    });
  }, [subjects, searchText]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <FaBook className="text-xl" />
              </span>
              Manage Subjects
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Define curriculum, allocate departments, and manage regulations.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="group flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <FaPlus className="text-sm group-hover:rotate-90 transition-transform" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between z-10 relative">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search code, name, reg..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400 text-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-center">


            {(searchText) && (
              <button
                onClick={() => {
                  setSearchText("");
                }}
                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  {["Code", "Subject Name", "Regulation", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {loading ? (
                  // Loading Skeleton
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-50 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                          <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 w-16 bg-gray-100 rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((s) => {
                    return (
                      <tr
                        key={s.subject_id}
                        className="hover:bg-gray-50/80 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-indigo-50 text-indigo-700 font-mono border border-indigo-100">
                            {s.subject_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm font-semibold text-gray-900">
                            {s.subject_name}
                          </div>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-lg w-fit">
                            <FaCalendarAlt className="text-gray-400" />
                            {s.regulation}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                          {canModify() && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(s)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>

                              <button
                                onClick={() => handleDelete(s.subject_id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Empty State
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <FaSearch className="text-2xl text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          No subjects found
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                          We couldn't find any subjects matching your search.
                          Try adjusting filters or add a new subject.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {!loading && filteredData.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Total Records:{" "}
                <span className="text-gray-900">{filteredData.length}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- Modal Overlay --- */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={resetForm}
          ></div>

          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Subject" : "Create New Subject"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the details below to {editingId ? "update" : "add"} a subject.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Code */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.subject_code}
                    onChange={(e) =>
                      setForm({ ...form, subject_code: e.target.value })
                    }
                    placeholder="e.g. CS3401"
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                    autoFocus
                  />
                </div>

                {/* Regulation */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Regulation <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={REGULATION_OPTIONS}
                    isClearable={false}
                    placeholder="Select Regulation"
                    value={
                      form.regulation
                        ? REGULATION_OPTIONS.find(
                          (r) => r.value === form.regulation
                        )
                        : null
                    }
                    onChange={(opt) =>
                      setForm({ ...form, regulation: opt?.value || "" })
                    }
                    styles={selectStyles}
                  />
                </div>

                {/* Subject Name - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.subject_name}
                    onChange={(e) =>
                      setForm({ ...form, subject_name: e.target.value })
                    }
                    placeholder="e.g. Analysis of Algorithms"
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                  />
                </div>


              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <FaSave />
                {editingId ? "Save Changes" : "Create Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSubjects;