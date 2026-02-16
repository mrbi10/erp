import React, { useState, useEffect, useMemo } from "react";
import {
    FaBullhorn,
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
    FaSpinner,
    FaBuilding,
    FaUsers,
    FaUserGraduate,
    FaSearch,
    FaClock,
    FaCheckCircle
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

// ---------------------------
// Constants & Utils
// ---------------------------



const TARGET_OPTIONS = [
    { value: "all", label: "All Students & Staff", icon: FaUsers, color: "indigo" },
    { value: "department", label: "Specific Department", icon: FaBuilding, color: "blue" },
    { value: "class", label: "Specific Class", icon: FaUserGraduate, color: "emerald" },
];

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
    }).format(date);
};

// ---------------------------
// Main Component
// ---------------------------
export default function AnnouncementsPage({ user }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const token = localStorage.getItem("token");

    // --- Data Fetching ---
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            setAnnouncements(
                Array.isArray(data)
                    ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    : []
            );
        } catch (error) {
            console.error("Error loading data:", error);
            Swal.fire("Connection Error", "Failed to load announcements.", "error");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);

    // --- Computed Data ---
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(a =>
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [announcements, searchTerm]);

    const canPost = ["CA", "HOD", "Principal", "staff"].includes(user?.role);

    const checkPermission = (item) => {
        if (!user) return false;
        if (["Principal", "HOD", "CA"].includes(user.role)) return true;
        return item.created_by === user.id;
    };

    // --- Handlers ---
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Announcement?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Delete",
            cancelButtonColor: "#e5e7eb"
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${BASE_URL}/announcements/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    Swal.fire("Deleted", "Announcement removed successfully.", "success");
                    loadData();
                } else throw new Error();
            } catch {
                Swal.fire("Error", "Failed to delete.", "error");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* --- HEADER --- */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <span className="bg-indigo-600 text-white p-2 rounded-lg text-lg"><FaBullhorn /></span>
                            Announcements
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Stay updated with the latest college news.</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search updates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                            />
                        </div>
                        {canPost && (
                            <button
                                onClick={() => { setEditingAnnouncement(null); setShowForm(true); }}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 text-sm shadow-md shadow-indigo-200"
                            >
                                <FaPlus /> <span className="hidden sm:inline">Post</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* --- FEED --- */}
                <div className="space-y-4 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <FaSpinner className="animate-spin text-3xl text-indigo-500" />
                            <p className="mt-3 text-slate-500 font-medium">Loading updates...</p>
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <FaBullhorn className="text-3xl text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600">No Announcements Found</h3>
                            <p className="text-slate-400 text-sm">
                                {searchTerm ? "Try adjusting your search terms." : "Check back later for new updates."}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredAnnouncements.map((item, idx) => (
                                <AnnouncementCard
                                    key={item.id}
                                    data={item}
                                    idx={idx}
                                    canEdit={checkPermission(item)}
                                    onEdit={() => { setEditingAnnouncement(item); setShowForm(true); }}
                                    onDelete={() => handleDelete(item.id)}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* --- MODAL --- */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingAnnouncement ? "Edit Announcement" : "New Announcement"}>
                <AnnouncementForm
                    user={user}
                    editData={editingAnnouncement}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => { setShowForm(false); loadData(); }}
                />
            </Modal>
        </div>
    );
}

// ---------------------------
// Sub-Components
// ---------------------------

