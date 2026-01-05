import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBookOpen, FaArrowRight } from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function StudentMyCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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
  // Helpers
  // -----------------------------
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "-";

  const getStatusBadge = (status) => {
    if (!status) return "bg-gray-400";

    if (status === "ONGOING") return "bg-green-600";
    if (status === "UPCOMING") return "bg-blue-600";
    if (status === "COMPLETED") return "bg-gray-600";

    return "bg-slate-500";
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FaBookOpen className="text-sky-600 text-2xl" />
        <h1 className="text-2xl font-bold">My Placement Training</h1>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          You are not enrolled in any placement training courses
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl shadow flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-bold mb-1">{c.name}</h2>

                {c.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {c.description}
                  </p>
                )}

                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium">Start:</span>{" "}
                    {formatDate(c.start_date)}
                  </p>
                  <p>
                    <span className="font-medium">End:</span>{" "}
                    {formatDate(c.end_date)}
                  </p>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-block text-xs text-white px-3 py-1 rounded-full ${getStatusBadge(
                      c.status
                    )}`}
                  >
                    {c.status || "UNKNOWN"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5">
                <button
                  onClick={() =>
                    navigate(`/placementtraining/tests/${c.course_id}`)
                  }
                  className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg"
                >
                  View Tests
                  <FaArrowRight />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
