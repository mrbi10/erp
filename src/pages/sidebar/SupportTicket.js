import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaLifeRing,
  FaPlusCircle,
  FaEye,
  FaTasks
} from "react-icons/fa";

export default function SupportTicket({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/support";
  const options = [];

  const roleStyles = {
    Admin: { label: "Admin Portal", color: "bg-red-600" },
    HOD: { label: "HOD Portal", color: "bg-indigo-600" },
    CA: { label: "Course Advisor", color: "bg-green-600" },
    Staff: { label: "Staff", color: "bg-orange-600" },
    student: { label: "Student", color: "bg-sky-600" }
  };

  const roleStyle = roleStyles[user.role] || roleStyles.Staff;

  /* ---------------- ROLE BASED OPTIONS ---------------- */

  if (user.role === "Admin") {
    options.push({
      label: "Manage Tickets",
      page: "manage",
      icon: <FaTasks className="text-red-500" />,
      description: "View and resolve support tickets."
    });

    options.push({
      label: "View All Tickets",
      page: "view",
      icon: <FaEye className="text-indigo-500" />,
      description: "View all raised support tickets."
    });
  } else {
    options.push({
      label: "Raise Ticket",
      page: "raise",
      icon: <FaPlusCircle className="text-green-500" />,
      description: "Submit a new support request."
    });

    options.push({
      label: "My Tickets",
      page: "view",
      icon: <FaEye className="text-blue-500" />,
      description: "Track status of your support tickets."
    });
  }

  /* ---------------------------------------------------- */

  const showHeader = location.pathname === basePath;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-blue-500 mb-8">

          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
              <FaLifeRing className="mr-3 text-blue-600" />
              Support Center
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
            Choose an option below.
          </p>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
