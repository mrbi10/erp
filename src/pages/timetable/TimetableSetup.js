import React, { useEffect, useState } from "react";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

export default function TimetableSetup({ user }) {
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const [deptId, setDeptId] = useState("");
  const [classId, setClassId] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  /* ================= LOAD SUBJECTS ================= */
  useEffect(() => {
    if (!deptId || !classId) return;

    fetch(`${BASE_URL}/timetable/class-subjects?dept_id=${deptId}&class_id=${classId}`, { headers })
      .then(res => res.json())
      .then(data => setSubjects(data.subjects || []));
  }, [deptId, classId]);

  /* ================= LOAD TIMESLOTS ================= */
  useEffect(() => {
    fetch(`${BASE_URL}/timetable?dept_id=${user.dept_id}&class_id=${classId}`, { headers })
      .then(res => res.json())
      .then(data => setTimeSlots(data.timeSlots || []));
  }, [classId]);

  /* ================= LOAD STAFF AVAILABILITY ================= */
  useEffect(() => {
    if (!selectedStaff) return;

    fetch(`${BASE_URL}/timetable/staff-availability?staff_id=${selectedStaff}`, { headers })
      .then(res => res.json())
      .then(data => setAvailableSlots(data.available_slots || []));
  }, [selectedStaff]);

  /* ================= SAVE SUBJECT SETUP ================= */
  const saveSubjects = async () => {
    await fetch(`${BASE_URL}/timetable/class-subjects`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        dept_id: deptId,
        class_id: classId,
        subjects
      })
    });
    alert("Saved");
  };

  /* ================= SAVE STAFF AVAILABILITY ================= */
  const saveAvailability = async () => {
    await fetch(`${BASE_URL}/timetable/staff-availability`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        staff_id: selectedStaff,
        available_slots: availableSlots
      })
    });
    alert("Availability Saved");
  };

  const toggleSlot = (slotId) => {
    if (availableSlots.includes(slotId)) {
      setAvailableSlots(prev => prev.filter(id => id !== slotId));
    } else {
      setAvailableSlots(prev => [...prev, slotId]);
    }
  };

  const deptOptions = Object.entries(DEPT_MAP).map(([k, v]) => ({ value: k, label: v }));
  const classOptions = Object.entries(CLASS_MAP).map(([k, v]) => ({ value: k, label: v }));

  return (
    <div className="p-8 space-y-10">

      {/* ===== FILTERS ===== */}
      <div className="flex gap-6">
        <Select
          placeholder="Department"
          options={deptOptions}
          onChange={(o) => setDeptId(o.value)}
        />
        <Select
          placeholder="Class"
          options={classOptions}
          onChange={(o) => setClassId(o.value)}
        />
      </div>

      {/* ================================================= */}
      {/* ================= SUBJECT SETUP ================= */}
      {/* ================================================= */}

      <div>
        <h2 className="text-xl font-bold mb-4">Class Subject Setup</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th>Subject</th>
              <th>Weekly Hours</th>
              <th>Lab</th>
              <th>Max / Day</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, index) => (
              <tr key={sub.map_id} className="border-t">
                <td className="p-2">
                  {sub.subject_code} - {sub.subject_name}
                </td>

                <td>
                  <input
                    type="number"
                    value={sub.weekly_hours || 0}
                    onChange={(e) => {
                      const updated = [...subjects];
                      updated[index].weekly_hours = Number(e.target.value);
                      setSubjects(updated);
                    }}
                    className="border p-1 w-20"
                  />
                </td>

                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={sub.is_lab === 1}
                    onChange={(e) => {
                      const updated = [...subjects];
                      updated[index].is_lab = e.target.checked ? 1 : 0;
                      setSubjects(updated);
                    }}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={sub.max_per_day || 2}
                    onChange={(e) => {
                      const updated = [...subjects];
                      updated[index].max_per_day = Number(e.target.value);
                      setSubjects(updated);
                    }}
                    className="border p-1 w-20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={saveSubjects}
          className="mt-4 px-6 py-2 bg-black text-white"
        >
          Save Subjects
        </button>
      </div>

      {/* ================================================= */}
      {/* ================= STAFF AVAILABILITY ============ */}
      {/* ================================================= */}

      <div>
        <h2 className="text-xl font-bold mb-4">Staff Availability</h2>

        <input
          type="number"
          placeholder="Enter Staff ID"
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="border p-2 mb-4"
        />

        <div className="grid grid-cols-6 gap-2">
          {timeSlots
            .filter(slot => slot.is_break === 0)
            .map(slot => (
              <div
                key={slot.id}
                onClick={() => toggleSlot(slot.id)}
                className={`p-3 text-center cursor-pointer border
                  ${availableSlots.includes(slot.id)
                    ? "bg-green-200"
                    : "bg-red-200"
                  }`}
              >
                {slot.day} P{slot.period_number}
              </div>
            ))}
        </div>

        <button
          onClick={saveAvailability}
          className="mt-4 px-6 py-2 bg-black text-white"
        >
          Save Availability
        </button>
      </div>

    </div>
  );
}