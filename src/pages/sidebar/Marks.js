import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaPen,
  FaEye,
  FaClipboardCheck,
  FaAward,
  FaUserTag,
  FaBookOpen,
  FaChartBar,
  FaChartPie,
} from "react-icons/fa";

export default function Marks({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/erp/marks";

  // --- Role-based color styles ---
  const optionStyles = {
    HOD: { label: "HOD", color: "bg-indigo-600", hover: "hover:bg-indigo-700", icon: FaUserTag },
    CA: { label: "Course Advisor", color: "bg-green-600", hover: "hover:bg-green-700", icon: FaUserTag },
    Staff: { label: "Faculty", color: "bg-orange-600", hover: "hover:bg-orange-700", icon: FaUserTag },
    student: { label: "Student", color: "bg-sky-600", hover: "hover:bg-sky-700", icon: FaUserTag },
    Principal: { label: "Principal", color: "bg-purple-600", hover: "hover:bg-purple-700", icon: FaUserTag },
  };

  const roleStyle = optionStyles[user?.role] || optionStyles.Staff;
  const showHeader = location.pathname === basePath;

  // --- Role-based Cards ---
  const options = [];

  if (user?.role === "Principal") {
    options.push(
      {
        label: "Marks Overview",
        page: "view",
        icon: <FaEye className="text-blue-500" />,
        description: "Review marks for all classes.",
      },
      {
        label: "Marks Overview",
        page: "overview",
        icon: <FaEye className="text-blue-500" />,
        description: "View marks and performance data across all departments.",
      },
      {
        label: "Department Analysis",
        page: "analysis",
        icon: <FaChartBar className="text-purple-500" />,
        description: "Analyze department-wise averages and top-performing classes.",
      },
      {
        label: "Top Performers",
        page: "top",
        icon: <FaAward className="text-yellow-500" />,
        description: "See the best-performing students across the institution.",
      }
    );
  } else if (user?.role === "HOD") {
    options.push(
      {
        label: "Department Marks Overview",
        page: "view",
        icon: <FaEye className="text-blue-500" />,
        description: "Review marks for all classes in your department.",
      },
      {
        label: "Faculty Performance Reports",
        page: "faculty",
        icon: <FaClipboardCheck className="text-teal-500" />,
        description: "View reports on marks entered and exam performance by staff.",
      }
    );
  } else if (user?.role === "CA") {
    options.push(
      {
        label: "Enter Marks",
        page: "enter",
        icon: <FaPen className="text-green-500" />,
        description: "Record IAT and Model Exam marks for your advised class.",
      },
      {
        label: "View Class Marks",
        page: "view",
        icon: <FaEye className="text-blue-500" />,
        description: "View summary of your advised class and teaching subjects.",
      },
      {
        label: "Top Performers",
        page: "top",
        icon: <FaAward className="text-yellow-500" />,
        description: "See top students in your advised class.",
      }
    );
  } else if (user?.role === "Staff") {
    options.push(
      {
        label: "Enter Subject Marks",
        page: "enter",
        icon: <FaPen className="text-green-500" />,
        description: "Enter marks for subjects you handle.",
      },
      {
        label: "View My Subject Marks",
        page: "view",
        icon: <FaBookOpen className="text-indigo-500" />,
        description: "Check marks data for your subjects.",
      }
    );
  } else if (user?.role === "student") {
    options.push(
      {
        label: "View My Marks",
        page: "view",
        icon: <FaEye className="text-sky-500" />,
        description: "Access your IAT and Model Exam marks with subject-wise breakdown.",
      },
      {
        label: "Top Rankers",
        page: "top",
        icon: <FaAward className="text-yellow-500" />,
        description: "See class toppers and your ranking.",
      }
    );
  }

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-gray-50">
      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-blue-500 mb-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
              <FaClipboardCheck className="mr-3 text-blue-600" />
              Marks Management
            </h1>
            <div
              className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}
            >
              {roleStyle.label} Portal
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-6">
            Welcome,{" "}
            <span className="font-bold text-blue-800">{user?.name}</span>. Select
            an option below to manage or analyze marks and student performance.
          </p>

          {/* Cards */}
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

      {/* Nested Routes */}
      <Outlet />
    </div>
  );
}
