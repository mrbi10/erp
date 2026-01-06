import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaGraduationCap,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaPlay
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function StudentMyCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 inline tests logic
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [testsByCourse, setTestsByCourse] = useState({});
  const [loadingTests, setLoadingTests] = useState(false);

  // -----------------------------
  // Fetch enrolled courses
  // -----------------------------
  const fetchCourses = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/placement-training/student/courses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire(
          "Error",
          data.message || "Failed to load courses",
          "error"
        );
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

  // -----------------------------
  // Fetch tests for a course
  // -----------------------------
  const fetchTestsForCourse = async (courseId) => {
    // toggle close
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }

    // already loaded → just open
    if (testsByCourse[courseId]) {
      setExpandedCourseId(courseId);
      return;
    }

    try {
      setLoadingTests(true);

      const res = await fetch(
        `${BASE_URL}/placement-training/student/courses/${courseId}/tests`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return Swal.fire("Error", data.message, "error");
      }

      setTestsByCourse((prev) => ({
        ...prev,
        [courseId]: data.tests || [],
      }));

      setExpandedCourseId(courseId);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load tests", "error");
    } finally {
      setLoadingTests(false);
    }
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

  const getStatusStyle = (status) => {
    switch (status) {
      case "ONGOING":
        return "bg-emerald-100 text-emerald-700";
      case "UPCOMING":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // -----------------------------
  // Skeleton
  // -----------------------------
  const CourseSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-100 rounded w-2/3 mb-6"></div>
      <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 text-slate-800">

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <span className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <FaBookOpen />
          </span>
          My Placement Training
        </h1>
        <p className="mt-2 text-slate-500 ml-16">
          Courses and active tests assigned to you
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CourseSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <FaGraduationCap className="text-4xl text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No Courses Found</h3>
            <p className="text-slate-500 mt-2">
              You are not enrolled in any placement training yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div
                key={c.course_id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Course Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold mb-2">{c.name}</h2>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                    {c.description || "No description available"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt />
                      {formatDate(c.start_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock />
                      {formatDate(c.end_date)}
                    </div>
                  </div>

                  <button
                    onClick={() => fetchTestsForCourse(c.course_id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                  >
                    {expandedCourseId === c.course_id ? (
                      <>
                        Hide Tests <FaChevronUp />
                      </>
                    ) : (
                      <>
                        View Tests <FaChevronDown />
                      </>
                    )}
                  </button>
                </div>

                {/* Tests Section */}
                {expandedCourseId === c.course_id && (
                  <div className="px-6 pb-6 border-t bg-slate-50">
                    {loadingTests ? (
                      <p className="text-sm text-slate-500 py-4">
                        Loading tests...
                      </p>
                    ) : testsByCourse[c.course_id]?.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4">
                        No active tests available right now.
                      </p>
                    ) : (
                      <div className="space-y-3 mt-4">
                        {testsByCourse[c.course_id].map((t) => (
                          <div
                            key={t.test_id}
                            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
                          >
                            <div>
                              <h4 className="font-semibold">
                                {t.title}
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <FaClock /> {t.duration_minutes} mins
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                navigate(
                                  `/placementtraining/tests/${t.test_id}`
                                )
                              }
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                            >
                              <FaPlay /> Start
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
