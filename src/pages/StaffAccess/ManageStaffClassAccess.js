import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLayerGroup,
  FaPaperPlane,
  FaSpinner,
  FaUserTie,
  FaBookOpen,
  FaChalkboardTeacher,
  FaBuilding,
  FaHistory,
  FaCheckCircle,
  FaInfoCircle,
  FaUniversity,
  FaUserGraduate,
  FaShieldAlt,
  FaEraser
} from "react-icons/fa";

// --- IMPORT CONSTANTS ---
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

// --- STYLING & ANIMATION CONFIG ---

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '50px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
    paddingLeft: '4px',
    backgroundColor: '#fff',
    transition: 'all 0.2s',
    '&:hover': { borderColor: '#a5b4fc' }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 50,
    marginTop: '8px'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#4f46e5'
      : state.isFocused
        ? '#e0e7ff'
        : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#334155',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontSize: '0.95rem'
  })
};

// --- CUSTOM SELECT COMPONENTS ---

/**
 * Renders an icon next to the option label in the dropdown
 */
const { Option, SingleValue } = components;

const IconOption = (props) => (
  <Option {...props}>
    <span className="text-lg opacity-70">{props.data.icon}</span>
    <div className="flex flex-col">
      <span>{props.data.label}</span>
      {props.data.subLabel && (
        <span className={`text-[10px] ${props.isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
          {props.data.subLabel}
        </span>
      )}
    </div>
  </Option>
);

const IconSingleValue = (props) => (
  <SingleValue {...props}>
    <span className="text-indigo-500 text-lg">{props.data.icon}</span>
    {props.data.label}
  </SingleValue>
);

// --- MAIN COMPONENT ---

export default function ManageStaffClassAccess() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // --- STATE ---
  const [staffList, setStaffList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    dept: null,
    targetClass: null,
    staff: null,
    subject: null,
    accessType: { value: "teaching", label: "Teaching Staff", icon: <FaChalkboardTeacher /> }
  });

  // Local Session History (UX Improvement)
  const [recentActivity, setRecentActivity] = useState([]);

  // --- DERIVED OPTIONS ---

  const deptOptions = Object.entries(DEPT_MAP).map(([id, name]) => ({
    value: id,
    label: name,
    icon: <FaUniversity />,
    subLabel: "Department"
  }));

  const classOptions = Object.entries(CLASS_MAP).map(([id, name]) => ({
    value: id,
    label: name,
    icon: <FaUserGraduate />,
    subLabel: "Year / Class"
  }));

  const accessOptions = [
    { value: "teaching", label: "Teaching Staff", icon: <FaChalkboardTeacher />, subLabel: "Assign specific subject" },
    { value: "ca", label: "Class Advisor", icon: <FaUserTie />, subLabel: "Full class responsibility" }
  ];

  // --- API CALLS ---

  // 1. Fetch Staff on Mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/faculty`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mappedStaff = (res.data.data || []).map(s => ({
          value: s.staff_id,
          label: s.name,
          user_id: s.user_id,
          icon: <FaUserTie />,
          subLabel: s.staff_id // Showing Staff ID as sub-label
        }));
        setStaffList(mappedStaff);
      } catch (error) {
        console.error("Staff Fetch Error", error);
        Swal.fire({
          icon: 'error',
          title: 'System Error',
          text: 'Failed to load faculty list. Please refresh.',
          confirmButtonColor: '#4f46e5'
        });
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchStaff();
  }, [token]);

  // 2. Fetch Subjects when Class or Dept changes
  useEffect(() => {
    // Reset subject when dependencies change to avoid invalid states
    if (form.subject) {
      setForm(prev => ({ ...prev, subject: null }));
    }

    if (!form.targetClass || !form.dept) {
      setSubjectList([]);
      return;
    }

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await axios.get(
          `${BASE_URL}/subjects?class_id=${form.targetClass.value}&dept_id=${form.dept.value}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const mappedSubjects = (res.data || []).map(sub => ({
          value: sub.subject_id,
          label: sub.subject_name,
          icon: <FaBookOpen />,
          subLabel: sub.subject_code || "Subject"
        }));
        setSubjectList(mappedSubjects);
      } catch {
        setSubjectList([]);
        // Optional: Toast notification that no subjects were found
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.targetClass, form.dept, token]);


  // --- HANDLERS ---

  const handleReset = () => {
    setForm({
      dept: null,
      targetClass: null,
      staff: null,
      subject: null,
      accessType: accessOptions[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.dept || !form.targetClass || !form.staff) {
      return Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please ensure Department, Class, and Staff are selected.',
        confirmButtonColor: '#f59e0b'
      });
    }

    if (form.accessType.value === "teaching" && !form.subject) {
      return Swal.fire({
        icon: 'warning',
        title: 'Subject Required',
        text: 'Teaching staff must be assigned a specific subject.',
        confirmButtonColor: '#f59e0b'
      });
    }

    setSubmitting(true);

    const payload = {
      staff_id: form.staff.value,
      user_id: form.staff.user_id,
      class_id: form.targetClass.value,
      subject_id: form.accessType.value === "teaching" ? form.subject.value : null,
      access_type: form.accessType.value
    };

    try {
      await axios.post(`${BASE_URL}/staffClassAccess`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add to local history for UX
      const newActivity = {
        id: Date.now(),
        staff: form.staff.label,
        role: form.accessType.label,
        target: `${form.dept.label} - ${form.targetClass.label}`,
        subject: form.subject ? form.subject.label : 'N/A',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setRecentActivity(prev => [newActivity, ...prev].slice(0, 5));

      Swal.fire({
        icon: 'success',
        title: 'Access Granted',
        text: `${form.staff.label} has been assigned successfully.`,
        timer: 2000,
        showConfirmButton: false
      });

      // Soft reset (Keep dept/class selected as user might be doing batch entry)
      setForm(prev => ({
        ...prev,
        staff: null,
        subject: null
      }));

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err.response?.data?.message || "Server rejected the request.",
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER ---

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* === LEFT COLUMN: FORM === */}
        <div className="lg:col-span-7 space-y-6">

          {/* Header */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-2xl">
              <FaLayerGroup />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Assign Staff Access</h1>
              <p className="text-slate-500 text-sm">Configure permissions for teaching and advisory roles.</p>
            </div>
          </div>

          {/* Main Form Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

              {/* SECTION 1: CONTEXT */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FaBuilding /> Class Context
                </h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                    <Select
                      placeholder="Select Dept..."
                      options={deptOptions}
                      value={form.dept}
                      onChange={(val) => setForm(prev => ({ ...prev, dept: val }))}
                      components={{ Option: IconOption, SingleValue: IconSingleValue }}
                      styles={customSelectStyles}
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Year</label>
                    <Select
                      placeholder="Select Year..."
                      options={classOptions}
                      value={form.targetClass}
                      onChange={(val) => setForm(prev => ({ ...prev, targetClass: val }))}
                      components={{ Option: IconOption, SingleValue: IconSingleValue }}
                      styles={customSelectStyles}
                      isClearable
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION 2: STAFF & ROLE */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FaUserTie /> Staff Details
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Faculty</label>
                  <Select
                    placeholder="Search faculty name..."
                    options={staffList}
                    value={form.staff}
                    onChange={(val) => setForm(prev => ({ ...prev, staff: val }))}
                    components={{ Option: IconOption, SingleValue: IconSingleValue }}
                    styles={customSelectStyles}
                    isClearable
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Access Role</label>
                    <Select
                      options={accessOptions}
                      value={form.accessType}
                      onChange={(val) => setForm(prev => ({ ...prev, accessType: val, subject: null }))}
                      components={{ Option: IconOption, SingleValue: IconSingleValue }}
                      styles={customSelectStyles}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 pl-1">
                      *Class Advisors have full access to class reports.
                    </p>
                  </div>

                  {/* Conditional Subject Select */}
                  <AnimatePresence>
                    {form.accessType.value === "teaching" && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between items-center">
                          <span>Subject</span>

                          <button
                            type="button"
                            onClick={() => navigate("/managesubjects")}
                            className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                          >
                            Manage Subjects
                          </button>
                        </label>

                        <Select
                          placeholder={form.dept && form.targetClass ? "Select Subject..." : "Select Class first"}
                          options={subjectList}
                          value={form.subject}
                          onChange={(val) => setForm(prev => ({ ...prev, subject: val }))}
                          components={{ Option: IconOption, SingleValue: IconSingleValue }}
                          styles={customSelectStyles}
                          isDisabled={!form.dept || !form.targetClass}
                          noOptionsMessage={() => <p className="text-xs text-red-500 mt-2">
                            No subjects found.
                            <button
                              type="button"
                              onClick={() => navigate("/managesubjects")}
                              className="ml-2 text-indigo-600 underline"
                            >
                              Create one now
                            </button>
                          </p>
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center gap-2"
                >
                  <FaEraser /> Reset
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95
                    ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}
                  `}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Assign Access
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>

        {/* === RIGHT COLUMN: PREVIEW & HISTORY === */}
        <div className="lg:col-span-5 space-y-6">

          {/* Live Summary Card */}
          <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FaShieldAlt className="text-9xl transform rotate-12 translate-x-4 -translate-y-4" />
            </div>

            <h3 className="text-indigo-200 font-bold uppercase tracking-wider text-xs mb-4">Live Preview</h3>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-lg">
                  <FaUserTie className="text-white" />
                </div>
                <div>
                  <p className="text-indigo-300 text-xs">Staff Member</p>
                  <p className="font-semibold text-lg">{form.staff?.label || "---"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-lg">
                  <FaLayerGroup className="text-white" />
                </div>
                <div>
                  <p className="text-indigo-300 text-xs">Assigning To</p>
                  <p className="font-semibold">
                    {form.dept?.label || "---"} <span className="text-indigo-400 mx-1">/</span> {form.targetClass?.label || "---"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-white/20 p-2 rounded-lg">
                  <FaCheckCircle className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-indigo-300 text-xs">Permission Level</p>
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-300">{form.accessType.label}</span>
                    {form.accessType.value === "teaching" && (
                      <span className="text-sm text-indigo-100 mt-1 bg-indigo-800/50 px-2 py-1 rounded">
                        Sub: {form.subject?.label || "Not Selected"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FaHistory className="text-indigo-500" /> Recent Assignments
              </h3>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Session only</span>
            </div>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No assignments made in this session yet.
                </div>
              ) : (
                <AnimatePresence>
                  {recentActivity.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className={`mt-1 h-2 w-2 rounded-full ${log.role === 'Teaching' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-slate-700">{log.staff}</p>
                          <span className="text-[10px] text-slate-400">{log.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {log.role} • {log.target}
                        </p>
                        {log.subject !== 'N/A' && (
                          <p className="text-[10px] font-mono text-indigo-500 mt-1 bg-indigo-50 inline-block px-1 rounded">
                            {log.subject}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-3">
            <FaInfoCircle className="text-blue-500 mt-1 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Access Guidelines</p>
              <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                <li><strong>Class Advisors</strong> have administrative view of the entire class performance.</li>
                <li><strong>Teaching Staff</strong> can only view/edit marks for their specific subject.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}