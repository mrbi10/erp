import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import {
  FaSpinner,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaChartPie,
  FaUserTie,
  FaClipboardList,
  FaTrophy,
  FaHistory,
  FaExclamationCircle
} from "react-icons/fa";

export default function ViewFeedback({ user }) {

  /* ===================== STATE ===================== */
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Student Data
  const [myFeedback, setMyFeedback] = useState([]);

  // CA / HOD / Principal Data
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Specific Data containers
  const [submissionSummary, setSubmissionSummary] = useState(null); // For CA
  const [staffSummary, setStaffSummary] = useState([]); // For HOD/Principal

  const token = localStorage.getItem("token");

  /* ===================== INITIAL FETCH ===================== */
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (user.role === "student") {
          const res = await axios.get(
            `${BASE_URL}/feedback/student/my-feedback`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMyFeedback(res.data || []);
        } else {
          // Load Sessions for Staff Roles
          const sessRes = await axios.get(
            `${BASE_URL}/feedback/sessions`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSessions(sessRes.data || []);
          
          // Auto-select the most recent session if available
          if (sessRes.data && sessRes.data.length > 0) {
             handleSelectSession(sessRes.data[0]); 
          }
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load feedback module", "error");
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
      setSessionLoading(true);
      setSubmissionSummary(null);
      setStaffSummary([]);

      if (user.role === "CA") {
        const res = await axios.get(
          `${BASE_URL}/feedback/class/submission-summary/${session.session_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmissionSummary(res.data);
      } else if (["HOD", "Principal", "Admin"].includes(user.role)) {
        const res = await axios.get(
          `${BASE_URL}/feedback/session/${session.session_id}/staff-summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStaffSummary(res.data || []);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load session data", "error");
    } finally {
      setSessionLoading(false);
    }
  };

  /* ===================== RENDER: LOADING ===================== */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-bold animate-pulse">Initializing Feedback Module...</p>
      </div>
    );
  }

  /* ===================== RENDER: STUDENT VIEW ===================== */
  if (user.role === "student") {
    if (myFeedback.length === 0) {
      return (
        <EmptyState 
          icon={<FaHistory />} 
          title="No History Found" 
          desc="You haven't submitted any feedback yet." 
        />
      );
    }

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b border-slate-200">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
             <FaStar className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Feedback History</h1>
            <p className="text-slate-500 text-sm">A record of your anonymous evaluations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myFeedback.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
              
              {/* Card Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                    <FaUserTie />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{item.staff_name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{item.subject_name || "Faculty"}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
              </div>

              {/* Ratings List */}
              <div className="p-6 space-y-5">
                {item.ratings.map((r, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-medium text-slate-600 leading-tight max-w-[85%]">{r.question}</span>
                      <span className="text-sm font-bold text-indigo-600">{r.rating}/10</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                       <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            r.rating >= 8 ? 'bg-emerald-400' : r.rating >= 5 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${(r.rating / 10) * 100}%` }}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ===================== RENDER: CLASS ADVISOR (CA) VIEW ===================== */
  if (user.role === "CA") {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FaUsers className="text-indigo-600" /> Class Compliance Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">Monitor feedback submission status for your class.</p>
          </div>
        </div>

        {/* Session Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSelectSession(s)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-bold border transition-all
                ${selectedSession?.session_id === s.session_id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}
              `}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {sessionLoading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
          </div>
        ) : !selectedSession ? (
           <EmptyState icon={<FaClipboardList />} title="Select a Session" desc="Choose a feedback session to view statistics." />
        ) : submissionSummary ? (
          
          <div className="space-y-8">
            {/* 1. Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {/* Percentage Visual */}
               <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Completion</p>
                    <p className="text-4xl font-extrabold mt-1">
                      {submissionSummary.total > 0 
                        ? Math.round((submissionSummary.submitted_count / submissionSummary.total) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <FaChartPie className="text-7xl opacity-20 absolute -right-2 -bottom-4 rotate-12" />
               </div>

               <StatCard 
                  label="Total Students" 
                  value={submissionSummary.total} 
                  icon={<FaUsers />} 
                  color="slate" 
               />
               <StatCard 
                  label="Submitted" 
                  value={submissionSummary.submitted_count} 
                  icon={<FaCheckCircle />} 
                  color="emerald" 
               />
               <StatCard 
                  label="Pending" 
                  value={submissionSummary.not_submitted_count} 
                  icon={<FaExclamationCircle />} 
                  color="rose" 
               />
            </div>

            {/* 2. Lists (Submitted vs Pending) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <StudentListCard 
                title="✅ Submission Complete" 
                count={submissionSummary.submitted_count}
                data={submissionSummary.submitted_students} 
                type="success"
              />
              <StudentListCard 
                title="⚠️ Action Required" 
                count={submissionSummary.not_submitted_count}
                data={submissionSummary.not_submitted_students} 
                type="danger"
              />
            </div>
          </div>
        ) : (
          <EmptyState icon={<FaExclamationCircle />} title="No Data" desc="No submission data available for this session." />
        )}
      </div>
    );
  }

  /* ===================== RENDER: HOD / PRINCIPAL VIEW ===================== */
  if (["HOD", "Principal", "Admin"].includes(user.role)) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Performance Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Aggregate feedback scores per staff member.</p>
        </div>

        {/* Session Selector */}
        <div className="flex flex-wrap gap-2">
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSelectSession(s)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-bold border transition-all
                ${selectedSession?.session_id === s.session_id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}
              `}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {sessionLoading ? (
          <div className="flex justify-center py-20">
             <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
          </div>
        ) : !selectedSession ? (
           <EmptyState icon={<FaChartPie />} title="Select Analysis Session" desc="Choose a session to view the leaderboard." />
        ) : staffSummary.length > 0 ? (
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-5">Rank</th>
                    <th className="p-5">Faculty Name</th>
                    <th className="p-5 w-1/3 min-w-[200px]">Average Rating</th>
                    <th className="p-5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffSummary
                    .sort((a, b) => b.avg_rating - a.avg_rating)
                    .map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-5">
                         {i === 0 ? <FaTrophy className="text-amber-400 text-xl drop-shadow-sm" /> : 
                          i === 1 ? <FaTrophy className="text-slate-400 text-lg" /> :
                          i === 2 ? <FaTrophy className="text-amber-700 text-lg" /> :
                           <span className="text-slate-400 font-bold ml-1 text-sm">#{i + 1}</span>
                         }
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700 block group-hover:text-indigo-700 transition-colors">{s.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{s.subject_name || "Faculty"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                             className={`h-full rounded-full shadow-sm ${
                               s.avg_rating >= 8 ? "bg-emerald-500" : s.avg_rating >= 6 ? "bg-amber-500" : "bg-rose-500"
                             }`}
                             style={{ width: `${(s.avg_rating / 10) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-5 text-right font-bold text-slate-800 text-lg">
                        {Number(s.avg_rating).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState icon={<FaExclamationCircle />} title="No Ratings" desc="No feedback data found for this session." />
        )}
      </div>
    );
  }

  // Fallback
  return <div className="p-8 text-center text-slate-400">Invalid Role Access</div>;
}

/* ===================== SUB-COMPONENTS ===================== */

const StatCard = ({ label, value, icon, color }) => {
  const styles = {
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  
  return (
    <div className={`p-6 rounded-2xl border ${styles[color]} flex items-center gap-4 shadow-sm`}>
       <div className="text-2xl opacity-90 p-2 bg-white rounded-full shadow-sm">{icon}</div>
       <div>
         <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
         <p className="text-2xl font-extrabold">{value}</p>
       </div>
    </div>
  );
};

const StudentListCard = ({ title, count, data, type }) => {
  const isDanger = type === "danger";
  return (
    <div className={`bg-white rounded-2xl border ${isDanger ? 'border-rose-100' : 'border-slate-200'} overflow-hidden flex flex-col h-[500px] shadow-sm`}>
      <div className={`px-6 py-4 border-b ${isDanger ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'} flex justify-between items-center`}>
        <h3 className={`font-bold ${isDanger ? 'text-rose-700' : 'text-slate-700'}`}>{title}</h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isDanger ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-700'}`}>
          {count} Students
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
        {data.length > 0 ? (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-400 uppercase bg-white sticky top-0 shadow-sm z-10">
               <tr>
                 <th className="px-4 py-3 bg-white">Roll No</th>
                 <th className="px-4 py-3 bg-white">Name</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(s => (
                <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{s.roll_no}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 text-sm">
            <FaCheckCircle className="text-3xl mb-2 opacity-20" />
            <p>List is empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
    <div className="text-slate-300 text-6xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-slate-600">{title}</h3>
    <p className="text-slate-400 text-sm mt-1">{desc}</p>
  </div>
);