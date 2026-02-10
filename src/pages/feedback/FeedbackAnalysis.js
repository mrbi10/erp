import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import {
  FaSpinner,
  FaChartBar,
  FaUserTie,
  FaListUl,
  FaChartPie,
  FaArrowRight,
  FaTrophy,
  FaSearch
} from "react-icons/fa";

export default function FeedbackAnalysis({ user }) {
  /* ===================== STATE ===================== */
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const [staffSummary, setStaffSummary] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [questionBreakdown, setQuestionBreakdown] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    if (!["HOD", "Principal"].includes(user.role)) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${BASE_URL}/feedback/sessions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSessions(res.data || []);
      } catch {
        Swal.fire("Error", "Failed to load feedback sessions", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user.role, token]);

  /* ===================== HANDLERS ===================== */

  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setSelectedStaff(null);
      setStaffSummary([]);
      setQuestionBreakdown([]);
      setDataLoading(true);
      setSearchTerm("");

      const res = await axios.get(
        `${BASE_URL}/feedback/session/${session.session_id}/staff-summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffSummary(res.data || []);
    } catch {
      Swal.fire("Error", "Failed to load staff summary", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSelectStaff = async (staff) => {
    if (!selectedSession) return;

    try {
      setSelectedStaff(staff);
      setQuestionBreakdown([]);
      setBreakdownLoading(true);

      const res = await axios.get(
        `${BASE_URL}/feedback/session/${selectedSession.session_id}/staff/${staff.staff_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuestionBreakdown(res.data || []);
    } catch {
      Swal.fire("Error", "Failed to load question breakdown", "error");
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Helper for color coding scores
  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 6) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };
  
  const getBarColor = (score) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Filter staff based on search
  const filteredStaff = staffSummary.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ===================== ACCESS GUARD ===================== */

  if (!["HOD", "Principal"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 font-medium">
        Access restricted to HOD and Principal.
      </div>
    );
  }

  /* ===================== LOADING ===================== */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Initializing analytics module...</p>
      </div>
    );
  }

  /* ===================== RENDER ===================== */

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in-up">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-200">
               <FaChartBar />
             </div>
             Feedback Analysis
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-1">
            Deep dive into faculty performance metrics.
          </p>
        </div>
      </div>

      {/* SESSION TABS */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {sessions.length === 0 && (
           <span className="p-3 text-slate-400 text-sm">No feedback sessions found.</span>
        )}
        {sessions.map(s => (
          <button
            key={s.session_id}
            onClick={() => handleSelectSession(s)}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${selectedSession?.session_id === s.session_id
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}
            `}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">

        {/* LEFT COLUMN: STAFF LIST */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
           
           {/* Search & Header */}
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <FaUserTie className="text-indigo-600" /> Faculty Search
              </h2>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-slate-400 text-sm" />
                <input 
                  type="text"
                  placeholder="Search faculty..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedSession}
                />
              </div>
           </div>

           {/* List Container */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
              {dataLoading ? (
                 <div className="flex-1 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
                 </div>
              ) : !selectedSession ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                    <FaChartPie className="text-4xl mb-3 opacity-20" />
                    <p className="text-sm">Select a session to view staff</p>
                 </div>
              ) : filteredStaff.length === 0 ? (
                 <div className="p-8 text-center text-slate-400">No staff found matching your criteria.</div>
              ) : (
                 <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                    {filteredStaff.map((s, i) => (
                      <button
                        key={s.staff_id}
                        onClick={() => handleSelectStaff(s)}
                        className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 group
                           ${selectedStaff?.staff_id === s.staff_id ? "bg-indigo-50/60 border-indigo-100" : ""}
                        `}
                      >
                         {/* Rank/Avatar */}
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                            ${selectedStaff?.staff_id === s.staff_id ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-500"}
                         `}>
                            {i < 3 ? <FaTrophy className={i === 0 ? "text-amber-300" : "text-white"} /> : `#${i+1}`}
                         </div>

                         {/* Info */}
                         <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-sm truncate ${selectedStaff?.staff_id === s.staff_id ? "text-indigo-900" : "text-slate-700"}`}>
                              {s.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${getBarColor(s.avg_rating)}`} style={{width: `${(s.avg_rating/10)*100}%`}}></div>
                               </div>
                               <span className="text-xs font-medium text-slate-400">{s.avg_rating}</span>
                            </div>
                         </div>

                         {/* Arrow */}
                         <FaArrowRight className={`text-xs transition-transform ${selectedStaff?.staff_id === s.staff_id ? "text-indigo-600 translate-x-1" : "text-slate-300 group-hover:text-slate-400"}`} />
                      </button>
                    ))}
                 </div>
              )}
           </div>
        </div>

        {/* RIGHT COLUMN: ANALYSIS */}
        <div className="lg:col-span-7">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[500px] flex flex-col">
              
              <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-2xl">
                 <FaListUl className="text-indigo-600" />
                 <h2 className="font-bold text-slate-700">Detailed Breakdown</h2>
              </div>

              {breakdownLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <FaSpinner className="animate-spin text-3xl mb-3 text-indigo-600" />
                    <p className="text-sm font-medium">Analyzing Feedback...</p>
                 </div>
              ) : !selectedStaff ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                       <FaChartBar className="text-3xl opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">No Staff Selected</h3>
                    <p className="text-sm mt-2 max-w-xs mx-auto">Click on a faculty member from the list to view their question-wise performance analysis.</p>
                 </div>
              ) : (
                 <div className="p-6 overflow-y-auto max-h-[600px] custom-scrollbar space-y-6">
                    
                    {/* Selected Staff Header Card */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-white p-6 rounded-xl border border-slate-100 mb-6">
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis For</p>
                          <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedStaff.name}</h2>
                       </div>
                       <div className={`px-4 py-2 rounded-xl border text-center ${getScoreColor(selectedStaff.avg_rating)}`}>
                          <p className="text-xs font-bold uppercase opacity-80">Overall Score</p>
                          <p className="text-2xl font-extrabold">{selectedStaff.avg_rating}</p>
                       </div>
                    </div>

                    {/* Questions Grid */}
                    <div className="space-y-6">
                       {questionBreakdown.map((q, i) => (
                          <div key={i} className="group">
                             <div className="flex justify-between items-end mb-2">
                                <p className="text-sm font-medium text-slate-700 w-[85%] leading-relaxed group-hover:text-indigo-700 transition-colors">
                                  <span className="text-slate-400 font-bold mr-2">Q{i+1}.</span>
                                  {q.question_text}
                                </p>
                                <span className={`text-sm font-bold ${q.avg_rating >= 8 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                   {q.avg_rating}
                                </span>
                             </div>
                             
                             <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(q.avg_rating)}`} 
                                  style={{ width: `${(q.avg_rating / 10) * 100}%` }} // Assuming max 10
                                ></div>
                             </div>
                          </div>
                       ))}
                       
                       {questionBreakdown.length === 0 && (
                          <div className="text-center py-10 text-slate-400">
                             No detailed question data available.
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}