import React, { useEffect, useState, useMemo } from "react";
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
  FaSearch,
  FaFilter,
  FaExclamationCircle
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
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' | 'asc'

  const token = localStorage.getItem("token");

  /* ===================== INITIAL LOAD ===================== */
  useEffect(() => {
    if (!["HOD", "Principal", "Admin"].includes(user.role)) {
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
        const sessionData = res.data || [];
        setSessions(sessionData);
        
        // Auto-select most recent active session
        const activeSession = sessionData.find(s => s.is_active) || sessionData[0];
        if (activeSession) {
            handleSelectSession(activeSession);
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load feedback sessions", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error) {
      console.error(error);
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
      
      // Transform data if needed (e.g., ensure avg_rating is number)
      const formattedData = (res.data || []).map(q => ({
          ...q,
          avg_rating: Number(q.avg_rating)
      }));

      setQuestionBreakdown(formattedData);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load detailed breakdown", "error");
    } finally {
      setBreakdownLoading(false);
    }
  };

  /* ===================== HELPERS ===================== */

  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100";
    if (score >= 6) return "text-amber-600 bg-amber-50 border-amber-200 shadow-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-200 shadow-rose-100";
  };
  
  const getBarColor = (score) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Memoized Filter & Sort
  const processedStaffList = useMemo(() => {
    let list = staffSummary.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.subject_name && s.subject_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    list.sort((a, b) => {
        const diff = Number(a.avg_rating) - Number(b.avg_rating);
        return sortOrder === 'desc' ? -diff : diff;
    });

    return list;
  }, [staffSummary, searchTerm, sortOrder]);


  /* ===================== RENDER: ACCESS DENIED ===================== */
  if (!["HOD", "Principal", "Admin"].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <FaExclamationCircle className="text-4xl mb-4 opacity-20" />
        <p className="font-medium">Access Restricted</p>
        <p className="text-sm">Analytics dashboard is available for HOD & Principal roles only.</p>
      </div>
    );
  }

  /* ===================== RENDER: LOADING ===================== */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-bold animate-pulse">Loading Analytics Engine...</p>
      </div>
    );
  }

  /* ===================== RENDER: MAIN CONTENT ===================== */
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up font-sans text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             Feedback Analysis
          </h1>
          <p className="text-slate-500 mt-1">Deep dive into faculty performance metrics and student sentiment.</p>
        </div>

        {/* Session Pills */}
        <div className="flex flex-wrap gap-2">
            {sessions.map(s => (
                <button
                    key={s.session_id}
                    onClick={() => handleSelectSession(s)}
                    className={`
                        px-4 py-2 rounded-full text-xs font-bold border transition-all
                        ${selectedSession?.session_id === s.session_id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }
                    `}
                >
                    {s.title}
                </button>
            ))}
        </div>
      </div>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">

        {/* --- LEFT COLUMN: STAFF LIST (5 cols) --- */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
           
           {/* Search & Sort Controls */}
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-3 sticky top-4 z-10">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input 
                  type="text"
                  placeholder="Search faculty name..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedSession}
                />
              </div>
              <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                title="Sort by Rating"
              >
                <FaFilter className="text-xs" /> {sortOrder === 'desc' ? 'Top' : 'Low'}
              </button>
           </div>

           {/* List Container */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-[500px]">
              {dataLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <FaSpinner className="animate-spin text-3xl mb-3 text-indigo-500" />
                    <span className="text-sm font-medium">Processing Data...</span>
                 </div>
              ) : !selectedSession ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-300 text-center">
                    <FaChartPie className="text-6xl mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-slate-500">No Session Selected</h3>
                    <p className="text-xs mt-1">Select a feedback session from the top right to view faculty rankings.</p>
                 </div>
              ) : processedStaffList.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <FaSearch className="text-4xl mb-3 opacity-20" />
                    <p>No faculty found matching "{searchTerm}"</p>
                 </div>
              ) : (
                 <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {processedStaffList.map((s, i) => {
                      const isActive = selectedStaff?.staff_id === s.staff_id;
                      const rank = i + 1;
                      
                      return (
                        <button
                          key={s.staff_id}
                          onClick={() => handleSelectStaff(s)}
                          className={`w-full text-left p-4 border-b border-slate-50 hover:bg-indigo-50/30 transition-all flex items-center gap-4 group relative
                             ${isActive ? "bg-indigo-50/80 border-l-4 border-l-indigo-500 pl-3" : "border-l-4 border-l-transparent"}
                          `}
                        >
                           {/* Rank Badge */}
                           <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                              ${rank <= 3 ? "bg-amber-100 text-amber-700 shadow-sm" : "bg-slate-100 text-slate-500"}
                              ${isActive ? "scale-110 shadow-md" : ""}
                           `}>
                              {rank <= 3 ? <FaTrophy className={rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-amber-700"} /> : rank}
                           </div>

                           {/* Info */}
                           <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-sm truncate transition-colors ${isActive ? "text-indigo-900" : "text-slate-700"}`}>
                                {s.name}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">
                                {s.subject_name || "General Faculty"}
                              </p>
                              
                              {/* Mini Progress Bar */}
                              <div className="flex items-center gap-2 mt-1.5">
                                 <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${getBarColor(Number(s.avg_rating))}`} 
                                      style={{width: `${(Number(s.avg_rating)/10)*100}%`}}
                                    ></div>
                                 </div>
                                 <span className={`text-xs font-bold ${Number(s.avg_rating) >= 8 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {Number(s.avg_rating).toFixed(1)}
                                 </span>
                              </div>
                           </div>

                           {/* Active Indicator Arrow */}
                           {isActive && <FaArrowRight className="text-indigo-500 text-xs animate-pulse" />}
                        </button>
                      );
                    })}
                 </div>
              )}
           </div>
        </div>

        {/* --- RIGHT COLUMN: ANALYSIS (7 cols) --- */}
        <div className="lg:col-span-7 h-full">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[600px] flex flex-col relative overflow-hidden">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                 <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                    <FaListUl className="text-sm" />
                 </div>
                 <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Performance Breakdown</h2>
              </div>

              {/* Content Area */}
              {breakdownLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                    <FaSpinner className="animate-spin text-4xl mb-3 text-indigo-600" />
                    <p className="text-sm font-bold text-slate-500 animate-pulse">Analyzing Responses...</p>
                 </div>
              ) : !selectedStaff ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-300 text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-slate-200">
                       <FaUserTie className="text-4xl opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-500">Select Faculty Member</h3>
                    <p className="text-sm mt-2 max-w-xs mx-auto">Click on a name from the list to view detailed question-wise analysis.</p>
                 </div>
              ) : (
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                    
                    {/* Selected Staff Summary Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-200 p-6 md:p-8">
                       <div className="relative z-10 flex justify-between items-start">
                           <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-3">
                                <FaUserTie /> Faculty Report
                              </div>
                              <h2 className="text-2xl md:text-3xl text-white font-bold leading-tight">{selectedStaff.name}</h2>
                              <p className="text-indigo-200 text-sm mt-1 font-medium">{selectedStaff.subject_name || "Department Faculty"}</p>
                           </div>

                           <div className="text-right">
                              <p className="text-xs font-bold uppercase opacity-70 mb-1">Overall Rating</p>
                              <div className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                                {Number(selectedStaff.avg_rating).toFixed(1)}
                                <span className="text-lg opacity-50 ml-1">/10</span>
                              </div>
                           </div>
                       </div>
                       
                       {/* Decorative BG Icon */}
                       <FaChartBar className="absolute -bottom-6 -right-6 text-9xl text-white opacity-10 rotate-12" />
                    </div>

                    {/* Question Breakdown List */}
                    <div className="space-y-6">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Question Analysis</h3>
                       
                       {questionBreakdown.map((q, i) => (
                          <div key={i} className="group bg-slate-50 rounded-xl p-4 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all">
                             <div className="flex justify-between items-start mb-3 gap-4">
                                <div className="flex gap-3">
                                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-bold shadow-sm mt-0.5">
                                      {i + 1}
                                   </span>
                                   <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-indigo-900 transition-colors">
                                      {q.question_text}
                                   </p>
                                </div>
                                
                                <span className={`flex-shrink-0 text-sm font-extrabold px-2 py-1 rounded-md border ${getScoreColor(q.avg_rating)}`}>
                                   {Number(q.avg_rating).toFixed(1)}
                                </span>
                             </div>
                             
                             {/* Visual Bar */}
                             <div className="pl-9 pr-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                   <span>Performance</span>
                                   <span>{Number(q.avg_rating) >= 8 ? 'Excellent' : Number(q.avg_rating) >= 6 ? 'Good' : 'Needs Improvement'}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getBarColor(q.avg_rating)}`} 
                                      style={{ width: `${(q.avg_rating / 10) * 100}%` }}
                                    ></div>
                                </div>
                             </div>
                          </div>
                       ))}

                       {questionBreakdown.length === 0 && (
                          <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                             <p className="text-sm font-medium">No detailed question data available for this session.</p>
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