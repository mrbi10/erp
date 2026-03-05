import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import {
  LucideSave, LucideUser, LucideBookOpen, LucideCalendar,
  LucideLoader2, LucideInfo, LucideAlertCircle, LucideCopy,
  LucideRefreshCcw, LucideCheckCircle, LucideShieldCheck
} from "lucide-react";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptclassV2";

/**
 * Custom Select Styling for a premium Look
 */
const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: '12px',
    padding: '2px',
    border: '1px solid #e2e8f0',
    boxShadow: 'none',
    '&:hover': { border: '1px solid #6366f1' }
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected ? '#6366f1' : isFocused ? '#f8fafc' : 'white',
    color: isSelected ? 'white' : '#1e293b',
    fontSize: '14px',
    fontWeight: '500'
  })
};

export default function TimetableSetup({ user }) {
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // State Management
  const [activeTab, setActiveTab] = useState("subjects");
  const [loading, setLoading] = useState(false);
  const [deptId, setDeptId] = useState("");
  const [classId, setClassId] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [labs, setLabs] = useState([]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  // 1. Initial Data Fetch (Staff List)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${BASE_URL}/faculty`, { headers });
        const data = await res.json();
        const raw = data.data || data.staff || data;
        if (Array.isArray(raw)) {
          setStaffOptions(raw.map(s => ({
            value: s.staff_id,
            label: `${s.name}`,
            dept: DEPT_MAP[s.dept_id] || "Faculty"
          })));
        }
      } catch (e) {
        console.error("Staff Fetch Error", e);
      }
    };
    fetchStaff();
  }, []);

  // 2. Role-Based Permissions Logic
  useEffect(() => {
    if (!user) return;
    if (user.dept_id) setDeptId(String(user.dept_id));
    if (user.role === "CA" && user.assigned_class_id) {
      setClassId(String(user.assigned_class_id));
    }
  }, [user]);

  // 3. Subject Loader (Syncs with Backend SQL Requirement Schema)
  useEffect(() => {
    if (!deptId || !classId) return;
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/timetable/class-subjects?dept_id=${deptId}&class_id=${classId}`, { headers });
        const data = await res.json();

        // Sanitize incoming data to ensure no nulls break the UI components
        const sanitized = (data.subjects || []).map(s => ({
          ...s,
          weekly_hours: s.weekly_hours ?? 0,
          is_lab: s.is_lab ?? 0,
          is_integrated: s.is_integrated ?? 0,
          max_per_day: s.max_per_day ?? 1,
          lab_hours: s.lab_hours ?? 0,
          lab_max_per_day: s.lab_max_per_day ?? 0,
          lab_id: s.lab_id ?? null
        }));
        setSubjects(sanitized);
      } catch (e) {
        Swal.fire("Fetch Error", "Failed to load class configuration", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [deptId, classId]);

  useEffect(() => {

    if (!deptId) return;

    const fetchLabs = async () => {

      try {

        const res = await fetch(
          `${BASE_URL}/timetable/labdropdown?dept_id=${deptId}`,
          { headers }
        );

        const data = await res.json();

        if (data.success) {
          setLabs(
            (data.labs || []).map(lab => ({
              value: lab.lab_id,
              label: lab.lab_name
            }))
          );
        }

      } catch (err) {
        console.error("Lab fetch failed", err);
      }

    };

    fetchLabs();

  }, [deptId]);

  // 4. Staff Availability Loader
  useEffect(() => {
    if (!selectedStaff) return;
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/timetable/staff-availability?staff_id=${selectedStaff.value}`, { headers });
        const data = await res.json();
        setAvailabilityMap(data || {});
      } catch (e) {
        console.error("Availability error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [selectedStaff]);

  // 5. Subject Matrix Handlers
  const updateSubjectField = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const handleTypeChange = (index, type) => {
    const updated = [...subjects];
    if (type === 'theory') {
      updated[index] = { ...updated[index], is_lab: 0, is_integrated: 0, lab_hours: 0, lab_max_per_day: 0 };
    } else if (type === 'lab') {
      updated[index] = { ...updated[index], is_lab: 1, is_integrated: 0, weekly_hours: 0, max_per_day: 0 };
    } else {
      updated[index] = { ...updated[index], is_lab: 0, is_integrated: 1 };
    }
    setSubjects(updated);
  };

  const saveSubjectConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/timetable/class-subjects`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ dept_id: deptId, class_id: classId, subjects })
      });
      if (res.ok) {
        Swal.fire({ title: "Saved!", text: "Class requirements updated successfully.", icon: "success", timer: 2000, showConfirmButton: false });
      }
    } catch (e) {
      Swal.fire("Save Failed", "API communication error", "error");
    } finally {
      setLoading(false);
    }
  };

  // 6. Availability Grid Handlers
  const toggleSlot = (day, period) => {
    const key = `${day}-${period}`;
    setAvailabilityMap(prev => ({
      ...prev,
      [key]: prev[key] === 0 ? 1 : 0
    }));
  };

  const copyMondayToAll = () => {
    const newMap = { ...availabilityMap };
    periods.forEach(p => {
      const monVal = availabilityMap[`Mon-${p}`] ?? 1;
      days.slice(1).forEach(day => newMap[`${day}-${p}`] = monVal);
    });
    setAvailabilityMap(newMap);
    Swal.fire({ icon: 'info', title: 'Propagated Monday', text: 'Schedule copied to all days', timer: 1500 });
  };

  const saveStaffAvailability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/timetable/staffavailability`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ staff_id: selectedStaff.value, available_slots: availabilityMap })
      });
      if (res.ok) Swal.fire("Success", "Faculty availability updated", "success");
    } catch (e) {
      Swal.fire("Error", "Could not update availability", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10 text-slate-900 font-sans">
      <div className="max-w-[1600px] mx-auto">

        {/* TOP HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <span className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-100">
                <LucideCalendar size={32} />
              </span>
              Academic Subjects Setup
            </h1>
            <p className="text-slate-500 font-semibold pl-1 text-lg">
              Manage constraints, subject loads, and faculty availability.
            </p>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab("subjects")}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black transition-all duration-300 ${activeTab === 'subjects' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-y-[-2px]' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <LucideBookOpen size={20} /> Subject Setup
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black transition-all duration-300 ${activeTab === 'staff' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-y-[-2px]' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <LucideUser size={20} /> Staff Constraints
            </button>
          </div>
        </div>

        {/* TAB 1: SUBJECT SETUP */}
        {activeTab === "subjects" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* SUBJECT FILTERS CARD */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <LucideShieldCheck size={14} className="text-indigo-500" /> Administrative Department
                </label>
                <Select
                  styles={selectStyles}
                  options={Object.entries(DEPT_MAP).map(([k, v]) => ({ value: k, label: v }))}
                  value={deptId ? { value: deptId, label: DEPT_MAP[deptId] } : null}
                  onChange={(o) => setDeptId(o.value)}
                  isDisabled={["CA", "DeptAdmin", "HOD"].includes(user?.role)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Target Class Batch
                </label>
                <Select
                  styles={selectStyles}
                  options={Object.entries(CLASS_MAP).map(([k, v]) => ({ value: k, label: v }))}
                  value={classId ? { value: classId, label: CLASS_MAP[classId] } : null}
                  onChange={(o) => setClassId(o.value)}
                  isDisabled={user?.role === "CA"}
                  placeholder="Select class to configure..."
                />
              </div>
              <div className="flex items-center gap-4">
                {loading && <LucideLoader2 className="animate-spin text-indigo-600" size={28} />}
                <div className="text-xs text-slate-400 font-medium">
                  {subjects.length > 0 ? `${subjects.length} Subjects Linked` : "No subjects loaded"}
                </div>
              </div>
            </div>

            {/* MAIN TABLE CARD */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Resource Allocation Matrix</h3>
                  <p className="text-sm text-slate-500 font-medium italic">Define how many hours each subject requires per week.</p>
                </div>
                <button
                  onClick={saveSubjectConfig}
                  disabled={!classId || loading}
                  className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all disabled:opacity-20 shadow-xl shadow-slate-200 active:scale-95"
                >
                  <LucideSave size={20} /> Save Configuration
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-6">Subject Identity</th>
                      <th className="px-8 py-6">Instructional Type</th>
                      <th className="px-6 py-6 text-center">Theory Hrs</th>
                      <th className="px-6 py-6 text-center">Theory Max/D</th>
                      <th className="px-6 py-6 text-center">Lab Hrs</th>
                      <th className="px-6 py-6 text-center">Lab Max/D</th>
                      <th className="px-6 py-6 text-center">Lab Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((sub, idx) => (
                      <tr key={sub.map_id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-black text-indigo-600 text-sm">{sub.subject_code}</div>
                          <div className="text-xs text-slate-500 font-bold mt-1 line-clamp-1">{sub.subject_name}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200">
                            {[
                              { id: 'theory', label: 'Theory', active: !sub.is_lab && !sub.is_integrated },
                              { id: 'lab', label: 'Lab', active: sub.is_lab },
                              { id: 'int', label: 'Integrated', active: sub.is_integrated }
                            ].map(btn => (
                              <button
                                key={btn.id}
                                onClick={() => handleTypeChange(idx, btn.id)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${btn.active ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <input
                            type="number"
                            disabled={sub.is_lab}
                            value={sub.weekly_hours}
                            onChange={(e) => updateSubjectField(idx, 'weekly_hours', Number(e.target.value))}
                            className="w-16 bg-slate-50 border-2 border-slate-100 rounded-xl text-center py-2.5 font-black text-indigo-600 focus:border-indigo-500 focus:ring-0 transition-all disabled:opacity-25"
                          />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <input
                            type="number"
                            disabled={sub.is_lab}
                            value={sub.max_per_day}
                            onChange={(e) => updateSubjectField(idx, 'max_per_day', Number(e.target.value))}
                            className="w-16 bg-slate-50 border-2 border-slate-100 rounded-xl text-center py-2.5 font-black text-slate-600 focus:border-indigo-500 focus:ring-0 disabled:opacity-25"
                          />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <input
                            type="number"
                            disabled={!sub.is_lab && !sub.is_integrated}
                            value={sub.lab_hours}
                            onChange={(e) => updateSubjectField(idx, 'lab_hours', Number(e.target.value))}
                            className="w-16 bg-slate-50 border-2 border-slate-100 rounded-xl text-center py-2.5 font-black text-indigo-600 focus:border-indigo-500 focus:ring-0 disabled:opacity-25"
                          />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <input
                            type="number"
                            disabled={!sub.is_lab && !sub.is_integrated}
                            value={sub.lab_max_per_day}
                            onChange={(e) => updateSubjectField(idx, 'lab_max_per_day', Number(e.target.value))}
                            className="w-16 bg-slate-50 border-2 border-slate-100 rounded-xl text-center py-2.5 font-black text-slate-600 focus:border-indigo-500 focus:ring-0 disabled:opacity-25"
                          />
                        </td>
                        <td className="px-6 py-6 text-center">

                          {(sub.is_lab || sub.is_integrated) ? (

                            <Select
                              styles={selectStyles}
                              options={labs}
                              value={labs.find(l => l.value === sub.lab_id) || null}
                              onChange={(option) =>
                                updateSubjectField(idx, "lab_id", option?.value || null)
                              }
                              placeholder="Select Lab"
                              isClearable
                              className="text-xs"
                              menuPortalTarget={document.body}
                            />

                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subjects.length === 0 && !loading && (
                  <div className="py-32 flex flex-col items-center gap-4">
                    <div className="bg-slate-100 p-6 rounded-full text-slate-300">
                      <LucideAlertCircle size={48} />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Select batch to view data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF AVAILABILITY */}
        {activeTab === "staff" && (
          <div className="flex flex-col xl:flex-row gap-8 animate-in slide-in-from-right duration-500">

            {/* LEFT SIDE: FACULTY PICKER */}
            <div className="xl:w-[360px] w-full space-y-6 flex-shrink-0">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 sticky top-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><LucideUser size={20} /></div>
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Faculty Selection</h3>
                </div>

                <Select
                  styles={selectStyles}
                  options={staffOptions}
                  value={selectedStaff}
                  onChange={setSelectedStaff}
                  isSearchable
                  placeholder="Type faculty name..."
                  formatOptionLabel={o => (
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700">{o.label}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{o.dept}</span>
                    </div>
                  )}
                />
                <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">

                  {/* Info */}
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                      <LucideInfo size={16} />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Scheduling Rule
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Mark a slot as <span className="text-red-500 font-semibold">Busy</span> to prevent the timetable engine from assigning a class during that period.
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100"></div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">

                    {/* Primary */}
                    <button
                      onClick={saveStaffAvailability}
                      disabled={!selectedStaff || loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
                    >
                      {loading ? <LucideLoader2 className="animate-spin" /> : <LucideSave size={16} />}
                      Save Availability
                    </button>

                    {/* Secondary */}
                    <button
                      onClick={copyMondayToAll}
                      disabled={!selectedStaff}
                      className="w-full border border-slate-200 hover:bg-slate-50 py-3 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-2 transition"
                    >
                      <LucideCopy size={14} />
                      Copy Monday to All Days
                    </button>

                    {/* Reset */}
                    <button
                      onClick={() => setAvailabilityMap({})}
                      disabled={!selectedStaff}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold text-center pt-2 transition"
                    >
                      Reset All Slots
                    </button>

                  </div>

                </div>
              </div>
            </div>

            {/* RIGHT SIDE: INTERACTIVE GRID */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                    <LucideRefreshCcw size={20} className="text-indigo-600" />
                    Availability Grid
                  </h3>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Available
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div> Busy
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  {!selectedStaff ? (
                    <div className="py-40 text-center space-y-4 border-4 border-dashed border-slate-50 rounded-[32px]">
                      <LucideUser className="mx-auto text-slate-200" size={64} />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Search for a faculty member to edit their schedule</p>
                    </div>
                  ) : (
                    <div className="space-y-6 overflow-x-auto">
                      <div className="min-w-[700px] xl:min-w-[800px] grid grid-cols-9 gap-4 mb-4">
                        <div className="col-span-1"></div>
                        {periods.map(p => (
                          <div key={p} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Period {p}
                          </div>
                        ))}
                      </div>

                      {days.map(day => (
                        <div key={day} className="min-w-[700px] xl:min-w-[800px] grid grid-cols-9 items-center gap-4 group">
                          <div className="text-sm font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
                            {day}
                          </div>
                          {periods.map(p => {
                            const isBusy = availabilityMap[`${day}-${p}`] === 0;
                            return (
                              <button
                                key={p}
                                onClick={() => toggleSlot(day, p)}
                                className={`
                                  h-20 rounded-2xl border-2 transition-all duration-300 transform active:scale-90 flex flex-col items-center justify-center gap-1
                                  ${isBusy
                                    ? "bg-red-50 border-red-100 text-red-600 shadow-inner"
                                    : "bg-white border-slate-100 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-xl hover:-translate-y-1"}
                                `}
                              >
                                <span className="text-[10px] font-black">{isBusy ? "BUSY" : "OPEN"}</span>
                                {isBusy ? <LucideAlertCircle size={14} /> : <LucideCheckCircle size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}