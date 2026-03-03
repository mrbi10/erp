import React, { useEffect, useState } from "react";
import Select from "react-select";
import {
  LucideSave, LucideUser, LucideBookOpen, LucideCalendar,
  LucideLoader2, LucideInfo, LucideCheckCircle2, LucideCopy
} from "lucide-react";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

export default function TimetableSetup({ user }) {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // UI & Data State
  const [activeTab, setActiveTab] = useState("subjects");
  const [loading, setLoading] = useState(false);
  const [deptId, setDeptId] = useState("");
  const [classId, setClassId] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  /* 1. FETCH FACULTY LIST */
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${BASE_URL}/faculty`, { headers });
        const data = await res.json();
        const raw = data.data || data.staff || data;
        if (Array.isArray(raw)) {
          setStaffOptions(raw.map(s => ({
            value: s.staff_id,
            label: `${s.name} (${DEPT_MAP[s.dept_id] || "Faculty"})`
          })));
        }
      } catch (e) { console.error("Staff Fetch Error", e); }
    };
    fetchStaff();
  }, []);

  /* 2. LOAD SUBJECTS FOR SELECTED CLASS */
  useEffect(() => {
    if (!deptId || !classId) return;
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/timetable/class-subjects?dept_id=${deptId}&class_id=${classId}`, { headers });
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSubjects();
  }, [deptId, classId]);

  /* 3. LOAD STAFF AVAILABILITY */
  useEffect(() => {
    if (!selectedStaff) return;
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/timetable/staff-availability?staff_id=${selectedStaff.value}`, { headers });
        const data = await res.json();
        setAvailabilityMap(data || {});
      } catch (e) { Swal.fire("Error", "Failed to load availability", "error"); }
      finally { setLoading(false); }
    };
    fetchAvailability();
  }, [selectedStaff]);

  /* 4. TOGGLE LOGIC (0 = Busy, 1 = Available) */
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
      days.slice(1).forEach(day => {
        newMap[`${day}-${p}`] = monVal;
      });
    });
    setAvailabilityMap(newMap);
    Swal.fire({ icon: 'success', title: 'Monday schedule copied to all days', timer: 1500, showConfirmButton: false });
  };

  /* 5. SAVE LOGIC */
  const saveSubjects = async () => {
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/timetable/class-subjects`, {
        method: "PUT", headers,
        body: JSON.stringify({ dept_id: deptId, class_id: classId, subjects })
      });
      Swal.fire("Success", "Subject configuration saved", "success");
    } catch (e) { Swal.fire("Error", "Save failed", "error"); }
    finally { setLoading(false); }
  };

  const saveAvailability = async () => {
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/timetable/staffavailability`, {
        method: "PUT", headers,
        body: JSON.stringify({ staff_id: selectedStaff.value, available_slots: availabilityMap })
      });
      Swal.fire("Success", "Faculty availability updated", "success");
    } catch (e) { Swal.fire("Error", "Update failed", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><LucideCalendar size={24} /></div>
            Timetable Setup          </h1>
          <p className="text-slate-500 font-medium">Configure academic hours and faculty constraints</p>
        </div>

        <nav className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
          <button onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'subjects' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LucideBookOpen size={18} /> Subject Setup
          </button>
          <button onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'staff' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LucideUser size={18} /> Staff Availability
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* GLOBAL FILTERS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap gap-6 mb-8 items-center">
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Department</label>
            <Select
              options={Object.entries(DEPT_MAP).map(([k, v]) => ({ value: k, label: v }))}
              onChange={(o) => setDeptId(o.value)}
              placeholder="Filter Department..."
              className="react-select-container"
            />
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Target Class</label>
            <Select
              options={Object.entries(CLASS_MAP).map(([k, v]) => ({ value: k, label: v }))}
              onChange={(o) => setClassId(o.value)}
              placeholder="Select Class..."
            />
          </div>
          {loading && <LucideLoader2 className="animate-spin text-indigo-600" size={24} />}
        </div>

        {activeTab === "subjects" ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Subject Allocation Matrix</h3>
                <p className="text-xs text-slate-500">Define weekly hours and lab requirements for the selected class</p>
              </div>
              <button onClick={saveSubjects} disabled={!classId || loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-100">
                <LucideSave size={18} /> Save Configuration
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Course Details</th>
                    <th className="px-8 py-4">Hrs / Week</th>
                    <th className="px-8 py-4 text-center">Type</th>
                    <th className="px-8 py-4">Max / Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub, idx) => (
                    <tr key={sub.map_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-bold text-slate-700">{sub.subject_code}</div>
                        <div className="text-xs text-slate-500 font-medium">{sub.subject_name}</div>
                      </td>
                      <td className="px-8 py-4">
                        <input type="number" value={sub.weekly_hours} onChange={(e) => {
                          const up = [...subjects]; up[idx].weekly_hours = Number(e.target.value); setSubjects(up);
                        }} className="w-20 bg-slate-100 border-none rounded-lg font-bold text-center py-2 focus:ring-2 focus:ring-indigo-500" />
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex justify-center">
                          <button onClick={() => {
                            const up = [...subjects]; up[idx].is_lab = up[idx].is_lab === 1 ? 0 : 1; setSubjects(up);
                          }} className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${sub.is_lab === 1 ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'}`}>
                            {sub.is_lab === 1 ? 'Laboratory' : 'Theory'}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <input type="number" value={sub.max_per_day} onChange={(e) => {
                          const up = [...subjects]; up[idx].max_per_day = Number(e.target.value); setSubjects(up);
                        }} className="w-20 bg-slate-100 border-none rounded-lg font-bold text-center py-2" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subjects.length === 0 && <div className="p-20 text-center text-slate-400 font-medium">Select a Class to load subject data</div>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4">
            <aside className="xl:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Select Faculty</label>
                <Select options={staffOptions} value={selectedStaff} onChange={setSelectedStaff} isSearchable placeholder="Search Name..." />

                <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><LucideInfo size={16} className="text-indigo-600" /> Quick Guide</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Click slots to block them. Blocked periods prevent the generator from assigning classes.</p>
                  <button onClick={copyMondayToAll} disabled={!selectedStaff} className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                    <LucideCopy size={14} /> Copy Monday Schedule
                  </button>
                </div>

                <button onClick={saveAvailability} disabled={loading || !selectedStaff} className="w-full mt-6 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200">
                  {loading ? <LucideLoader2 className="animate-spin" /> : <LucideSave size={20} />}
                  Update Faculty Records
                </button>
              </div>
            </aside>

            <section className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold flex items-center gap-2 text-slate-700 uppercase text-xs tracking-wider"><LucideCalendar size={18} className="text-indigo-600" /> Availability Matrix</h3>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div> Available</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div> Busy</span>
                </div>
              </div>

              <div className="p-8 overflow-x-auto">
                <div className="min-w-[700px] space-y-4">
                  {days.map(day => (
                    <div key={day} className="flex items-center group">
                      <div className="w-24 text-xs font-black text-slate-400 uppercase tracking-tighter">{day}</div>
                      <div className="flex-1 grid grid-cols-8 gap-3">
                        {periods.map(p => {
                          const isBusy = availabilityMap[`${day}-${p}`] === 0;
                          return (
                            <button key={p} onClick={() => toggleSlot(day, p)} className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 group/btn ${isBusy ? "bg-red-50 border-red-200 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1"}`}>
                              <span className="text-xs font-black">P{p}</span>
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isBusy ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}