import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaPlusCircle, FaEye } from "react-icons/fa";

export default function Timetable({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/timetable";
  const options = [];

  const roleStyles = {
    Admin: { label: "Admin Portal", color: "bg-red-600" },
    Principal: { label: "Principal Portal", color: "bg-red-600" },
    HOD: { label: "HOD Portal", color: "bg-indigo-600" },
    DeptAdmin: { label: "Department Admin", color: "bg-purple-600" },
    Staff: { label: "Staff", color: "bg-orange-600" },
    student: { label: "Student", color: "bg-sky-600" }
  };

  const roleStyle = roleStyles[user.role] || roleStyles.Staff;

  /* Generate option only for management roles */
  if (["Admin", "HOD", "Principal" ,"DeptAdmin"].includes(user.role)) {
    options.push({
      label: "Generate Timetable",
      page: "generate",
      icon: <FaPlusCircle className="text-green-500" />,
      description: "Generate and override class timetable."
    });
  }

  /* View option for everyone */
  options.push({
    label: "View Timetable",
    page: "view",
    icon: <FaEye className="text-blue-500" />,
    description: "View timetable based on your role."
  });

  const showHeader = location.pathname === basePath;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-blue-500 mb-8">

          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
              <FaCalendarAlt className="mr-3 text-blue-600" />
              Timetable Management
            </h1>

            <div
              className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}
            >
              {roleStyle.label}
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-6">
            Welcome,{" "}
            <span className="font-bold text-blue-800">{user.name}</span>.
          </p>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`${basePath}/${opt.page}`)}
                className="bg-white p-6 shadow-xl rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-l-4 border-blue-400 hover:border-blue-600"
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