const AnnouncementCard = ({ data, idx, canEdit, onEdit, onDelete }) => {
    // Resolve Target Label
    const getTargetInfo = () => {
        if (data.target_type === 'all') {
            return {
                label: "College Wide",
                icon: <FaUsers />,
                bg: "bg-indigo-50 text-indigo-700 border-indigo-100"
            };
        }

        if (data.target_type === 'department') {
            return {
                label: `${DEPT_MAP[data.dept_id] || 'Dept'} Only`,
                icon: <FaBuilding />,
                bg: "bg-blue-50 text-blue-700 border-blue-100"
            };
        }

        if (data.target_type === 'class') {
            return {
                label: `${DEPT_MAP[data.dept_id]} - ${CLASS_MAP[data.class_id]}`,
                icon: <FaUserGraduate />,
                bg: "bg-emerald-50 text-emerald-700 border-emerald-100"
            };
        }

        return {
            label: "General",
            icon: <FaUsers />,
            bg: "bg-gray-100"
        };
    };


    const target = getTargetInfo();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${target.bg}`}>
                    {target.icon} {target.label}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <FaClock /> {formatDate(data.created_at)}
                </div>
            </div>

            <div className="pr-10"> {/* Padding for absolute buttons */}
                <h3 className="text-xl font-bold text-slate-800 mb-2">{data.title}</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{data.message}</p>
            </div>

            {/* Hover Actions */}
            {canEdit && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                        <FaEdit />
                    </button>
                    <button onClick={onDelete} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                        <FaTrash />
                    </button>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                {/* <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {data.created_by_name ? data.created_by_name[0] : 'A'}
                </div> */}
                <span>Posted by <span className="font-semibold text-slate-600">{data.created_by_name}</span></span>
            </div>
        </motion.div>
    );
};

const AnnouncementForm = ({ user, editData, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: editData?.title || "",
        message: editData?.message || "",
        targetType: editData?.target_type || "all",
        deptId: editData?.dept_id || "",
        classId: editData?.class_id || ""
    });
    const [submitting, setSubmitting] = useState(false);
    const token = localStorage.getItem("token");

    // Auto-fill defaults for specific roles
    useEffect(() => {
        if (!editData) {
            if (user.role === "CA") {
                setFormData(p => ({
                    ...p,
                    targetType: "class",
                    deptId: user.dept_id,
                    classId: user.assigned_class_id
                }));
            }

            if (user.role === "HOD") {
                setFormData(p => ({
                    ...p,
                    targetType: "department",
                    deptId: user.dept_id,
                    classId: ""
                }));
            }
        }
    }, [user, editData]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (formData.targetType === "department" && !formData.deptId) {
            Swal.fire("Validation Error", "Please select a department", "warning");
            setSubmitting(false);
            return;
        }

        if (formData.targetType === "class") {
            if (!formData.deptId) {
                Swal.fire("Validation Error", "Please select a department first", "warning");
                setSubmitting(false);
                return;
            }

            if (!formData.classId) {
                Swal.fire("Validation Error", "Please select a class", "warning");
                setSubmitting(false);
                return;
            }
        }


        const payload = {
            title: formData.title,
            message: formData.message,
            target_type: formData.targetType,
            dept_id:
                formData.targetType === "department" ||
                    formData.targetType === "class"
                    ? Number(formData.deptId)
                    : null,
            class_id:
                formData.targetType === "class"
                    ? Number(formData.classId)
                    : null
        };

        try {
            const url = editData ? `${BASE_URL}/announcements/${editData.id}` : `${BASE_URL}/announcements`;
            const method = editData ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed");

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Announcement has been published',
                timer: 1500,
                showConfirmButton: false
            });
            onSuccess();
        } catch {
            Swal.fire("Error", "Operation failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Logic for Select
    const targetOptions = TARGET_OPTIONS.filter(opt => {
        if (user.role === "CA") return opt.value === "class";
        if (user.role === "HOD") return opt.value !== "class"; // HOD usually posts to Dept or All
        return true;
    });

    const classOptions = Object.entries(CLASS_MAP).map(([key, value]) => ({
        value: Number(key),
        label: value
    }));


    // Select Styles
    const customStyles = {
        control: (base) => ({
            ...base, borderRadius: '0.75rem', padding: '2px', borderColor: '#e2e8f0', boxShadow: 'none',
            '&:hover': { borderColor: '#cbd5e1' }
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }) // Fix z-index issue
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Mid-Semester Exam Schedule"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Type your announcement details here..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Audience</label>
                    <Select
                        options={targetOptions}
                        value={TARGET_OPTIONS.find(o => o.value === formData.targetType)}
                        onChange={val =>
                            setFormData({
                                ...formData,
                                targetType: val.value,
                                deptId: "",
                                classId: ""
                            })
                        }
                        isDisabled={user.role === "CA"}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                    />
                </div>

                {/* Dynamic Second Dropdown */}
                {/* Department Selector (for both department & class types) */}
                {(formData.targetType === "department" || formData.targetType === "class") && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Select Department
                        </label>

                        {user.role === "Principal" || user.role === "staff" ? (
                            <Select
                                options={Object.entries(DEPT_MAP).map(([k, v]) => ({
                                    value: Number(k),
                                    label: v
                                }))}
                                value={
                                    formData.deptId
                                        ? { value: formData.deptId, label: DEPT_MAP[formData.deptId] }
                                        : null
                                }
                                onChange={val =>
                                    setFormData({
                                        ...formData,
                                        deptId: val.value,
                                        classId: ""
                                    })
                                }
                                styles={customStyles}
                                menuPortalTarget={document.body}
                            />
                        ) : (
                            <input
                                disabled
                                value={DEPT_MAP[user.dept_id]}
                                className="w-full px-4 py-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200"
                            />
                        )}
                    </div>
                )}

                {/* Class Selector (only if targetType === class) */}
                {formData.targetType === "class" && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Select Class
                        </label>

                        {user.role === "CA" ? (
                            <input
                                disabled
                                value="My Assigned Class"
                                className="w-full px-4 py-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200"
                            />
                        ) : (
                            <Select
                                options={classOptions}
                                value={classOptions.find(o => o.value === formData.classId)}
                                onChange={val =>
                                    setFormData({
                                        ...formData,
                                        classId: val.value
                                    })
                                }
                                isDisabled={!formData.deptId}
                                styles={customStyles}
                                menuPortalTarget={document.body}
                            />
                        )}
                    </div>
                )}

            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50">Cancel</button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
                >
                    {submitting && <FaSpinner className="animate-spin" />}
                    {editData ? "Update" : "Publish"}
                </button>
            </div>
        </form>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto border border-slate-100"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
                    </motion.div>
                </div>
            </>
        )}
    </AnimatePresence>
);