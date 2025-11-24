import React, { useEffect, useState } from "react";
import { FaSpinner, FaUserGraduate, FaSearch } from "react-icons/fa";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import { motion } from "framer-motion";


const DEPT_MAP = {
  1: "CSE",
  2: "ECE",
  3: "EEE",
  4: "MECH",
  5: "CIVIL",
  6: "IT",
};

const romanMap = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
};

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    dept: "",
    year: "",
    classId: "",
    multiFilters: []
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 7;
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    roll_no: "",
    email: "",
    mobile: "",
    class_id: "",
    dept_id: "",
    jain: false,
    hostel: false,
    bus: false,
  });
  const [adding, setAdding] = useState(false);
  const token = localStorage.getItem("token");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ jain: false, hostel: false, bus: false });
  const [saving, setSaving] = useState(false);



  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditForm({
      jain: !!student.jain,
      hostel: !!student.hostel,
      bus: !!student.bus,
    });
  };

  const handleDelete = async (student) => {
    const confirm = await Swal.fire({
      title: `Delete ${student.name}?`,
      text: "This will permanently remove the student.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "bg-red-600 text-white px-4 py-2 rounded",
        cancelButton: "bg-gray-200 px-4 py-2 rounded ml-2",
      },
      buttonsStyling: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      await fetch(`${BASE_URL}/student/${student.student_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        title: "Deleted!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setStudents(prev => prev.filter(st => st.student_id !== student.student_id));
    } catch (err) {
      Swal.fire("Error", "Something went wrong.", "error");
    }
  };

  const handleAddStudent = async () => {
    try {
      setAdding(true);

      let finalDept = newStudent.dept_id;
      let finalClass = newStudent.class_id;

      if (user.role === "HOD") {
        finalDept = user.dept_id;
      }

      if (user.role === "CA") {
        finalDept = user.dept_id;
        finalClass = user.assigned_class_id;
      }

      const formattedStudent = {
        ...newStudent,
        name: newStudent.name.trim().toUpperCase(),
        dept_id: finalDept,
        class_id: finalClass
      };

      const res = await fetch(`${BASE_URL}/student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedStudent),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.code === "DUPLICATE") {
          const ex = data.existingStudent;
          return Swal.fire({
            title: "Student Already Exists",
            html: `
            <div class="text-left leading-relaxed">
              <p class="text-gray-700 mb-3">
                A student with the same <b>email</b> or <b>register number</b> already exists.
              </p>

              <div class="p-3 bg-gray-100 rounded border">
                <p><b>Name:</b> ${ex?.name || "-"}</p>
                <p><b>Reg No:</b> ${ex?.roll_no || "-"}</p>
                <p><b>Email:</b> ${ex?.email || "-"}</p>
              </div>
            </div>
          `,
            icon: "warning",
            confirmButtonText: "OK",
            customClass: { confirmButton: "bg-blue-600 text-white px-4 py-2 rounded" },
            buttonsStyling: false
          });
        }

        return Swal.fire({
          title: "Failed to Add Student",
          text: data.message || "Unexpected error occurred",
          icon: "error",
        });
      }

      Swal.fire({
        title: "Student Added",
        text: `${formattedStudent.name} added successfully`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setStudents(prev => [
        ...prev,
        { ...formattedStudent, student_id: data.student_id }
      ]);

      setShowAddModal(false);

    } catch (err) {
      Swal.fire({
        title: "Server Error",
        text: "Could not reach server",
        icon: "error",
      });
    } finally {
      setAdding(false);
    }
  };




  const handleSave = async () => {
    const confirm = await
      Swal.fire({
        title: "Save changes?",
        text: "This will update the student's information in the database.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, save it",
        cancelButtonText: "Cancel",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded",
          cancelButton:
            "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded ml-2",
        },
        buttonsStyling: false,
      });


    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/student/${editingStudent.student_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: "Updated!",
          text: "Student details were successfully updated.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setStudents((prev) =>
          prev.map((s) =>
            s.student_id === editingStudent.student_id ? { ...s, ...editForm } : s
          )
        );
        setEditingStudent(null);
      } else {
        Swal.fire({
          title: "Error!",
          text: data.message || "Failed to update student.",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("Error saving student:", err);
      Swal.fire({
        title: "Server Error",
        text: "Something went wrong while saving changes.",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const deptOptions = Object.entries(DEPT_MAP).map(([id, name]) => ({
    value: Number(id),
    label: name
  }));


  const formattedClassOptions = classes.map(c => ({
    value: c.class_id,
    label: `${romanMap[c.year]} Year - ${DEPT_MAP[c.dept_id]}`
  }));



  useEffect(() => {
    if (!user) return;

    if (user.role === "Principal") {
      setFilters({ dept: "", year: "", classId: "", multiFilters: [] });
    }

    if (user.role === "HOD") {
      setFilters({ dept: user.dept_id, year: "", classId: "", multiFilters: [] });
    }

    if (user.role === "CA") {
      setFilters({
        dept: user.dept_id,
        year: "",
        classId: user.assigned_class_id,
        multiFilters: []
      });
    }
  }, [user]);


  const yearOptions = [...new Set(
    classes
      .filter(c => !filters.dept || c.dept_id === filters.dept)
      .map(c => c.year)
  )].map(y => ({ value: y, label: ` ${romanMap[y]} Year` }));





  useEffect(() => {
    if (!user) return;

    const fetchClasses = async () => {
      try {
        let url = "";

        if (user.role === "Principal") {
          url = `${BASE_URL}/classes`;
        }

        else if (user.role === "HOD") {
          url = `${BASE_URL}/classes?dept_id=${user.dept_id}`;
        }

        else if (user.role === "CA") {
          url = `${BASE_URL}/classes/${user.assigned_class_id}`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        setClasses(Array.isArray(data) ? data : [data]);

      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };

    fetchClasses();
  }, [user, token]);


  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        let url = "";

        if (user?.role === "Principal") {
          url = selectedClass
            ? `${BASE_URL}/classes/${selectedClass}/students`
            : `${BASE_URL}/students`;
        }

        else if (user?.role === "HOD") {
          url = `${BASE_URL}/departments/${user.dept_id}/students`;
        }

        else if (user?.role === "CA") {
          url = `${BASE_URL}/classes/${user.assigned_class_id}/students`;
        }

        else {
          setLoading(false);
          return;
        }


        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStudents(data);
        setFilteredStudents(data);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user, token, selectedClass]);

  useEffect(() => {
    let result = [...students];
    const { dept, year, classId, multiFilters } = filters;

    if (dept) {
      result = result.filter(s => s.dept_id === dept);
    }

    if (year) {
      result = result.filter(s => {
        const cls = classes.find(c => c.class_id === s.class_id);
        return cls?.year === year;
      });
    }

    if (classId) {
      result = result.filter(s => s.class_id === classId);
    }

    if (multiFilters.length > 0) {
      result = result.filter(s => {
        const jain = s.jain === 1;
        const hostel = s.hostel === 1;
        const bus = s.bus === 1;

        return multiFilters.every(f => {
          if (f === "Jain") return jain;
          if (f === "Non-Jain") return !jain;
          if (f === "Hostel") return hostel;
          if (f === "DayScholar") return !hostel;
          if (f === "Bus") return bus;
          if (f === "NoBus") return !bus;
          return true;
        });
      });
    }

    if (search.trim() !== "") {
      result = result.filter(
        s =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.roll_no?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredStudents(result);
    setCurrentPage(1);
  }, [filters, search, students, classes]);



  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };



  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-4"
        >
          <FaSpinner className="text-5xl text-blue-600 dark:text-blue-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          className="text-lg font-semibold tracking-wide"
        >
          Loading Students...
        </motion.h2>
      </div>
    );
  }


  return (
    <div className="p-6 min-h-screen bg-gray-50">

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
        <FaUserGraduate className="text-red-600 mr-3" />
        {user?.role === "Principal"
          ? "Students Overview"
          : ""}
      </h1>

      {user.role === "Principal" && (
        <div className="flex gap-3 flex-wrap mb-6">

          <Select
            className="w-52"
            placeholder="All Departments"
            options={[{ value: "", label: "All Departments" },
            ...Object.entries(DEPT_MAP).map(([id, name]) => ({
              value: Number(id),
              label: name
            }))
            ]}
            value={filters.dept ? { value: filters.dept, label: DEPT_MAP[filters.dept] } : null}
            onChange={(opt) => setFilters(f => ({
              ...f,
              dept: opt?.value || "",
              year: "",
              classId: ""
            }))}
          />

          <Select
            className="w-52"
            placeholder="All Years"
            options={[{ value: "", label: "All Years" }, ...yearOptions]}
            value={yearOptions.find(o => o.value === filters.year) || null}
            onChange={(opt) => setFilters(f => ({
              ...f,
              year: opt?.value || "",
              classId: ""
            }))}
          />

          <Select
            isMulti
            options={[
              { value: "Jain", label: "Jain" },
              { value: "Non-Jain", label: "Non-Jain" },
              { value: "Hostel", label: "Hostel" },
              { value: "DayScholar", label: "Day Scholar" },
              { value: "Bus", label: "College Bus" },
              { value: "NoBus", label: "No Bus" },
            ]}
            value={filters.multiFilters.map(f => ({
              value: f,
              label:
                f === "Jain" ? "Jain" :
                  f === "Non-Jain" ? "Non-Jain" :
                    f === "Hostel" ? "Hostel" :
                      f === "DayScholar" ? "Day Scholar" :
                        f === "Bus" ? "College Bus" : "No Bus"
            }))}
            onChange={(selected) =>
              setFilters(f => ({
                ...f,
                multiFilters: selected ? selected.map(s => s.value) : []
              }))
            }
            placeholder="Filter by Category"
            className="text-sm"
          />

          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or reg no"
              className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        </div>



      )}


      {user.role === "HOD" && (
        <div className="flex gap-3 flex-wrap mb-6">

          <Select
            className="w-52"
            placeholder="All Years"
            options={[{ value: "", label: "All Years" }, ...yearOptions]}
            value={yearOptions.find(o => o.value === filters.year) || null}
            onChange={(opt) => setFilters(f => ({
              ...f,
              year: opt?.value || "",
              classId: ""
            }))}
          />

          <Select
            isMulti
            options={[
              { value: "Jain", label: "Jain" },
              { value: "Non-Jain", label: "Non-Jain" },
              { value: "Hostel", label: "Hostel" },
              { value: "DayScholar", label: "Day Scholar" },
              { value: "Bus", label: "College Bus" },
              { value: "NoBus", label: "No Bus" },
            ]}
            value={filters.multiFilters.map(f => ({
              value: f,
              label:
                f === "Jain" ? "Jain" :
                  f === "Non-Jain" ? "Non-Jain" :
                    f === "Hostel" ? "Hostel" :
                      f === "DayScholar" ? "Day Scholar" :
                        f === "Bus" ? "College Bus" : "No Bus"
            }))}
            onChange={(selected) =>
              setFilters(f => ({
                ...f,
                multiFilters: selected ? selected.map(s => s.value) : []
              }))
            }
            placeholder="Filter by Category"
            className="text-sm"
          />
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or reg no"
              className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>


        </div>
      )}


      {user.role === "CA" && (
        <div className="flex gap-3 flex-wrap mb-6">
          <div className="px-3 py-2 bg-gray-100 border rounded">
            Dept: {DEPT_MAP[user.dept_id]}
          </div>
          <div className="px-3 py-2 bg-gray-100 border rounded">
            Class: {romanMap[user.assigned_class_id]}
          </div>
          <Select
            isMulti
            options={[
              { value: "Jain", label: "Jain" },
              { value: "Non-Jain", label: "Non-Jain" },
              { value: "Hostel", label: "Hostel" },
              { value: "DayScholar", label: "Day Scholar" },
              { value: "Bus", label: "College Bus" },
              { value: "NoBus", label: "No Bus" },
            ]}
            value={filters.multiFilters.map(f => ({
              value: f,
              label:
                f === "Jain" ? "Jain" :
                  f === "Non-Jain" ? "Non-Jain" :
                    f === "Hostel" ? "Hostel" :
                      f === "DayScholar" ? "Day Scholar" :
                        f === "Bus" ? "College Bus" : "No Bus"
            }))}
            onChange={(selected) =>
              setFilters(f => ({
                ...f,
                multiFilters: selected ? selected.map(s => s.value) : []
              }))
            }
            placeholder="Filter by Category"
            className="text-sm"
          />
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or reg no"
              className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        </div>
      )}




      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Student
        </button>
      </div>


      {filteredStudents.length === 0 ? (
        <div className="p-6 bg-white rounded-xl shadow-md text-center text-gray-500">
          No students found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Reg No
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Dept / Year
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Mobile
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Jain / Non-Jain
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Hostel / Day Scholar
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  College Bus / No Bus
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((s) => (
                <tr
                  key={s.student_id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                    {s.roll_no || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-gray-600">
                    {`${DEPT_MAP[s.dept_id] || "Dept"} - ${romanMap[s.class_id]}`}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-gray-600">
                    {s.email}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-gray-600">
                    {s.mobile}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm">
                    {s.jain ? (
                      <span className="text-green-700 font-semibold">Jain</span>
                    ) : (
                      <span className="text-gray-700">Non-Jain</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm">
                    {s.hostel ? (
                      <span className="text-blue-700 font-semibold">
                        Hostel
                      </span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">
                        Day Scholar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm">
                    {s.bus ? (
                      <span className="text-blue-700 font-semibold">
                        College Bus
                      </span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm flex gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(s)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>


                </tr>
              ))}
            </tbody>

          </table>
          {filteredStudents.length > studentsPerPage && (
            <div className="flex justify-center items-center py-4 gap-2 text-sm flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                Prev
              </button>

              {(() => {
                const pageButtons = [];
                const maxVisible = 4;

                if (totalPages <= maxVisible + 2) {
                  for (let i = 1; i <= totalPages; i++) {
                    pageButtons.push(i);
                  }
                } else {
                  if (currentPage <= 3) {
                    pageButtons.push(1, 2, 3, 4, "...", totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pageButtons.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    pageButtons.push(
                      1,
                      "...",
                      currentPage - 1,
                      currentPage,
                      currentPage + 1,
                      "...",
                      totalPages
                    );
                  }
                }

                return pageButtons.map((page, index) =>
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${page === currentPage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                Next
              </button>
            </div>
          )}

          {editingStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg w-80 p-6 relative">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  Edit Student: {editingStudent.name}
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Jain</span>
                    <input
                      type="checkbox"
                      checked={editForm.jain}
                      onChange={(e) => setEditForm({ ...editForm, jain: e.target.checked })}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Hostel</span>
                    <input
                      type="checkbox"
                      checked={editForm.hostel}
                      onChange={(e) =>
                        setEditForm({ ...editForm, hostel: e.target.checked })
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span>College Bus</span>
                    <input
                      type="checkbox"
                      checked={editForm.bus}
                      onChange={(e) => setEditForm({ ...editForm, bus: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg w-96 p-6">

                <h2 className="text-xl font-bold mb-4">Add New Student</h2>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="text"
                    placeholder="Register Number"
                    value={newStudent.roll_no}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="text"
                    placeholder="Mobile"
                    value={newStudent.mobile}
                    onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })}
                    className="w-full border p-2 rounded"
                  />

                  {user.role === "Principal" && (
                    <Select
                      options={deptOptions}
                      placeholder="Select Department"
                      value={deptOptions.find(d => d.value === newStudent.dept_id) || null}
                      onChange={(opt) => setNewStudent({ ...newStudent, dept_id: opt.value })}
                    />
                  )}

                  {user.role === "HOD" && (
                    <input
                      className="border p-2 rounded bg-gray-100"
                      value={DEPT_MAP[user.dept_id]}
                      disabled
                    />
                  )}

                  {user.role === "CA" && (
                    <input
                      className="border p-2 rounded bg-gray-100"
                      value={DEPT_MAP[user.dept_id]}
                      disabled
                    />
                  )}

                  {user.role === "Principal" && (
                    <Select
                      options={formattedClassOptions}
                      placeholder="Select Class"
                      value={formattedClassOptions.find(c => c.value === newStudent.class_id) || null}
                      onChange={(opt) => setNewStudent({ ...newStudent, class_id: opt.value })}
                    />
                  )}

                  {user.role === "HOD" && (
                    <Select
                      options={formattedClassOptions.filter(c => c.dept_id === user.dept_id)}
                      placeholder="Select Class"
                      value={formattedClassOptions.find(c => c.value === newStudent.class_id) || null}
                      onChange={(opt) => setNewStudent({ ...newStudent, class_id: opt.value })}
                    />
                  )}

                  {user.role === "CA" && (
                    <input
                      className="border p-2 rounded bg-gray-100"
                      value={`${romanMap[user.assigned_class_id]} - ${DEPT_MAP[user.dept_id]}`}
                      disabled
                    />
                  )}


                  <div className="flex items-center justify-between">
                    <label>Jain</label>
                    <input
                      type="checkbox"
                      checked={newStudent.jain}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, jain: e.target.checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label>Hostel</label>
                    <input
                      type="checkbox"
                      checked={newStudent.hostel}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, hostel: e.target.checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label>Bus</label>
                    <input
                      type="checkbox"
                      checked={newStudent.bus}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, bus: e.target.checked })
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleAddStudent}
                    disabled={adding}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    {adding ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      )}
    </div>
  );
}
