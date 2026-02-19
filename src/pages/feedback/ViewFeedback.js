import React, { useEffect, useState } from "react";
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

      if (user.role === "CA" || user.role === "DeptAdmin") {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
        <FaSpinner className="animate-spin text-5xl mb-4" />
        <p className="font-bold text-lg text-slate-700">Loading Feedback System...</p>
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
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 font-sans">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-indigo-100 text-indigo-700 rounded-lg">
             <FaStar className="text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Feedback History</h1>
            <p className="text-slate-600 font-medium mt-1">A record of your anonymous evaluations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myFeedback.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border border-slate-300 rounded-full flex items-center justify-center text-indigo-700 shadow-sm text-xl">
                    <FaUserTie />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{item.staff_name}</h3>
                    <p className="text-xs text-slate-600 uppercase font-bold tracking-wider">{item.subject_name || "Faculty"}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {item.ratings.map((r, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end gap-4">
                      <span className="text-sm font-bold text-slate-700 leading-tight">{r.question}</span>
                      <span className="text-lg font-black text-indigo-700">{r.rating}/10</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                       <div 
                          className={`h-full rounded-full ${
                            r.rating >= 8 ? 'bg-emerald-500' : r.rating >= 5 ? 'bg-amber-500' : 'bg-rose-500'
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
  if (user.role === "CA" || user.role === "DeptAdmin") {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 font-sans">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FaUsers className="text-indigo-600" /> Class Compliance Dashboard
          </h1>
          <p className="text-slate-600 font-medium mt-1">Monitor feedback submission status for your class.</p>
        </div>

        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center">
          <span className="font-bold text-slate-700 ml-2">Select Session:</span>
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSelectSession(s)}
              className={`
                px-6 py-3 rounded-lg text-sm font-bold border-2 transition-colors
                ${selectedSession?.session_id === s.session_id
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                  : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"}
              `}
            >
              {s.title}
            </button>
          ))}
        </div>

        {sessionLoading ? (
          <div className="flex justify-center py-20 text-indigo-600">
            <FaSpinner className="animate-spin text-5xl" />
          </div>
        ) : !selectedSession ? (
           <EmptyState icon={<FaClipboardList />} title="Select a Session" desc="Choose a feedback session to view statistics." />
        ) : submissionSummary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-indigo-700 text-white p-6 rounded-xl shadow-md flex items-center justify-between border-2 border-indigo-800">
                  <div>
                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-1">Total Completion</p>
                    <p className="text-5xl font-black">
                      {submissionSummary.total > 0 
                        ? Math.round((submissionSummary.submitted_count / submissionSummary.total) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <FaChartPie className="text-6xl opacity-30" />
               </div>

               <StatCard label="Total Students" value={submissionSummary.total} icon={<FaUsers />} color="slate" />
               <StatCard label="Submitted" value={submissionSummary.submitted_count} icon={<FaCheckCircle />} color="emerald" />
               <StatCard label="Pending" value={submissionSummary.not_submitted_count} icon={<FaExclamationCircle />} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <StudentListCard 
                title="✅ Submission Complete" 
                count={submissionSummary.submitted_count}
                data={submissionSummary.submitted_students} 
                type="success"
              />
              <StudentListCard 
                title="⚠️ Action Required (Pending)" 
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
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 font-sans">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <FaChartPie className="text-indigo-600" /> Faculty Performance Overview
          </h1>
          <p className="text-slate-600 font-medium mt-1">Review aggregate feedback scores per staff member.</p>
        </div>

        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center">
          <span className="font-bold text-slate-700 ml-2">Select Session:</span>
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSelectSession(s)}
              className={`
                px-6 py-3 rounded-lg text-sm font-bold border-2 transition-colors
                ${selectedSession?.session_id === s.session_id
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                  : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"}
              `}
            >
              {s.title}
            </button>
          ))}
        </div>

        {sessionLoading ? (
          <div className="flex justify-center py-20 text-indigo-600">
             <FaSpinner className="animate-spin text-5xl" />
          </div>
        ) : !selectedSession ? (
           <EmptyState icon={<FaClipboardList />} title="Select Analysis Session" desc="Choose a session to view the leaderboard." />
        ) : staffSummary.length > 0 ? (
          
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 p-4">
               <h2 className="text-white font-bold text-lg">Performance Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300 text-sm font-bold text-slate-700 uppercase tracking-wider">
                    <th className="p-4 w-20 text-center">Rank</th>
                    <th className="p-4">Faculty Details</th>
                    <th className="p-4 w-1/3 min-w-[250px]">Average Rating</th>
                    <th className="p-4 text-center">Score (out of 10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {staffSummary
                    .sort((a, b) => b.avg_rating - a.avg_rating)
                    .map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-center">
                         {i === 0 ? <FaTrophy className="text-amber-500 text-3xl mx-auto" title="1st Place" /> : 
                          i === 1 ? <FaTrophy className="text-slate-400 text-2xl mx-auto" title="2nd Place" /> :
                          i === 2 ? <FaTrophy className="text-amber-700 text-2xl mx-auto" title="3rd Place" /> :
                           <span className="text-slate-500 font-black text-lg">#{i + 1}</span>
                         }
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-lg font-black text-slate-600 shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-lg block">{s.name}</span>
                            <span className="text-xs text-slate-600 uppercase font-bold tracking-wider">{s.subject_name || "Faculty"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden border border-slate-300">
                          <div 
                             className={`h-full rounded-full ${
                               s.avg_rating >= 8 ? "bg-emerald-500" : s.avg_rating >= 6 ? "bg-amber-500" : "bg-rose-500"
                             }`}
                             style={{ width: `${(s.avg_rating / 10) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-4 text-center font-black text-slate-900 text-2xl">
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

  return <div className="p-8 text-center text-slate-500 font-bold text-xl">Invalid Role Access</div>;
}

/* ===================== SUB-COMPONENTS ===================== */

const StatCard = ({ label, value, icon, color }) => {
  const styles = {
    slate: "bg-slate-50 text-slate-700 border-slate-300",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-300",
    rose: "bg-rose-50 text-rose-800 border-rose-300"
  };
  
  return (
    <div className={`p-6 rounded-xl border-2 ${styles[color]} flex items-center gap-4 shadow-sm`}>
       <div className="text-3xl opacity-90 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">{icon}</div>
       <div>
         <p className="text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
         <p className="text-4xl font-black">{value}</p>
       </div>
    </div>
  );
};

const StudentListCard = ({ title, count, data, type }) => {
  const isDanger = type === "danger";
  return (
    <div className={`bg-white rounded-xl border-2 ${isDanger ? 'border-rose-200' : 'border-slate-200'} overflow-hidden shadow-sm`}>
      <div className={`px-6 py-5 border-b-2 ${isDanger ? 'bg-rose-100 border-rose-200' : 'bg-slate-100 border-slate-200'} flex justify-between items-center`}>
        <h3 className={`font-bold text-lg ${isDanger ? 'text-rose-900' : 'text-slate-900'}`}>{title}</h3>
        <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${isDanger ? 'bg-white border-rose-300 text-rose-800' : 'bg-white border-emerald-300 text-emerald-800'}`}>
          {count} Students
        </span>
      </div>
      
      {/* Removed fixed height constraint, using standard table flow for better scrolling */}
      <div className="p-0">
        {data.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
               <tr>
                 <th className="px-6 py-3 font-bold text-slate-700 w-1/3">Roll No</th>
                 <th className="px-6 py-3 font-bold text-slate-700">Student Name</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(s => (
                <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{s.roll_no}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-50">
            <FaCheckCircle className="text-5xl mb-3 text-slate-300" />
            <p className="font-bold text-lg">List is empty</p>
            <p className="text-sm">Great job! Everyone is accounted for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-sm">
    <div className="text-slate-300 text-7xl mb-6">{icon}</div>
    <h3 className="text-2xl font-bold text-slate-700 mb-2">{title}</h3>
    <p className="text-slate-500 font-medium text-lg text-center max-w-md">{desc}</p>
  </div>
);