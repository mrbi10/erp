import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaTimes,
  FaArrowRight,
  FaCheckCircle,
  FaTrashAlt,
  FaEdit,
  FaBuilding,
  FaUserGraduate,
  FaExclamationCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

/**
 * ------------------------------------------------------------------
 * SUB-COMPONENT: SKELETON LOADER
 * ------------------------------------------------------------------
 */
const CourseSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-64 flex flex-col">
    <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
    <div className="space-y-2 mb-6 flex-1">
      <div className="h-4 bg-slate-100 rounded w-full"></div>
      <div className="h-4 bg-slate-100 rounded w-5/6"></div>
      <div className="h-4 bg-slate-100 rounded w-4/6"></div>
    </div>
    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
      <div className="h-8 bg-slate-200 rounded w-24"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

/**
 * ------------------------------------------------------------------
 * SUB-COMPONENT: EMPTY STATE
 * ------------------------------------------------------------------
 */
const EmptyState = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 text-center">
    <div className="bg-indigo-50 p-6 rounded-full mb-6">
      <FaLayerGroup className="text-4xl text-indigo-300" />
    </div>
    <h3 className="text-xl font-bold text-slate-800">No courses available</h3>
    <p className="text-slate-500 mt-2 max-w-sm mx-auto mb-8">
      Get started by creating your first training course to manage curriculum and assignments.
    </p>
    <button
      onClick={onCreate}
      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200"
    >
      <FaPlus /> Create First Course
    </button>
  </div>
);

/**
 * ------------------------------------------------------------------
 * SUB-COMPONENT: COURSE CARD
 * ------------------------------------------------------------------
 */
