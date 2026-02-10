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
  FaTrophy
} from "react-icons/fa";

export default function ViewFeedback({ user }) {

  /* ===================== STATE ===================== */
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);

  // student
  const [myFeedback, setMyFeedback] = useState([]);

  // CA
  const [submissionSummary, setSubmissionSummary] = useState(null);

  // HOD / Principal
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [staffSummary, setStaffSummary] = useState([]);

  const token = localStorage.getItem("token");

  /* ===================== EFFECT ===================== */
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
          const sessRes = await axios.get(
            `${BASE_URL}/feedback/sessions`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSessions(sessRes.data || []);
          // Auto-select first active session if available
          if (sessRes.data && sessRes.data.length > 0) {
             // Optional: Auto-load first session
             // handleSelectSession(sessRes.data[0]); 
          }
        }
      } catch {
        Swal.fire("Error", "Failed to load feedback data", "error");
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
      setSessionLoading(true);
      setSubmissionSummary(null);
      setStaffSummary([]);

      if (user.role === "CA") {
        const res = await axios.get(
          `${BASE_URL}/feedback/class/submission-summary/${session.session_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmissionSummary(res.data);
      } else {
        const res = await axios.get(
          `${BASE_URL}/feedback/session/${session.session_id}/staff-summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStaffSummary(res.data || []);
      }
    } catch {
      Swal.fire("Error", "Failed to load session data", "error");
    } finally {
      setSessionLoading(false);
    }
  };

  /* ===================== RENDER HELPERS ===================== */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading feedback module...</p>
      </div>
    );
  }

  /* ===================== ROLE: STUDENT ===================== */
  if (user.role === "student") {
    if (myFeedback.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
           <FaClipboardList className="text-5xl mb-4 opacity-20" />
           <p className="font-medium">No feedback history found.</p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in-up">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
             <FaStar className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Feedback History</h1>
            <p className="text-slate-500 text-sm">Review your submitted evaluations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myFeedback.map((staff, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-indigo-600">
                  <FaUserTie />
                </div>
                <h3 className="font-bold text-slate-800">{staff.staff_name}</h3>
              </div>

              <div className="p-6 space-y-4">
                {staff.ratings.map((r, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      <span className="truncate max-w-[80%]">{r.question}</span>
                      <span className="text-indigo-600">{r.rating}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                       <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(r.rating / 10) * 100}%` }} // Assuming max 10, adjust if needed
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

  /* ===================== ROLE: CA (Class Advisor) ===================== */
  if (user.role === "CA") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in-up">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FaUsers className="text-indigo-600" /> Class Feedback Status
            </h1>
            <p className="text-slate-500 text-sm mt-1">Monitor student participation per session.</p>
          </div>
        </div>

        {/* Session Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
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

        {sessionLoading && (
          <div className="flex justify-center py-10">
            <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
          </div>
        )}

        {!selectedSession && !sessionLoading && (
           <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-medium">Select a session above to view details</p>
           </div>
        )}

        {submissionSummary && !sessionLoading && (() => {
          const {
            total,
            submitted_count,
            not_submitted_count,
            submitted_students,
            not_submitted_students
          } = submissionSummary;

          // Calculate Percentage
          const submittedPercent = total > 0 ? Math.round((submitted_count / total) * 100) : 0;

          return (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {/* Progress Ring Card (Visual Candy) */}
                 <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium">Participation</p>
                      <p className="text-3xl font-bold mt-1">{submittedPercent}%</p>
                    </div>
                    <FaChartPie className="text-5xl opacity-30" />
                 </div>

                 <StatCard 
                    label="Total Students" 
                    value={total} 
                    icon={<FaUsers />} 
                    color="slate" 
                 />
                 <StatCard 
                    label="Submitted" 
                    value={submitted_count} 
                    icon={<FaCheckCircle />} 
                    color="emerald" 
                 />
                 <StatCard 
                    label="Pending" 
                    value={not_submitted_count} 
                    icon={<FaTimesCircle />} 
                    color="rose" 
                 />
              </div>

              {/* Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StudentList 
                  title="✅ Submitted" 
                  count={submitted_count}
                  data={submitted_students} 
                  type="success"
                />
                <StudentList 
                  title="⚠️ Pending Action" 
                  count={not_submitted_count}
                  data={not_submitted_students} 
                  type="danger"
                />
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ===================== ROLE: HOD / PRINCIPAL ===================== */
  if (["HOD", "Principal"].includes(user.role)) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in-up">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Performance Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Aggregate feedback scores per staff member.</p>
        </div>

        {/* Session Tabs */}
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

        {sessionLoading && (
          <div className="flex justify-center py-12">
             <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
          </div>
        )}

        {!selectedSession && !sessionLoading && (
           <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <FaChartPie className="text-slate-300 text-6xl mb-4" />
             <p className="text-slate-500 font-medium">Select a session to analyze performance</p>
           </div>
        )}

        {selectedSession && !sessionLoading && staffSummary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-5">Rank</th>
                  <th className="p-5">Faculty Name</th>
                  <th className="p-5 w-1/3">Average Rating</th>
                  <th className="p-5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffSummary
                  .sort((a, b) => b.avg_rating - a.avg_rating) // client-side sort just in case
                  .map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-5">
                       {i === 0 ? (
                         <FaTrophy className="text-amber-400 text-xl" />
                       ) : (
                         <span className="text-slate-400 font-bold ml-1">#{i + 1}</span>
                       )}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-indigo-700">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                           className={`h-full rounded-full ${
                             s.avg_rating >= 8 ? "bg-emerald-500" : s.avg_rating >= 6 ? "bg-amber-500" : "bg-rose-500"
                           }`}
                           style={{ width: `${(s.avg_rating / 10) * 100}%` }} // Assuming max 10
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
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
      Access Denied
    </div>
  );
}

/* ===================== SMALL COMPONENTS ===================== */

const StatCard = ({ label, value, icon, color }) => {
  const colorMap = {
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600"
  };
  
  return (
    <div className={`p-6 rounded-2xl border border-transparent ${colorMap[color]} flex items-center gap-4`}>
       <div className="text-2xl opacity-80">{icon}</div>
       <div>
         <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
         <p className="text-2xl font-extrabold">{value}</p>
       </div>
    </div>
  );
};

const StudentList = ({ title, count, data, type }) => {
  const isDanger = type === "danger";
  return (
    <div className={`bg-white rounded-2xl border ${isDanger ? 'border-rose-100' : 'border-slate-200'} overflow-hidden flex flex-col h-96 shadow-sm`}>
      <div className={`px-6 py-4 border-b ${isDanger ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'} flex justify-between items-center`}>
        <h3 className={`font-bold ${isDanger ? 'text-rose-700' : 'text-slate-700'}`}>{title}</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isDanger ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-700'}`}>
          {count}
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
        {data.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white sticky top-0">
               <tr>
                 <th className="px-4 py-2">Roll No</th>
                 <th className="px-4 py-2">Name</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(s => (
                <tr key={s.student_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{s.roll_no}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
            List is empty
          </div>
        )}
      </div>
    </div>
  );
};