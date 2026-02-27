import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaClipboardCheck,
  FaChartBar,
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaCheckCircle
} from "react-icons/fa";

export default function Placements({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = "/placements";

  const options = [];

  const roleStyles = {
    HOD: { label: "HOD", color: "bg-indigo-600" },
    CA: { label: "Course Advisor", color: "bg-green-600" },
    trainer: { label: "Trainer", color: "bg-orange-600" },
    Principal: { label: "Principal", color: "bg-purple-600" },
    student: { label: "Student", color: "bg-sky-600" },
  };

  const roleStyle = roleStyles[user.role] || roleStyles.Student;

  /* ---------------- ROLE BASED OPTIONS ---------------- */

  if (user.role === "student") {
    options.push(
      {
        label: "My Placement Training Courses",
        page: "my-courses",
        icon: <FaBookOpen className="text-sky-500" />,
        description: "View all placement training programs.",
      },
      {
        label: "My Placement Training Results",
        page: "result",
        icon: <FaChartBar className="text-indigo-500" />,
        description: "View your test performance.",
      },
      {
        label: "Available Placement Drives",
        page: "drives",
        icon: <FaUserGraduate className="text-green-500" />,
        description: "View and apply for placement drives.",
      },
      {
        label: "My Placement Applications",
        page: "applications",
        icon: <FaClipboardCheck className="text-purple-500" />,
        description: "Track your application status.",
      },
      {
        label: "My Placement Profile",
        page: "profile",
        icon: <FaUsers className="text-orange-500" />,
        description: "Update your placement details.",
      }
    );
  }

  else if (user.role === "trainer") {
    options.push(
      {
        label: "Placement Training Courses",
        page: "courses",
        icon: <FaChalkboardTeacher className="text-orange-500" />,
        description: "Manage assigned training courses.",
      },
      {
        label: "Placement Training Answer Review",
        page: "review",
        icon: <FaClipboardCheck className="text-green-600" />,
        description: "Review student test submissions.",
      },
      {
        label: "Placement Training Results",
        page: "results",
        icon: <FaUserGraduate className="text-purple-500" />,
        description: "Analyze student performance.",
      },
      {
        label: "Placement Training Analytics",
        page: "analytics",
        icon: <FaChartBar className="text-green-500" />,
        description: "View training insights.",
      },
      {
        label: "Manage Placement Drives",
        page: "drives-manage",
        icon: <FaUsers className="text-blue-500" />,
        description: "Create and manage placement drives.",
      },
      {
        label: "Manage Placement Drive Applications",
        page: "drive-applications",
        icon: <FaClipboardCheck className="text-indigo-500" />,
        description: "View drive applicants.",
      },
      {
        label: "Students Placement Profile",
        page: "studentsprofile",
        icon: <FaUsers className="text-orange-500" />,
        description: "Students placement details.",
      }
    );
  }

  else if (["CA"].includes(user.role)) {
    options.push(
      { label: "Placement Profile Approval", page: "approval", icon: <FaCheckCircle /> }
    );
  }

  else if (["CA", "HOD", "Principal"].includes(user.role)) {
    options.push(
      { label: "Placement Training Results", page: "results", icon: <FaUsers /> },
      { label: "Placement Training Analytics", page: "analytics", icon: <FaChartBar /> },
      { label: "Placement Training Answer Review", page: "review", icon: <FaClipboardCheck /> },
      { label: "Manage Placement Drive Applications", page: "drive-applications", icon: <FaUsers /> },
      { label: "Placement Drive Analytics", page: "drive-analytics", icon: <FaChartBar /> },
      
    );
  }

  /* ---------------------------------------------------- */

  const showHeader = location.pathname === basePath;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-indigo-500 mb-8">

          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="flex items-center text-2xl font-bold">
              <FaUserGraduate className="mr-3 text-indigo-600" />
              Placements
            </h1>

            <div className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}>
              {roleStyle.label} Portal
            </div>
          </div>

          {/* ✅ Proper Placement Opt Warning
          {user.role === "Student" && !user.willing_for_placement && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-6 text-sm font-medium">
              You have not opted for campus placements. Please update your Placement Profile.
            </div>
          )} */}

          <p className="text-lg text-gray-600 mb-6">
            Welcome, <span className="font-bold text-indigo-800">{user.name}</span>.
            Choose an option below to continue.
          </p>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`${basePath}/${opt.page}`)}
                className="bg-white p-6 shadow-xl rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-l-4 border-indigo-400 hover:border-indigo-600"
              >
                <div className="flex items-start">
                  <div className="text-4xl mr-4 p-3 bg-gray-100 rounded-full shadow-inner">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800 mb-1">
                      {opt.label}
                    </div>
                    <p className="text-sm text-gray-500">
                      {opt.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      <Outlet />
    </div>
  );
}