const CourseCard = ({ course, onNavigate, onAssign, onEdit, onDelete }) => (
  <article 
    onClick={onNavigate}
    className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full hover:-translate-y-1"
    role="button"
    tabIndex={0}
  >
    {/* Decorative Gradient Bar */}
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    <div className="p-7 flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {course.name}
        </h2>
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
          {course.description || "No description provided for this course."}
        </p>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
        {/* Primary Action */}
        <button
          onClick={(e) => { e.stopPropagation(); onAssign(course); }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg text-sm font-bold transition-colors border border-slate-200 hover:border-indigo-200"
        >
          <FaLayerGroup />
          <span>Assign Class</span>
        </button>

        {/* Secondary Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(course); }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Edit Course"
          >
            <FaEdit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(course); }}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Course"
          >
            <FaTrashAlt />
          </button>
          
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          
          <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
             <FaArrowRight />
          </div>
        </div>
      </div>
    </div>
  </article>
);

/**
 * ------------------------------------------------------------------
 * MAIN COMPONENT: TRAINER COURSES
 * ------------------------------------------------------------------
 */
export default function TrainerCourses() {
  const navigate = useNavigate();

  // --- State ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);

  // Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  // Assign Modal State
  const [assignModal, setAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignForm, setAssignForm] = useState({
    dept_ids: [],
    class_ids: [],
  });

  // -----------------------------
  // Logic: Actions & Helpers
  // -----------------------------
  const openEditCourse = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      description: course.description || ""
    });
    setShowModal(true);
  };

  const fetchAssignments = async (courseId) => {
    // Keep exact logic as requested
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

    const dept_ids = [...new Set(data.assignments.map(a => a.dept_id))];
    const class_ids = [...new Set(data.assignments.map(a => a.class_id))];

    setAssignForm({ dept_ids, class_ids });
  };

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

      // Preserving exact HTML string generation logic for Swal
      const testListHtml = tests.length
        ? `
    <div style="margin-top:16px; text-align:center;">
      <strong style="font-size:15px; display:block; margin-bottom:8px;">
        ${tests.length} test(s) will be deleted
      </strong>
      <ul style="
        list-style: none;
        margin:0 auto;
        padding:0;
        max-width:320px;
        text-align:left;
        max-height:150px;
        overflow-y:auto;
      ">
        ${tests
          .map(
            ({ title }) => `
            <li style="
              padding:8px 12px;
              margin-bottom:6px;
              border-radius:6px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              font-size:13px;
              color:#475569;
            ">
              ${title}
            </li>`
          )
          .join("")}
      </ul>
    </div>
  `
        : `<p style="text-align:center; color:#64748b;">No tests found under this course.</p>`;

      const confirm = await Swal.fire({
        title: "Delete course?",
        html: `
        <div style="text-align:center;">
          <p style="margin-bottom:8px; color:#334155;">
            You will <b>lose access</b> to all tests, questions and results under this course.
          </p>
          ${testListHtml}
          <p style="margin-top:16px; color:#dc2626; font-weight:600;">
            This action cannot be undone.
          </p>
        </div>
      `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete course",
        cancelButtonText: "Cancel",
        width: 480,
        focusCancel: true
      });

      if (!confirm.isConfirmed) return;

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
        confirmButtonColor: "#dc2626"
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
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
                <FaChalkboardTeacher />
              </span>
              Training Courses
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium ml-14">
              Manage curriculum, tests, and student assignments.
            </p>
          </div>

          <button
            onClick={() => { setEditingCourse(null); setForm({ name: "", description: "" }); setShowModal(true); }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all active:scale-95"
          >
            <FaPlus /> Create Course
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState onCreate={() => setShowModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <CourseCard
                key={c.course_id}
                course={c}
                onNavigate={() => navigate(`/placementtraining/tests/manage/${c.course_id}`)}
                onAssign={(course) => {
                  setSelectedCourse(course);
                  setAssignModal(true);
                  fetchAssignments(course.course_id);
                }}
                onEdit={(course) => openEditCourse(course)}
                onDelete={(course) => deleteCourse(course)}
              />
            ))}
          </div>
        )}
      </div>

      {/* -------------------------
          MODAL: ASSIGN COURSE
         ------------------------- */}
      {assignModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setAssignModal(false)} 
          />
          
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Assign Course</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 uppercase tracking-wide">
                    {selectedCourse.name}
                  </span>
                </div>
              </div>
              <button onClick={() => setAssignModal(false)} className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400">
                <FaTimes />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                
                {/* Departments Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <FaBuilding className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target Departments</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(DEPT_MAP).map(([id, name]) => {
                      const deptId = Number(id);
                      const isSelected = assignForm.dept_ids.includes(deptId);
                      return (
                        <label
                          key={id}
                          className={`
                            relative flex items-center p-3 rounded-xl cursor-pointer border transition-all select-none
                            ${isSelected 
                              ? "bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500" 
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                            ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300"}
                          `}>
                            {isSelected && <FaCheckCircle className="text-xs" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={(e) => {
                              setAssignForm(prev => ({
                                ...prev,
                                dept_ids: e.target.checked
                                  ? [...prev.dept_ids, deptId]
                                  : prev.dept_ids.filter(d => d !== deptId)
                              }));
                            }}
                          />
                          <span className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-slate-600"}`}>
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* Classes Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <FaUserGraduate className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target Classes</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(CLASS_MAP).map(([id, name]) => {
                      const classId = Number(id);
                      const isSelected = assignForm.class_ids.includes(classId);
                      return (
                        <label
                          key={id}
                          className={`
                            relative flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border text-center transition-all select-none h-20
                            ${isSelected 
                              ? "bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500" 
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={(e) => {
                              setAssignForm(prev => ({
                                ...prev,
                                class_ids: e.target.checked
                                  ? [...prev.class_ids, classId]
                                  : prev.class_ids.filter(c => c !== classId)
                              }));
                            }}
                          />
                          <span className={`text-lg font-bold ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setAssignModal(false)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={assignCourse} 
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------
          MODAL: CREATE / EDIT
         ------------------------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
            <div className="bg-slate-900 px-6 py-5 flex justify-between items-center text-white">
              <h2 className="text-white font-bold flex items-center gap-2">
                {editingCourse ? <FaEdit className="text-white" /> : <FaPlus className="text-white" />}
                {editingCourse ? "Edit Course Details" : "Create New Course"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Name <span className="text-red-500">*</span></label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. Advanced Aptitude 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400 resize-none"
                  placeholder="Brief summary of the curriculum, objectives, or target audience..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="px-8 pb-8 pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transform active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <FaCheckCircle /> {editingCourse ? "Update Changes" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for Animations & Scrollbars */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}