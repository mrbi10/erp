import React, { useState, useEffect } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
    HiOutlineAcademicCap,
    HiOutlineCalendar,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineChevronDown,
    HiOutlineClipboardList,
    HiOutlineTag,
    HiOutlineBadgeCheck,
    HiOutlineViewGrid,
    HiOutlineDocumentText,
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptclassV2";

// ─── helpers ────────────────────────────────────────────────────────────────
const headers = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

const selectStyles = {
    control: (b) => ({
        ...b,
        borderRadius: 10,
        borderColor: "#e2e8f0",
        boxShadow: "none",
        minHeight: 42,
        fontSize: 14,
    }),
    menu: (b) => ({
        ...b,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    }),
    option: (b, s) => ({
        ...b,
        backgroundColor: s.isSelected
            ? "#6366f1"
            : s.isFocused
                ? "#eef2ff"
                : "white",
        color: s.isSelected ? "white" : "#1e293b",
    }),
};

const ACADEMIC_YEAR_OPTIONS = [
    { value: 1, label: "2022 - 2023" },
    { value: 1, label: "2023 - 2024" },
    { value: 2, label: "2024 - 2025" },
    { value: 3, label: "2025 - 2026" },
    { value: 4, label: "2026 - 2027" },
];

const inputCls =
    "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition";
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

// ─── Toggle ──────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-indigo-500" : "bg-slate-200"
                }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </div>
        <span className="text-xs text-slate-600 font-medium">{label}</span>
    </label>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </motion.div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {action}
    </div>
);

// ════════════════════════════════════════════════════════════════════════════
// EXAM TYPE FORM
// ════════════════════════════════════════════════════════════════════════════
const defaultType = {
    code: "",
    name: "",
    description: "",
    max_marks: "",
    passing_marks: "",
    weightage: "",
    is_internal: true,
    allow_mark_entry: true,
    allow_student_view: true,
    display_order: "",
};

