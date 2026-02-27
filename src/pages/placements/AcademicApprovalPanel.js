import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import {
    FaUserCheck,
    FaSpinner,
    FaCheck,
    FaTimes,
    FaIdCard,
    FaArrowRight,
    FaHistory,
    FaSearch,
    FaGraduationCap,
    FaFileAlt,
    FaUserShield,
    FaInbox,
    FaExclamationCircle
} from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

/**
 * @component AcademicApprovalPanel
 * @description Administrative dashboard for Class Advisors.
 * Clean ERP aesthetic focused on high legibility and data density.
 */
const AcademicApprovalPanel = () => {
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const loadRequests = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await axios.get(`${BASE_URL}/placementdrives/ca/academic-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            Swal.fire("Error", "Failed to load requests", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => { loadRequests(); }, []);

    const handleAction = async (id, type) => {
        const isApprove = type === 'approve';
        const result = await Swal.fire({
            title: isApprove ? 'Confirm Approval?' : 'Confirm Rejection?',
            text: isApprove ? "Update student records permanently?" : "Student will be notified of rejection.",
            icon: isApprove ? 'success' : 'warning',
            showCancelButton: true,
            confirmButtonColor: isApprove ? '#0f172a' : '#ef4444',
            confirmButtonText: isApprove ? 'Yes, Approve' : 'Yes, Reject',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            setProcessingId(id);
            const res = await axios.put(`${BASE_URL}/placementdrives/ca/academic-requests/${id}/${type}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200) {
                setRequests(prev => prev.filter(r => r.id !== id));
                Swal.fire({ title: "Success", icon: "success", timer: 1000, showConfirmButton: false });
            }
        } catch {
            Swal.fire("Error", "Action failed", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(req => 
        req.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900">
                <FaSpinner className="animate-spin text-4xl mb-4" />
                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Syncing Requests...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20 font-sans text-slate-900">
            
            {/* STICKY HEADER - ERP STYLE */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                            <FaUserShield size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Academic Approvals</h1>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Class Advisor Review Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search student name or roll..." 
                                className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-slate-900 font-bold text-slate-700 placeholder:text-slate-400 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => loadRequests()}
                            className="p-3.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            <FaHistory className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-10">
                
                {/* STATUS SUMMARY */}
                <div className="flex gap-10 overflow-x-auto pb-4 border-b border-slate-100 mb-10">
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{requests.length}</span>
                        <div className="leading-tight">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            <p className="text-xs font-bold text-slate-600">Requests</p>
                        </div>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-200 shrink-0"></div>
                    <div className="flex items-center gap-3 shrink-0">
                        <FaUserCheck className="text-2xl text-slate-300" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue Status</p>
                            <p className="text-xs font-bold text-slate-600 italic">Waiting for review</p>
                        </div>
                    </div>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                        <FaInbox className="text-5xl text-slate-200 mb-4" />
                        <h3 className="text-xl font-black text-slate-700">All Caught Up</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">No academic change requests found.</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {filteredRequests.map((req) => (
                            <div key={req.id} className="group">
                                
                                {/* STUDENT HEADER */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center text-2xl font-black border border-slate-200">
                                            {req.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{req.name}</h2>
                                            <div className="flex flex-wrap gap-4 mt-1">
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    <FaIdCard className="text-slate-300" /> {req.roll_no}
                                                </span>
                                                <span className="text-slate-200">•</span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    <FaGraduationCap className="text-slate-300" /> {DEPT_MAP[req.dept_id]}
                                                </span>
                                                <span className="text-slate-200">•</span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    <FaFileAlt className="text-slate-300" /> {CLASS_MAP[req.class_id]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-amber-50 rounded-lg border border-amber-100 text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <FaExclamationCircle /> Action Required
                                    </div>
                                </div>

                                {/* DATA COMPARISON TABLE */}
                                <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-slate-100">
                                        {[
                                            { key: "tenth_percent", label: "10th Percentage" },
                                            { key: "twelfth_percent", label: "12th Percentage" },
                                            { key: "diploma_percent", label: "Diploma Score" },
                                            { key: "ug_cgpa", label: "Current CGPA" },
                                            { key: "current_arrears_count", label: "Active Backlogs" },
                                            { key: "history_of_arrears", label: "Backlog History" }
                                        ].map(field => {
                                            const oldVal = req[`current_${field.key}`] ?? "0.00";
                                            const newVal = req[field.key] ?? "0.00";
                                            const changed = String(oldVal) !== String(newVal);

                                            return (
                                                <div key={field.key} className={`p-8 ${changed ? 'bg-slate-50/50' : ''}`}>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{field.label}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-slate-400">{oldVal}</span>
                                                        {changed ? (
                                                            <>
                                                                <FaArrowRight className="text-slate-300 text-xs" />
                                                                <span className="text-xl font-black text-slate-900 underline decoration-indigo-500 decoration-4 underline-offset-8">{newVal}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">No Change</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* FOOTER ACTIONS */}
                                    <div className="bg-slate-50/50 p-6 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={!!processingId}
                                            className="flex-1 bg-slate-900 hover:bg-black text-white h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {processingId === req.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                            Confirm Approval
                                        </button>

                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={!!processingId}
                                            className="px-10 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {processingId === req.id ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                                
                                {/* SECTION DIVIDER */}
                                <div className="h-[1px] bg-slate-100 w-full mt-16 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                )}

                <footer className="mt-20 py-10 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Integrated Academic Review v3.0</p>
                </footer>
            </main>
        </div>
    );
};

export default AcademicApprovalPanel;