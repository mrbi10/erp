import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import {
    FaUserGraduate,
    FaEnvelope,
    FaPhoneAlt,
    FaGraduationCap,
    FaBriefcase,
    FaSpinner,
    FaCalendarAlt,
    FaVenusMars,
    FaSave,
    FaPaperPlane,
    FaExclamationCircle,
    FaCheckCircle,
    FaLock,
    FaUnlock,
    FaHistory,
    FaUniversity,
    FaIdCard
} from "react-icons/fa";

/**
 * @component StudentPlacementProfile
 * @description Integrated ERP Placement Profile module. 
 * Matches the color theme and layout of the Feedback system.
 */
export default function StudentPlacementProfile() {
    const token = localStorage.getItem("token");

    /* ===================== STATE ===================== */
    const [loading, setLoading] = useState(true);
    const [savingPersonal, setSavingPersonal] = useState(false);
    const [submittingAcademic, setSubmittingAcademic] = useState(false);
    
    const [academicStatus, setAcademicStatus] = useState(null); // 'pending', 'approved', 'rejected'
    const [academicChanged, setAcademicChanged] = useState(false);
    const [originalAcademic, setOriginalAcademic] = useState({});
    
    const [form, setForm] = useState({
        personal_email: "",
        personal_mobile: "",
        gender: "",
        dob: "",
        tenth_percent: "",
        twelfth_percent: "",
        diploma_percent: "",
        ug_cgpa: "",
        history_of_arrears: 0,
        current_arrears_count: 0,
        willing_for_placement: 1
    });

    /* ===================== INITIAL FETCH ===================== */
    const loadProfile = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await axios.get(`${BASE_URL}/placementdrives/student/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { studentData, academicRequest } = res.data;
            if (!studentData) return;

            setForm(prev => ({ ...prev, ...studentData }));
            
            // Set baseline for change detection
            const baseline = {
                tenth_percent: studentData.tenth_percent,
                twelfth_percent: studentData.twelfth_percent,
                diploma_percent: studentData.diploma_percent,
                ug_cgpa: studentData.ug_cgpa,
                history_of_arrears: studentData.history_of_arrears,
                current_arrears_count: studentData.current_arrears_count
            };
            setOriginalAcademic(baseline);

            if (academicRequest) {
                setAcademicStatus(academicRequest.status);
                // If pending, show the requested values in the form
                if (academicRequest.status === "pending") {
                    setForm(prev => ({
                        ...prev,
                        tenth_percent: academicRequest.tenth_percent,
                        twelfth_percent: academicRequest.twelfth_percent,
                        diploma_percent: academicRequest.diploma_percent,
                        ug_cgpa: academicRequest.ug_cgpa,
                        history_of_arrears: academicRequest.history_of_arrears,
                        current_arrears_count: academicRequest.current_arrears_count
                    }));
                }
            } else {
                setAcademicStatus(null);
            }
        } catch (error) {
            console.error(error);
            if (!silent) Swal.fire("Error", "Failed to load placement profile", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    /* ===================== HANDLERS ===================== */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? (checked ? 1 : 0) : value;

        setForm(prev => {
            const updated = { ...prev, [name]: newValue };
            
            // Track changes for academic fields specifically
            const academicFields = ["tenth_percent", "twelfth_percent", "diploma_percent", "ug_cgpa", "history_of_arrears", "current_arrears_count"];
            if (academicFields.includes(name)) {
                const hasChanged = academicFields.some(key => String(updated[key]) !== String(originalAcademic[key]));
                setAcademicChanged(hasChanged);
            }
            return updated;
        });
    };

    const savePersonalDetails = async () => {
        try {
            setSavingPersonal(true);
            await axios.put(`${BASE_URL}/placementdrives/student/profile`, {
                personal_email: form.personal_email,
                personal_mobile: form.personal_mobile,
                gender: form.gender,
                dob: form.dob,
                willing_for_placement: form.willing_for_placement
            }, { headers: { Authorization: `Bearer ${token}` } });

            Swal.fire({ title: "Success", text: "Contact information updated", icon: "success", timer: 1500, showConfirmButton: false });
        } catch (error) {
            Swal.fire("Update Failed", "Could not save personal details", "error");
        } finally {
            setSavingPersonal(false);
        }
    };

    const submitAcademicRequest = async () => {
        const result = await Swal.fire({
            title: "Submit for Approval?",
            text: "Your academic details will be sent to the CA for verification. You cannot edit them until reviewed.",
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            confirmButtonText: "Yes, Submit"
        });

        if (!result.isConfirmed) return;

        try {
            setSubmittingAcademic(true);
            await axios.post(`${BASE_URL}/placementdrives/student/academic-request`, {
                tenth_percent: form.tenth_percent,
                twelfth_percent: form.twelfth_percent,
                diploma_percent: form.diploma_percent,
                ug_cgpa: form.ug_cgpa,
                history_of_arrears: form.history_of_arrears,
                current_arrears_count: form.current_arrears_count
            }, { headers: { Authorization: `Bearer ${token}` } });

            setAcademicStatus("pending");
            setAcademicChanged(false);
            Swal.fire("Submitted", "Update request sent successfully", "success");
        } catch (error) {
            Swal.fire("Error", "Submission failed", "error");
        } finally {
            setSubmittingAcademic(false);
        }
    };

    /* ===================== RENDER: LOADING ===================== */
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
                <FaSpinner className="animate-spin text-5xl mb-4" />
                <p className="font-bold text-lg text-slate-700 uppercase tracking-widest">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans bg-white min-h-screen">
            
            {/* MODULE HEADER - Matches Feedback Style */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-100 text-indigo-700 rounded-lg">
                        <FaUserGraduate className="text-3xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Placement Eligibility Profile</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                           <FaUniversity className="text-indigo-600" /> Academic & Contact Information
                        </p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-lg border-2 font-black text-xs uppercase tracking-tighter flex items-center gap-2 
                    ${academicStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      academicStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {academicStatus === 'pending' ? <FaLock /> : <FaUnlock />}
                    Verification: {academicStatus || 'Clear'}
                </div>
            </div>

            {/* QUICK STATS - Integrated Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatItem label="UG Performance" value={`${form.ug_cgpa} CGPA`} icon={<FaCheckCircle />} color="indigo" />
                <StatItem label="Placement Status" value={form.willing_for_placement ? "Opted In" : "Opted Out"} icon={<FaBriefcase />} color={form.willing_for_placement ? "indigo" : "slate"} />
            </div>

            {/* MAIN FORM AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: PERSONAL INFORMATION */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
                                <FaIdCard /> Contact Info
                            </h3>
                            <button 
                                onClick={savePersonalDetails} 
                                disabled={savingPersonal}
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded transition-colors disabled:opacity-50"
                            >
                                {savingPersonal ? <FaSpinner className="animate-spin" /> : "Save"}
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <InputField label="Personal Email" name="personal_email" value={form.personal_email} onChange={handleChange} icon={<FaEnvelope />} />
                            <InputField label="Mobile Number" name="personal_mobile" value={form.personal_mobile} onChange={handleChange} icon={<FaPhoneAlt />} />
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Gender</label>
                                <div className="relative">
                                    <FaVenusMars className="absolute left-3 top-3.5 text-slate-400" />
                                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 transition-colors appearance-none">
                                        <option value="">Select</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                </div>
                            </div>
                            <InputField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} icon={<FaCalendarAlt />} />
                        </div>
                    </div>

                    {/* PLACEMENT TOGGLE - Clean Style */}
                    <div className={`p-6 rounded-xl border-2 transition-all flex items-center justify-between ${form.willing_for_placement ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Placement Participation</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{form.willing_for_placement ? "Active for campus drives" : "Opted out from drives"}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="willing_for_placement" className="sr-only peer" checked={form.willing_for_placement === 1} onChange={handleChange} />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>

                {/* RIGHT: ACADEMIC INFORMATION */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <FaGraduationCap className="text-indigo-600" /> Academic Performance
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Requires Class Advisor verification for updates</p>
                            </div>
                            {academicStatus === "pending" && (
                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-[10px] font-black uppercase flex items-center gap-2 border border-amber-200">
                                    <FaHistory /> Review Pending
                                </span>
                            )}
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                            <AcademicInput label="10th Percentage" name="tenth_percent" value={form.tenth_percent} onChange={handleChange} disabled={academicStatus === 'pending'} />
                            <AcademicInput label="12th Percentage" name="twelfth_percent" value={form.twelfth_percent} onChange={handleChange} disabled={academicStatus === 'pending'} />
                            <AcademicInput label="Diploma Percentage" name="diploma_percent" value={form.diploma_percent} onChange={handleChange} disabled={academicStatus === 'pending'} />
                            <AcademicInput label="UG CGPA" name="ug_cgpa" value={form.ug_cgpa} onChange={handleChange} disabled={academicStatus === 'pending'} />
                            <AcademicInput label="History of Arrears" name="history_of_arrears" value={form.history_of_arrears} onChange={handleChange} disabled={academicStatus === 'pending'} />
                            <AcademicInput label="Current Arrears" name="current_arrears_count" value={form.current_arrears_count} onChange={handleChange} disabled={academicStatus === 'pending'} />
                        </div>

                        {/* SUBMIT BUTTON - Contextual */}
                        {academicChanged && academicStatus !== 'pending' && (
                            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center">
                                <button 
                                    onClick={submitAcademicRequest} 
                                    disabled={submittingAcademic}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-3"
                                >
                                    {submittingAcademic ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                    Submit Academic Updates for Approval
                                </button>
                            </div>
                        )}
                    </div>

                    {/* NOTICE BOX - High Contrast */}
                    <div className="mt-6 bg-slate-50 border-2 border-dashed border-slate-300 p-6 rounded-xl flex gap-4">
                        <FaExclamationCircle className="text-slate-400 text-2xl shrink-0 mt-1" />
                        <div>
                            <p className="text-sm font-bold text-slate-700 tracking-tight">System Integrity Notice</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Modifications to marks and arrears require administrative override. Once submitted, your profile data will be locked until the review process is completed. 
                                <span className="text-indigo-600 font-bold"> Only reputable marks verified via certificates should be entered.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===================== SUB-COMPONENTS ===================== */

const StatItem = ({ label, value, icon, color }) => {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        rose: "bg-rose-50 text-rose-700 border-rose-200",
        slate: "bg-slate-50 text-slate-600 border-slate-200"
    };
    return (
        <div className={`p-5 rounded-xl border-2 ${colors[color]} flex items-center justify-between shadow-sm`}>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
                <p className="text-2xl font-black tracking-tight">{value}</p>
            </div>
            <div className="text-3xl opacity-20">{icon}</div>
        </div>
    );
};

const InputField = ({ label, icon, ...props }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-3.5 text-slate-400">{icon}</div>
            <input 
                {...props}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 transition-colors"
            />
        </div>
    </div>
);

const AcademicInput = ({ label, ...props }) => (
    <div className="relative">
        <label className="block text-xs font-black text-slate-700 uppercase mb-2 tracking-tight">{label}</label>
        <input 
            type="number" 
            step="0.01"
            {...props}
            className={`w-full bg-white border-b-4 border-slate-200 py-3 px-1 text-2xl font-black text-indigo-700 outline-none focus:border-indigo-500 transition-colors 
                ${props.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        />
        {props.disabled && <FaLock className="absolute right-0 bottom-4 text-slate-300" />}
    </div>
);

const EmptyState = ({ icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-sm">
        <div className="text-slate-300 text-7xl mb-6">{icon}</div>
        <h3 className="text-2xl font-bold text-slate-700 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium text-lg text-center max-w-md">{desc}</p>
    </div>
);