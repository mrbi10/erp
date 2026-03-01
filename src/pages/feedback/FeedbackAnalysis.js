import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../../constants/API";
import {
  FaSpinner,
  FaSearch,
  FaUserTie,
  FaChevronRight,
  FaStar,
  FaArrowLeft,
  FaFilter,
  FaGraduationCap
} from "react-icons/fa";

export default function FeedbackAnalysis({ user }) {
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [summaryType, setSummaryType] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  
  // Selection & Search States
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const token = localStorage.getItem("token");

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (!["HOD", "Principal", "Admin"].includes(user.role)) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/feedback/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data || [];
        setSessions(data);
        if (data.length > 0) handleSelectSession(data[0]);
      } catch (err) {
        Swal.fire("Error", "Failed to load sessions", "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  /* ================= FETCH ANALYTICS ================= */
  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setDataLoading(true);
      setSelectedStaffId(null);
      const res = await axios.get(
        `${BASE_URL}/feedback/session/${session.session_id}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummaryType(res.data.type);
      setAnalyticsData(res.data.data || []);
      
      // Auto-select first staff if available
      if (res.data.type === "staff" && res.data.data.length > 0) {
        setSelectedStaffId(res.data.data[0].staff_id);
      }
    } catch (err) {
      Swal.fire("Error", "Failed to load analytics", "error");
    } finally {
      setDataLoading(false);
    }
  };

  /* ================= DATA PROCESSING ================= */
  const staffList = useMemo(() => {
    if (summaryType !== "staff") return [];
    const map = {};
    analyticsData.forEach((row) => {
      if (!map[row.staff_id]) {
        map[row.staff_id] = {
          staff_id: row.staff_id,
          name: row.name,
          questions: [],
          total: 0,
          count: 0,
        };
      }
      map[row.staff_id].questions.push(row);
      if (row.question_type === "rating") {
        map[row.staff_id].total += Number(row.avg_rating);
        map[row.staff_id].count += 1;
      }
    });

    return Object.values(map)
      .map((s) => ({
        ...s,
        overall: s.count > 0 ? (s.total / s.count).toFixed(2) : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [analyticsData, summaryType]);

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStaff = useMemo(() => 
    staffList.find(s => s.staff_id === selectedStaffId),
    [staffList, selectedStaffId]
  );

  /* ================= RENDER HELPERS ================= */
  if (!["HOD", "Principal", "Admin"].includes(user.role)) {
    return <div className="p-20 text-center text-slate-400 font-bold">Access Denied</div>;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <FaSpinner className="animate-spin text-3xl text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900">
      
      {/* LEFT SIDEBAR: STAFF LIST */}
      <aside className={`
        ${isMobileDetailOpen ? 'hidden' : 'flex'} 
        md:flex flex-col w-full md:w-80 lg:w-96 border-r border-slate-100 bg-slate-50/50
      `}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Faculty</h2>
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
              {filteredStaff.length} Total
            </span>
          </div>

          {/* SESSION SELECTOR DROPDOWN */}
          <select 
            onChange={(e) => handleSelectSession(sessions.find(s => s.session_id === parseInt(e.target.value)))}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
          >
            {sessions.map(s => (
              <option key={s.session_id} value={s.session_id}>{s.title}</option>
            ))}
          </select>

          {/* SEARCH BAR (Simulating React-Select functionality) */}
          <div className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Quick search name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-600 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 custom-scrollbar">
          {filteredStaff.map((staff) => (
            <button
              key={staff.staff_id}
              onClick={() => {
                setSelectedStaffId(staff.staff_id);
                setIsMobileDetailOpen(true);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all group
                ${selectedStaffId === staff.staff_id 
                  ? "bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-100" 
                  : "hover:bg-slate-100/50 text-slate-500"}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs
                  ${selectedStaffId === staff.staff_id ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"}
                `}>
                  {staff.name.charAt(0)}
                </div>
                <div className="text-left">
                    <p className={`text-sm font-bold truncate max-w-[140px] ${selectedStaffId === staff.staff_id ? "text-slate-900" : ""}`}>
                        {staff.name}
                    </p>
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Overall: {staff.overall}</p>
                </div>
              </div>
              <FaChevronRight className={`text-[10px] transition-transform ${selectedStaffId === staff.staff_id ? "translate-x-1 text-indigo-600" : "opacity-0 group-hover:opacity-100"}`} />
            </button>
          ))}
        </div>
      </aside>

      {/* RIGHT PANE: DETAILED FEEDBACK */}
      <main className={`
        flex-1 flex flex-col bg-white transition-all
        ${!isMobileDetailOpen ? 'hidden md:flex' : 'flex'}
      `}>
        {dataLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Analytics</p>
            </div>
        ) : activeStaff ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* DETAIL HEADER */}
            <div className="p-6 md:p-12 border-b border-slate-50">
              <button 
                onClick={() => setIsMobileDetailOpen(false)}
                className="md:hidden flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-8"
              >
                <FaArrowLeft /> Back to List
              </button>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    Faculty Performance Profile
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    {activeStaff.name}
                  </h1>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[200px] shadow-2xl shadow-indigo-100">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Aggregate Score</span>
                    <div className="flex items-center gap-3">
                        <FaStar className="text-amber-400 text-2xl" />
                        <span className="text-5xl font-black tabular-nums">{activeStaff.overall}</span>
                    </div>
                </div>
              </div>
            </div>

            {/* QUESTIONS LIST */}
            <div className="p-6 md:p-12 max-w-4xl">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Detailed Question Breakdown</h3>
                
                <div className="space-y-12">
                    {activeStaff.questions.map((q, idx) => {
                        const score = Number(q.avg_rating);
                        const percentage = (score / 10) * 100;
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={idx} 
                                className="group"
                            >
                                <div className="flex justify-between items-start gap-6 mb-4">
                                    <div className="flex gap-4">
                                        <span className="text-slate-300 font-black text-sm tabular-nums">0{idx + 1}</span>
                                        <p className="text-lg font-bold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                            {q.question_text}
                                        </p>
                                    </div>
                                    <span className={`text-xl font-black tabular-nums ${score >= 8 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                        {score.toFixed(1)}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: "circOut" }}
                                        className={`h-full rounded-full ${score >= 8 ? 'bg-emerald-500' : 'bg-indigo-600'} shadow-lg shadow-indigo-100`}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FaUserTie className="text-4xl text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Faculty Selected</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Select a faculty member from the list on the left to view their detailed feedback analytics.</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
}