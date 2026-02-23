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
  FaSearch
} from "react-icons/fa";

export default function StudentDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null); // Tracks which specific drive is applying

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

  const applyDrive = async (id, companyName) => {
    // Optional: Double-check before applying
    const confirm = await Swal.fire({
      title: `Apply to ${companyName}?`,
      text: "Ensure your placement profile is up to date before applying.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Yes, Apply Now",
    });

    if (!confirm.isConfirmed) return;

    try {
      setApplyingId(id);
      const res = await fetch(`${BASE_URL}/placementdrives/${id}/apply`, {
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
        fetchDrives(); // Refresh to remove it from the "Eligible" list if backend handles it
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 text-indigo-700 rounded-lg text-2xl">
              <FaBriefcase />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Job Opportunities</h1>
              <p className="text-slate-600 font-medium mt-1">Drives matching your academic profile.</p>
            </div>
          </div>
          <div className="hidden md:flex bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 items-center gap-2">
            <span className="font-bold text-indigo-700 text-lg">{drives.length}</span>
            <span className="text-indigo-600 text-sm font-semibold">Eligible Drives</span>
          </div>
        </div>

        {/* DRIVES GRID */}
        {drives.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <FaSearch className="text-5xl text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">No Drives Available</h2>
            <p className="text-slate-500 font-medium max-w-md">There are currently no placement drives matching your eligibility criteria. Keep your profile updated and check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drives.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                
                {/* Card Top: Company & Role */}
                <div className="p-6 border-b border-slate-100 flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xl shrink-0">
                      <FaBuilding />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{d.company_name}</h2>
                      <p className="text-indigo-600 font-bold text-sm mt-1">{d.role}</p>
                    </div>
                  </div>

                  {d.description && (
                     <p className="text-sm text-slate-600 line-clamp-2 mt-2 font-medium">
                       {d.description}
                     </p>
                  )}
                </div>

                {/* Card Middle: Badges */}
                <div className="px-6 py-4 bg-slate-50 grid grid-cols-1 gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaMoneyBillWave className="text-emerald-500 text-lg shrink-0" />
                    <span className="font-bold text-sm">
                      CTC: <span className="text-emerald-700">{d.ctc ? `${d.ctc} LPA` : "Not Disclosed"}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaCalendarAlt className="text-rose-500 text-lg shrink-0" />
                    <span className="font-bold text-sm">
                      Apply By: <span className="text-rose-700">{formatDateTime(d.last_date)}</span>
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Action */}
                <div className="p-4 bg-white">
                  <button
                    onClick={() => applyDrive(d.id, d.company_name)}
                    disabled={applyingId === d.id}
                    className={`
                      w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all border-2
                      ${applyingId === d.id 
                        ? 'bg-indigo-400 border-indigo-400 cursor-not-allowed' 
                        : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700 hover:shadow-indigo-200'}
                    `}
                  >
                    {applyingId === d.id ? (
                      <><FaSpinner className="animate-spin text-lg" /> Applying...</>
                    ) : (
                      <><FaPaperPlane /> Apply Now</>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}