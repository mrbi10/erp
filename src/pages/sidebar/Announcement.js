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
    FaUserGraduate
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";

// ---------------------------
// Constants & Utils
// ---------------------------
const DEPT_MAP = {
    1: "CSE",
    2: "IT",
    3: "ADS",
    4: "CSBS",
    5: "ECE",
    6: "EEE",
    7: "MECH",
    8: "CIVIL",
};

const ROMAN_MAP = { 1: "I", 2: "II", 3: "III", 4: "IV" };
const TARGET_OPTIONS = [
    { value: "all", label: "Everyone (College-wide)", icon: FaUsers },
    { value: "department", label: "Only Department", icon: FaBuilding },
    { value: "class", label: "Only Class", icon: FaUserGraduate },
];

const getTargetBadge = (type, id, classes) => {
    switch (type) {
        case 'all': return { text: "College-Wide", color: "bg-indigo-100 text-indigo-700" };
        case 'department':
            const deptName = DEPT_MAP[id] || `Dept ID ${id}`;
            return { text: `Department: ${deptName}`, color: "bg-blue-100 text-blue-700" };
        case 'class':
            const cls = classes.find(c => c.class_id === id);
            const className = cls ? `${DEPT_MAP[cls.dept_id]} ${ROMAN_MAP[cls.year]} Year` : `Class ID ${id}`;
            return { text: `Class: ${className}`, color: "bg-green-100 text-green-700" };
        default: return { text: "Undefined Target", color: "bg-gray-100 text-gray-700" };
    }
};

