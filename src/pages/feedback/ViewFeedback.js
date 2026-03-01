import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

// Utility imports
import { exportToExcel, generatePDFReport } from "../../utils/exportHelper";

import {
  FaUsers,
  FaCheckCircle,
  FaStar,
  FaUserTie,
  FaClipboardList,
  FaFilePdf,
  FaFileExcel,
  FaBuilding,
  FaArrowRight
} from "react-icons/fa";

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

  /* ===================== EXPORT HANDLERS ===================== */
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

  /* ===================== INITIAL FETCH ===================== */
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

            if (!grouped[sessionKey]) {
              grouped[sessionKey] = {
                session_id: row.session_id,
                title: row.title,
                staffs: {}
              };
            }

            const staffKey = row.staff_name || "Institutional";

            if (!grouped[sessionKey].staffs[staffKey]) {
              grouped[sessionKey].staffs[staffKey] = {
                staff_name: row.staff_name,
                feedback_type: row.staff_name ? "staff" : "non-staff",
                responses: []
              };
            }

            const num = row.answer_value != null ? Number(row.answer_value) : null;
            const txt = row.answer_text?.trim() || null;

            if (num !== null || txt) {
              grouped[sessionKey].staffs[staffKey].responses.push({
                question: row.question_text,
                type: row.question_type,
                answer_value: num,
                answer_text: txt
              });
            }
          });

          setMyFeedback(Object.values(grouped));
        } else {
          const sessRes = await axios.get(`${BASE_URL}/feedback/sessions`, { headers: { Authorization: `Bearer ${token}` } });
          setSessions(sessRes.data || []);
          if (sessRes.data?.length > 0) handleSelectSession(sessRes.data[0]);
        }
      } catch (error) {
        Swal.fire("Error", "Failed to load data", "error");
      } finally { setLoading(false); }
    };
    init();
  }, [user.role, token]);

  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setSessionLoading(true);
      if (user.role === "CA" || user.role === "DeptAdmin") {
        const res = await axios.get(`${BASE_URL}/feedback/class/submission-summary/${session.session_id}`, { headers: { Authorization: `Bearer ${token}` } });
        setSubmissionSummary(res.data);
      } else if (["HOD", "Principal", "Admin"].includes(user.role)) {
        const res = await axios.get(`${BASE_URL}/feedback/session/${session.session_id}/details`, { headers: { Authorization: `Bearer ${token}` } });
        const { type, data } = res.data;
        setSummaryType(type);
        if (type === "staff") { setStaffSummary(data || []); setSubmissionSummary(null); }
        else { setStaffSummary([]); setSubmissionSummary(data || []); }
      }
    } catch (error) { console.error(error); }
    finally { setSessionLoading(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-slate-700">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Feedback Insights</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Viewing reports as <span className="text-indigo-600 font-bold">{user.role}</span></p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExcelAction} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all">
            <FaFileExcel /> EXCEL
          </button>
          <button onClick={handlePDFAction} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all">
            <FaFilePdf /> PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {user.role === "student" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {myFeedback.map((session, i) => (
              <div key={i} className="space-y-6">
                {/* Session Title */}
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                    {session.title}
                  </h2>
                </div>

                {/* Staff Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Object.values(session.staffs).map((staff, idx) => (
                    <CompactFeedbackCard key={idx} item={staff} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Session Tabs */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar border-b border-slate-50 pb-2">
              {sessions.map(s => (
                <button key={s.session_id} onClick={() => handleSelectSession(s)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${selectedSession?.session_id === s.session_id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                  {s.title}
                </button>
              ))}
            </div>

            {sessionLoading ? <div className="h-40 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-pulse" /> : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {submissionSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 p-5 rounded-xl text-white">
                      <p className="text-[9px] font-bold uppercase opacity-50 mb-1">Completion</p>
                      <p className="text-3xl font-black">{submissionSummary.total > 0 ? Math.round((submissionSummary.submitted_count / submissionSummary.total) * 100) : 0}%</p>
                    </div>
                    <StatCard label="Total Cohort" value={submissionSummary.total} color="slate" />
                    <StatCard label="Submitted" value={submissionSummary.submitted_count} color="emerald" />
                    <StatCard label="Pending" value={submissionSummary.not_submitted_count} color="rose" />
                  </div>
                )}

                {submissionSummary && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TableList title="Submitted Records" data={submissionSummary.submitted_students} />
                    <TableList title="Pending Records" data={submissionSummary.not_submitted_students} isDanger />
                  </div>
                )}

                {staffSummary?.length > 0 && (
                  <div className="space-y-4">
                    {Object.values(staffSummary.reduce((acc, row) => {
                      if (!acc[row.staff_id]) acc[row.staff_id] = { name: row.name, responses: [] };
                      if (row.answer_value !== null || row.answer_text) acc[row.staff_id].responses.push(row);
                      return acc;
                    }, {})).map((staff, i) => (
                      <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">{staff.name.charAt(0)}</div>
                          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{staff.name}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                          {staff.responses.map((r, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{r.question_text}</p>
                              <p className="text-xs font-semibold text-slate-700">{r.answer_value ? `${r.answer_value}/10` : (r.answer_text || "—")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===================== COMPONENTS ===================== */

const CompactFeedbackCard = ({ item }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 bg-slate-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm border border-slate-100">
        {item.feedback_type === 'staff' ? <FaUserTie /> : <FaBuilding />}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-xs leading-none mb-1 uppercase tracking-tight">{item.staff_name || "Institutional"}</h3>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.subject_name || "General"}</p>
      </div>
    </div>
    <div className="space-y-4">
      {item.responses.map((r, idx) => (
        <div key={idx} className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 leading-snug">{r.question}</p>
          {r.answer_value ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 rounded-full">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(r.answer_value / 10) * 100}%` }} />
              </div>
              <span className="text-[10px] font-black text-slate-800">{r.answer_value}</span>
            </div>
          ) : <p className="text-[10px] text-slate-400 italic bg-slate-50 p-2.5 rounded-lg leading-relaxed border border-slate-100/50">"{r.answer_text}"</p>}
        </div>
      ))}
    </div>
  </div>
);

const StatCard = ({ label, value, color }) => {
  const c = { slate: "text-slate-600", emerald: "text-emerald-600", rose: "text-rose-600" };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
      <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${c[color]}`}>{value}</p>
    </div>
  );
};

const TableList = ({ title, data, isDanger }) => (
  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
    <div className={`px-4 py-2 border-b border-slate-50 flex justify-between items-center ${isDanger ? 'bg-rose-50/30' : 'bg-slate-50/50'}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDanger ? 'text-rose-600' : 'text-slate-500'}`}>{title}</h3>
      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{data.length}</span>
    </div>
    <div className="max-h-52 overflow-y-auto no-scrollbar">
      <table className="w-full text-[10px]">
        <tbody className="divide-y divide-slate-50">
          {data.map(s => (
            <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-2.5 font-mono text-slate-400 border-r border-slate-50 w-24">{s.roll_no}</td>
              <td className="px-4 py-2.5 font-bold text-slate-700 uppercase tracking-tight">{s.name}</td>
            </tr>
          ))}
          {data?.length === 0 && <tr><td colSpan="2" className="py-8 text-center text-slate-300 italic text-[10px]">No records found</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);