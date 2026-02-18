import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaUsers, FaEye } from "react-icons/fa";
import { MdManageAccounts } from "react-icons/md";

export default function StaffAccess({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const basePath = "/staffaccess";

    // Restrict access
    if (!["HOD", "DeptAdmin", "Principal"].includes(user.role)) {
        return (
            <div className="p-8 text-center text-red-600 font-semibold">
                Unauthorized Access
            </div>
        );
    }

    const roleStyles = {
        HOD: { label: "HOD", color: "bg-indigo-600" },
        Principal: { label: "Principal", color: "bg-purple-600" }
    };

    const roleStyle = roleStyles[user.role];

    const options = [
        {
            label: "View Staff Access",
            page: "view",
            icon: <FaEye className="text-indigo-500" />,
            description: "View staff access details and permissions."
        },
        {
            label: "Manage Staff Access",
            page: "manage",
            icon: <MdManageAccounts className="text-green-500" />,
            description: "Create or update staff access permissions."
        }
    ];

    const showHeader = location.pathname === basePath;

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

            {showHeader && (
                <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-indigo-500 mb-8">

                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                            <FaUsers className="mr-3 text-indigo-600" />
                            Staff Access Control
                        </h1>

                        <div
                            className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyles.color}`}
                        >
                            {roleStyles.label} Portal
                        </div>
                    </div>

                    <p className="text-lg text-gray-600 mb-6">
                        Welcome,{" "}
                        <span className="font-bold text-indigo-800">
                            {user.name}
                        </span>.
                        Select an option below.
                    </p>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
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
