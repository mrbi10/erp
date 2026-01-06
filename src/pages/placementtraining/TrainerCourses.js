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

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const [assignModal, setAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [assignForm, setAssignForm] = useState({
    dept_ids: [],
    class_ids: [],
  });

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

  const handleCreateCourse = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      return Swal.fire("Required", "Fill all required fields", "warning");
    }

    try {
      const res = await fetch(`${BASE_URL}/placement-training/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire("Error", data.message || "Failed", "error");
      }

      Swal.fire("Created", "Course created successfully", "success");
      setShowModal(false);
      setForm({ name: "", description: "", start_date: "", end_date: "" });
      fetchCourses();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  const assignCourse = async () => {
    if (assignForm.dept_ids.length === 0 || assignForm.class_ids.length === 0) {
      return Swal.fire("Required", "Select department and class", "warning");
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

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "-";

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
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                      c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {c.status || "Upcoming"}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {c.name}
                  </h2>
                  
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">
                    {c.description || "No description provided."}
                  </p>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <FaCalendarAlt className="text-slate-400" />
                      <span>{formatDate(c.start_date)} — {formatDate(c.end_date)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(c);
                          setAssignModal(true);
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Assign Modal --- */}
      {assignModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Departments</label>
                <div className="relative">
                  <select
                    multiple
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-32 bg-slate-50 text-slate-600"
                    value={assignForm.dept_ids}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        dept_ids: Array.from(e.target.selectedOptions, o => Number(o.value))
                      })
                    }
                  >
                    {Object.entries(DEPT_MAP).map(([id, name]) => (
                      <option key={id} value={id} className="p-2 rounded hover:bg-indigo-100 cursor-pointer">
                        {name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1 text-right">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>

              {/* Class Select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Classes</label>
                <select
                  multiple
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-32 bg-slate-50 text-slate-600"
                  value={assignForm.class_ids}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      class_ids: Array.from(e.target.selectedOptions, o => Number(o.value))
                    })
                  }
                >
                  {Object.entries(CLASS_MAP).map(([id, name]) => (
                    <option key={id} value={id} className="p-2 rounded hover:bg-indigo-100 cursor-pointer">
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
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
                <FaPlus className="text-indigo-200" size={16}/> Create New Course
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

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-slate-700"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-slate-700"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
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
                onClick={handleCreateCourse}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transform active:scale-95 transition-all flex items-center gap-2"
              >
                <FaCheckCircle /> Create Course
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