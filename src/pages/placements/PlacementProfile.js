import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import {
    FaUserGraduate,
    FaSave,
    FaSpinner,
    FaEnvelope,
    FaPhoneAlt,
    FaGraduationCap,
    FaBriefcase,
    FaInfoCircle,
    FaCheckCircle,
    FaIdCard
} from "react-icons/fa";

const PlacementProfile = () => {
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
        willing_for_placement: 1,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const token = localStorage.getItem("token");

    // ================= LOAD PROFILE =================
    useEffect(() => {
        fetch(`${BASE_URL}/placementdrives/student/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setForm(prev => ({ ...prev, ...data }));
                }
            })
            .catch(() => {
                Swal.fire("Connection Error", "Failed to load your profile data.", "error");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    // ================= HANDLE INPUT =================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value
        }));
    };

    // ================= SAVE & VALIDATE =================
    const handleSave = async (e) => {
        e.preventDefault();

        // --- Front-End Validations ---
        if (!form.personal_email || !form.personal_mobile || !form.ug_cgpa) {
            return Swal.fire("Missing Info", "Email, Mobile, and CGPA are required.", "warning");
        }

        if (parseFloat(form.ug_cgpa) > 10 || parseFloat(form.ug_cgpa) < 0) {
            return Swal.fire("Invalid CGPA", "CGPA must be a valid number between 0 and 10.", "error");
        }

        if (parseFloat(form.tenth_percent) > 100 || parseFloat(form.twelfth_percent) > 100 || parseFloat(form.diploma_percent) > 100) {
            return Swal.fire("Invalid Marks", "Percentages cannot exceed 100. Do not include the '%' symbol.", "error");
        }

        if (form.history_of_arrears < 0) {
            return Swal.fire("Invalid Data", "History of arrears cannot be negative.", "error");
        }

        if (form.current_arrears_count < 0) {
            return Swal.fire("Invalid Data", "Current arrears cannot be negative.", "error");
        }

        try {
            setSaving(true);
            const res = await fetch(`${BASE_URL}/placementdrives/student/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Profile Saved!",
                    text: "Your placement details are up to date.",
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire("Update Failed", "Please check your inputs and try again.", "error");
            }
        } catch {
            Swal.fire("Error", "Something went wrong communicating with the server.", "error");
        } finally {
            setSaving(false);
        }
    };

    // ================= RENDER =================
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
                <FaSpinner className="animate-spin text-5xl mb-4" />
                <p className="font-bold text-slate-700">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-28 md:pb-12 font-sans overflow-x-hidden">
            
            {/* Header: App-style on mobile, Banner-style on desktop */}
            <div className="bg-indigo-600 px-6 pt-10 pb-12 rounded-b-[2.5rem] shadow-lg text-white md:rounded-3xl md:mt-8 md:pt-8 md:pb-8 max-w-5xl mx-auto transition-all relative z-0">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                        <FaUserGraduate className="text-3xl md:text-4xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl text-white text-left font-black tracking-tight drop-shadow-sm">Placement Profile</h1>
                        <p className="text-indigo-100 text-sm md:text-base font-medium mt-0.5">Manage your academic and contact details.</p>
                    </div>
                </div>
            </div>

            {/* Main Form Container */}
            <div className="max-w-5xl mx-auto px-4 md:px-0 -mt-6 md:mt-8 relative z-10">
                <form onSubmit={handleSave} className="space-y-5 md:space-y-6">

                    {/* Row 1: Contact & Personal (Side by side on desktop) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                        
                        {/* --- Card: Contact Details --- */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
                            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-3 text-lg border-b border-slate-100 pb-3">
                                <FaEnvelope className="text-indigo-500" /> Contact Info
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">Personal Email <span className="text-rose-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        name="personal_email"
                                        value={form.personal_email || ""}
                                        onChange={handleChange}
                                        placeholder="student@gmail.com"
                                        className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 transition-shadow hover:shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">Mobile Number <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            required
                                            name="personal_mobile"
                                            value={form.personal_mobile || ""}
                                            onChange={handleChange}
                                            placeholder="10-digit mobile number"
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 transition-shadow hover:shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Card: Personal Details --- */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
                            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-3 text-lg border-b border-slate-100 pb-3">
                                <FaIdCard className="text-indigo-500" /> Personal Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">Gender</label>
                                    <select
                                        name="gender"
                                        value={form.gender || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 appearance-none transition-shadow hover:shadow-inner"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={form.dob || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 transition-shadow hover:shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Academics (Full Width) */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-3 text-lg border-b border-slate-100 pb-3">
                            <FaGraduationCap className="text-indigo-500 text-xl" /> Academic Record 
                            <span className="text-xs font-normal text-slate-400 ml-auto md:ml-2">(Numbers only, no % symbol)</span>
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">10th Score</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="100"
                                    name="tenth_percent"
                                    value={form.tenth_percent || ""}
                                    onChange={handleChange}
                                    placeholder="85.5"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center transition-shadow hover:shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">12th Score</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="100"
                                    name="twelfth_percent"
                                    value={form.twelfth_percent || ""}
                                    onChange={handleChange}
                                    placeholder="82.0"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center transition-shadow hover:shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">Diploma</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="100"
                                    name="diploma_percent"
                                    value={form.diploma_percent || ""}
                                    onChange={handleChange}
                                    placeholder="N/A"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center transition-shadow hover:shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider ml-1 mb-1.5">UG CGPA <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    max="10"
                                    required
                                    name="ug_cgpa"
                                    value={form.ug_cgpa || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. 7.85"
                                    className="w-full px-4 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-indigo-700 text-center transition-shadow hover:shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Arrears & Actions (Side by side on desktop) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                        
                        {/* --- Card: Arrears & Standing --- */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5 h-full">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                                <FaInfoCircle className="text-blue-500 text-xl shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900 leading-snug">
                                    <p className="font-bold mb-1">Arrears Guide:</p>
                                    <p className="mb-1"><b>Current Arrears:</b> Papers you have not yet cleared.</p>
                                    <p><b>History of Arrears:</b> Total number of arrears you ever had in your academic journey.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">
                                        Current Arrears
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="current_arrears_count"
                                        value={form.current_arrears_count ?? ""}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center transition-shadow hover:shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5">
                                        Total History
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="history_of_arrears"
                                        value={form.history_of_arrears ?? ""}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center transition-shadow hover:shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- Card: Willingness Toggle & Desktop Save --- */}
                        <div className="flex flex-col gap-5 md:gap-6">
                            
                            {/* Willingness Card */}
                            <label className={`flex-1 flex flex-col justify-center p-6 md:p-8 rounded-3xl cursor-pointer shadow-sm border-2 transition-all active:scale-[0.98] group ${form.willing_for_placement === 1 ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-colors ${form.willing_for_placement === 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-400'}`}>
                                            <FaBriefcase />
                                        </div>
                                        <div>
                                            <span className={`font-black block text-xl ${form.willing_for_placement === 1 ? 'text-indigo-900' : 'text-slate-700'}`}>Placement Opt-in</span>
                                            <span className={`text-sm font-medium mt-0.5 block ${form.willing_for_placement === 1 ? 'text-indigo-700' : 'text-slate-500'}`}>Receive campus drive invites.</span>
                                        </div>
                                    </div>
                                    <div className="relative shrink-0">
                                        <input
                                            type="checkbox"
                                            name="willing_for_placement"
                                            checked={form.willing_for_placement === 1}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                </div>
                            </label>

                            {/* Save Button (Static on Desktop) */}
                            <div className="hidden lg:block shrink-0">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`w-full py-5 rounded-3xl font-black text-white text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95
                                      ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}
                                    `}
                                >
                                    {saving ? (
                                        <> <FaSpinner className="animate-spin text-xl" /> Saving Profile... </>
                                    ) : (
                                        <> <FaCheckCircle text-xl /> Save & Update Profile </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                    
                    {/* Mobile Only: Sticky App-like Action Button */}
                    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full max-w-2xl mx-auto py-4 rounded-2xl font-black text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95
                                ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                            `}
                        >
                            {saving ? (
                                <> <FaSpinner className="animate-spin" /> Saving... </>
                            ) : (
                                <> <FaCheckCircle /> Save Profile </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default PlacementProfile;