import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaLayerGroup,
  FaTimes,
  FaArrowRight,
  FaCheckCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

export default function TrainerCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);


  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [assignModal, setAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [assignForm, setAssignForm] = useState({
    dept_ids: [],
    class_ids: [],
  });

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      description: course.description || ""
    });
    setShowModal(true);
  };



  const fetchAssignments = async (courseId) => {
    const res = await fetch(
      `${BASE_URL}/placement-training/courses/${courseId}/assignments`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      Swal.fire("Error", "Failed to load assignments", "error");
      return;
    }

    // Extract unique dept_ids and class_ids
    const dept_ids = [...new Set(data.assignments.map(a => a.dept_id))];
    const class_ids = [...new Set(data.assignments.map(a => a.class_id))];

    setAssignForm({ dept_ids, class_ids });
  };

  // -----------------------------
  // Logic (Unchanged)
  // -----------------------------
  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/placement-training/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return Swal.fire("Error", data.message || "Failed to load courses", "error");
      }

      setCourses(data.courses || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const buildAssignments = () => {
    const list = [];
    for (const d of assignForm.dept_ids) {
      for (const c of assignForm.class_ids) {
        list.push({ dept_id: d, class_id: c });
      }
    }
    return list;
  };

  const deleteCourse = async (course) => {
    try {
      const tests = await getCourseTests(course.course_id);

      const testListHtml = tests.length
        ? `
    <div style="
      margin-top:16px;
      text-align:center;
    ">
      <strong style="font-size:15px;">
        ${tests.length} test(s) will be deleted
      </strong>

      <ul style="
        list-style: none;
        margin:12px auto 0;
        padding:0;
        max-width:320px;
        text-align:left;
      ">
        ${tests
          .map(
            ({ title }) => `
            <li style="
              padding:8px 12px;
              margin-bottom:6px;
              border-radius:6px;
              background:#f8fafc;
              border:1px solid #e5e7eb;
              font-size:14px;
            ">
              ${title}
            </li>`
          )
          .join("")}
      </ul>
    </div>
  `
        : `<p style="text-align:center;">No tests found under this course.</p>`;



      const confirm = await Swal.fire({
        title: "Delete course?",
        html: `
        <p style="margin-bottom:8px">
          You will <b>lose access</b> to all tests, questions and results under this course.
        </p>
        ${testListHtml}
        <p style="margin-top:10px;color:#dc2626;font-weight:600">
          This action cannot be undone.
        </p>
      `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete course",
        cancelButtonText: "Cancel",
        width: 520,
      });

      if (!confirm.isConfirmed) return;

      // 🔴 actual delete (unchanged)
      const res = await fetch(
        `${BASE_URL}/placement-training/courses/${course.course_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire("Deleted", "Course removed successfully", "success");
      fetchCourses();

    } catch (err) {
      Swal.fire("Error", err.message || "Server error", "error");
    }
  };

  const getCourseTests = async (courseId) => {
    const res = await fetch(
      `${BASE_URL}/placement-training/courses/${courseId}/tests`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.tests || [];
  };


  const handleSaveCourse = async () => {
    if (!form.name) {
      return Swal.fire("Required", "Course name is required", "warning");
    }

    try {
      const url = editingCourse
        ? `${BASE_URL}/placement-training/courses/${editingCourse.course_id}`
        : `${BASE_URL}/placement-training/courses`;

      const method = editingCourse ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire(
        editingCourse ? "Updated" : "Created",
        `Course ${editingCourse ? "updated" : "created"} successfully`,
        "success"
      );

      setShowModal(false);
      setEditingCourse(null);
      setForm({ name: "", description: "" });
      fetchCourses();
    } catch (err) {
      Swal.fire("Error", err.message || "Server error", "error");
    }
  };


  const assignCourse = async () => {
    if (assignForm.dept_ids.length === 0 || assignForm.class_ids.length === 0) {
      const confirm = await Swal.fire({
        title: "Remove all assignments?",
        text: "This will unassign the course from all departments and classes.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove",
      });

      if (!confirm.isConfirmed) return;
    }


    const assignments = buildAssignments();

    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/courses/${selectedCourse.course_id}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ assignments }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire("Error", data.message, "error");
      }

      Swal.fire("Assigned", `${data.assigned_count} assignments saved`, "success");
      setAssignModal(false);
      setAssignForm({ dept_ids: [], class_ids: [] });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };



  // -----------------------------
  // UI Components
  // -----------------------------

  // Loading Skeleton Component
  const CourseSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-100 rounded w-5/6 mb-6"></div>
      <div className="flex justify-between mt-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800">

      {/* --- Header Section --- */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <span className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <FaChalkboardTeacher />
              </span>
              Training Courses
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              Manage your placement curriculum and schedules.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <FaPlus className="transition-transform group-hover:rotate-90" />
            Create Course
          </button>
        </div>
      </div>

      {/* --- Content Grid --- */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center shadow-sm">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <FaLayerGroup className="text-4xl text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No courses yet</h3>
            <p className="text-slate-500 mt-2 max-w-xs">
              Get started by creating your first training course for the students.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 text-indigo-600 font-semibold hover:underline"
            >
              Create Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((c) => (
              <div
                key={c.course_id}
                onClick={() => navigate(`/placementtraining/tests/manage/${c.course_id}`)}
                className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
              >
                {/* Decorative Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="p-6 flex flex-col h-full">


                  <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {c.name}
                  </h2>

                  <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">
                    {c.description || "No description provided."}
                  </p>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">


                    <div className="flex items-center justify-between mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(c);
                          setAssignModal(true);
                          fetchAssignments(c.course_id);
                        }}
                        className="text-sm font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-indigo-50"
                      >
                        <FaLayerGroup /> Assign Class
                      </button>

                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <FaArrowRight className="text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCourse(c);
                      }}
                      className="text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCourse(c);
                      }}
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Assign Modal --- */}
      {assignModal && selectedCourse && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAssignModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">

            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Assign Course</h2>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{selectedCourse.name}</p>
              </div>
              <button onClick={() => setAssignModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dept Select */}
              {/* Dept Select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Select Departments
                </label>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {Object.entries(DEPT_MAP).map(([id, name]) => {
                    const deptId = Number(id);
                    const checked = assignForm.dept_ids.includes(deptId);

                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border
            ${checked
                            ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setAssignForm(prev => ({
                              ...prev,
                              dept_ids: e.target.checked
                                ? [...prev.dept_ids, deptId]
                                : prev.dept_ids.filter(d => d !== deptId)
                            }));
                          }}
                        />
                        <span className="text-sm font-medium">{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>


              {/* Class Select */}
              {/* Class Select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Select Classes
                </label>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {Object.entries(CLASS_MAP).map(([id, name]) => {
                    const classId = Number(id);
                    const checked = assignForm.class_ids.includes(classId);

                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border
            ${checked
                            ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setAssignForm(prev => ({
                              ...prev,
                              class_ids: e.target.checked
                                ? [...prev.class_ids, classId]
                                : prev.class_ids.filter(c => c !== classId)
                            }));
                          }}
                        />
                        <span className="text-sm font-medium">{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setAssignModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={assignCourse} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Create Course Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus className="text-indigo-200" size={16} /> Create New Course
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white transition-colors">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Course Name</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. Advanced Aptitude 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400"
                  placeholder="Brief summary of the curriculum..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>



            </div>

            <div className="px-8 pb-8 flex items-center justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transform active:scale-95 transition-all flex items-center gap-2"
              >
                <FaCheckCircle /> {editingCourse ? "Update Course" : "Create Course"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tailwind Custom Animation (Inline styles for quick demo, preferably add to tailwind.config.js) */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}