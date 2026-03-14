import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUsers,
  FaPlusCircle,
  FaTasks,
  FaBuilding
} from "react-icons/fa";

export default function Events({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = "/events";
  const options = [];

  const roleStyles = {
    Admin: { label: "Admin Portal", color: "bg-red-600" },
    Principal: { label: "Principal Portal", color: "bg-red-600" },
    HOD: { label: "HOD Portal", color: "bg-indigo-600" },
    DeptAdmin: { label: "Department Admin Portal", color: "bg-purple-600" },
    CA: { label: "Course Advisor", color: "bg-green-600" },
    Staff: { label: "Staff", color: "bg-orange-600" },
    student: { label: "Student", color: "bg-sky-600" }
  };

  const roleStyle = roleStyles[user.role] || roleStyles.Staff;

  /* ---------------- ROLE BASED OPTIONS ---------------- */

  const adminRoles = ["Principal", "Admin", "HOD", "DeptAdmin", "CA", "Staff"];

  /* ----- Manage Clubs ----- */

  if (adminRoles.includes(user.role)) {
    options.push({
      label: "Manage Clubs",
      page: "clubs",
      icon: <FaBuilding className="text-purple-500" />,
      description: "Create and manage clubs and coordinators."
    });
  }

  /* ----- Event Feed (Everyone) ----- */

  options.push({
    label: "Events Feed",
    page: "feed",
    icon: <FaCalendarAlt className="text-blue-500" />,
    description: "Browse upcoming events and register."
  });

  /* ----- Student Options ----- */

  if (user.role === "student") {
    options.push({
      label: "My Registrations",
      page: "my-registrations",
      icon: <FaUsers className="text-green-500" />,
      description: "View events you have registered for."
    });
  }

  /* ----- Coordinator/Admin Options ----- */

  if (adminRoles.includes(user.role)) {
    options.push({
      label: "Create Event",
      page: "create",
      icon: <FaPlusCircle className="text-emerald-500" />,
      description: "Create a new event for your club."
    });

    options.push({
      label: "Manage Events",
      page: "manage",
      icon: <FaTasks className="text-orange-500" />,
      description: "View and manage events and participants."
    });
  }

  /* ---------------------------------------------------- */

  const showHeader = location.pathname === basePath;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

      {showHeader && (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-indigo-500 mb-8">

          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
              <FaCalendarAlt className="mr-3 text-indigo-600" />
              Events
            </h1>

            <div
              className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}
            >
              {roleStyle.label}
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-6">
            Welcome,{" "}
            <span className="font-bold text-indigo-800">{user.name}</span>.
            Explore and manage events from here.
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