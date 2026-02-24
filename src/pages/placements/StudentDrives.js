import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { 
  FaBriefcase, 
  FaSpinner, 
  FaBuilding, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaPaperPlane,
  FaSearch,
  FaTimes,
  FaGraduationCap,
  FaInfoCircle,
  FaFileAlt
} from "react-icons/fa";

export default function StudentDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  
  // Modal State
  const [selectedDrive, setSelectedDrive] = useState(null);

  const token = localStorage.getItem("token");

  // --- Date Formatter ---
  const formatDateTime = (dateString) => {
    if (!dateString) return "No Deadline";
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/placementdrives/student/eligible`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDrives(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire("Connection Error", "Failed to load available drives.", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyDrive = async (drive) => {
    const confirm = await Swal.fire({
      title: `Apply to ${drive.company_name}?`,
      text: "Ensure your placement profile is up to date before applying.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Yes, Apply Now",
    });

    if (!confirm.isConfirmed) return;

    try {
      setApplyingId(drive.id);
      const res = await fetch(`${BASE_URL}/placementdrives/${drive.id}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Application Submitted!",
          text: data.message || "You have successfully applied to this drive.",
          timer: 2000,
          showConfirmButton: false
        });
        setSelectedDrive(null); // Close modal on success
        fetchDrives(); // Refresh list to remove applied drive
      } else {
        Swal.fire("Application Failed", data.message || "You cannot apply to this drive.", "error");
      }
    } catch {
      Swal.fire("Error", "Something went wrong while applying.", "error");
    } finally {
      setApplyingId(null);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  // --- RENDER: LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
        <FaSpinner className="animate-spin text-5xl mb-4" />
        <p className="font-bold text-slate-700">Finding Opportunities...</p>
      </div>
    );
  }

  // --- RENDER: MAIN ---
  return (
    <div >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 text-indigo-700 rounded-xl text-2xl">
              <FaBriefcase />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-left text-slate-800 tracking-tight">Job Opportunities</h1>
              <p className="text-slate-600 font-medium mt-1 text-sm md:text-base">Drives matching your academic profile.</p>
            </div>
          </div>
          <div className="hidden md:flex bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 items-center gap-2">
            <span className="font-black text-indigo-700 text-xl">{drives.length}</span>
            <span className="text-indigo-600 text-sm font-bold uppercase tracking-wide">Eligible</span>
          </div>
        </div>

        {/* DRIVES GRID */}
        {drives.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-slate-100">
              <FaSearch className="text-5xl text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">No Drives Available</h2>
            <p className="text-slate-500 font-medium max-w-md">There are currently no placement drives matching your eligibility criteria. Keep your profile updated and check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drives.map((d) => (
              <div key={d.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer" onClick={() => setSelectedDrive(d)}>
                
                {/* Card Top: Company & Role */}
                <div className="p-6 border-b border-slate-100 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-2xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <FaBuilding />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">{d.company_name}</h2>
                      <p className="text-indigo-600 font-bold text-sm">{d.role}</p>
                    </div>
                  </div>
                </div>

                {/* Card Middle: Badges */}
                <div className="px-6 py-4 bg-slate-50 grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FaMoneyBillWave /></div>
                    <span className="font-bold text-sm">
                      <span className="text-emerald-700 text-base">{d.ctc ? `₹${d.ctc} LPA` : "Not Disclosed"}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><FaCalendarAlt /></div>
                    <span className="font-bold text-sm text-slate-800">
                      {formatDateTime(d.last_date)}
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Action */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <button className="w-full py-3 rounded-xl font-bold text-indigo-700 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                    View Details & Apply &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ===================== DETAILS MODAL ===================== */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 md:p-4">
          
          {/* Modal Container */}
          <div className="bg-white w-full max-w-2xl md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-800 p-6 flex justify-between items-start sticky top-0 z-10 text-white">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md border border-white/20">
                  <FaBuilding />
                </div>
                <div>
                  <h2 className="text-2xl text-white font-black tracking-tight">{selectedDrive.company_name}</h2>
                  <p className="text-white-300 font-bold tracking-wide mt-1">{selectedDrive.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDrive(null)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-full transition-colors text-white">
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-50">
              
              {/* Highlight Banner */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Package</p>
                  <p className="text-xl font-black text-emerald-800">{selectedDrive.ctc ? `₹${selectedDrive.ctc} LPA` : "Not Disclosed"}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Apply Before</p>
                  <p className="text-sm font-bold text-rose-800">{formatDateTime(selectedDrive.last_date)}</p>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <FaFileAlt className="text-indigo-500" /> About the Role
                </h3>
                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm md:text-base bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  {selectedDrive.description || <span className="italic text-slate-400">No detailed description provided by the recruiter.</span>}
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <FaGraduationCap className="text-indigo-500" /> Eligibility Criteria
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
                     <div className="p-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min. UG CGPA</p>
                       <p className="text-lg font-black text-slate-800">{selectedDrive.min_ug_cgpa || "No Limit"}</p>
                     </div>
                     <div className="p-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Active Arrears</p>
                       <p className="text-lg font-black text-slate-800">{selectedDrive.max_arrears !== null ? selectedDrive.max_arrears : "Any"}</p>
                     </div>
                     <div className="p-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">10th Percentage</p>
                       <p className="text-lg font-black text-slate-800">{selectedDrive.min_10th_percent ? `${selectedDrive.min_10th_percent}%` : "No Limit"}</p>
                     </div>
                     <div className="p-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">12th Percentage</p>
                       <p className="text-lg font-black text-slate-800">{selectedDrive.min_12th_percent ? `${selectedDrive.min_12th_percent}%` : "No Limit"}</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Area */}
            <div className="p-5 bg-white border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 pb-safe">
              <button 
                onClick={() => setSelectedDrive(null)}
                className="hidden md:block py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => applyDrive(selectedDrive)}
                disabled={applyingId === selectedDrive.id}
                className={`
                  py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 text-lg transition-transform active:scale-95 border-2 md:col-span-1
                  ${applyingId === selectedDrive.id 
                    ? 'bg-indigo-400 border-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700'}
                `}
              >
                {applyingId === selectedDrive.id ? (
                  <><FaSpinner className="animate-spin" /> Submitting...</>
                ) : (
                  <><FaPaperPlane /> Apply for this Drive</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Safe area spacing for mobile browsers */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}