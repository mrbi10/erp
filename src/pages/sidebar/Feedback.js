import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    FaCommentDots,
    FaStar,
    FaChartBar,
    FaEye,
    FaUsers
} from "react-icons/fa";
import { MdManageHistory, MdOutlineManageAccounts } from "react-icons/md";


export default function Feedback({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const basePath = "/feedback";
    const options = [];

    const roleStyles = {
        HOD: { label: "HOD", color: "bg-indigo-600" },
        CA: { label: "Course Advisor", color: "bg-green-600" },
        Staff: { label: "Staff", color: "bg-orange-600" },
        Principal: { label: "Principal", color: "bg-purple-600" },
        student: { label: "Student", color: "bg-sky-600" }
    };

    const roleStyle = roleStyles[user.role] || roleStyles.Staff;

    /* ---------------- ROLE BASED OPTIONS ---------------- */

    if (user.role === "student") {
        options.push(
            {
                label: "Give Feedback",
                page: "give",
                icon: <FaStar className="text-yellow-500" />,
                description: "Submit feedback for your teaching staff."
            },
            {
                label: "View Feedback",
                page: "view",
                icon: <FaEye className="text-sky-500" />,
                description: "View the feedback you have submitted."
            }
        );
    }

    else if (["CA", "HOD", "Principal"].includes(user.role)) {
        options.push(
            {
                label: "View Feedback",
                page: "view",
                icon: <FaUsers className="text-indigo-500" />,
                description: "View feedback data based on your role."
            }
        );
        options.push(
            {
                label: "Manage Feedback",
                page: "manage",
                icon: <MdManageHistory className="text-indigo-500" />,
                description: "Manage feedback sessions."
            }
        );
        options.push(
            {
                label: "Manage Feedback Question set",
                page: "questions",
                icon: <MdOutlineManageAccounts className="text-indigo-500" />,
                description: "Manage feedback question set."
            }
        );

        if (["HOD", "Principal"].includes(user.role)) {
            options.push(
                {
                    label: "Feedback Analysis",
                    page: "analysis",
                    icon: <FaChartBar className="text-green-500" />,
                    description: "Analyze feedback performance and trends."
                }
            );
        }
    }

    /* ---------------------------------------------------- */

    const showHeader = location.pathname === basePath;

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

            {showHeader && (
                <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-indigo-500 mb-8">

                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                            <FaCommentDots className="mr-3 text-indigo-600" />
                            Student Feedback
                        </h1>

                        <div
                            className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}
                        >
                            {roleStyle.label} Portal
                        </div>
                    </div>

                    <p className="text-lg text-gray-600 mb-6">
                        Welcome,{" "}
                        <span className="font-bold text-indigo-800">{user.name}</span>.
                        Choose an option below.
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
