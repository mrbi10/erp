import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    FaBookOpen,
    FaClipboardCheck,
    FaChartBar,
    FaUsers,
    FaEye,
    FaUserGraduate,
    FaChalkboardTeacher
} from 'react-icons/fa';

export default function PlacementTraining({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const basePath = "/placementtraining";

    const options = [];

    const roleStyles = {
        HOD: { label: 'HOD', color: 'bg-indigo-600' },
        CA: { label: 'Course Advisor', color: 'bg-green-600' },
        Staff: { label: 'Staff', color: 'bg-orange-600' },
        trainer: { label: 'Trainer', color: 'bg-orange-600' },
        Principal: { label: 'Principal', color: 'bg-purple-600' },
        student: { label: 'Student', color: 'bg-sky-600' },
    };


    const roleStyle = roleStyles[user.role] || roleStyles.Staff;

    /* ---------------- ROLE BASED OPTIONS ---------------- */

    if (user.role === 'student') {
        options.push(
            {
                label: 'My Courses',
                page: 'my-courses',
                icon: <FaBookOpen className="text-sky-500" />,
                description: 'View all placement training programs you are enrolled in.'
            },
            // {
            //     label: 'Take Test',
            //     page: 'tests',
            //     icon: <FaClipboardCheck className="text-green-500" />,
            //     description: 'Attempt available placement training tests.'
            // },
            {
                label: 'My Results',
                page: 'result',
                icon: <FaChartBar className="text-indigo-500" />,
                description: 'View your test scores and performance.'
            }
        );
    }

    else if (user.role === 'trainer') {
        options.push(
            {
                label: 'My Courses',
                page: 'courses',
                icon: <FaChalkboardTeacher className="text-orange-500" />,
                description: 'Manage placement training courses assigned to you.'
            },
            // {
            //     label: 'Students Answer review',
            //     page: 'review',
            //     icon: <FaClipboardCheck className="text-green-600" />,
            //     description: "Review student's training tests."
            // },
            {
                label: 'Student Results',
                page: 'results',
                icon: <FaUserGraduate className="text-purple-500" />,
                description: 'Analyze student performance and scores.'
            },
            {
                label: 'Student Analytics',
                page: 'analytics',
                icon: <FaChartBar className="text-green-500" />,
                description: 'Analyze student performance and scores.'
            }
        );
    }

    else if (user.role === 'CA') {
        options.push(
            { label: "Class Results", page: "results", icon: <FaUsers /> },
            { label: "Class Analytics", page: "analytics", icon: <FaChartBar /> },
            { label: "Class Review", page: "review", icon: <FaChartBar /> }
        );
    }

    else if (user.role === 'HOD') {
        options.push(
            { label: "Department Results", page: "results", icon: <FaUsers /> },
            { label: "Department Analytics", page: "analytics", icon: <FaChartBar /> },
            { label: "Department Review", page: "review", icon: <FaChartBar /> }
        );
    }

    else if (user.role === 'Principal') {
        options.push(
            { label: "Institution Results", page: "results", icon: <FaUsers /> },
            { label: "Institution Analytics", page: "analytics", icon: <FaChartBar /> },
            { label: "Institution review", page: "review", icon: <FaChartBar /> },
        );
    }

    /* ---------------------------------------------------- */

    const showHeader = location.pathname === basePath;

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

            {showHeader && (
                <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-indigo-500 mb-8">

                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                            <FaBookOpen className="mr-3 text-indigo-600" />
                            Placement Training
                        </h1>

                        <div className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}>
                            {roleStyle.label} Portal
                        </div>
                    </div>

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
