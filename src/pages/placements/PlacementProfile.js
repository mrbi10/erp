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
    FaCheckCircle
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
        <div className="min-h-screen bg-slate-100 pb-24 md:pb-8 font-sans">
            {/* Mobile-style Top Header */}
            <div className="bg-indigo-600 px-6 pt-10 pb-6 rounded-b-3xl shadow-md text-white md:max-w-2xl md:mx-auto md:rounded-b-none md:pt-8 md:mt-0">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <FaUserGraduate className="text-3xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl text-white font-black tracking-tight">Placement Profile</h1>
                        <p className="text-indigo-100 text-sm font-medium mt-0.5">Keep your details updated for drives</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-10 space-y-5">
                <form onSubmit={handleSave} className="space-y-5">

                    {/* --- Card 1: Contact Details --- */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FaEnvelope className="text-indigo-500" /> Contact Info
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">Personal Email <span className="text-rose-500">*</span></label>
                                <input
                                    type="email"
                                    required
                                    name="personal_email"
                                    value={form.personal_email || ""}
                                    onChange={handleChange}
                                    placeholder="student@gmail.com"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">Mobile Number <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        required
                                        name="personal_mobile"
                                        value={form.personal_mobile || ""}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile number"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Card: Personal Details --- */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FaUserGraduate className="text-indigo-500" /> Personal Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Gender */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={form.gender || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>

                            {/* DOB */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">
                                    Date of Birth (DD-MM-YYYY)
                                </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={form.dob || ""}
                                    onChange={handleChange}
                                    placeholder="DD-MM-YYYY"
                                    pattern="\d{2}-\d{2}-\d{4}"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                                />
                            </div>

                        </div>
                    </div>

                    {/* --- Card 2: Academic Record --- */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FaGraduationCap className="text-indigo-500 text-lg" /> Academics <span className="text-xs font-normal text-slate-400 ml-1">(Numbers only, no % symbol)</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">10th Score</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="100"
                                    name="tenth_percent"
                                    value={form.tenth_percent || ""}
                                    onChange={handleChange}
                                    placeholder="85.5"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">12th Score</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="100"
                                    name="twelfth_percent"
                                    value={form.twelfth_percent || ""}
                                    onChange={handleChange}
                                    placeholder="82.0"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">Diploma</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="100"
                                    name="diploma_percent"
                                    value={form.diploma_percent || ""}
                                    onChange={handleChange}
                                    placeholder="N/A"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1 text-indigo-600">UG CGPA <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    max="10"
                                    required
                                    name="ug_cgpa"
                                    value={form.ug_cgpa || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. 7.85"
                                    className="w-full px-4 py-3.5 bg-indigo-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-indigo-700 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- Card 3: Arrears & Standing --- */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-5">

                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <FaInfoCircle className="text-blue-500 text-xl shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900 leading-snug">
                                <p className="font-bold mb-1">Arrears Guide:</p>
                                <p><b>Current Arrears:</b> Papers you have not yet cleared.</p>
                                <p><b>History of Arrears:</b> Total number of arrears you ever had in your academic journey.</p>
                            </div>
                        </div>

                        {/* Current Arrears */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">
                                Current Standing Arrears
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="current_arrears_count"
                                value={form.current_arrears_count ?? ""}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                            />
                        </div>

                        {/* History of Arrears */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1">
                                Total History of Arrears
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="history_of_arrears"
                                value={form.history_of_arrears ?? ""}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                Enter 0 if you never had any arrears.
                            </p>
                        </div>

                    </div>

                    {/* --- Card 4: Willingness Toggle --- */}
                    <label className={`flex items-center justify-between p-5 rounded-3xl cursor-pointer shadow-sm border-2 transition-all active:scale-[0.98] ${form.willing_for_placement === 1 ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${form.willing_for_placement === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <FaBriefcase />
                            </div>
                            <div>
                                <span className={`font-black block text-lg ${form.willing_for_placement === 1 ? 'text-indigo-900' : 'text-slate-700'}`}>Placement Opt-in</span>
                                <span className={`text-xs font-medium ${form.willing_for_placement === 1 ? 'text-indigo-700' : 'text-slate-500'}`}>Receive campus drive invites.</span>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="willing_for_placement"
                                checked={form.willing_for_placement === 1}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                    </label>

                    {/* Mobile Spacer (Allows scrolling past the sticky button) */}
                    <div className="h-20 md:h-0"></div>

                    {/* --- Sticky App-like Action Button --- */}
                    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50 md:relative md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full max-w-2xl mx-auto py-4 rounded-2xl font-black text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95
                  ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
                        >
                            {saving ? (
                                <> <FaSpinner className="animate-spin" /> Saving Profile... </>
                            ) : (
                                <> <FaCheckCircle /> Save & Update Profile </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default PlacementProfile;