import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUsers, FaPlusCircle, FaUniversity, FaUserTie,
    FaUserGraduate, FaSpinner, FaEdit, FaTrashAlt,
    FaCalendarAlt, FaTimes
} from "react-icons/fa";

import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptclassV2";

/* ---------------- SELECT STYLES ---------------- */
const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: "12px",
        border: state.isFocused ? "2px solid #4f46e5" : "1px solid #e2e8f0",
        padding: "4px",
        boxShadow: "none",
        "&:hover": { border: "1px solid #cbd5e0" }
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export default function ManageClubs({ user }) {
    const token = localStorage.getItem("token");

    const [clubs, setClubs] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        club_name: "",
        description: "",
        started_on: "",
        faculty_coordinators: [],
        student_coordinators: []
    });

    /* ---------------- DATA FETCHING ---------------- */
    const fetchClubs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/clubs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setClubs(Array.isArray(json) ? json : json.data || []);
        } catch {
            setClubs([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchStaff = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/faculty`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setStaffList(Array.isArray(json) ? json : json.data || []);
        } catch { }
    }, [token]);

    useEffect(() => {
        fetchClubs();
        fetchStaff();
    }, [fetchClubs, fetchStaff]);

    /* ---------------- HANDLERS ---------------- */
    const handleOpenModal = (club = null) => {
        if (club) {
            setEditingId(club.club_id);
            setForm({
                club_name: club.club_name,
                description: club.description || "",
                started_on: club.started_on ? club.started_on.split('T')[0] : "",
                // Note: These usually need to be mapped to {value, label} objects
                faculty_coordinators: club.faculty_data || [], 
                student_coordinators: club.student_data || []
            });
        } else {
            setEditingId(null);
            setForm({
                club_name: "", description: "", started_on: "",
                faculty_coordinators: [], student_coordinators: []
            });
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Club?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete it"
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${BASE_URL}/clubs/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    Swal.fire("Deleted!", "Club has been removed.", "success");
                    fetchClubs();
                }
            } catch {
                Swal.fire("Error", "Failed to delete club", "error");
            }
        }
    };

    const handleSave = async () => {
        if (!form.club_name) return Swal.fire("Required", "Club name is missing", "warning");

        const method = editingId ? "PATCH" : "POST";
        const url = editingId ? `${BASE_URL}/clubs/${editingId}` : `${BASE_URL}/clubs`;

        try {
            const payload = {
                ...form,
                faculty_coordinators: form.faculty_coordinators.map(c => c.value),
                student_coordinators: form.student_coordinators.map(c => c.value)
            };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                Swal.fire("Success", `Club ${editingId ? 'updated' : 'created'}!`, "success");
                setShowModal(false);
                fetchClubs();
            }
        } catch {
            Swal.fire("Error", "Transaction failed", "error");
        }
    };

    /* ---------------- OPTIONS ---------------- */
    const staffOptions = staffList.map((s) => ({
        value: s.staff_id,
        label: s.name,
        dept: DEPT_MAP[s.dept_id]
    }));

    const searchStudents = async (input) => {
        if (!input || input.length < 2) return [];
        const res = await fetch(`${BASE_URL}/students/search?q=${encodeURIComponent(input)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        return data.map((s) => ({
            value: s.student_id,
            label: s.name,
            dept: DEPT_MAP[s.dept_id],
            class: CLASS_MAP[s.class_id],
            roll_no: s.roll_no
        }));
    };

    return (
        <div className="p-6 lg:p-10 bg-[#f8fafc] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* TOP HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                            <FaUniversity size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 text-left tracking-tight">Manage Clubs</h1>
                            <p className="text-slate-500 font-medium">Create, update, and organize Clubs.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                        <FaPlusCircle /> Create New Club
                    </button>
                </div>

                {/* CLUB GRID */}
                {loading ? (
                    <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-indigo-600" /></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {clubs.map((club) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={club.club_id} 
                                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-left text-slate-800">{club.club_name}</h2>
                                        <p className="text-sm text-slate-500 line-clamp-2">{club.description || " "}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(club)} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><FaEdit /></button>
                                        <button onClick={() => handleDelete(club.club_id)} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"><FaTrashAlt /></button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    {/* FACULTY SECTION */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full mb-1 flex items-center gap-1"><FaUserTie /> Faculty Coordinators</span>
                                        {club.faculty_names?.split(',').map((name, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">{name.trim()}</span>
                                        )) || <span className="text-xs text-slate-400">Not Assigned</span>}
                                    </div>

                                    {/* STUDENT SECTION */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full mb-1 flex items-center gap-1"><FaUserGraduate /> Student Coordinators</span>
                                        {club.student_names?.split(',').map((name, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">{name.trim()}</span>
                                        )) || <span className="text-xs text-slate-400">Not Assigned</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL SYSTEM */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Update Club' : 'Create Club'}</h2>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><FaTimes /></button>
                                </div>

                                <div className="space-y-4">
                                    <input 
                                        type="text" placeholder="Club Name" value={form.club_name}
                                        onChange={(e) => setForm({...form, club_name: e.target.value})}
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-semibold"
                                    />
                                    <textarea 
                                        placeholder="Description..." value={form.description} rows={3}
                                        onChange={(e) => setForm({...form, description: e.target.value})}
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 ml-1">START DATE</label>
                                            <input type="date" value={form.started_on} onChange={(e) => setForm({...form, started_on: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none" />
                                        </div>
                                    </div>

                                    {/* MULTI SELECTS */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 ml-1">FACULTY COORDINATORS</label>
                                            <Select 
                                                isMulti options={staffOptions} styles={selectStyles} value={form.faculty_coordinators}
                                                onChange={(val) => setForm({...form, faculty_coordinators: val})}
                                                formatOptionLabel={(opt) => (
                                                    <div className="text-sm font-bold">{opt.label} <span className="text-slate-400 font-medium ml-1">({opt.dept})</span></div>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 ml-1">STUDENT COORDINATORS</label>
                                            <AsyncSelect 
                                                isMulti cacheOptions loadOptions={searchStudents} styles={selectStyles} value={form.student_coordinators}
                                                onChange={(val) => setForm({...form, student_coordinators: val})}
                                                formatOptionLabel={(opt) => (
                                                    <div className="py-1">
                                                        <div className="text-sm font-bold">{opt.label} <span className="text-indigo-600 ml-1 text-[10px] uppercase">{opt.class}</span></div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{opt.dept} • {opt.roll_no}</div>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                                    <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all">
                                        {editingId ? 'Save Changes' : 'Confirm & Create'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}