import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaListUl,
  FaUserGraduate,
  FaClock,
  FaChartPie,
} from "react-icons/fa";

export default function Fees({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/erp/fees";

  // Role bubbles
  const optionStyles = {
    Principal: { label: "Principal", color: "bg-purple-600" },
    HOD: { label: "HOD", color: "bg-indigo-600" },
    CA: { label: "Course Advisor", color: "bg-green-600" },
    Staff: { label: "Faculty", color: "bg-orange-600" },
    student: { label: "Student", color: "bg-blue-600" },
  };

  const roleStyle = optionStyles[user?.role] || optionStyles.Staff;

  const showHeader = location.pathname === basePath;

  // MAIN OPTIONS BASED ON ROLES
  const options = [];

  // PRINCIPAL – Full college access
  if (user?.role === "Principal") {
    options.push(
      {
        label: "All Students Fees",
        page: "list",
        icon: <FaListUl className="text-blue-600" />,
        description: "View semester, hostel, and transport fees for the entire college.",
      },

      {
        label: "Fee Analytics",
        page: "analytics",
        icon: <FaChartPie className="text-orange-600" />,
        description: "Breakdown by semester, hostel, transport — department-wise insights.",
      }
    );
  }

  // HOD – Department only
  if (user?.role === "HOD") {
    options.push(
      {
        label: "Department Fee List",
        page: "list",
        icon: <FaListUl className="text-blue-600" />,
        description: "View all students’ semester/hostel/transport fees in your department.",
      },
      {
        label: "Payment History",
        page: "history",
        icon: <FaClock className="text-purple-600" />,
        description: "Check fee payments from your department students.",
      }
    );
  }

  // Finance & Accounts Role
  if (user?.role === "F&A") {
    options.push(
      {
        label: "Add Fees",
        page: "add",
        icon: <FaMoneyBillWave className="text-green-600" />,
        description: "Insert semester, hostel, or transport fee entries.",
      },
      {
        label: "Bulk Upload",
        page: "add",
        icon: <FaChartPie className="text-purple-600" />,
        description: "Upload fee records using Excel.",
      },
      {
        label: "Fee List",
        page: "list",
        icon: <FaListUl className="text-blue-600" />,
        description: "Search & verify all fee records.",
      }
    );
  }


  // CA – Class only
  if (user?.role === "CA") {
    options.push(
      {
        label: "Class Fee List",
        page: "list",
        icon: <FaListUl className="text-blue-600" />,
        description: "View semester, hostel, and transport fee status for your class.",
      },
      {
        label: "Payment History",
        page: "history",
        icon: <FaClock className="text-purple-600" />,
        description: "Check class payment logs quickly.",
      }
    );
  }

  // Staff – Dept only
  if (user?.role === "Staff") {
    options.push({
      label: "Department Fee List",
      page: "list",
      icon: <FaListUl className="text-blue-600" />,
      description: "Access fee details for your department.",
    });
  }

  // Student – Only their own data
  if (user?.role === "student") {
    options.push(
      {
        label: "My Fees",
        page: `student/${user.roll_no}`,
        icon: <FaUserGraduate className="text-green-600" />,
        description: "View your semester, hostel, and transport fees.",
      },
      {
        label: "My Payment History",
        page: "history",
        icon: <FaClock className="text-purple-600" />,
        description: "Check all your payments at one place.",
      }
    );
  }

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-gray-50">
      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-xl border-t-8 border-green-600 mb-8">

          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
              <FaMoneyBillWave className="mr-3 text-green-600" />
              Fees Management
            </h1>

            <div
              className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}
            >
              {roleStyle.label} Portal
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-6">
            Hello <span className="font-bold text-green-700">{user?.name}</span>.
            Select a section below to view or manage fee details.
          </p>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`${basePath}/${opt.page}`)}
                className="bg-white p-6 shadow-lg rounded-xl cursor-pointer hover:shadow-2xl hover:scale-[1.03] transition-all border-l-4 border-green-500"
              >
                <div className="flex items-start">
                  <div className="text-4xl mr-4 p-3 bg-gray-100 rounded-full shadow-inner">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-800">
                      {opt.label}
                    </div>
                    <p className="text-gray-500 text-sm">{opt.description}</p>
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
