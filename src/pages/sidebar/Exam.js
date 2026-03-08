import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaPen,
  FaEye,
  FaClipboardCheck,
  FaDoorOpen,
  FaUserTag,
  FaCalendarAlt,
  FaChartBar,
  FaUsers,
} from "react-icons/fa";

export default function Exam({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/exam";

  // Role color styles
  const roleStyles = {
    HOD: { label: "HOD", color: "bg-indigo-600" },
    CA: { label: "Course Advisor", color: "bg-green-600" },
    Staff: { label: "Faculty", color: "bg-orange-600" },
    student: { label: "Student", color: "bg-sky-600" },
    Principal: { label: "Principal", color: "bg-purple-600" },
    DeptAdmin: { label: "Department Admin", color: "bg-pink-600" },
  };

  const roleStyle = roleStyles[user?.role] || roleStyles.Staff;
  const showHeader = location.pathname === basePath;

  const options = [];

  // PRINCIPAL
  if (user?.role === "Principal") {
    options.push(
      {
        label: "Exam Timetable",
        page: "timetable",
        icon: <FaCalendarAlt className="text-blue-500" />,
        description: "View all exam schedules across departments.",
      },
      {
        label: "Exam Results",
        page: "marks",
        icon: <FaEye className="text-indigo-500" />,
        description: "Review marks and results across the institution.",
      },
      {
        label: "Exam Analytics",
        page: "analytics",
        icon: <FaChartBar className="text-purple-500" />,
        description: "Analyze department and subject performance.",
      }
    );
  }

  // HOD
  else if (user?.role === "HOD") {
    options.push(
      {
        label: "Department Timetable",
        page: "timetable",
        icon: <FaCalendarAlt className="text-blue-500" />,
        description: "View exam schedules for your department.",
      },
      {
        label: "Department Results",
        page: "marks",
        icon: <FaEye className="text-indigo-500" />,
        description: "View marks for classes in your department.",
      },
      {
        label: "Department Analytics",
        page: "analytics",
        icon: <FaChartBar className="text-purple-500" />,
        description: "Analyze class and subject performance.",
      }
    );
  }

  // COURSE ADVISOR
  else if (user?.role === "CA") {
    options.push(
      {
        label: "Enter Marks",
        page: "marks/enter",
        icon: <FaPen className="text-green-500" />,
        description: "Enter marks for your advised class.",
      },
      {
        label: "View Class Marks",
        page: "marks",
        icon: <FaEye className="text-blue-500" />,
        description: "View results and subject marks for your class.",
      },
      {
        label: "Publish Results",
        page: "publish",
        icon: <FaClipboardCheck className="text-teal-500" />,
        description: "Publish results after mark verification.",
      }
    );
  }

  // STAFF
  else if (user?.role === "Staff") {
    options.push(
      {
        label: "Exam Duties",
        page: "duties",
        icon: <FaUsers className="text-purple-500" />,
        description: "View your assigned invigilation duties.",
      },
      {
        label: "Enter Subject Marks",
        page: "marks/enter",
        icon: <FaPen className="text-green-500" />,
        description: "Enter marks for subjects you teach.",
      },
      {
        label: "Room Allocation",
        page: "rooms",
        icon: <FaDoorOpen className="text-orange-500" />,
        description: "View exam hall allocation and seating.",
      }
    );
  }

  // STUDENT
  else if (user?.role === "student") {
    options.push(
      {
        label: "Exam Timetable",
        page: "timetable",
        icon: <FaCalendarAlt className="text-blue-500" />,
        description: "View your upcoming exams.",
      },
      {
        label: "My Seating",
        page: "seating",
        icon: <FaDoorOpen className="text-orange-500" />,
        description: "Check your exam hall and seat number.",
      },
      {
        label: "My Results",
        page: "marks",
        icon: <FaEye className="text-sky-500" />,
        description: "View subject-wise exam marks.",
      }
    );
  }

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-gray-50">
      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-blue-500 mb-8">
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
              <FaClipboardCheck className="mr-3 text-blue-600" />
              Examination Module
            </h1>

            <div
              className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}
            >
              {roleStyle.label} Portal
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-6">
            Welcome{" "}
            <span className="font-bold text-blue-800">{user?.name}</span>. Select
            an option to manage exams and results.
          </p>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`${basePath}/${opt.page}`)}
                className="bg-white p-6 shadow-lg rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl border-l-4 border-blue-400 hover:border-blue-600"
              >
                <div className="flex items-start">
                  <div className="text-4xl mr-4 p-3 bg-gray-100 rounded-full shadow-inner">
                    {opt.icon}
                  </div>

                  <div>
                    <div className="text-xl font-semibold text-gray-800 mb-1">
                      {opt.label}
                    </div>
                    <p className="text-sm text-gray-500">{opt.description}</p>
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