function ExamTypeForm({ initial, onSave, onCancel, saving }) {
    const [form, setForm] = useState(initial || defaultType);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mt-4"
        >
            <p className="text-sm font-semibold text-indigo-700 mb-4">
                {initial?.exam_type_id ? "Edit Exam Type" : "New Exam Type"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className={labelCls}>Code *</label>
                    <input className={inputCls} placeholder="e.g. IAT1" value={form.code} onChange={(e) => set("code", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Name *</label>
                    <input className={inputCls} placeholder="e.g. Internal Assessment 1" value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Description</label>
                    <input className={inputCls} placeholder="Short description" value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Max Marks *</label>
                    <input type="number" className={inputCls} placeholder="100" value={form.max_marks} onChange={(e) => set("max_marks", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Passing Marks *</label>
                    <input type="number" className={inputCls} placeholder="40" value={form.passing_marks} onChange={(e) => set("passing_marks", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Weightage (%)</label>
                    <input type="number" className={inputCls} placeholder="25" value={form.weightage} onChange={(e) => set("weightage", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Display Order</label>
                    <input type="number" className={inputCls} placeholder="1" value={form.display_order} onChange={(e) => set("display_order", e.target.value)} />
                </div>
                <div className="flex flex-col gap-3 justify-end pb-1">
                    <Toggle checked={form.is_internal} onChange={(v) => set("is_internal", v)} label="Internal Exam" />
                    <Toggle checked={form.allow_mark_entry} onChange={(v) => set("allow_mark_entry", v)} label="Allow Mark Entry" />
                    <Toggle checked={form.allow_student_view} onChange={(v) => set("allow_student_view", v)} label="Student Viewable" />
                </div>
            </div>
            <div className="flex gap-2 mt-5">
                <button
                    onClick={() => onSave(form)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
                >
                    {saving ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <HiOutlineCheckCircle className="w-4 h-4" />
                    )}
                    {initial?.exam_type_id ? "Update" : "Create"}
                </button>
                <button onClick={onCancel} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                    Cancel
                </button>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// EXAM SESSION FORM
// ════════════════════════════════════════════════════════════════════════════
const defaultSession = {
    session_name: "",
    exam_type_id: null,
    academic_year_id: null,
    dept_id: null,
    class_id: null,
    start_date: "",
    end_date: "",
};

function ExamSessionForm({ initial, examTypes , onSave, onCancel, saving }) {
    const [form, setForm] = useState(
        initial
            ? {
                ...initial,
                exam_type_id: initial.exam_type_id || null,
                academic_year_id: initial.academic_year_id || null,
                dept_id: initial.dept_id || null,
                class_id: initial.class_id || null,
            }
            : defaultSession
    );
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const typeOptions = examTypes.map((t) => ({ value: t.exam_type_id, label: `${t.code} — ${t.name}` }));
    const yearOptions = ACADEMIC_YEAR_OPTIONS;
    const deptOptions = Object.entries(DEPT_MAP).map(([id, name]) => ({
        value: Number(id),
        label: name,
    }));

    const classOptions = Object.entries(CLASS_MAP).map(([id, name]) => ({
        value: Number(id),
        label: name,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 mt-4"
        >
            <p className="text-sm font-semibold text-emerald-700 mb-4">
                {initial?.session_id ? "Edit Exam Session" : "New Exam Session"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <label className={labelCls}>Session Name *</label>
                    <input
                        className={inputCls}
                        placeholder="e.g. IAT-1 Nov 2024 — CSE"
                        value={form.session_name}
                        onChange={(e) => set("session_name", e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelCls}>Exam Type *</label>
                    <Select
                        options={typeOptions}
                        value={typeOptions.find((o) => o.value === form.exam_type_id) || null}
                        onChange={(o) => set("exam_type_id", o?.value || null)}
                        styles={selectStyles}
                        placeholder="Select exam type…"
                        isClearable
                    />
                </div>
                <div>
                    <label className={labelCls}>Academic Year *</label>
                    <Select
                        options={yearOptions}
                        value={yearOptions.find((o) => o.value === form.academic_year_id) || null}
                        onChange={(o) => set("academic_year_id", o?.value || null)}
                        styles={selectStyles}
                        placeholder="Select year…"
                        isClearable
                    />
                </div>
                <div>
                    <label className={labelCls}>Department</label>
                    <Select
                        options={deptOptions}
                        value={deptOptions.find((o) => o.value === form.dept_id) || null}
                        onChange={(o) => set("dept_id", o?.value || null)}
                        styles={selectStyles}
                        placeholder="Select dept…"
                        isClearable
                    />
                </div>
                <div>
                    <label className={labelCls}>Class</label>
                    <Select
                        options={classOptions}
                        value={classOptions.find((o) => o.value === form.class_id) || null}
                        onChange={(o) => set("class_id", o?.value || null)}
                        styles={selectStyles}
                        placeholder="Select class…"
                        isClearable
                    />
                </div>
                <div>
                    <label className={labelCls}>Start Date *</label>
                    <input type="date" className={inputCls} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>End Date *</label>
                    <input type="date" className={inputCls} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                </div>
            </div>
            <div className="flex gap-2 mt-5">
                <button
                    onClick={() => onSave(form)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
                >
                    {saving ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <HiOutlineCheckCircle className="w-4 h-4" />
                    )}
                    {initial?.session_id ? "Update" : "Create"}
                </button>
                <button onClick={onCancel} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                    Cancel
                </button>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ════════════════════════════════════════════════════════════════════════════
const statusColors = {
    draft: "bg-slate-100 text-slate-500",
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-blue-100 text-blue-700",
};

const StatusBadge = ({ status }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[status] || "bg-slate-100 text-slate-500"}`}>
        {status || "draft"}
    </span>
);

// ════════════════════════════════════════════════════════════════════════════
// SESSION STATUS PATCH MODAL
// ════════════════════════════════════════════════════════════════════════════
function SessionStatusPanel({ session, onPatch, patching }) {
    const [flags, setFlags] = useState({
        status: session.status || "draft",
        timetable_published: !!session.timetable_published,
        marks_entry_open: !!session.marks_entry_open,
        results_published: !!session.results_published,
    });

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Status</label>
                    <select
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={flags.status}
                        onChange={(e) => setFlags((p) => ({ ...p, status: e.target.value }))}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Toggle
                        checked={flags.timetable_published}
                        onChange={(v) => setFlags((p) => ({ ...p, timetable_published: v }))}
                        label="Timetable Published"
                    />
                    <Toggle
                        checked={flags.marks_entry_open}
                        onChange={(v) => setFlags((p) => ({ ...p, marks_entry_open: v }))}
                        label="Marks Entry Open"
                    />
                    <Toggle
                        checked={flags.results_published}
                        onChange={(v) => setFlags((p) => ({ ...p, results_published: v }))}
                        label="Results Published"
                    />
                </div>
                <button
                    onClick={() => onPatch(session.session_id, flags)}
                    disabled={patching}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                    {patching ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                    Save Status
                </button>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function ExamCreation() {
    const token = localStorage.getItem("token");
    const h = headers(token);

    // ── Exam Types ──────────────────────────────────────────────────────────
    const [examTypes, setExamTypes] = useState([]);
    const [typesLoading, setTypesLoading] = useState(true);
    const [showTypeForm, setShowTypeForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [savingType, setSavingType] = useState(false);

    // ── Sessions ────────────────────────────────────────────────────────────
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [savingSession, setSavingSession] = useState(false);
    const [patchingSession, setPatchingSession] = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);

    // ── Lookups ─────────────────────────────────────────────────────────────


    // ── Fetch all data ───────────────────────────────────────────────────────
    const fetchTypes = () => {
        setTypesLoading(true);
        fetch(`${BASE_URL}/exam/types`, { headers: h })
            .then((r) => r.json())
            .then((d) => setExamTypes(Array.isArray(d) ? d : []))
            .finally(() => setTypesLoading(false));
    };

    const fetchSessions = () => {
        setSessionsLoading(true);
        fetch(`${BASE_URL}/exam/sessions`, { headers: h })
            .then((r) => r.json())
            .then((d) => setSessions(Array.isArray(d) ? d : []))
            .finally(() => setSessionsLoading(false));
    };

    useEffect(() => {
        fetchTypes();
        fetchSessions();
    }, []);

    // ── Exam Type CRUD ───────────────────────────────────────────────────────
    const handleSaveType = async (form) => {
        if (!form.code || !form.name || !form.max_marks || !form.passing_marks) {
            return Swal.fire("Validation", "Code, Name, Max Marks and Passing Marks are required.", "warning");
        }
        setSavingType(true);
        const isEdit = !!editingType?.exam_type_id;
        const url = isEdit ? `${BASE_URL}/exam/types/${editingType.exam_type_id}` : `${BASE_URL}/exam/types`;
        const method = isEdit ? "PUT" : "POST";
        try {
            const res = await fetch(url, { method, headers: h, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error");
            Swal.fire("Success", data.message || (isEdit ? "Updated!" : "Created!"), "success");
            setShowTypeForm(false);
            setEditingType(null);
            fetchTypes();
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        } finally {
            setSavingType(false);
        }
    };

    const handleDeleteType = (id) => {
        Swal.fire({
            title: "Delete Exam Type?",
            text: "This will soft-delete the exam type.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Delete",
        }).then(async ({ isConfirmed }) => {
            if (!isConfirmed) return;
            try {
                const res = await fetch(`${BASE_URL}/exam/types/${id}`, { method: "DELETE", headers: h });
                const data = await res.json();
                Swal.fire("Deleted", data.message, "success");
                fetchTypes();
            } catch {
                Swal.fire("Error", "Failed to delete", "error");
            }
        });
    };

    // ── Session CRUD ──────────────────────────────────────────────────────────
    const handleSaveSession = async (form) => {
        if (!form.session_name || !form.exam_type_id || !form.academic_year_id || !form.start_date || !form.end_date) {
            return Swal.fire("Validation", "Session Name, Exam Type, Academic Year, Start Date and End Date are required.", "warning");
        }
        setSavingSession(true);
        const isEdit = !!editingSession?.session_id;
        const url = isEdit ? `${BASE_URL}/exam/sessions/${editingSession.session_id}` : `${BASE_URL}/exam/sessions`;
        const method = isEdit ? "PUT" : "POST";
        try {
            const res = await fetch(url, { method, headers: h, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error");
            Swal.fire("Success", data.message || (isEdit ? "Updated!" : "Created!"), "success");
            setShowSessionForm(false);
            setEditingSession(null);
            fetchSessions();
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        } finally {
            setSavingSession(false);
        }
    };

    const handleDeleteSession = (id) => {
        Swal.fire({
            title: "Delete Session?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Delete",
        }).then(async ({ isConfirmed }) => {
            if (!isConfirmed) return;
            try {
                const res = await fetch(`${BASE_URL}/exam/sessions/${id}`, { method: "DELETE", headers: h });
                const data = await res.json();
                Swal.fire("Deleted", data.message, "success");
                fetchSessions();
            } catch {
                Swal.fire("Error", "Failed to delete", "error");
            }
        });
    };

    const handlePatchStatus = async (sessionId, flags) => {
        setPatchingSession(sessionId);
        try {
            const res = await fetch(`${BASE_URL}/exam/sessions/${sessionId}/status`, {
                method: "PATCH",
                headers: h,
                body: JSON.stringify(flags),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error");
            Swal.fire("Updated", data.message || "Status updated!", "success");
            fetchSessions();
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        } finally {
            setPatchingSession(null);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const activeTypes = examTypes.filter((t) => t.is_active !== 0).length;
    const activeSessions = sessions.filter((s) => s.status === "active").length;
    const draftSessions = sessions.filter((s) => s.status === "draft" || !s.status).length;

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "—";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Page Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Setup</h1>
                        <p className="text-slate-500 mt-1 text-sm">Create and manage exam types and examination sessions</p>
                    </div>
                </motion.div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={HiOutlineTag} label="Exam Types" value={examTypes.length} color="bg-indigo-50 text-indigo-500" />
                    <StatCard icon={HiOutlineBadgeCheck} label="Active Types" value={activeTypes} color="bg-emerald-50 text-emerald-500" />
                    <StatCard icon={HiOutlineViewGrid} label="Sessions" value={sessions.length} color="bg-amber-50 text-amber-500" />
                    <StatCard icon={HiOutlineClipboardList} label="Active Sessions" value={activeSessions} color="bg-violet-50 text-violet-500" />
                </div>

                {/* ══════════════════════ EXAM TYPES SECTION ══════════════════════ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                >
                    <SectionHeader
                        icon={HiOutlineTag}
                        title="Exam Types"
                        subtitle="Define exam categories like IAT, Model, Final, etc."
                        action={
                            <button
                                onClick={() => {
                                    setShowTypeForm((p) => !p);
                                    setEditingType(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                Add Type
                            </button>
                        }
                    />

                    <AnimatePresence>
                        {(showTypeForm && !editingType) && (
                            <ExamTypeForm
                                onSave={handleSaveType}
                                onCancel={() => setShowTypeForm(false)}
                                saving={savingType}
                            />
                        )}
                    </AnimatePresence>

                    {typesLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : examTypes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <HiOutlineTag className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-400 font-medium">No exam types yet</p>
                            <p className="text-slate-300 text-sm mt-1">Click "Add Type" to create your first exam type</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {["Code", "Name", "Max Marks", "Passing", "Weightage", "Internal", "Mark Entry", "Student View", "Order", "Status", ""].map((h) => (
                                            <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence>
                                        {examTypes.map((t, i) => (
                                            <React.Fragment key={t.exam_type_id}>
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="hover:bg-indigo-50/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">{t.code}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{t.name}</td>
                                                    <td className="px-4 py-3.5 text-slate-600 font-medium">{t.max_marks}</td>
                                                    <td className="px-4 py-3.5 text-slate-500">{t.passing_marks}</td>
                                                    <td className="px-4 py-3.5 text-slate-500">{t.weightage != null ? `${t.weightage}%` : "—"}</td>
                                                    <td className="px-4 py-3.5">
                                                        {t.is_internal ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiOutlineXCircle className="w-4 h-4 text-slate-300" />}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {t.allow_mark_entry ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiOutlineXCircle className="w-4 h-4 text-slate-300" />}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {t.allow_student_view ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiOutlineXCircle className="w-4 h-4 text-slate-300" />}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">{t.display_order ?? "—"}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.is_active === 0 ? "bg-red-50 text-red-400" : "bg-emerald-50 text-emerald-600"}`}>
                                                            {t.is_active === 0 ? "Inactive" : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingType(t);
                                                                    setShowTypeForm(false);
                                                                }}
                                                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition"
                                                            >
                                                                <HiOutlinePencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteType(t.exam_type_id)}
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-400 transition"
                                                            >
                                                                <HiOutlineTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                                {editingType?.exam_type_id === t.exam_type_id && (
                                                    <tr>
                                                        <td colSpan={11} className="px-4 py-2">
                                                            <AnimatePresence>
                                                                <ExamTypeForm
                                                                    key={t.exam_type_id}
                                                                    initial={editingType}
                                                                    onSave={handleSaveType}
                                                                    onCancel={() => setEditingType(null)}
                                                                    saving={savingType}
                                                                />
                                                            </AnimatePresence>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                                {examTypes.length} exam type{examTypes.length !== 1 ? "s" : ""}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ══════════════════════ EXAM SESSIONS SECTION ══════════════════════ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                >
                    <SectionHeader
                        icon={HiOutlineCalendar}
                        title="Exam Sessions"
                        subtitle="Link exam types with classes and academic years"
                        action={
                            <button
                                onClick={() => {
                                    setShowSessionForm((p) => !p);
                                    setEditingSession(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                Add Session
                            </button>
                        }
                    />

                    <AnimatePresence>
                        {showSessionForm && !editingSession && (
                            <ExamSessionForm
                                examTypes={examTypes}
                                onSave={handleSaveSession}
                                onCancel={() => setShowSessionForm(false)}
                                saving={savingSession}
                            />
                        )}
                    </AnimatePresence>

                    {sessionsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <HiOutlineCalendar className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-400 font-medium">No sessions yet</p>
                            <p className="text-slate-300 text-sm mt-1">Click "Add Session" to create your first exam session</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {sessions.map((s, i) => (
                                    <motion.div
                                        key={s.session_id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="border border-slate-100 rounded-xl overflow-hidden"
                                    >
                                        {/* Session row */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <HiOutlineAcademicCap className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate">{s.session_name}</p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                        {s.exam_type_name && (
                                                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-medium">
                                                                {s.exam_type_name}
                                                            </span>
                                                        )}
                                                        {(s.class_name || s.dept_name) && (
                                                            <span className="text-xs text-slate-500">{s.class_name || s.dept_name}</span>
                                                        )}
                                                        {s.academic_year && (
                                                            <span className="text-xs text-slate-400">{s.academic_year}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                                                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                                                    {formatDate(s.start_date)} – {formatDate(s.end_date)}
                                                </div>

                                                {/* Flags */}
                                                <div className="flex gap-1.5">
                                                    {s.timetable_published ? (
                                                        <span title="Timetable Published" className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <HiOutlineDocumentText className="w-3 h-3 text-indigo-500" />
                                                        </span>
                                                    ) : null}
                                                    {s.marks_entry_open ? (
                                                        <span title="Marks Entry Open" className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                                                            <HiOutlinePencil className="w-3 h-3 text-amber-500" />
                                                        </span>
                                                    ) : null}
                                                    {s.results_published ? (
                                                        <span title="Results Published" className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <HiOutlineBadgeCheck className="w-3 h-3 text-emerald-500" />
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <StatusBadge status={s.status} />

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setExpandedSession(expandedSession === s.session_id ? null : s.session_id)}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                                        title="Manage status"
                                                    >
                                                        <HiOutlineChevronDown
                                                            className={`w-4 h-4 transition-transform ${expandedSession === s.session_id ? "rotate-180" : ""}`}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingSession(s);
                                                            setShowSessionForm(false);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSession(s.session_id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-400 transition"
                                                    >
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Edit form for this session */}
                                        {editingSession?.session_id === s.session_id && (
                                            <div className="px-5 pb-5 border-t border-slate-100">
                                                <AnimatePresence>
                                                    <ExamSessionForm
                                                        key={s.session_id}
                                                        initial={editingSession}
                                                        examTypes={examTypes}
                                                        onSave={handleSaveSession}
                                                        onCancel={() => setEditingSession(null)}
                                                        saving={savingSession}
                                                    />
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {/* Status panel */}
                                        <AnimatePresence>
                                            {expandedSession === s.session_id && editingSession?.session_id !== s.session_id && (
                                                <div className="px-5 pb-4 border-t border-slate-100">
                                                    <SessionStatusPanel
                                                        session={s}
                                                        onPatch={handlePatchStatus}
                                                        patching={patchingSession === s.session_id}
                                                    />
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div className="text-xs text-slate-400 pt-1 px-1">
                                {sessions.length} session{sessions.length !== 1 ? "s" : ""} — {activeSessions} active, {draftSessions} draft
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}