import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import {
  FaLayerGroup,
  FaPaperPlane,
  FaSpinner,
  FaUserTie,
  FaBookOpen,
  FaChalkboardTeacher,
  FaBuilding,
  FaUniversity,
  FaUserGraduate,
  FaEraser,
  FaTrash
} from "react-icons/fa";

// --- IMPORT CONSTANTS ---
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

// --- STYLING CONFIG (Simplified & Faster) ---
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    '&:hover': { borderColor: '#818cf8' }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  })
};

// --- CUSTOM SELECT COMPONENTS ---
const { Option, SingleValue } = components;

const IconOption = (props) => (
  <Option {...props}>
    <span className="text-lg opacity-70">{props.data.icon}</span>
    <span>{props.data.label}</span>
  </Option>
);

const IconSingleValue = (props) => (
  <SingleValue {...props}>
    <div className="flex items-center gap-2 text-slate-700 font-medium">
      <span className="text-indigo-600">{props.data.icon}</span>
      {props.data.label}
    </div>
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
  const [accessList, setAccessList] = useState([]);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role;
  const userDeptId = user.dept_id;

  // Form State
  const initialDept = userRole === "HOD" || userRole === "DeptAdmin"
    ? { value: String(userDeptId), label: DEPT_MAP[userDeptId], icon: <FaUniversity /> }
    : null;

  const [form, setForm] = useState({
    dept: initialDept,
    targetClass: null,
    staff: null,
    subject: null,
    accessType: { value: "teaching", label: "Teaching Staff", icon: <FaChalkboardTeacher /> }
  });

  // --- DERIVED OPTIONS ---
  const deptOptions = useMemo(() =>
    Object.entries(DEPT_MAP).map(([id, name]) => ({ value: id, label: name, icon: <FaUniversity /> })),
    []);

  const classOptions = useMemo(() =>
    Object.entries(CLASS_MAP).map(([id, name]) => ({ value: id, label: name, icon: <FaUserGraduate /> })),
    []);

  const accessOptions = [
    { value: "teaching", label: "Teaching Staff", icon: <FaChalkboardTeacher /> },
    { value: "ca", label: "Class Advisor", icon: <FaUserTie /> }
  ];

  // --- API CALLS ---
  const fetchAccessList = useCallback(async () => {
    if (!form.dept || !form.targetClass) {
      setAccessList([]);
      return;
    }
    setLoadingAccess(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/staffClassAccess?dept_id=${form.dept.value}&class_id=${form.targetClass.value}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccessList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccess(false);
    }
  }, [form.dept, form.targetClass, token]);

  useEffect(() => { fetchAccessList(); }, [fetchAccessList]);


  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/faculty`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.data.success) {
          throw new Error("Invalid response");
        }

        const mappedStaff = res.data.data.map(s => ({
          value: s.user_id,
          label: `${s.name} - ${DEPT_MAP[s.dept_id] || "Unknown Dept"}`,
          user_id: s.user_id
        }));

        setStaffList(mappedStaff);

      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load faculty list.", "error");
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchStaff();
  }, [token]);


  useEffect(() => {
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
          label: `${sub.subject_name} (${sub.subject_code})`,
          icon: <FaBookOpen />
        }));
        setSubjectList(mappedSubjects);

        if (form.subject && !mappedSubjects.find(s => s.value === form.subject.value)) {
          setForm(prev => ({ ...prev, subject: null }));
        }
      } catch {
        setSubjectList([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [form.targetClass?.value, form.dept?.value, token]);

  // --- HANDLERS ---
  const handleReset = () => {
    setForm(prev => ({ ...prev, staff: null, subject: null, accessType: accessOptions[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.dept || !form.targetClass || !form.staff) {
      return Swal.fire('Missing Fields', 'Please select Department, Class, and Staff.', 'warning');
    }
    if (form.accessType.value === "teaching" && !form.subject) {
      return Swal.fire('Subject Required', 'Teaching staff must be assigned a subject.', 'warning');
    }

    setSubmitting(true);
    const payload = {
      user_id: form.staff.user_id,
      class_id: form.targetClass.value,
      dept_id: form.dept.value,
      subject_id: form.accessType.value === "teaching" ? form.subject.value : null,
      access_type: form.accessType.value
    };

    try {
      await axios.post(`${BASE_URL}/staffClassAccess`, payload, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ icon: 'success', title: 'Assigned!', timer: 1500, showConfirmButton: false });
      fetchAccessList();
      setForm(prev => ({ ...prev, staff: null, subject: null })); // Keep class/dept selected for fast batch entry
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || "Failed to assign.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Remove Access?",
      text: "Are you sure you want to remove this staff member?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, Remove"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${BASE_URL}/staffClassAccess/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAccessList();
    } catch (err) {
      Swal.fire("Error", "Failed to remove staff.", "error");
    }
  };

  // --- RENDER ---
  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
        <FaSpinner className="animate-spin text-4xl mb-3" />
        <p className="font-medium">Loading System...</p>
      </div>
    );
  }

  return (
    <div className=" mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* === LEFT COLUMN: ENTRY FORM === */}
      <div className="lg:col-span-6 space-y-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg text-2xl">
            <FaLayerGroup />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Assign Staff Access</h1>
            <p className="text-slate-500">Assign faculty to classes and subjects.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="h-1 bg-indigo-600 w-full"></div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

            {/* Context Block */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                <FaBuilding className="text-indigo-500" /> 1. Select Class
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                  <Select
                    options={deptOptions}
                    value={form.dept}
                    onChange={(val) => setForm(prev => ({ ...prev, dept: val }))}
                    components={{ Option: IconOption, SingleValue: IconSingleValue }}
                    styles={customSelectStyles}
                    isDisabled={userRole === "HOD" || userRole === "DeptAdmin"}
                    placeholder="Select Dept..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Year / Class</label>
                  <Select
                    options={classOptions}
                    value={form.targetClass}
                    onChange={(val) => setForm(prev => ({ ...prev, targetClass: val }))}
                    components={{ Option: IconOption, SingleValue: IconSingleValue }}
                    styles={customSelectStyles}
                    placeholder="Select Class..."
                  />
                </div>
              </div>
            </div>

            {/* Assignment Block */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                <FaUserTie className="text-indigo-500" /> 2. Assign Role
              </h3>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Select Faculty</label>
                  <button type="button" onClick={() => navigate("/faculty")} className="text-xs text-indigo-600 hover:underline font-semibold">Add New Faculty?</button>
                </div>
                <Select
                  options={staffList}
                  value={form.staff}
                  onChange={(val) => setForm(prev => ({ ...prev, staff: val }))}
                  components={{ Option: IconOption, SingleValue: IconSingleValue }}
                  styles={customSelectStyles}
                  placeholder="Search by name or ID..."
                  isClearable
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                  <Select
                    options={accessOptions}
                    value={form.accessType}
                    onChange={(val) => setForm(prev => ({ ...prev, accessType: val, subject: null }))}
                    components={{ Option: IconOption, SingleValue: IconSingleValue }}
                    styles={customSelectStyles}
                  />
                </div>

                {form.accessType.value === "teaching" && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-bold text-slate-700">Subject</label>
                      <button type="button" onClick={() => navigate("/managesubjects")} className="text-xs text-indigo-600 hover:underline font-semibold">Manage Subjects</button>
                    </div>
                    <Select
                      options={subjectList}
                      value={form.subject}
                      onChange={(val) => setForm(prev => ({ ...prev, subject: val }))}
                      components={{ Option: IconOption, SingleValue: IconSingleValue }}
                      styles={customSelectStyles}
                      isDisabled={!form.dept || !form.targetClass}
                      placeholder={form.dept && form.targetClass ? "Select Subject..." : "Select Class first"}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition"
              >
                <FaEraser className="inline mr-2" /> Clear
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-3 rounded-lg font-bold text-white text-lg shadow-md transition ${submitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : <FaPaperPlane className="inline mr-2" />}
                Assign Staff
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* === RIGHT COLUMN: DATA TABLE === */}
      <div className="lg:col-span-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 h-full flex flex-col">

          <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
            <h3 className="font-bold text-xl text-slate-800">Currently Assigned Staff</h3>
            <p className="text-slate-500 text-sm mt-1">
              {form.dept && form.targetClass
                ? `Showing staff for ${form.dept.label} - ${form.targetClass.label}`
                : "Select a Department and Class to view assigned staff."}
            </p>
          </div>

          <div className="p-0 flex-1 overflow-auto max-h-[600px]">
            {!form.dept || !form.targetClass ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <FaBuilding className="text-4xl mb-3 opacity-20" />
                <p>Awaiting class selection...</p>
              </div>
            ) : loadingAccess ? (
              <div className="flex justify-center items-center h-48 text-indigo-500">
                <FaSpinner className="animate-spin text-3xl" />
              </div>
            ) : accessList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <p className="font-medium">No staff assigned to this class yet.</p>
                <p className="text-sm">Use the form to add someone.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-4 font-bold border-b">Faculty Name</th>
                    <th className="p-4 font-bold border-b">Role / Subject</th>
                    <th className="p-4 font-bold border-b text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="p-4">
                        {item.access_type === "ca" ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold uppercase">Class Advisor</span>
                        ) : (
                          <div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">Teaching</span>
                            <div className="text-xs text-slate-500 mt-1 font-medium">{item.subject_name || "Unknown Subject"}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remove Access"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}