// --- Modal Component (Re-used from previous clean code) ---
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
                <div
                    className="
        fixed inset-0 
        flex items-start md:items-center justify-center 
        pt-24 md:pt-0 
        z-50 pointer-events-none p-4
    "
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto border border-gray-100"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FaTimes className="text-lg" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                        {footer && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
// Main AnnouncementsPage Component
// ---------------------------
export default function AnnouncementsPage({ user }) {
    const [announcements, setAnnouncements] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const token = localStorage.getItem("token");

    // --- Data Fetching ---
    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const [announcementRes, classRes] = await Promise.all([
                fetch(`${BASE_URL}/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const announcementData = await announcementRes.json();
            const classData = await classRes.json();

            setAnnouncements(announcementData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setClasses(Array.isArray(classData) ? classData : []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    // --- Permissions Logic ---
    const canPost = useMemo(() => ["CA", "HOD", "Principal", "staff"].includes(user?.role), [user]);

    const canEdit = (a) => {
        if (!user) return false;

        if (user.role === "Principal") return true;

        if (user.role === "HOD") return true;

        if (user.role === "CA") return true;

        return a.created_by === user.id;
    };

    const canDelete = canEdit;





    // --- Handlers ---
    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "This announcement will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#e5e7eb",
            confirmButtonText: "Yes, delete it!",
            customClass: { container: 'z-9999' }
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`${BASE_URL}/announcements/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                Swal.fire({ title: "Deleted!", text: "The announcement has been deleted.", icon: "success", timer: 1500, showConfirmButton: false });
                loadAnnouncements();
            } else {
                throw new Error("Failed to delete.");
            }
        } catch (error) {
            Swal.fire("Error", "Could not delete announcement.", "error");
        }
    };

    const handleOpenEdit = (a) => {
        setEditing(a);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditing(null);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* --- HEADER & CTA --- */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-100 rounded-xl text-blue-600"><FaBullhorn className="text-xl" /></span>
                        College Announcements
                    </h1>

                    {canPost && (
                        <button
                            onClick={() => { setEditing(null); setShowForm(true); }}
                            className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-sm"
                        >
                            <FaPlus className="text-xs group-hover:rotate-90 transition-transform" />
                            <span>Post New</span>
                        </button>
                    )}
                </div>

                {/* --- ANNOUNCEMENT LIST --- */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="p-10 text-center">
                            <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto" />
                            <p className="mt-3 text-gray-500">Fetching announcements...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="p-10 text-center bg-white rounded-2xl shadow-md border border-gray-100">
                            <p className="text-lg text-gray-500 font-medium">No announcements have been posted yet.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {announcements.map((a, idx) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="border rounded-xl p-5 shadow-sm bg-white hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="font-extrabold text-xl text-gray-800 leading-snug">{a.title}</h2>
                                            <p className="text-gray-700 mt-2 whitespace-pre-wrap">{a.message}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {canEdit(a) && (
                                                <button
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                                                    onClick={() => handleOpenEdit(a)}
                                                    title="Edit Announcement"
                                                >
                                                    <FaEdit className="text-sm" />
                                                </button>
                                            )}

                                            {canDelete(a) && (
                                                <button
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                                    onClick={() => handleDelete(a.id)}
                                                    title="Delete Announcement"
                                                >
                                                    <FaTrash className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-50/50 flex flex-wrap gap-3 items-center">
                                        {/* Target Badge */}
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTargetBadge(a.target_type, a.target_id, classes).color}`}>
                                            {getTargetBadge(a.target_type, a.target_id, classes).text}
                                        </span>

                                        {/* Metadata */}
                                        <p className="text-xs text-gray-500">
                                            Posted by{" "}
                                            <span className="font-semibold text-gray-700">{a.created_by_name}</span>{" "}
                                            on{" "}
                                            {new Date(a.created_at).toLocaleDateString()}{" "}
                                            at{" "}
                                            {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* FORM MODAL */}
            <AnnouncementForm
                isOpen={showForm}
                user={user}
                classes={classes}
                editData={editing}
                onClose={handleCloseForm}
                onSaved={loadAnnouncements}
            />
        </div>
    );
}


/* --------------------------
    ANNOUNCEMENT FORM COMPONENT (MODAL CONTENT)
--------------------------- */

function AnnouncementForm({ isOpen, user, classes, editData, onClose, onSaved }) {
    const [title, setTitle] = useState(editData?.title || "");
    const [message, setMessage] = useState(editData?.message || "");
    const [targetType, setTargetType] = useState(editData?.target_type || "all");
    const [targetId, setTargetId] = useState(editData?.target_id || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const token = localStorage.getItem("token");

    // Reset form data when opening for a new/edit action
    useEffect(() => {
        if (isOpen) {
            setTitle(editData?.title || "");
            setMessage(editData?.message || "");

            let initialTargetType = editData?.target_type || "all";
            let initialTargetId = editData?.target_id || "";

            // Auto-set target for CA
            if (user.role === "CA" && !editData) {
                initialTargetType = "class";
                initialTargetId = user.assigned_class_id;
            }
            // Auto-set target for HOD
            else if (user.role === "HOD" && !editData) {
                initialTargetType = "department";
                initialTargetId = user.dept_id;
            }

            setTargetType(initialTargetType);
            setTargetId(initialTargetId);
        }
    }, [isOpen, editData, user]);

    // Filter available classes based on user role/current department
    const targetClassOptions = useMemo(() => {
        let filteredClasses = classes;
        // HOD can only see their department's classes
        if (user.role === "HOD" || (user.role === "CA" && targetType === "department")) {
            filteredClasses = classes.filter(c => c.dept_id === user.dept_id);
        }

        return filteredClasses.map(c => ({
            value: c.class_id,
            label: `${DEPT_MAP[c.dept_id]} ${ROMAN_MAP[c.year]} Year`
        })).sort((a, b) => a.label.localeCompare(b.label));
    }, [classes, user, targetType]);

    // Handle Select Change
    const handleTargetChange = (option) => {
        setTargetType(option.value);
        setTargetId(""); // Reset ID when type changes
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const finalTargetId =
            (targetType === "department" || targetType === "class")
                ? targetId
                : null;

        if (!finalTargetId && (targetType === "department" || targetType === "class")) {
            Swal.fire("Validation Error", "Please select a valid target.", "warning");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            title,
            message,
            target_type: targetType,

            target_id: finalTargetId ? Number(finalTargetId) : null
        };

        const method = editData ? "PATCH" : "POST";
        const url = editData
            ? `${BASE_URL}/announcements/${editData.id}`
            : `${BASE_URL}/announcements`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                Swal.fire({
                    title: editData ? "Updated!" : "Posted!",
                    text: "Announcement saved successfully.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                onSaved();
                onClose();
            } else {
                throw new Error("API failed");
            }
        } catch (error) {
            Swal.fire("Error", `Failed to ${editData ? "update" : "post"} announcement.`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Select Custom Styles ---
    const selectStyles = {
        control: (base) => ({
            ...base,
            borderRadius: "10px",
            padding: "2px 4px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            boxShadow: "none",
            "&:hover": { borderColor: "#d1d5db" },
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
            color: state.isSelected ? "white" : "#1f2937",
            cursor: "pointer",
        }),
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? "Edit Announcement" : "Create New Announcement"}
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        form="announcement-form"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSubmitting && <FaSpinner className="animate-spin text-sm" />}
                        {editData ? "Save Changes" : "Post Announcement"}
                    </button>
                </>
            }
        >
            <div
                className="
            max-h-[90vh] overflow-y-auto 
            flex flex-col gap-5 
            items-start md:items-center 
            mt-10 md:mt-0
        "
            >
                <form id="announcement-form" onSubmit={handleSubmit} className="space-y-5 w-full">

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Title
                        </label>

                        <input
                            type="text"
                            className="
                        w-full p-3 bg-gray-50 rounded-xl 
                        border-none shadow-sm
                        focus:ring-2 focus:ring-blue-200 
                        transition-all font-medium text-gray-800
                    "
                            placeholder="Enter announcement title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Message
                        </label>

                        <textarea
                            className="
                        w-full p-3 bg-gray-50 rounded-xl shadow-sm 
                        border-none focus:ring-2 focus:ring-blue-200 
                        transition-all resize-none
                    "
                            placeholder="Write the detailed announcement message"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Target Type Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Target Audience
                        </label>

                        <Select
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={{
                                ...selectStyles,
                                menuPortal: base => ({ ...base, zIndex: 999999 })
                            }}
                            options={TARGET_OPTIONS.filter(o => {
                                if (user.role === "CA") return o.value === "class";
                                if (user.role === "HOD") return o.value !== "class";
                                return true;
                            })}
                            value={TARGET_OPTIONS.find(o => o.value === targetType)}
                            onChange={handleTargetChange}
                            isDisabled={user.role === "CA" || isSubmitting}
                        />
                    </div>

                    {/* Target ID Block */}
                    {(targetType === "department" || targetType === "class") && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                {targetType === "department" ? "Select Department" : "Select Class"}
                            </label>

                            {/* Principal – Select Dept */}
                            {targetType === "department" && user.role === "Principal" && (
                                <Select
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        ...selectStyles,
                                        menuPortal: base => ({ ...base, zIndex: 999999 })
                                    }}

                                    options={Object.entries(DEPT_MAP).map(([k, v]) => ({ value: Number(k), label: v }))}
                                    value={Object.entries(DEPT_MAP).map(([k, v]) => ({ value: Number(k), label: v }))
                                        .find(o => o.value === targetId) || null}
                                    onChange={(o) => setTargetId(o?.value || "")}
                                    placeholder="Choose Department"
                                    isDisabled={isSubmitting}
                                />
                            )}

                            {/* HOD / CA – Department Display */}
                            {targetType === "department" && user.role !== "Principal" && (
                                <input
                                    disabled
                                    value={DEPT_MAP[user.dept_id]}
                                    className="w-full p-3 bg-gray-100 text-gray-500 rounded-xl border-none shadow-inner"
                                />
                            )}

                            {/* Principal / HOD – Select Class */}
                            {targetType === "class" && (user.role === "Principal" || user.role === "HOD") && (
                                <Select
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        ...selectStyles,
                                        menuPortal: base => ({ ...base, zIndex: 999999 })
                                    }}
                                    options={targetClassOptions}
                                    value={targetClassOptions.find(o => o.value === targetId) || null}
                                    onChange={(o) => setTargetId(o?.value || "")}
                                    placeholder="Choose Class"
                                    isDisabled={isSubmitting}
                                />
                            )}

                            {/* CA – Class fixed */}
                            {targetType === "class" && user.role === "CA" && (
                                <input
                                    disabled
                                    value={targetClassOptions.find(o => o.value === user.assigned_class_id)?.label || "Assigned Class"}
                                    className="w-full p-3 bg-gray-100 text-gray-500 rounded-xl border-none shadow-inner"
                                />
                            )}
                        </div>
                    )}
                </form>
            </div>
        </Modal>

    );
}