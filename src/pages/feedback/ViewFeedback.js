import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

import {
  FaUsers,
  FaCheckCircle,
  FaUserTie,
  FaClipboardList,
  FaFilePdf,
  FaFileExcel,
  FaBuilding,
  FaPrint
} from "react-icons/fa";

/* ── PROFESSIONAL STYLE INJECTION ── */
const ProfessionalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .erp-container { 
      font-family: 'Inter', sans-serif; 
      color: #1a202c;
      line-height: 1.5;
    }

    /* Professional Card */
    .erp-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    /* High Visibility Labels */
    .erp-label {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4a5568;
    }

    /* Large Data Text */
    .erp-value {
      font-size: 36px;
      font-weight: 800;
      color: #1a202c;
    }

    /* Progress Bar for readability */
    .erp-progress-bg {
      height: 14px;
      background: #edf2f7;
      border-radius: 10px;
      border: 1px solid #cbd5e0;
    }
    .erp-progress-fill {
      height: 100%;
      background: #2b6cb0;
      border-radius: 10px;
    }

    /* Buttons */
    .btn-action {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      transition: all 0.2s;
      border: 2px solid transparent;
    }
    .btn-excel { background: #f0fff4; color: #276749; border-color: #c6f6d5; }
    .btn-pdf { background: #fff5f5; color: #9b2c2c; border-color: #fed7d7; }
    .btn-excel:hover { background: #c6f6d5; }
    .btn-pdf:hover { background: #fed7d7; }

    /* Navigation Tabs */
    .nav-tab {
      padding: 12px 24px;
      font-weight: 700;
      font-size: 16px;
      border-radius: 8px;
      border: 2px solid #e2e8f0;
      background: #ffffff;
      color: #4a5568;
    }
    .nav-tab.active {
      background: #2b6cb0;
      color: #ffffff;
      border-color: #2b6cb0;
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
  `}</style>
);

export default function ViewFeedback({ user }) {
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [summaryType, setSummaryType] = useState(null);
  const [myFeedback, setMyFeedback] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [submissionSummary, setSubmissionSummary] = useState(null);
  const [staffSummary, setStaffSummary] = useState([]);
  const token = localStorage.getItem("token");

  /* ── DATA HANDLERS (LOGIC UNTOUCHED) ── */
  const handleExcelAction = () => {
    let data = [];
    if (user.role === "student") {
      data = myFeedback.flatMap(item => item.responses.map(r => ({
        Category: item.staff_name || "Institutional",
        Question: r.question,
        Score: r.answer_value || "N/A",
        Comment: r.answer_text || "N/A"
      })));
    } else if (submissionSummary) {
      data = [
        ...submissionSummary.submitted_students.map(s => ({ Name: s.name, Roll: s.roll_no, Status: "Submitted" })),
        ...submissionSummary.not_submitted_students.map(s => ({ Name: s.name, Roll: s.roll_no, Status: "Pending" }))
      ];
    }
    exportToExcel(data, `${user.role}_Report`);
  };

  const handlePDFAction = () => {
    const config = {
      title: `${user.role} Feedback Report`,
      subTitle: selectedSession?.title || "Overview",
      generatedBy: user.name,
      tableHeaders: ["Context", "Question/Detail", "Value"],
      tableData: user.role === "student"
        ? myFeedback.flatMap(item => item.responses.map(r => [item.staff_name || "General", r.question, r.answer_value || r.answer_text]))
        : staffSummary.map(r => [r.name, r.question_text, r.answer_value || r.answer_text])
    };
    generatePDFReport(config);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (user.role === "student") {
          const res = await axios.get(`${BASE_URL}/feedback/student/my-feedback`, { headers: { Authorization: `Bearer ${token}` } });
          const raw = res.data || [];
          const grouped = {};
          raw.forEach(row => {
            const sessionKey = row.session_id;
            if (!grouped[sessionKey]) grouped[sessionKey] = { session_id: row.session_id, title: row.title, staffs: {} };
            const staffKey = row.staff_name || "Institutional";
            if (!grouped[sessionKey].staffs[staffKey]) {
              grouped[sessionKey].staffs[staffKey] = { staff_name: row.staff_name, feedback_type: row.staff_name ? "staff" : "non-staff", responses: [] };
            }
            const num = row.answer_value != null ? Number(row.answer_value) : null;
            const txt = row.answer_text?.trim() || null;
            if (num !== null || txt) {
              grouped[sessionKey].staffs[staffKey].responses.push({ question: row.question_text, answer_value: num, answer_text: txt });
            }
          });
          setMyFeedback(Object.values(grouped));
        } else {
          const sessRes = await axios.get(`${BASE_URL}/feedback/sessions`, { headers: { Authorization: `Bearer ${token}` } });
          setSessions(sessRes.data || []);
          if (sessRes.data?.length > 0) handleSelectSession(sessRes.data[0]);
        }
      } catch (error) {
        Swal.fire("Error", "Failed to load reports", "error");
      } finally { setLoading(false); }
    };
    init();
  }, [user.role, token]);

  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setSessionLoading(true);
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      if (user.role === "CA" || user.role === "DeptAdmin") {
        const res = await axios.get(`${BASE_URL}/feedback/class/submission-summary/${session.session_id}`, headers);
        setSubmissionSummary(res.data);
      } else if (["HOD", "Principal", "Admin"].includes(user.role)) {
        const res = await axios.get(`${BASE_URL}/feedback/session/${session.session_id}/details`, headers);
        const { type, data } = res.data;
        setSummaryType(type);
        if (type === "staff") { setStaffSummary(data || []); setSubmissionSummary(null); }
        else { setStaffSummary([]); setSubmissionSummary(data || []); }
      }
    } catch (error) { console.error(error); }
    finally { setSessionLoading(false); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-2xl erp-container">Loading Reports...</div>;

  return (
    <div className="erp-container min-h-screen bg-gray-50 pb-20">
      <ProfessionalStyles />
      
      {/* ── TOP NAV BAR ── */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-800 text-gray-900 tracking-tight">Academic Feedback Reports</h1>
            <p className="text-gray-600 font-500 text-lg">Logged in as: <span className="text-blue-700 font-700">{user.role}</span></p>
          </div>
          <div className="flex gap-4">
            <button onClick={handleExcelAction} className="btn-action btn-excel">
              <FaFileExcel size={20} /> Export Excel
            </button>
            <button onClick={handlePDFAction} className="btn-action btn-pdf">
              <FaFilePdf size={20} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* ── ADMIN/STAFF TABS ── */}
        {user.role !== "student" && sessions.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
            {sessions.map(s => (
              <button
                key={s.session_id}
                onClick={() => handleSelectSession(s)}
                className={`nav-tab whitespace-nowrap ${selectedSession?.session_id === s.session_id ? 'active' : ''}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {user.role === "student" ? (
            /* STUDENT VIEW */
            <motion.div key="student" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              {myFeedback.length === 0 ? <p className="text-center py-20 text-2xl font-bold text-gray-400">No records found.</p> : 
                myFeedback.map((session, i) => (
                  <div key={i} className="space-y-6">
                    <h2 className="text-2xl font-800 border-l-8 border-blue-600 pl-4 text-gray-800 uppercase tracking-wide">{session.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.values(session.staffs).map((staff, idx) => (
                        <FeedbackDetailCard key={idx} staff={staff} />
                      ))}
                    </div>
                  </div>
                ))
              }
            </motion.div>
          ) : (
            /* ADMIN VIEW */
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {sessionLoading ? <div className="p-10 text-xl font-bold">Fetching session data...</div> : (
                <>
                  {submissionSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <SummaryMetric label="Overall Completion" val={`${submissionSummary.total > 0 ? Math.round((submissionSummary.submitted_count / submissionSummary.total) * 100) : 0}%`} isBlue />
                      <SummaryMetric label="Total Students" val={submissionSummary.total} />
                      <SummaryMetric label="Submitted" val={submissionSummary.submitted_count} />
                      <SummaryMetric label="Pending" val={submissionSummary.not_submitted_count} />
                    </div>
                  )}

                  {submissionSummary && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <DataTable title="SUBMITTED LIST" data={submissionSummary.submitted_students} color="green" />
                      <DataTable title="PENDING LIST" data={submissionSummary.not_submitted_students} color="red" />
                    </div>
                  )}

                  {staffSummary?.length > 0 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-800 text-gray-800 uppercase">Faculty Performance Summary</h2>
                      {Object.values(staffSummary.reduce((acc, row) => {
                        if (!acc[row.staff_id]) acc[row.staff_id] = { name: row.name, responses: [] };
                        acc[row.staff_id].responses.push(row);
                        return acc;
                      }, {})).map((staff, i) => (
                        <StaffAdminCard key={i} staff={staff} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── REUSABLE PROFESSIONAL COMPONENTS ── */

const SummaryMetric = ({ label, val, isBlue }) => (
  <div className={`erp-card p-6 ${isBlue ? 'bg-blue-900 text-white' : ''}`}>
    <p className={`erp-label ${isBlue ? 'text-blue-200' : 'text-gray-500'}`}>{label}</p>
    <p className={`erp-value ${isBlue ? 'text-white' : ''}`}>{val}</p>
  </div>
);

const FeedbackDetailCard = ({ staff }) => (
  <div className="erp-card p-6">
    <div className="flex items-center gap-4 border-b-2 border-gray-100 pb-4 mb-4">
      <div className="p-3 bg-blue-100 text-blue-800 rounded-lg"><FaUserTie size={24} /></div>
      <h3 className="text-xl font-800 uppercase tracking-tight">{staff.staff_name || "Institutional"}</h3>
    </div>
    <div className="space-y-6">
      {staff.responses.map((r, i) => (
        <div key={i}>
          <p className="text-lg font-600 text-gray-700 mb-2 leading-snug">{r.question}</p>
          {r.answer_value != null ? (
            <div className="flex items-center gap-4">
              <div className="flex-1 erp-progress-bg">
                <div className="erp-progress-fill" style={{ width: `${(r.answer_value / 10) * 100}%` }} />
              </div>
              <span className="text-2xl font-800 text-blue-700">{r.answer_value}/10</span>
            </div>
          ) : (
            <p className="bg-gray-50 p-4 border-l-4 border-blue-500 italic text-gray-600 text-lg">"{r.answer_text}"</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

const StaffAdminCard = ({ staff }) => (
  <div className="erp-card p-8">
    <h3 className="text-2xl font-800 text-blue-800 border-b-2 border-gray-100 pb-2 mb-6 uppercase tracking-wider">{staff.name}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
      {staff.responses.map((r, i) => (
        <div key={i} className="bg-gray-50 p-4 rounded-lg">
          <p className="font-700 text-gray-600 mb-2 text-md tracking-tight uppercase">{r.question_text}</p>
          {r.answer_value ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 erp-progress-bg"><div className="erp-progress-fill" style={{ width: `${(r.answer_value/10)*100}%` }} /></div>
              <span className="font-800 text-xl">{r.answer_value}</span>
            </div>
          ) : <p className="italic text-gray-500 font-500">"{r.answer_text || 'No comment'}"</p>}
        </div>
      ))}
    </div>
  </div>
);

const DataTable = ({ title, data, color }) => (
  <div className="erp-card overflow-hidden">
    <div className={`px-6 py-4 border-b-2 flex justify-between items-center bg-gray-50`}>
      <h3 className={`text-xl font-800 tracking-wider ${color === 'red' ? 'text-red-700' : 'text-green-700'}`}>{title}</h3>
      <span className="bg-gray-200 px-4 py-1 rounded-full font-800 text-lg">{data.length}</span>
    </div>
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-100 text-gray-600 border-b-2">
          <tr>
            <th className="px-6 py-4 font-800 text-sm">ROLL NUMBER</th>
            <th className="px-6 py-4 font-800 text-sm">FULL NAME</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((s, idx) => (
            <tr key={idx} className="hover:bg-blue-50 transition-colors">
              <td className="px-6 py-4 font-700 text-lg font-mono text-gray-600">{s.roll_no}</td>
              <td className="px-6 py-4 font-700 text-lg uppercase tracking-tight">{s.name}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan="2" className="text-center py-10 font-700 text-gray-400">NO STUDENTS FOUND</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);