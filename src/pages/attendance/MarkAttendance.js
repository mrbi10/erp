import React, { useState, useEffect } from "react";
import { BASE_URL } from '../../constants/API';
import { FaUserCheck, FaUserTimes, FaUserCircle, FaUndo, FaCheck, FaCalendarDay, FaSearch, FaUsers, FaClipboardCheck, FaTimesCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';



function MarkAttendance({ user }) {
  const todayISO = new Date().toISOString().split("T")[0];
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(null); // Used for submission payload
  const [selectedPeriod, setSelectedPeriod] = useState(1); // Used for submission payload
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); // Richer date format
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});


  // Map of department ids to names
  const DEPT_MAP = {
    1: "CSE",
    2: "IT",
    3: "ADS",
    4: "CSBS",
    5: "ECE",
    6: "EEE",
    7: "MECH",
    8: "CIVIL",
  };

  const fetchTodayAttendance = async (classId) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/attendance?classId=${classId}&date=${todayISO}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) return [];

    return await res.json();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);

    // Placeholder: In a real app, this should fetch only the students for the CA's assigned class/subject.
    fetch(`${BASE_URL}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch students'))
      .then(data => {
        setStudents(data.map(s => ({
          student_id: s.student_id,
          regNo: s.roll_no,
          name: s.name,
          class_id: s.class_id,
          dept_id: s.dept_id, // assuming this comes from API
          status: 'unmarked' // default status
        })));

        if (data.length) {
          const classId = data[0].class_id;

          fetchTodayAttendance(classId).then(attRows => {
            if (attRows.length > 0) {
              setAttendanceMarked(true);

              const map = {};
              attRows.forEach(a => {
                map[a.student_id] = a;
              });
              setAttendanceMap(map);

              // preload status into students list
              setStudents(prev =>
                prev.map(s => ({
                  ...s,
                  status: map[s.student_id]
                    ? map[s.student_id].status.toLowerCase()
                    : "unmarked"
                }))
              );
            }
          });
        }
        // Set department name based on first student's dept_id
        if (data.length) {
          setDepartmentName(DEPT_MAP[data[0].dept_id] || "Department");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);




  const markStudent = (studentId, status) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const handleMarkPresent = (studentId) => markStudent(studentId, "present");
  const handleMarkOD = (studentId) => markStudent(studentId, "present");
  const handleMarkAbsent = (studentId) => markStudent(studentId, "absent");

  const handleSubmit = () => {
    const unmarked = students.filter(s => s.status === 'unmarked');
    if (unmarked.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Attendance Incomplete',
        text: 'Please mark all students before submitting.',
        confirmButtonText: 'OK'
      });
      return;
    }

    const finalizedStudents = students;


    const absentStudents = finalizedStudents.filter(s => s.status === "absent");
    const presentStudents = finalizedStudents.filter(s => s.status === "present");

    // Improved Absent Names display
    const absentNamesHTML = absentStudents.length
      ? absentStudents.map(s => `<li class="text-left text-sm text-red-700">${s.regNo} - ${s.name}</li>`).join("")
      : "<p class='text-green-700'>None!</p>";

    Swal.fire({
      title: `<span class="text-xl font-bold">Confirm Attendance Submission</span>`,
      html: `
        <div class="text-left p-3 bg-gray-50 rounded-lg">
          <p class="mb-1 text-sm"><strong class="text-gray-700">Date:</strong> ${today}</p>
          <p class="mb-3 text-sm"><strong class="text-gray-700">Marked by:</strong> ${user.name || "Faculty"}</p>
          <hr class="my-2 border-gray-200"/>
          <p class="text-base"><strong class="text-green-600">Total Present:</strong> ${presentStudents.length}</p>
          <p class="text-base mb-2"><strong class="text-red-600">Total Absent:</strong> ${absentStudents.length}</p>
          <p class="font-semibold text-gray-800 border-b pb-1">Absent Students List:</p>
          <ul class="list-none p-0 mt-1 max-h-40 overflow-y-auto">${absentNamesHTML}</ul>
        </div>
      `,
      icon: absentStudents.length ? 'warning' : 'success',
      showCancelButton: true,
      confirmButtonText: '<FaCheck/> Submit Now',
      cancelButtonText: 'Review/Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal-classic-popup',
        confirmButton: 'swal-classic-button bg-teal-600 hover:bg-teal-700',
        cancelButton: 'swal-classic-button-cancel bg-red-500 hover:bg-red-600'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = finalizedStudents.map(s => ({
          regNo: s.regNo,
          date: todayISO,
          subjectId: selectedSubjectId || 1,
          period: selectedPeriod,
          status: s.status.charAt(0).toUpperCase() + s.status.slice(1)
        }));

        if (!attendanceMarked) {
          // FIRST TIME → POST
          submitAttendancePOST(payload);
        } else {
          // ALREADY MARKED → PATCH
          submitAttendancePATCH();
        }

      }
    });
  };

  const submitAttendancePOST = (payload) => {
    fetch(`${BASE_URL}/attendance`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setAttendanceMarked(true);

        fetchTodayAttendance(students[0].class_id).then(attRows => {
          const map = {};
          attRows.forEach(a => {
            map[a.student_id] = a;
          });
          setAttendanceMap(map);
        });

        Swal.fire("Success", "Attendance marked for today", "success");
      })

      .catch(() => {
        Swal.fire("Error", "Failed to save attendance", "error");
      });
  };

  const submitAttendancePATCH = () => {
    const changed = students.filter(s => {
      const old = attendanceMap[s.student_id];
      return old && old.status.toLowerCase() !== s.status;
    });

    if (changed.length === 0) {
      Swal.fire("No Changes", "Nothing to update", "info");
      return;
    }

    const payload = changed.map(s => ({
      attendance_id: attendanceMap[s.student_id].attendance_id,
      status: s.status.charAt(0).toUpperCase() + s.status.slice(1)
    }));

    fetch(`${BASE_URL}/attendance`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        const newMap = { ...attendanceMap };
        students.forEach(s => {
          if (newMap[s.student_id]) {
            newMap[s.student_id].status =
              s.status.charAt(0).toUpperCase() + s.status.slice(1);
          }
        });
        setAttendanceMap(newMap);

        Swal.fire("Updated", "Attendance updated successfully", "success");
      })
      .catch(() => {
        Swal.fire("Error", "Failed to update attendance", "error");
      });
  };

  const markAllPresent = () => setStudents(prev => prev.map(s => ({ ...s, status: "present" })));
  const resetAll = () => setStudents(prev => prev.map(s => ({ ...s, status: "unmarked" })));

  const filteredStudents = students.filter(
    s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentList = students.filter(s => s.status === "present");
  const absentList = students.filter(s => s.status === "absent");

  if (loading) {
    return (
      <div className="p-10 text-center text-xl font-semibold text-sky-600">
        <FaUsers className="inline mr-2 animate-pulse" /> Loading student data...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-teal-500 mb-8">

        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:justify-between mb-6 items-start md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
              <FaClipboardCheck className="mr-3 text-teal-600" /> Mark Class Attendance
            </h1>
            <p className="text-gray-600 mt-1 ml-10">
              <span className="font-semibold text-indigo-700">{departmentName}</span> | Date: {today}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Subject and Period Selectors would go here in a real app */}

            <button
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150"
              onClick={markAllPresent}
            >
              <FaCheck /> Mark All Present
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-150"
              onClick={resetAll}
            >
              <FaUndo /> Reset Status
            </button>
            <button
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-4 py-2 
    ${attendanceMarked ? "bg-orange-600" : "bg-teal-600"} 
    text-white font-bold rounded-lg`}
            >
              <FaUserCheck />
              {attendanceMarked ? "Update Attendance" : "Submit Attendance"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-xl shadow-lg bg-indigo-50 border-l-4 border-indigo-500 text-center">
            <h3 className="font-semibold text-indigo-700 mb-1">Total Students</h3>
            <p className="text-3xl font-extrabold text-indigo-900">{students.length}</p>
          </div>
          <div className="p-5 rounded-xl shadow-lg bg-green-50 border-l-4 border-green-500 text-center">
            <h3 className="font-semibold text-green-700 mb-1">Present (Marked)</h3>
            <p className="text-3xl font-extrabold text-green-900">{presentList.length}</p>
          </div>
          <div className="p-5 rounded-xl shadow-lg bg-red-50 border-l-4 border-red-500 text-center">
            <h3 className="font-semibold text-red-700 mb-1">Absent (Marked)</h3>
            <p className="text-3xl font-extrabold text-red-900">{absentList.length}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or register number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 pl-10 border border-gray-300 rounded-lg w-full shadow-inner focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
          />
        </div>

        {/* Student Lists and Table */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main Attendance Table */}
          <div className="flex-1 bg-white rounded-xl shadow-xl p-0 overflow-hidden border border-gray-200">
            <h2 className="text-xl font-bold p-4 bg-gray-50 border-b text-gray-700">Students List</h2>
            {attendanceMarked && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                Attendance already marked for today. You are editing it.
              </div>
            )}
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full text-left">
                <thead className="bg-sky-100 sticky top-0 shadow-sm">
                  <tr>
                    <th className="p-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Register No</th>
                    <th className="p-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="p-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Status</th>
                    <th className="p-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr
                      key={student.regNo}
                      className={`border-b transition duration-150 ${student.status === 'present' ? 'bg-green-50 hover:bg-green-100' :
                        student.status === 'absent' ? 'bg-red-50 hover:bg-red-100' :
                          'hover:bg-gray-100'
                        }`}
                    >
                      <td className="p-3 text-sm font-medium text-gray-700">{student.regNo}</td>
                      <td className="p-3 text-sm font-medium text-gray-900">{student.name}</td>

                      {/* Status Tag */}
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm capitalize ${student.status === 'present' ? 'bg-green-200 text-green-800' :
                          student.status === 'absent' ? 'bg-red-200 text-red-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                          {student.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3 flex justify-center gap-2">
                        <button
                          className={`p-2 rounded-full transition duration-150 shadow-md ${student.status === 'present' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                          onClick={() => handleMarkPresent(student.student_id)}
                          title="Mark Present"
                        >
                          <FaUserCheck />
                        </button>
                        {/* <button
                          className={`p-2 rounded-full transition duration-150 shadow-md ${student.status === 'OD' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                          onClick={() => handleMarkOD(student.student_id)}
                          title="Mark OD"
                        >
                          <FaUserCircle  />
                        </button> */}
                        <button
                          className={`p-2 rounded-full transition duration-150 shadow-md ${student.status === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                          onClick={() => handleMarkAbsent(student.student_id)}
                          title="Mark Absent"
                        >
                          <FaUserTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No students found matching your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panels */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            <div className="panel bg-red-100 p-5 rounded-xl shadow-lg border border-red-300">
              <h3 className="font-bold text-xl text-red-800 mb-3 border-b border-red-300 pb-2 flex items-center">
                <FaTimesCircle className="mr-2" /> Absent List ({absentList.length})
              </h3>
              <ul className="list-none space-y-2 max-h-60 overflow-y-auto">
                {absentList.length > 0 ? (
                  absentList.map(s => <li key={s.regNo} className="text-sm text-red-700 truncate">{s.regNo} - {s.name}</li>)
                ) : (
                  <li className="text-sm text-red-500 italic">No one marked absent yet.</li>
                )}
              </ul>
            </div>
            <div className="panel bg-green-100 p-5 rounded-xl shadow-lg border border-green-300">
              <h3 className="font-bold text-xl text-green-800 mb-3 border-b border-green-300 pb-2 flex items-center">
                <FaUserCheck className="mr-2" /> Present List ({presentList.length})
              </h3>
              <ul className="list-none space-y-2 max-h-60 overflow-y-auto">
                {presentList.length > 0 ? (
                  presentList.map(s => <li key={s.regNo} className="text-sm text-green-700 truncate">{s.regNo} - {s.name}</li>)
                ) : (
                  <li className="text-sm text-green-500 italic">No one marked present yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkAttendance;