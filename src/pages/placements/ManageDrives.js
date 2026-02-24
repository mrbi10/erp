import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import {
    FaBuilding,
    FaBriefcase,
    FaMoneyBillWave,
    FaGraduationCap,
    FaUserGraduate,
    FaCalendarAlt,
    FaPlus,
    FaTrash,
    FaSpinner,
    FaClipboardList,
    FaPen,
    FaTimes
} from "react-icons/fa";

/* ===================== CONFIG & STYLES ===================== */

const deptOptions = Object.entries(DEPT_MAP).map(([id, name]) => ({
    value: Number(id),
    label: name,
}));

const classOptions = Object.entries(CLASS_MAP).map(([id, name]) => ({
    value: Number(id),
    label: name,
}));

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '48px',
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
        boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
        backgroundColor: '#fff',
        cursor: 'pointer',
        '&:hover': { borderColor: '#94a3b8' }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
        color: state.isSelected ? 'white' : '#1e293b',
        cursor: 'pointer',
        padding: '12px 14px',
        fontWeight: '500'
    })
};

/* ===================== COMPONENT ===================== */

const ManageDrives = () => {
    const token = localStorage.getItem("token");

    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Create State
    const [selectedDepts, setSelectedDepts] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const initialFormState = {
        company_name: "", role: "", ctc: "", description: "",
        min_10th_percent: "", min_12th_percent: "", min_ug_cgpa: "",
        max_arrears: "", max_history_arrears: "", last_date: ""
    };
    const [form, setForm] = useState(initialFormState);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSelectedDepts, setEditSelectedDepts] = useState([]);
    const [editSelectedClasses, setEditSelectedClasses] = useState([]);
    const [editForm, setEditForm] = useState({});

    // ================= STRICT VALIDATION HELPER =================
    const validateDriveData = (data) => {
        // Helper to check if a value is strictly empty (allows 0)
        const isEmpty = (val) => val === "" || val === null || val === undefined || String(val).trim() === "";

        // 1. Mandatory Field Check
        if (
            isEmpty(data.company_name) ||
            isEmpty(data.role) ||
            isEmpty(data.ctc) ||
            isEmpty(data.min_10th_percent) ||
            isEmpty(data.min_12th_percent) ||
            isEmpty(data.min_ug_cgpa) ||
            isEmpty(data.max_arrears) ||
            isEmpty(data.max_history_arrears) ||
            isEmpty(data.last_date)
        ) {
            return "All fields are strictly required. Please fill out the description, CTC, and all criteria cutoffs.";
        }

        // 2. Numeric Boundaries Check
        if (Number(data.ctc) < 0) return "CTC cannot be a negative number.";
        
        const cgpa = Number(data.min_ug_cgpa);
        if (cgpa < 0 || cgpa > 10) return "CGPA must be a valid number between 0 and 10.";
        
        const tenth = Number(data.min_10th_percent);
        if (tenth < 0 || tenth > 100) return "10th Percentage must be between 0 and 100.";
        
        const twelfth = Number(data.min_12th_percent);
        if (twelfth < 0 || twelfth > 100) return "12th Percentage must be between 0 and 100.";
        
        if (Number(data.max_arrears) < 0) return "Max active arrears cannot be negative.";
        if (Number(data.max_history_arrears) < 0) return "Max history of arrears cannot be negative.";

        return null;
    };

    // ================= FETCH =================
    const fetchDrives = async () => {
        try {
            const res = await fetch(`${BASE_URL}/placementdrives`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setDrives(Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : []);
        } catch (error) {
            Swal.fire("Connection Error", "Failed to load drives.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDrives(); }, []);

    // ================= CREATE LOGIC =================
    const handleCreate = async (e) => {
        e.preventDefault();

        const errorMsg = validateDriveData(form);
        if (errorMsg) return Swal.fire("Invalid Input", errorMsg, "warning");

        try {
            setSubmitting(true);
            const res = await fetch(`${BASE_URL}/placementdrives`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...form,
                    allowed_dept_ids: selectedDepts.map(d => d.value),
                    allowed_class_ids: selectedClasses.map(c => c.value),
                }),
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire({ icon: "success", title: "Drive Created", timer: 1500, showConfirmButton: false });
                setForm(initialFormState);
                setSelectedDepts([]);
                setSelectedClasses([]);
                fetchDrives();
            } else {
                Swal.fire("Creation Failed", data.message, "error");
            }
        } catch {
            Swal.fire("Error", "Server communication failed.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ================= EDIT LOGIC =================
    const openEditModal = (drive) => {
        const formattedDate = drive.last_date ? new Date(drive.last_date).toISOString().slice(0, 16) : "";

        setEditForm({
            id: drive.id,
            company_name: drive.company_name,
            role: drive.role,
            ctc: drive.ctc || "",
            description: drive.description || "",
            min_10th_percent: drive.min_10th_percent !== null ? drive.min_10th_percent : "",
            min_12th_percent: drive.min_12th_percent !== null ? drive.min_12th_percent : "",
            min_ug_cgpa: drive.min_ug_cgpa !== null ? drive.min_ug_cgpa : "",
            max_arrears: drive.max_arrears !== null ? drive.max_arrears : "",
            max_history_arrears: drive.max_history_arrears !== null ? drive.max_history_arrears : "",
            last_date: formattedDate
        });

        setEditSelectedDepts((drive.allowed_dept_ids || []).map(id => ({ value: id, label: DEPT_MAP[id] })));
        setEditSelectedClasses((drive.allowed_class_ids || []).map(id => ({ value: id, label: CLASS_MAP[id] })));
        
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        const errorMsg = validateDriveData(editForm);
        if (errorMsg) return Swal.fire("Invalid Input", errorMsg, "warning");

        try {
            setSubmitting(true);
            const res = await fetch(`${BASE_URL}/placementdrives/${editForm.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...editForm,
                    allowed_dept_ids: editSelectedDepts.map(d => d.value),
                    allowed_class_ids: editSelectedClasses.map(c => c.value),
                }),
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire({ icon: "success", title: "Drive Updated", timer: 1500, showConfirmButton: false });
                setIsEditModalOpen(false);
                fetchDrives();
            } else {
                Swal.fire("Update Failed", data.message, "error");
            }
        } catch {
            Swal.fire("Error", "Server communication failed.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ================= DELETE =================
    const deleteDrive = async (id, companyName) => {
        const confirm = await Swal.fire({
            title: "Deactivate Drive?",
            html: `Are you sure you want to stop the <b>${companyName}</b> drive?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            confirmButtonText: "Yes, Deactivate",
        });

        if (!confirm.isConfirmed) return;
        try {
            await fetch(`${BASE_URL}/placementdrives/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            Swal.fire({ icon: "success", title: "Deactivated", timer: 1500, showConfirmButton: false });
            fetchDrives();
        } catch (error) {
            Swal.fire("Error", "Failed to deactivate drive.", "error");
        }
    };

    const renderTargets = (deptIds, classIds) => {
        const depts = (deptIds || []).length > 0 ? deptIds.map(id => DEPT_MAP[id]).join(', ') : "All Depts";
        const classes = (classIds || []).length > 0 ? classIds.map(id => CLASS_MAP[id]).join(', ') : "All Classes";
        return (
            <div className="text-xs font-bold text-slate-600 flex flex-col">
                <span>{depts}</span>
                <span className="text-indigo-600">{classes}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
                <FaSpinner className="animate-spin text-5xl mb-4" />
                <p className="font-bold text-slate-700">Loading Placement Data...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="max-w-7xl mx-auto space-y-8">
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-extrabold text-slate-800">Placement Drives</h1>
                    <p className="text-slate-600 font-medium mt-1">Create, edit, and manage upcoming campus recruitment events.</p>
                </div>

                {/* ===== CREATE DRIVE FORM ===== */}
                <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="bg-slate-800 p-5 flex items-center gap-3">
                        <div className="bg-indigo-500 text-white p-2 rounded-lg"><FaPlus /></div>
                        <h2 className="text-xl font-bold text-white">Create New Drive</h2>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Zone 1: Job Details */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FaBuilding className="text-indigo-500" /> 1. Job Details
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Name *</label>
                                    <input required name="company_name" placeholder="e.g. Zoho Corporation" value={form.company_name} onChange={(e) => setForm({...form, company_name: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Role Offered *</label>
                                    <input required name="role" placeholder="e.g. Software Engineer" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">PACKAGE (LPA) *</label>
                                    <input required type="number" step="0.01" min="0" name="ctc" placeholder="e.g. 8.5" value={form.ctc} onChange={(e) => setForm({...form, ctc: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                            </div>
                        </div>

                        {/* Zone 2: Eligibility Criteria */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FaGraduationCap className="text-indigo-500" /> 2. Minimum Eligibility Cutoffs
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">UG CGPA *</label>
                                    <input required type="number" step="0.01" min="0" max="10" name="min_ug_cgpa" placeholder="0-10" value={form.min_ug_cgpa} onChange={(e) => setForm({...form, min_ug_cgpa: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-medium text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Max Active Arrears *</label>
                                    <input required type="number" min="0" name="max_arrears" placeholder="0" value={form.max_arrears} onChange={(e) => setForm({...form, max_arrears: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-medium text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-rose-600 mb-2">Max History Arrears *</label>
                                    <input required type="number" min="0" name="max_history_arrears" placeholder="e.g. 2" value={form.max_history_arrears} onChange={(e) => setForm({...form, max_history_arrears: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-medium text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">10th Percentage (%) *</label>
                                    <input required type="number" step="0.1" min="0" max="100" name="min_10th_percent" placeholder="0-100" value={form.min_10th_percent} onChange={(e) => setForm({...form, min_10th_percent: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-medium text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">12th Percentage (%) *</label>
                                    <input required type="number" step="0.1" min="0" max="100" name="min_12th_percent" placeholder="0-100" value={form.min_12th_percent} onChange={(e) => setForm({...form, min_12th_percent: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-medium text-center" />
                                </div>
                            </div>
                        </div>

                        {/* Zone 3: Target Audience & Deadline */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FaUserGraduate className="text-indigo-500" /> 3. Target Audience & Instructions
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Allowed Depts (Blank = All)</label>
                                    <Select isMulti options={deptOptions} value={selectedDepts} onChange={setSelectedDepts} styles={customSelectStyles} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Allowed Classes (Blank = All)</label>
                                    <Select isMulti options={classOptions} value={selectedClasses} onChange={setSelectedClasses} styles={customSelectStyles} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Application Deadline *</label>
                                    <input required type="datetime-local" name="last_date" value={form.last_date} onChange={(e) => setForm({...form, last_date: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Job Description & Instructions</label>
                                    <textarea  name="description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Detailed job description and specific requirements..." rows="3" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium resize-y" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl font-bold text-white shadow-md bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2">
                                {submitting ? <FaSpinner className="animate-spin" /> : <FaPlus />} Create Drive
                            </button>
                        </div>
                    </div>
                </form>

                {/* ===== ACTIVE DRIVES LIST ===== */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-3">
                        <FaClipboardList className="text-slate-500 text-xl" />
                        <h3 className="text-xl font-bold text-slate-800">Active Campus Drives</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-100 border-b-2 border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Company & Role</th>
                                    <th className="p-4">Target Audience</th>
                                    <th className="p-4">Cutoffs (CGPA/Arrears)</th>
                                    <th className="p-4">Deadline</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {drives.map((d) => (
                                    <tr key={d.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="p-4">
                                            <p className="font-extrabold text-slate-900 text-lg">{d.company_name}</p>
                                            <p className="font-semibold text-indigo-700 mb-1">{d.role}</p>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <FaMoneyBillWave /> {d.ctc ? `${d.ctc} LPA` : "Not Disclosed"}
                                            </span>
                                        </td>
                                        <td className="p-4 align-top">
                                            {renderTargets(d.allowed_dept_ids, d.allowed_class_ids)}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                                                <p>CGPA: <span className="text-slate-800">{d.min_ug_cgpa || "0"}</span></p>
                                                <p>Arrears: <span className="text-slate-800">{d.max_arrears !== null ? d.max_arrears : "0"}</span></p>
                                                <p>Hist. Arrears: <span className="text-slate-800">{d.max_history_arrears !== null ? d.max_history_arrears : "0"}</span></p>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top font-semibold text-slate-700">
                                            {new Date(d.last_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 text-center align-top">
                                            <div className="flex flex-col gap-2 justify-center items-center">
                                                <button onClick={() => openEditModal(d)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors border border-indigo-200 w-24 flex justify-center items-center gap-1">
                                                    <FaPen /> Edit
                                                </button>
                                                <button onClick={() => deleteDrive(d.id, d.company_name)} className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors border border-rose-200 w-24 flex justify-center items-center gap-1">
                                                    <FaTrash /> End
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* ===================== EDIT MODAL ("TOP MODEL") ===================== */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl mt-10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 mb-10">
                        
                        <div className="bg-slate-800 p-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaPen className="text-indigo-400" /> Edit Placement Drive</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-300 hover:text-white bg-slate-700 hover:bg-rose-500 p-2 rounded-lg transition"><FaTimes /></button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-6">
                            
                            {/* Company & Role */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                                    <input required name="company_name" value={editForm.company_name} onChange={(e) => setEditForm({...editForm, company_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                                    <input required name="role" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">CTC (LPA) *</label>
                                    <input required type="number" step="0.01" min="0" name="ctc" value={editForm.ctc} onChange={(e) => setEditForm({...editForm, ctc: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" />
                                </div>
                            </div>

                            {/* Eligibility row */}
                            <div className="grid md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">UG CGPA *</label>
                                    <input required type="number" step="0.01" min="0" max="10" name="min_ug_cgpa" value={editForm.min_ug_cgpa} onChange={(e) => setEditForm({...editForm, min_ug_cgpa: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Active Arr. *</label>
                                    <input required type="number" min="0" name="max_arrears" value={editForm.max_arrears} onChange={(e) => setEditForm({...editForm, max_arrears: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rose-600 mb-1">History Arr. *</label>
                                    <input required type="number" min="0" name="max_history_arrears" value={editForm.max_history_arrears} onChange={(e) => setEditForm({...editForm, max_history_arrears: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">10th % *</label>
                                    <input required type="number" step="0.1" min="0" max="100" name="min_10th_percent" value={editForm.min_10th_percent} onChange={(e) => setEditForm({...editForm, min_10th_percent: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">12th % *</label>
                                    <input required type="number" step="0.1" min="0" max="100" name="min_12th_percent" value={editForm.min_12th_percent} onChange={(e) => setEditForm({...editForm, min_12th_percent: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center" />
                                </div>
                            </div>

                            {/* Audience, Date & Description */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Depts</label>
                                    <Select isMulti options={deptOptions} value={editSelectedDepts} onChange={setEditSelectedDepts} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Classes</label>
                                    <Select isMulti options={classOptions} value={editSelectedClasses} onChange={setEditSelectedClasses} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Application Deadline *</label>
                                    <input required type="datetime-local" name="last_date" value={editForm.last_date} onChange={(e) => setEditForm({...editForm, last_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Job Description</label>
                                    <textarea name="description" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-y" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-8 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2">
                                    {submitting ? <FaSpinner className="animate-spin" /> : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDrives;