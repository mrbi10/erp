import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import {
  FaChartLine,
  FaBriefcase,
  FaFileAlt,
  FaCheckCircle,
  FaSpinner,
  FaPercentage,
  FaExclamationTriangle
} from "react-icons/fa";

// --- Sub-Component for UI Consistency ---
const StatCard = ({ label, value, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6 flex-1">
    <div className={`p-5 rounded-xl ${iconBg} ${iconColor} shadow-inner`}>
      <Icon className="text-3xl md:text-4xl" />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl md:text-5xl font-black text-slate-800 leading-none">{value}</p>
    </div>
  </div>
);

export default function DriveAnalytics() {
  const [stats, setStats] = useState({
    total_drives: 0,
    total_applications: 0,
    selected_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`${BASE_URL}/placementdrives/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        setStats(data || { total_drives: 0, total_applications: 0, selected_count: 0 });
      } catch (err) {
        console.error(err);
        setError(true);
        Swal.fire("Error", "Could not load analytics data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  // --- Derived Metrics ---
  // Calculate success rate percentage automatically
  const conversionRate = stats.total_applications > 0 
    ? ((stats.selected_count / stats.total_applications) * 100).toFixed(1) 
    : 0;

  // --- Render Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
        <FaSpinner className="animate-spin text-5xl mb-4" />
        <p className="font-bold text-slate-700 text-lg">Compiling Analytics...</p>
      </div>
    );
  }

  // --- Render Error ---
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <FaExclamationTriangle className="text-6xl mb-4 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Data Unavailable</h2>
        <p className="text-slate-500 font-medium mt-1">Please check your connection and try again.</p>
      </div>
    );
  }

  // --- Render Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-xl text-indigo-700">
            <FaChartLine className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Placement Analytics</h1>
            <p className="text-slate-500 font-medium mt-1 text-lg">High-level overview of campus recruitment performance.</p>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <StatCard 
            label="Total Drives Hosted" 
            value={stats.total_drives || 0} 
            icon={FaBriefcase} 
            iconBg="bg-blue-100" 
            iconColor="text-blue-700" 
          />
          
          <StatCard 
            label="Total Applications" 
            value={stats.total_applications || 0} 
            icon={FaFileAlt} 
            iconBg="bg-amber-100" 
            iconColor="text-amber-700" 
          />
          
          <StatCard 
            label="Students Selected" 
            value={stats.selected_count || 0} 
            icon={FaCheckCircle} 
            iconBg="bg-emerald-100" 
            iconColor="text-emerald-700" 
          />

          <StatCard 
            label="Overall Selection Rate" 
            value={`${conversionRate}%`} 
            icon={FaPercentage} 
            iconBg="bg-purple-100" 
            iconColor="text-purple-700" 
          />

        </div>
        
      </div>
    </div>
  );
}