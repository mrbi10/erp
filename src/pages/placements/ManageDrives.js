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
    FaClipboardList
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

    const [selectedDepts, setSelectedDepts] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    const initialFormState = {
        company_name: "",
        role: "",
        ctc: "",
        description: "",
        min_10th_percent: "",
        min_12th_percent: "",
        min_ug_cgpa: "",
        max_arrears: "",
        last_date: ""
    };
    
    const [form, setForm] = useState(initialFormState);

    // ================= FETCH =================
    const fetchDrives = async () => {
        try {
            const res = await fetch(`${BASE_URL}/placementdrives`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setDrives(Array.isArray(data) ? data.sort((a,b) => b.id - a.id) : []);
        } catch (error) {
            Swal.fire("Connection Error", "Failed to load drives.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrives();
    }, []);

    // ================= HANDLE INPUT =================
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ================= CREATE =================
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!form.company_name || !form.role || !form.last_date) {
            Swal.fire("Missing Fields", "Company, Role, and Last Date are mandatory.", "warning");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch(`${BASE_URL}/placementdrives`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    allowed_dept_ids: selectedDepts.map(d => d.value),
                    allowed_class_ids: selectedClasses.map(c => c.value),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({ icon: "success", title: "Drive Created", text: data.message, timer: 2000, showConfirmButton: false });
                
                // Reset Form
                setForm(initialFormState);
                setSelectedDepts([]);
                setSelectedClasses([]);
                
                fetchDrives();
            } else {
                Swal.fire("Creation Failed", data.message || "Please check your inputs.", "error");
            }
        } catch {
            Swal.fire("Error", "Something went wrong while communicating with the server.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ================= DELETE =================
    const deleteDrive = async (id, companyName) => {
        const confirm = await Swal.fire({
            title: "Deactivate Drive?",
            html: `Are you sure you want to stop the <b>${companyName}</b> drive?<br/>Students will no longer be able to apply.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            confirmButtonText: "Yes, Deactivate",
        });

        if (!confirm.isConfirmed) return;

        try {
            await fetch(`${BASE_URL}/placementdrives/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            Swal.fire({ icon: "success", title: "Deactivated", timer: 1500, showConfirmButton: false });
            fetchDrives();
        } catch (error) {
            Swal.fire("Error", "Failed to deactivate drive.", "error");
        }
    };

    // ================= RENDER =================
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
                <FaSpinner className="animate-spin text-5xl mb-4" />
                <p className="font-bold text-slate-700">Loading Placement Data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* HEADER */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-extrabold text-slate-800">Placement Drives</h1>
                    <p className="text-slate-600 font-medium mt-1">Create and manage upcoming campus recruitment events.</p>
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
                                    <input required name="company_name" placeholder="e.g. Zoho Corporation" value={form.company_name} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Role Offered *</label>
                                    <input required name="role" placeholder="e.g. Software Engineer" value={form.role} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">CTC (LPA)</label>
                                    <input name="ctc" placeholder="e.g. 8.5" value={form.ctc} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800" />
                                </div>
                            </div>
                        </div>

                        {/* Zone 2: Eligibility Criteria */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FaGraduationCap className="text-indigo-500" /> 2. Minimum Eligibility Criteria
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">UG CGPA Cutoff</label>
                                    <input type="number" step="0.01" name="min_ug_cgpa" placeholder="e.g. 7.5" value={form.min_ug_cgpa} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-center" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Max Active Arrears</label>
                                    <input type="number" name="max_arrears" placeholder="e.g. 0" value={form.max_arrears} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-center" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">10th Percentage</label>
                                    <input type="number" step="0.1" name="min_10th_percent" placeholder="e.g. 60" value={form.min_10th_percent} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-center" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">12th Percentage</label>
                                    <input type="number" step="0.1" name="min_12th_percent" placeholder="e.g. 60" value={form.min_12th_percent} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-center" />
                                </div>
                            </div>
                        </div>

                        {/* Zone 3: Target Audience & Deadline */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FaUserGraduate className="text-indigo-500" /> 3. Target Audience & Deadlines
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Allowed Departments (Leave blank for all)</label>
                                    <Select isMulti options={deptOptions} value={selectedDepts} onChange={setSelectedDepts} styles={customSelectStyles} placeholder="Select departments..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Allowed Classes (Leave blank for all)</label>
                                    <Select isMulti options={classOptions} value={selectedClasses} onChange={setSelectedClasses} styles={customSelectStyles} placeholder="Select classes..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Application Deadline *</label>
                                    <input required type="datetime-local" name="last_date" value={form.last_date} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Additional Instructions</label>
                                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="Any specific requirements or instructions..." rows="1" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={submitting} className={`px-8 py-3 rounded-xl font-bold text-white shadow-md flex items-center gap-2 transition-colors border-2 ${submitting ? 'bg-indigo-400 border-indigo-400 cursor-not-allowed' : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700'}`}>
                                {submitting ? <><FaSpinner className="animate-spin" /> Processing...</> : <><FaBriefcase /> Publish Drive</>}
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
                                    <th className="p-5">Company & Role</th>
                                    <th className="p-5">CTC</th>
                                    <th className="p-5">Key Eligibility</th>
                                    <th className="p-5">Deadline</th>
                                    <th className="p-5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {drives.map((d) => (
                                    <tr key={d.id} className="hover:bg-indigo-50/50 transition-colors">
                                        <td className="p-5">
                                            <p className="font-extrabold text-slate-900 text-lg">{d.company_name}</p>
                                            <p className="font-semibold text-indigo-700">{d.role}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <FaMoneyBillWave /> {d.ctc ? `${d.ctc} LPA` : "Not Disclosed"}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                                                <p>CGPA: <span className="text-slate-800">{d.min_ug_cgpa || "N/A"}</span></p>
                                                <p>Arrears: <span className="text-slate-800">{d.max_arrears !== null ? d.max_arrears : "N/A"}</span></p>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                                <FaCalendarAlt className="text-rose-500" />
                                                {new Date(d.last_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button 
                                                onClick={() => deleteDrive(d.id, d.company_name)} 
                                                className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors border-2 border-red-700 shadow-sm flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <FaTrash /> Deactivate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {drives.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-16 text-center text-slate-400">
                                            <FaBuilding className="text-5xl mx-auto mb-3 opacity-30" />
                                            <p className="font-bold text-lg text-slate-600">No Active Drives</p>
                                            <p className="mt-1 text-slate-500">Create a new placement drive to see it listed here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ManageDrives;