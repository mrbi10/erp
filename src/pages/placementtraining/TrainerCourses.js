import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaChalkboardTeacher, FaCalendarAlt } from "react-icons/fa";
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
  // Fetch trainer courses
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
        list.push({
          dept_id: d,
          class_id: c
        });
      }
    }

    return list;
  };


  // -----------------------------
  // Create course
  // -----------------------------
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
      setForm({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
      });
      fetchCourses();

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  const assignCourse = async () => {
    if (
      assignForm.dept_ids.length === 0 ||
      assignForm.class_ids.length === 0
    ) {
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

      Swal.fire(
        "Assigned",
        `${data.assigned_count} assignments saved`,
        "success"
      );

      setAssignModal(false);
      setAssignForm({ dept_ids: [], class_ids: [] });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "-";

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaChalkboardTeacher className="text-sky-600" />
          Placement Training – Courses
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow"
        >
          <FaPlus />
          Create Course
        </button>
      </div>

      {/* Courses */}
      {loading ? (
        <p className="text-gray-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          No courses created yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.course_id}
              onClick={() =>
                navigate(`/placementtraining/tests/manage/${c.course_id}`)
              }
              className="bg-white rounded-xl shadow hover:shadow-xl transition cursor-pointer border-l-4 border-sky-500"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{c.name}</h2>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {c.description || "No description"}
                </p>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FaCalendarAlt />
                    {formatDate(c.start_date)} → {formatDate(c.end_date)}
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {c.status || "UPCOMING"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(c);
                      setAssignModal(true);
                    }}
                    className="mt-3 text-sm text-sky-600 hover:underline"
                  >
                    Assign to Dept / Class
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {assignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Assign Course – {selectedCourse.name}
            </h2>

            {/* Department Multi-select */}
            <label className="block mb-2 font-medium">Departments</label>
            <select
              multiple
              className="w-full border p-2 rounded mt-1"
              value={assignForm.dept_ids}
              onChange={(e) =>
                setAssignForm({
                  ...assignForm,
                  dept_ids: Array.from(
                    e.target.selectedOptions,
                    o => Number(o.value)
                  )
                })
              }
            >
              {Object.entries(DEPT_MAP).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            {/* Class Multi-select */}
            <label className="block mb-2 font-medium">Classes</label>
            <select
              multiple
              className="w-full border p-2 rounded mt-1"
              value={assignForm.class_ids}
              onChange={(e) =>
                setAssignForm({
                  ...assignForm,
                  class_ids: Array.from(
                    e.target.selectedOptions,
                    o => Number(o.value)
                  )
                })
              }
            >
              {Object.entries(CLASS_MAP).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAssignModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={assignCourse}
                className="px-4 py-2 bg-sky-600 text-white rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">Create New Course</h2>

            <div className="space-y-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="Course name *"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <textarea
                className="w-full border p-2 rounded"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                className="px-4 py-2 bg-sky-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
