import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import {
    FaPlus, FaEdit, FaTrash, FaLayerGroup, FaBook,
    FaCalendarAlt, FaSearch, FaFilter, FaTimes, FaUniversity
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

// --- Constants & Styles ---
const EMPTY_FORM = {
    subject_code: "",
    subject_name: "",
    regulation: "",
    dept_id: "",
    class_id: "",
    staff_id: "",
    periods_per_week: 5
};

const REGULATION_OPTIONS = [
    { value: "R2017", label: "R2017" },
    { value: "R2021", label: "R2021" },
    { value: "R2025", label: "R2025" }
];

const STYLES = {
    input: "w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400",
    label: "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5",
    badge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    actionBtn: "p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    th: "px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200"
};

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        padding: '2px',
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
        '&:hover': { borderColor: '#a5b4fc' }
    }),
    menu: (base) => ({ ...base, zIndex: 50, borderRadius: '0.5rem', overflow: 'hidden' }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#eef2ff' : 'white',
        color: state.isSelected ? 'white' : '#374151',
        cursor: 'pointer',
        fontSize: '0.875rem'
    })
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
    const [filterDept, setFilterDept] = useState(null);
    const [filterClass, setFilterClass] = useState(null);

    // --- Defaults based on Role ---
    useEffect(() => {
        if (user.role !== "Principal") {
            setForm(f => ({
                ...f,
                dept_id: user.dept_id || "",
                class_id: user.role === "CA" ? user.assigned_class_id : ""
            }));
        }
    }, [user]);

    // --- API Actions ---
    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
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

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleSubmit = async () => {
        // Validation
        const required = ['subject_code', 'subject_name', 'regulation', 'dept_id', 'class_id', 'periods_per_week'];
        const missing = required.filter(k => !form[k]);

        if (missing.length > 0) {
            Swal.fire("Incomplete Form", "Please fill in all mandatory fields.", "warning");
            return;
        }

        const url = editingId ? `${BASE_URL}/subjects/${editingId}` : `${BASE_URL}/subjects`;
        const method = editingId ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) throw new Error("API Error");

            Swal.fire({
                icon: "success",
                title: editingId ? "Updated!" : "Created!",
                text: `Subject has been ${editingId ? "updated" : "added"} successfully.`,
                timer: 2000,
                showConfirmButton: false
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
            text: "This subject will be deactivated.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Deactivate"
        });

        if (!result.isConfirmed) return;

        try {
            await fetch(`${BASE_URL}/subjects/${id}/delete`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSubjects();
            Swal.fire("Deactivated", "Subject has been removed.", "success");
        } catch {
            Swal.fire("Error", "Could not delete subject.", "error");
        }
    };

    // --- Helpers ---
    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        // Re-apply defaults if not Principal
        if (user.role !== "Principal") {
            setForm(f => ({
                ...f,
                dept_id: user.dept_id || "",
                class_id: user.role === "CA" ? user.assigned_class_id : ""
            }));
        }
    };

    const handleEditClick = (s) => {
        setEditingId(s.subject_id);
        setForm({
            subject_code: s.subject_code || "",
            subject_name: s.subject_name || "",
            regulation: s.regulation || "",
            dept_id: s.dept_id || "",
            class_id: s.class_id || "",
            staff_id: s.staff_id || "",
            periods_per_week: s.periods_per_week || 5
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Permission Check: Principal or Same Dept
    const canModify = (subjectDeptId) => {
        if (user.role === "Principal") return true;
        // Strict string comparison to avoid type issues
        return String(user.dept_id) === String(subjectDeptId);
    };

    // --- Filtering Logic (Robust) ---
    const filteredData = useMemo(() => {
        return subjects.filter(item => {
            // 1. Text Search
            const searchQ = searchText.toLowerCase().trim();
            const deptName = DEPT_MAP[item.dept_id] || "";
            const className = CLASS_MAP[item.class_id] || "";

            const matchesSearch = !searchQ ||
                String(item.subject_code).toLowerCase().includes(searchQ) ||
                String(item.subject_name).toLowerCase().includes(searchQ) ||
                String(item.regulation).toLowerCase().includes(searchQ) ||
                deptName.toLowerCase().includes(searchQ) ||
                className.toLowerCase().includes(searchQ);

            // 2. Dropdown Filters (String conversion ensures safety against number/string mismatches)
            const matchesDept = !filterDept || String(item.dept_id) === String(filterDept.value);
            const matchesClass = !filterClass || String(item.class_id) === String(filterClass.value);

            return matchesSearch && matchesDept && matchesClass;
        });
    }, [subjects, searchText, filterDept, filterClass]);

    // Options for Selects
    const deptOptions = useMemo(() => Object.entries(DEPT_MAP).map(([k, v]) => ({ value: k, label: v })), []);
    const classOptions = useMemo(() => Object.entries(CLASS_MAP).map(([k, v]) => ({ value: k, label: v })), []);

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            <FaBook className="text-indigo-600" />
                            Manage Subjects
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Define curriculum, allocate departments, and manage regulations.
                        </p>
                    </div>

                    {!showForm && (
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all font-medium text-sm"
                        >
                            <FaPlus className="text-xs" /> Add Subject
                        </button>
                    )}
                </div>

                {/* Form Container */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ring-1 ring-black ring-opacity-5">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingId ? "Edit Subject" : "Create New Subject"}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Row 1 */}
                            <div>
                                <label className={STYLES.label}>Subject Code <span className="text-red-500">*</span></label>
                                <input
                                    value={form.subject_code}
                                    onChange={e => setForm({ ...form, subject_code: e.target.value })}
                                    placeholder="e.g. CS3401"
                                    className={STYLES.input}
                                    autoFocus
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <label className={STYLES.label}>Subject Name <span className="text-red-500">*</span></label>
                                <input
                                    value={form.subject_name}
                                    onChange={e => setForm({ ...form, subject_name: e.target.value })}
                                    placeholder="e.g. Algorithms"
                                    className={STYLES.input}
                                />
                            </div>

                            {/* Row 2 */}
                            <div>
                                <label className={STYLES.label}>Department <span className="text-red-500">*</span></label>
                                <Select
                                    isDisabled={user.role !== "Principal"}
                                    options={deptOptions}
                                    value={deptOptions.find(o => String(o.value) === String(form.dept_id)) || null}
                                    onChange={o => setForm({ ...form, dept_id: o?.value || "" })}
                                    styles={customSelectStyles}
                                    placeholder="Select Dept..."
                                />
                            </div>

                            <div>
                                <label className={STYLES.label}>Year / Class <span className="text-red-500">*</span></label>
                                <Select
                                    isDisabled={user.role === "CA"}
                                    options={classOptions}
                                    value={classOptions.find(o => String(o.value) === String(form.class_id)) || null}
                                    onChange={o => setForm({ ...form, class_id: o?.value || "" })}
                                    styles={customSelectStyles}
                                    placeholder="Select Year..."
                                />
                            </div>

                            <div>
                                <label className={STYLES.label}>
                                    Regulation <span className="text-red-500">*</span>
                                </label>

                                <Select
                                    options={REGULATION_OPTIONS}
                                    isClearable={false}
                                    placeholder="Select regulation"
                                    value={
                                        form.regulation
                                            ? REGULATION_OPTIONS.find(r => r.value === form.regulation)
                                            : null
                                    }
                                    onChange={(opt) =>
                                        setForm({ ...form, regulation: opt?.value || "" })
                                    }
                                    classNamePrefix="react-select"
                                />
                            </div>


                            {/* Row 3 */}
                            <div>
                                <label className={STYLES.label}>Periods / Week <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.periods_per_week}
                                    onChange={e => setForm({ ...form, periods_per_week: e.target.value })}
                                    className={STYLES.input}
                                />
                            </div>

                            {/* Footer */}
                            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md transition-all"
                                >
                                    {editingId ? "Save Changes" : "Create Subject"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Toolbar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search code, name, reg..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
                        <div className="w-full md:w-48">
                            <Select
                                isClearable
                                placeholder="All Departments"
                                options={deptOptions}
                                value={filterDept}
                                onChange={setFilterDept}
                                styles={customSelectStyles}
                                className="text-sm"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                isClearable
                                placeholder="All Years"
                                options={classOptions}
                                value={filterClass}
                                onChange={setFilterClass}
                                styles={customSelectStyles}
                                className="text-sm"
                            />
                        </div>

                        {(searchText || filterDept || filterClass) && (
                            <button
                                onClick={() => { setSearchText(""); setFilterDept(null); setFilterClass(null); }}
                                className="px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                                <FaTimes /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className={STYLES.th}>Code</th>
                                    <th className={`${STYLES.th} w-1/3`}>Subject Name</th>
                                    <th className={STYLES.th}>Details</th>
                                    <th className={STYLES.th}>Regulation</th>
                                    <th className={`${STYLES.th} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    // Skeleton Loading
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-10 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredData.length > 0 ? (
                                    filteredData.map(s => {
                                        const hasPermission = canModify(s.dept_id);
                                        return (
                                            <tr key={s.subject_id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                                                        {s.subject_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{s.subject_name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">Periods: {s.periods_per_week} / week</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`${STYLES.badge} bg-blue-100 text-blue-800`}>
                                                            <FaUniversity className="mr-1" /> {DEPT_MAP[s.dept_id] || "N/A"}
                                                        </span>
                                                        <span className={`${STYLES.badge} bg-gray-100 text-gray-600`}>
                                                            <FaLayerGroup className="mr-1" /> {CLASS_MAP[s.class_id] || "N/A"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <FaCalendarAlt className="text-gray-400" /> {s.regulation}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {hasPermission ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditClick(s)}
                                                                    className={`${STYLES.actionBtn} text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800`}
                                                                    title="Edit Subject"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(s.subject_id)}
                                                                    className={`${STYLES.actionBtn} text-red-500 hover:bg-red-50 hover:text-red-700`}
                                                                    title="Delete Subject"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200 select-none">
                                                                Read Only
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    // Empty State
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="p-3 bg-gray-100 rounded-full">
                                                    <FaFilter className="text-2xl text-gray-400" />
                                                </div>
                                                <p className="font-medium">No subjects found</p>
                                                <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Stats */}
                    {!loading && filteredData.length > 0 && (
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                            <span>Showing {filteredData.length} subjects</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageSubjects;