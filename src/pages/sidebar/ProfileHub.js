import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FaPlusCircle,
  FaProjectDiagram,
  FaCertificate,
  FaEye,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";

export default function ProfileHub({ user }) {
  const navigate = useNavigate();
  const basePath = "/erp/profilehub";

  const roleCards = {
    Principal: [
      { label: "Add or Manage", to: `${basePath}/add`, icon: FaPlusCircle },
      { label: "View All Entries", to: `${basePath}/view?scope=all`, icon: FaEye },
    ],
    HOD: [
      { label: "Add or Manage", to: `${basePath}/add`, icon: FaPlusCircle },
      { label: "Department Entries", to: `${basePath}/view?scope=dept`, icon: FaUsers },
    ],
    Staff: [
      { label: "Add or Manage", to: `${basePath}/add`, icon: FaPlusCircle },
      { label: "My Entries", to: `${basePath}/view`, icon: FaEye },
    ],
    CA: [
      { label: "Add or Manage", to: `${basePath}/add`, icon: FaPlusCircle },
      { label: "My Entries", to: `${basePath}/view`, icon: FaEye },
    ],
    student: [
      { label: "Add or Manage", to: `${basePath}/add`, icon: FaPlusCircle },
      { label: "My Entries", to: `${basePath}/view`, icon: FaEye },
    ],
  };

  const cards = roleCards[user?.role] || roleCards.Staff;

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">

      {/* Top Header Section - Premium */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Profile Hub
            </h1>
            <p className="mt-2 text-gray-600 text-lg leading-relaxed max-w-2xl">
              Your consolidated space to manage certifications, projects, and achievements.  
              Keep your portfolio clean, organized, and professionally presentable.
            </p>
          </div>

          <div className="mt-6 lg:mt-0 px-5 py-2 text-white text-sm font-semibold bg-blue-700 rounded-full shadow-md">
            {user?.role} Portal
          </div>
        </div>
      </div>

      {/* Premium Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {cards.map((c, index) => {
          const Icon = c.icon;

          return (
            <div
              key={index}
              onClick={() => navigate(c.to)}
              className="
                bg-white 
                border border-gray-200
                shadow-sm 
                rounded-xl 
                p-6 
                cursor-pointer 
                transition-all 
                hover:shadow-lg 
                hover:-translate-y-1
              "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
                    w-14 h-14 
                    rounded-xl 
                    bg-blue-700 
                    flex items-center justify-center
                    shadow-inner
                  "
                >
                  <Icon className="text-white text-2xl" />
                </div>

                <div>
                  <div className="text-xl font-semibold text-gray-800">
                    {c.label}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Tap to continue
                  </p>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* The subpages load here (Add / View) */}
      <div className="mt-10">
        <Outlet />
      </div>
    </div>
  );
}
