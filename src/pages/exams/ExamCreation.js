import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    HiOutlineClipboardList,
    HiOutlineTag,
    HiOutlineBadgeCheck,
    HiOutlineDocumentText,
    HiOutlineAdjustments,
    HiOutlineSparkles,
    HiOutlineRefresh,
    HiOutlineLightningBolt,
    HiOutlineBookOpen,
    HiOutlineCollection,
    HiOutlineChartBar,
} from "react-icons/hi";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptclassV2";

// ─── Academic Year Auto-Detection ────────────────────────────────────────────
const getAcademicYearId = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12
    const year = now.getFullYear();
    // Academic year starts June → next year's May
    // 2024-2025: June 2024 – May 2025 → value 2 (index based)
    const startYear = month >= 6 ? year : year - 1;
    // Map startYear to our option values
    const map = { 2022: 1, 2023: 1, 2024: 2, 2025: 3, 2026: 4 };
    return map[startYear] ?? 3;
};

const ACADEMIC_YEAR_OPTIONS = [
    { value: 1, label: "2025 – 2026" },
    { value: 2, label: "2026 – 2027" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const headers = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

const DEPT_OPTIONS = Object.entries(DEPT_MAP).map(([id, name]) => ({
    value: Number(id),
    label: name,
}));

const CLASS_OPTIONS = Object.entries(CLASS_MAP).map(([id, name]) => ({
    value: Number(id),
    label: name,
}));

// ─── Select Styles ───────────────────────────────────────────────────────────
const makeSelectStyles = (accent = "#6366f1") => ({
    control: (b, s) => ({
        ...b,
        borderRadius: 10,
        borderColor: s.isFocused ? accent : "#e2e8f0",
        boxShadow: s.isFocused ? `0 0 0 3px ${accent}22` : "none",
        minHeight: 46,
        fontSize: 14,
        fontFamily: "inherit",
        "&:hover": { borderColor: accent },
        transition: "all 0.15s ease",
    }),
    menu: (b) => ({
        ...b,
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        zIndex: 9999,
        overflow: "hidden",
    }),
    menuPortal: (b) => ({ ...b, zIndex: 9999 }),
    option: (b, s) => ({
        ...b,
        padding: "10px 14px",
        fontSize: 14,
        backgroundColor: s.isSelected ? accent : s.isFocused ? `${accent}12` : "white",
        color: s.isSelected ? "white" : "#1e293b",
        cursor: "pointer",
        fontWeight: s.isSelected ? 600 : 400,
    }),
    multiValue: (b) => ({
        ...b,
        backgroundColor: `${accent}15`,
        borderRadius: 6,
    }),
    multiValueLabel: (b) => ({ ...b, color: accent, fontWeight: 600, fontSize: 12 }),
    multiValueRemove: (b) => ({
        ...b,
        color: accent,
        "&:hover": { backgroundColor: `${accent}30`, color: accent },
    }),
    placeholder: (b) => ({ ...b, color: "#94a3b8", fontSize: 14 }),
    valueContainer: (b) => ({ ...b, padding: "4px 10px", gap: 4 }),
    indicatorSeparator: () => ({ display: "none" }),
});

const sessionSelectStyles = makeSelectStyles("#10b981");
const typeSelectStyles = makeSelectStyles("#6366f1");

// ─── Shared Input Styles ─────────────────────────────────────────────────────
const inputCls =
    "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";
const labelCls = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18, color = "white" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
    >
        <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
        <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

// ─── Toggle ──────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, sublabel, accentColor = "#6366f1" }) => (
    <label className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all group">
        <div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                {label}
            </p>
            {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="relative flex-shrink-0 ml-3"
            style={{
                width: 44,
                height: 24,
                borderRadius: 999,
                background: checked ? accentColor : "#cbd5e1",
                border: "none",
                outline: "none",
                cursor: "pointer",
                transition: "background 0.2s ease",
                padding: 0,
            }}
        >
            <motion.span
                animate={{ x: checked ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{
                    position: "absolute",
                    top: 3,
                    left: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
            />
        </button>
    </label>
);

// ─── Status Pill ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
    const map = {
        DRAFT: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "Draft" },
        SCHEDULED: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", label: "Scheduled" },
        ONGOING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Ongoing" },
        COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
        ARCHIVED: { bg: "bg-slate-200", text: "text-slate-700", dot: "bg-slate-400", label: "Archived" },
    };
    const s = map[status] || map.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === "active" ? "animate-pulse" : ""}`} />
            {s.label}
        </span>
    );
};

// ─── Indicator ───────────────────────────────────────────────────────────────
const Indicator = ({ active, icon, label }) => (
    <div className={`flex flex-col items-center gap-1 transition-all ${active ? "opacity-100" : "opacity-25"}`}>
        <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
        >
            {React.cloneElement(icon, { className: "w-4 h-4" })}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</span>
    </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
        className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
        <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center text-white p-3.5"
            style={{ background: gradient }}
        >
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-slate-800 mt-0.5">{value}</p>
        </div>
        <div
            className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5"
            style={{ background: gradient }}
        />
    </motion.div>
);

// ─── Exam Type Form ───────────────────────────────────────────────────────────
function ExamTypeForm({ initial, onSave, onCancel, saving }) {
    const [form, setForm] = useState(
        initial || {
            code: "",
            name: "",
            description: "",
            max_marks: "",
            passing_marks: "",
            weightage: "",
            is_internal: true,
            allow_mark_entry: true,
            allow_student_view: false,
            display_order: "",
            is_active: true,
        }
    );
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-8"
        >
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-2 border-indigo-100 rounded-3xl p-8 shadow-lg shadow-indigo-50">
                {/* Decorative blur */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-200/20 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                        <HiOutlineTag className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">
                            {initial?.exam_type_id ? "Update Exam Category" : "Create Exam Category"}
                        </h3>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Define rules for this exam type — IAT, Model, Semester, etc.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    <div>
                        <label className={labelCls}>
                            Short Code <span className="text-red-400">*</span>
                        </label>
                        <input
                            className={inputCls}
                            placeholder="IAT-1"
                            value={form.code}
                            onChange={(e) => set("code", e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelCls}>
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            className={inputCls}
                            placeholder="First Internal Assessment Test"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Max Marks</label>
                        <input
                            type="number"
                            className={inputCls}
                            placeholder="100"
                            value={form.max_marks}
                            onChange={(e) => set("max_marks", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Passing Marks</label>
                        <input
                            type="number"
                            className={inputCls}
                            placeholder="40"
                            value={form.passing_marks}
                            onChange={(e) => set("passing_marks", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Weightage (%)</label>
                        <input
                            type="number"
                            className={inputCls}
                            placeholder="25"
                            value={form.weightage}
                            onChange={(e) => set("weightage", e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className={labelCls}>Description</label>
                        <textarea
                            className={`${inputCls} resize-none`}
                            rows={2}
                            placeholder="Optional notes about this exam type…"
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    <Toggle
                        checked={form.is_internal}
                        onChange={(v) => set("is_internal", v)}
                        label="Internal Exam"
                        sublabel="Handled by college"
                        accentColor="#6366f1"
                    />
                    <Toggle
                        checked={form.allow_mark_entry}
                        onChange={(v) => set("allow_mark_entry", v)}
                        label="Allow Mark Entry"
                        sublabel="Faculty can submit marks"
                        accentColor="#6366f1"
                    />
                    <Toggle
                        checked={form.allow_student_view}
                        onChange={(v) => set("allow_student_view", v)}
                        label="Student View"
                        sublabel="Results visible to students"
                        accentColor="#6366f1"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-indigo-100/60">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={saving}
                        className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 text-sm"
                    >
                        {saving ? (
                            <>
                                <Spinner size={16} />
                                Saving…
                            </>
                        ) : (
                            <>
                                <HiOutlineCheckCircle className="w-4 h-4" />
                                {initial?.exam_type_id ? "Update Category" : "Create Category"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Exam Session Form ────────────────────────────────────────────────────────
function ExamSessionForm({ initial, examTypes, onSave, onCancel, saving }) {
    const autoYearId = useMemo(() => getAcademicYearId(), []);

    const [form, setForm] = useState(() => {
        if (initial) return { ...initial };
        return {
            session_name: "",
            exam_type_id: null,
            academic_year_id: autoYearId,
            dept_ids: [],       // multi
            class_ids: [],      // multi
            start_date: "",
            end_date: "",
        };
    });

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const typeOptions = examTypes.map((t) => ({
        value: t.exam_type_id,
        label: `${t.code} — ${t.name}`,
    }));

    const formatDate = (d) => {
        if (!d) return "";
        return new Date(d).toISOString().split("T")[0];
    };

    // For edit mode, map existing single ids into arrays
    const deptValue = useMemo(() => {
        if (form.dept_ids?.length) return DEPT_OPTIONS.filter((o) => form.dept_ids.includes(o.value));
        if (form.dept_id) return DEPT_OPTIONS.filter((o) => o.value === form.dept_id);
        return [];
    }, [form.dept_ids, form.dept_id]);

    const classValue = useMemo(() => {
        if (form.class_ids?.length) return CLASS_OPTIONS.filter((o) => form.class_ids.includes(o.value));
        if (form.class_id) return CLASS_OPTIONS.filter((o) => o.value === form.class_id);
        return [];
    }, [form.class_ids, form.class_id]);

    const handleSubmit = () => {
        const payload = {
            ...form,
            dept_id: form.dept_ids?.length === 1 ? form.dept_ids[0] : form.dept_ids?.length > 1 ? null : null,
            class_id: form.class_ids?.length === 1 ? form.class_ids[0] : null,
            dept_ids: form.dept_ids,
            class_ids: form.class_ids,
        };
        onSave(payload);
    };

    const scopeDesc = useMemo(() => {
        const dCount = deptValue.length;
        const cCount = classValue.length;
        if (!dCount && !cCount) return "Institution-wide exam";
        if (dCount > 1 && cCount > 1) return `${dCount} departments × ${cCount} classes`;
        if (dCount > 1) return `${dCount} departments`;
        if (dCount === 1 && cCount > 1) return `${deptValue[0].label} — ${cCount} classes`;
        if (dCount === 1 && cCount === 1) return `${deptValue[0].label} › ${classValue[0].label}`;
        return "Custom scope";
    }, [deptValue, classValue]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="mb-10"
        >
            <div className="relative overflow-hidden bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-xl shadow-emerald-50/40">
                {/* Background decoration */}
                <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-emerald-100/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-teal-100/20 blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-200">
                        <HiOutlineCalendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-800">
                            {initial?.session_id ? "Edit Exam Session" : "Schedule New Exam Session"}
                        </h3>
                        <p className="text-slate-400 text-sm mt-0.5">
                            Define scope, dates, and type for this exam
                        </p>
                    </div>
                    {scopeDesc && (
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                            <HiOutlineCollection className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700">{scopeDesc}</span>
                        </div>
                    )}
                </div>

                {/* Row 1: Session name */}
                <div className="mb-6">
                    <label className={labelCls}>
                        Session Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        className={`${inputCls} focus:ring-emerald-500/20 focus:border-emerald-500 text-base`}
                        placeholder="e.g. Odd Sem IAT-1 Nov 2025 — CSE & IT"
                        value={form.session_name}
                        onChange={(e) => set("session_name", e.target.value)}
                    />
                </div>

                {/* Row 2: Type + Academic Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className={labelCls}>
                            Exam Category <span className="text-red-400">*</span>
                        </label>
                        <Select
                            options={typeOptions}
                            styles={sessionSelectStyles}
                            menuPortalTarget={document.body}
                            value={typeOptions.find((o) => o.value === form.exam_type_id) || null}
                            onChange={(o) => set("exam_type_id", o?.value)}
                            placeholder="Select exam type…"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            Academic Year{" "}
                            <span className="text-emerald-500 text-[10px] font-bold ml-1">
                                AUTO-DETECTED · OVERRIDABLE
                            </span>
                        </label>
                        <Select
                            options={ACADEMIC_YEAR_OPTIONS}
                            styles={sessionSelectStyles}
                            menuPortalTarget={document.body}
                            value={
                                ACADEMIC_YEAR_OPTIONS.find((o) => o.value === form.academic_year_id) ||
                                null
                            }
                            onChange={(o) => set("academic_year_id", o?.value)}
                            placeholder="Academic year…"
                        />
                    </div>
                </div>

                {/* Row 3: Dept (multi) + Class (multi) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className={labelCls}>
                            Departments{" "}
                            <span className="text-slate-400 normal-case font-normal">
                                (multi-select · leave empty for all)
                            </span>
                        </label>
                        <Select
                            isMulti
                            options={DEPT_OPTIONS}
                            styles={sessionSelectStyles}
                            menuPortalTarget={document.body}
                            value={deptValue}
                            onChange={(opts) => set("dept_ids", opts.map((o) => o.value))}
                            placeholder="All departments…"
                            closeMenuOnSelect={false}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            Classes{" "}
                            <span className="text-slate-400 normal-case font-normal">
                                (multi-select · leave empty for all)
                            </span>
                        </label>
                        <Select
                            isMulti
                            options={CLASS_OPTIONS}
                            styles={sessionSelectStyles}
                            menuPortalTarget={document.body}
                            value={classValue}
                            onChange={(opts) => set("class_ids", opts.map((o) => o.value))}
                            placeholder="All classes…"
                            closeMenuOnSelect={false}
                        />
                    </div>
                </div>

                {/* Row 4: Dates */}
                <div className="grid grid-cols-2 gap-5 mb-8">
                    <div>
                        <label className={labelCls}>
                            Start Date <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            className={`${inputCls} focus:ring-emerald-500/20 focus:border-emerald-500`}
                            value={formatDate(form.start_date)}
                            onChange={(e) => set("start_date", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            End Date <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            className={`${inputCls} focus:ring-emerald-500/20 focus:border-emerald-500`}
                            value={formatDate(form.end_date)}
                            onChange={(e) => set("end_date", e.target.value)}
                            min={form.start_date || undefined}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 text-sm"
                    >
                        {saving ? (
                            <>
                                <Spinner size={16} />
                                {initial?.session_id ? "Saving…" : "Creating…"}
                            </>
                        ) : (
                            <>
                                <HiOutlineLightningBolt className="w-4 h-4" />
                                {initial?.session_id ? "Save Changes" : "Launch Session"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ s, examTypes, onEdit, onPatch, patchingId }) {
    const [expanded, setExpanded] = useState(false);
    const [localStatus, setLocalStatus] = useState(s.status || "draft");
    const isPatching = patchingId === s.session_id;

    const typeName = s.exam_type_name || examTypes.find((t) => t.exam_type_id === s.exam_type_id)?.name || "—";

    const scopeLabel = useMemo(() => {
        if (s.dept_name && s.class_name) return `${s.dept_name} › ${s.class_name}`;
        if (s.dept_name) return s.dept_name;
        return "All Departments";
    }, [s]);

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
        >
            <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                            {typeName}
                        </span>
                        <StatusPill status={s.status} />
                        {s.academic_year && (
                            <span className="text-[11px] font-bold text-slate-400 px-2.5 py-1 rounded-lg bg-slate-50">
                                {s.academic_year}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 truncate">{s.session_name}</h3>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-sm text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                            <HiOutlineAcademicCap className="w-4 h-4 text-slate-300" />
                            {scopeLabel}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <HiOutlineCalendar className="w-4 h-4 text-slate-300" />
                            {formatDate(s.start_date)} — {formatDate(s.end_date)}
                        </span>
                    </div>
                </div>

                {/* Right: Indicators + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex gap-2 border-r border-slate-100 pr-4 mr-1">
                        <Indicator active={s.timetable_published} icon={<HiOutlineDocumentText />} label="Table" />
                        <Indicator active={s.marks_entry_open} icon={<HiOutlinePencil />} label="Marks" />
                        <Indicator active={s.results_published} icon={<HiOutlineBadgeCheck />} label="Result" />
                    </div>
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        title="Controls"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expanded ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"}`}
                    >
                        <HiOutlineAdjustments className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onEdit(s)}
                        title="Edit"
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-all"
                    >
                        <HiOutlinePencil className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Controls Panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 border-t border-slate-100 px-6 py-5">
                            <div className="flex flex-wrap items-end gap-6">
                                {/* Status Dropdown */}
                                <div className="flex-shrink-0">
                                    <label className={`${labelCls} mb-1.5`}>Session Status</label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={localStatus}
                                            onChange={(e) => {
                                                setLocalStatus(e.target.value);
                                                onPatch(s.session_id, { status: e.target.value });
                                            }}
                                        >
                                            <option value="DRAFT">Draft</option>
                                            <option value="SCHEDULED">Scheduled</option>
                                            <option value="ONGOING">Ongoing</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="ARCHIVED">Archived</option>
                                        </select>
                                        {isPatching && <Spinner size={16} color="#10b981" />}
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex flex-wrap gap-3 flex-1">
                                    <div className="min-w-[160px]">
                                        <Toggle
                                            checked={!!s.timetable_published}
                                            onChange={(v) => onPatch(s.session_id, { timetable_published: v })}
                                            label="Timetable"
                                            sublabel="Publish schedule"
                                            accentColor="#10b981"
                                        />
                                    </div>
                                    <div className="min-w-[160px]">
                                        <Toggle
                                            checked={!!s.marks_entry_open}
                                            onChange={(v) => onPatch(s.session_id, { marks_entry_open: v })}
                                            label="Mark Entry"
                                            sublabel="Faculty can submit"
                                            accentColor="#10b981"
                                        />
                                    </div>
                                    <div className="min-w-[160px]">
                                        <Toggle
                                            checked={!!s.results_published}
                                            onChange={(v) => onPatch(s.session_id, { results_published: v })}
                                            label="Results"
                                            sublabel="Visible to students"
                                            accentColor="#10b981"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExamCreation() {
    const token = localStorage.getItem("token");
    const h = useMemo(() => headers(token), [token]);

    const [examTypes, setExamTypes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [view, setView] = useState("sessions");

    const [showSessionForm, setShowSessionForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [savingSession, setSavingSession] = useState(false);

    const [showTypeForm, setShowTypeForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [savingType, setSavingType] = useState(false);

    const [patchingSession, setPatchingSession] = useState(null);

    const fetchData = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            try {
                const [tRes, sRes] = await Promise.all([
                    fetch(`${BASE_URL}/exam/types`, { headers: h }),
                    fetch(`${BASE_URL}/exam/sessions`, { headers: h }),
                ]);
                const [types, sess] = await Promise.all([tRes.json(), sRes.json()]);
                setExamTypes(Array.isArray(types) ? types : []);
                setSessions(Array.isArray(sess) ? sess : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [h]
    );

    useEffect(() => {
        fetchData();
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSaveSession = async (form) => {
        if (!form.session_name?.trim())
            return Swal.fire("Missing Field", "Please enter a session title.", "warning");
        if (!form.exam_type_id)
            return Swal.fire("Missing Field", "Please select an exam category.", "warning");
        if (!form.start_date || !form.end_date)
            return Swal.fire("Missing Field", "Please set start and end dates.", "warning");

        setSavingSession(true);
        const isEdit = !!editingSession?.session_id;

        // Build payload: for multi-dept/class, send arrays; backend handles
        const payload = {
            session_name: form.session_name,
            exam_type_id: form.exam_type_id,
            academic_year_id: form.academic_year_id,
            dept_ids: form.dept_ids || [],
            class_ids: form.class_ids || [],
            // backward-compat single values
            dept_id: form.dept_ids?.length === 1 ? form.dept_ids[0] : null,
            class_id: form.class_ids?.length === 1 ? form.class_ids[0] : null,
            start_date: form.start_date?.split("T")[0],
            end_date: form.end_date?.split("T")[0],
        };

        try {
            const res = await fetch(
                `${BASE_URL}/exam/sessions${isEdit ? `/${editingSession.session_id}` : ""}`,
                { method: isEdit ? "PUT" : "POST", headers: h, body: JSON.stringify(payload) }
            );
            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: isEdit ? "Session Updated" : "Session Created",
                    text: isEdit
                        ? "The exam session has been updated."
                        : "Your exam session is now live in draft mode.",
                    timer: 2000,
                    showConfirmButton: false,
                });
                setShowSessionForm(false);
                setEditingSession(null);
                fetchData(true);
            } else {
                const err = await res.json();
                Swal.fire("Error", err.message || "Something went wrong.", "error");
            }
        } catch (e) {
            Swal.fire("Network Error", "Could not reach the server.", "error");
        } finally {
            setSavingSession(false);
        }
    };

    const handleSaveType = async (form) => {
        if (!form.code?.trim() || !form.name?.trim())
            return Swal.fire("Missing Field", "Code and name are required.", "warning");

        setSavingType(true);
        const isEdit = !!editingType?.exam_type_id;

        try {
            const res = await fetch(
                `${BASE_URL}/exam/types${isEdit ? `/${editingType.exam_type_id}` : ""}`,
                { method: isEdit ? "PUT" : "POST", headers: h, body: JSON.stringify(form) }
            );
            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: isEdit ? "Category Updated" : "Category Created",
                    timer: 1800,
                    showConfirmButton: false,
                });
                setShowTypeForm(false);
                setEditingType(null);
                fetchData(true);
            } else {
                const err = await res.json();
                Swal.fire("Error", err.message || "Something went wrong.", "error");
            }
        } catch (e) {
            Swal.fire("Network Error", "Could not reach the server.", "error");
        } finally {
            setSavingType(false);
        }
    };

    const handlePatchStatus = async (id, flags) => {
        setPatchingSession(id);
        try {
            await fetch(`${BASE_URL}/exam/sessions/${id}/status`, {
                method: "PATCH",
                headers: h,
                body: JSON.stringify(flags),
            });
            fetchData(true);
        } catch (e) {
            Swal.fire("Error", "Could not update session controls.", "error");
        } finally {
            setPatchingSession(null);
        }
    };

    const stats = {
        total: sessions.length,
        active: sessions.filter((s) => s.status === "ONGOING").length,
        types: examTypes.length,
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F6F8FB] font-sans text-slate-900">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg">
                                <HiOutlineSparkles className="w-3 h-3" />
                                Academic Portal
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl text-left font-black text-slate-900 tracking-tight leading-none">
                            Examinations
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Create, schedule, and manage all student assessments
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Refresh */}
                        <button
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 flex items-center justify-center shadow-sm transition-all disabled:opacity-50"
                            title="Refresh"
                        >
                            <HiOutlineRefresh className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                        </button>

                        {/* Tab switcher */}
                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                            <button
                                onClick={() => setView("sessions")}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === "sessions"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:bg-slate-50"}`}
                            >
                                Sessions
                            </button>
                            <button
                                onClick={() => setView("types")}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === "types"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:bg-slate-50"}`}
                            >
                                Categories
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── STATS ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                    <StatCard
                        icon={HiOutlineBookOpen}
                        label="Total Sessions"
                        value={stats.total}
                        gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
                        delay={0.05}
                    />
                    <StatCard
                        icon={HiOutlineLightningBolt}
                        label="Live Now"
                        value={stats.active}
                        gradient="linear-gradient(135deg, #10b981, #14b8a6)"
                        delay={0.1}
                    />
                    <StatCard
                        icon={HiOutlineCollection}
                        label="Categories"
                        value={stats.types}
                        gradient="linear-gradient(135deg, #f59e0b, #f97316)"
                        delay={0.15}
                    />
                </div>

                {/* ── CONTENT ────────────────────────────────────────────── */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-center">
                            <div className="w-12 h-12 border-3 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
                            <p className="text-slate-400 font-medium">Loading data…</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {/* ── SESSIONS VIEW ─── */}
                        {view === "sessions" && (
                            <motion.div
                                key="sessions"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                        Exam Sessions
                                        <span className="bg-slate-100 text-slate-500 text-sm px-3 py-1 rounded-full font-bold">
                                            {sessions.length}
                                        </span>
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setEditingSession(null);
                                            setShowSessionForm((v) => !v);
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 text-sm"
                                    >
                                        <HiOutlinePlus className="w-4 h-4 stroke-[3]" />
                                        New Session
                                    </button>
                                </div>

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

                                <AnimatePresence>
                                    {editingSession && (
                                        <ExamSessionForm
                                            key={editingSession.session_id}
                                            initial={editingSession}
                                            examTypes={examTypes}
                                            onSave={handleSaveSession}
                                            onCancel={() => setEditingSession(null)}
                                            saving={savingSession}
                                        />
                                    )}
                                </AnimatePresence>

                                {sessions.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <HiOutlineCalendar className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-600">No Sessions Scheduled</h3>
                                        <p className="text-slate-400 text-sm mt-1.5">
                                            Click "New Session" above to get started.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sessions.map((s) => (
                                            <SessionCard
                                                key={s.session_id}
                                                s={s}
                                                examTypes={examTypes}
                                                onEdit={(sess) => {
                                                    setShowSessionForm(false);
                                                    setEditingSession(sess);
                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                }}
                                                onPatch={handlePatchStatus}
                                                patchingId={patchingSession}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── TYPES VIEW ─── */}
                        {view === "types" && (
                            <motion.div
                                key="types"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800">Exam Categories</h2>
                                        <p className="text-slate-400 text-sm mt-0.5">
                                            Manage IAT, Model, Semester, and other exam types
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingType(null);
                                            setShowTypeForm((v) => !v);
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                                    >
                                        <HiOutlinePlus className="w-4 h-4 stroke-[3]" />
                                        New Category
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showTypeForm && !editingType && (
                                        <ExamTypeForm
                                            onSave={handleSaveType}
                                            onCancel={() => setShowTypeForm(false)}
                                            saving={savingType}
                                        />
                                    )}
                                </AnimatePresence>

                                {examTypes.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <HiOutlineTag className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-600">No Categories Yet</h3>
                                        <p className="text-slate-400 text-sm mt-1.5">
                                            Create exam types like IAT, Model Exam, Semester, etc.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {examTypes.map((t) => (
                                            <motion.div
                                                key={t.exam_type_id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.97 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="group relative bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all overflow-hidden"
                                            >
                                                {/* Decoration */}
                                                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 opacity-50 group-hover:opacity-80 transition-opacity" />

                                                <div className="relative">
                                                    <span className="text-[11px] font-black text-indigo-500 tracking-widest uppercase">
                                                        {t.code}
                                                    </span>
                                                    <h3 className="text-xl font-black text-slate-800 mt-1 mb-5 leading-tight">
                                                        {t.name}
                                                    </h3>

                                                    <div className="space-y-2.5 mb-6">
                                                        {[
                                                            { label: "Max Marks", val: t.max_marks || "—" },
                                                            { label: "Passing", val: t.passing_marks || "—" },
                                                            { label: "Weightage", val: t.weightage ? `${t.weightage}%` : "—", accent: true },
                                                        ].map(({ label, val, accent }) => (
                                                            <div
                                                                key={label}
                                                                className="flex items-center justify-between text-sm"
                                                            >
                                                                <span className="font-semibold text-slate-400">{label}</span>
                                                                <span
                                                                    className={`font-black ${accent ? "text-indigo-600" : "text-slate-700"}`}
                                                                >
                                                                    {val}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider mb-5">
                                                        {t.is_internal == 1 && (
                                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">
                                                                Internal
                                                            </span>
                                                        )}

                                                        {t.allow_mark_entry == 1 && (
                                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                                                Mark Entry
                                                            </span>
                                                        )}

                                                        {Number(t.allow_student_view) === 1 && (
                                                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg">
                                                                Public
                                                            </span>
                                                        )}

                                                        {Number(t.allow_student_view) === 0 && (
                                                            <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg">
                                                                Private
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setShowTypeForm(false);
                                                            setEditingType(t);
                                                        }}
                                                        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                        Edit Category
                                                    </button>
                                                </div>

                                                {/* Edit modal overlay */}
                                                <AnimatePresence>
                                                    {editingType?.exam_type_id === t.exam_type_id && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                                                            onClick={(e) => e.target === e.currentTarget && setEditingType(null)}
                                                        >
                                                            <motion.div
                                                                initial={{ scale: 0.95, y: 10 }}
                                                                animate={{ scale: 1, y: 0 }}
                                                                exit={{ scale: 0.95, y: 10 }}
                                                                className="w-full max-w-3xl"
                                                            >
                                                                <ExamTypeForm
                                                                    initial={editingType}
                                                                    onSave={handleSaveType}
                                                                    onCancel={() => setEditingType(null)}
                                                                    saving={savingType}
                                                                />
                                                            </motion.div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}