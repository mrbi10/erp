import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCheck, FaClipboardList, FaUsersCog, FaEye, FaCalendarDay, FaUserTag } from 'react-icons/fa';

export default function Attendance({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Base paths for navigation
    const basePath = "/attendance";

    // --- Role-Based Options Definition with Enhanced Styling Data ---
    const options = [];

    // Define color palettes and icons for a richer look
    const optionStyles = {
        HOD: { label: 'HOD', color: 'bg-indigo-600', hover: 'hover:bg-indigo-700', icon: FaUserTag },
        CA: { label: 'Course Advisor', color: 'bg-green-600', hover: 'hover:bg-green-700', icon: FaUserTag },
        Staff: { label: 'Faculty', color: 'bg-orange-600', hover: 'hover:bg-orange-700', icon: FaUserTag },
        student: { label: 'Student', color: 'bg-sky-600', hover: 'hover:bg-sky-700', icon: FaUserTag },
    };

    const roleStyle = optionStyles[user.role] || optionStyles.Staff;

    if (user.role === 'HOD') {
        options.push(
            { label: 'View All Reports', page: 'reports', icon: <FaClipboardList className="text-blue-500" />, description: "Access comprehensive attendance reports across departments." },
            // { label: 'Manage Staff & CAs', page: 'manage', icon: <FaUsersCog className="text-purple-500" />, description: "Manage teaching loads and assign course advisors." },
            // { label: 'My Subject Reports', page: 'reports/my-subjects', icon: <FaClipboardList className="text-teal-500" />, description: "Review attendance for the subjects you personally teach." }
        );
    } else if (user.role === 'CA') {
        options.push(
            { label: 'Mark Class Attendance', page: 'mark', icon: <FaUserCheck className="text-green-500" />, description: "Record daily attendance for assigned classes/batches." },
            { label: 'View Class Reports', page: 'reports', icon: <FaClipboardList className="text-yellow-500" />, description: "View attendance summaries for your advised class." },
            // { label: 'My Subject Reports', page: 'reports/my-subjects', icon: <FaClipboardList className="text-red-500" />, description: "Review attendance for the subjects you personally teach." }
        );
    } else if (user.role === 'Principal') {
        options.push(
            { label: 'View All Reports', page: 'reports', icon: <FaClipboardList className="text-blue-500" />, description: "Access comprehensive attendance reports across departments." },
        );
    // } else if (user.role === 'Staff') {
    //     options.push(
    //         { label: 'Mark Class Attendance', page: 'mark', icon: <FaUserCheck className="text-green-500" />, description: "Record daily attendance for classes you teach (if permission is granted)." },
    //         { label: 'My Subject Reports', page: 'reports/my-subjects', icon: <FaClipboardList className="text-teal-500" />, description: "Review detailed attendance for your teaching subjects." }
    //     );
    } else if (user.role === 'student') {
        options.push(
            { label: 'View My Attendance', page: 'view', icon: <FaEye className="text-sky-500" />, description: "Access your overall and date-wise attendance history." }
        );
    }
    // --- End Role-Based Options Definition ---

    const showHeader = location.pathname === basePath;


    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gray-50">

            {showHeader && (
                <div className="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-sky-500 mb-8">
                    {/* Rich Header */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                            <FaCalendarDay className="mr-3 text-sky-600" /> Attendance Management
                        </h1>
                        <div className={`px-4 py-2 text-white font-bold rounded-full text-sm shadow-md ${roleStyle.color}`}>
                            {roleStyle.label} Portal
                        </div>
                    </div>

                    <p className="text-lg text-gray-600 mb-6">
                        Welcome, <span className="font-bold text-sky-800">{user.name}</span>. Select an action below to manage or view attendance records.
                    </p>

                    {/* Enhanced Options Grid */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {options.map((opt, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`${basePath}/${opt.page}`)}
                                className="bg-white p-6 shadow-xl rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-l-4 border-sky-400 hover:border-sky-600"
                            >
                                <div className="flex items-start">
                                    <div className="text-4xl mr-4 p-3 bg-gray-100 rounded-full shadow-inner">{opt.icon}</div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-800 mb-1">{opt.label}</div>
                                        <p className="text-sm text-gray-500">{opt.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Render the nested route content */}
            <Outlet />
        </div>
    );
}