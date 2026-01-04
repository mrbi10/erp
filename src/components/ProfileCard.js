// components/ProfileCard.jsx
import React from 'react';
import { FaUserCircle, FaGraduationCap, FaChalkboardTeacher, FaShieldAlt } from 'react-icons/fa';

const CARD_CLASSES = "p-8 bg-white rounded-2xl border border-gray-100 shadow-xl transition duration-500 hover:shadow-2xl hover:border-sky-200";
const ICON_COLOR = "text-sky-600";
const ACCENT_COLOR_CLASSES = "text-sky-600 font-bold";
const DETAIL_LABEL_CLASSES = "text-xs font-semibold text-gray-500 uppercase tracking-wider";
const DETAIL_VALUE_CLASSES = "font-medium text-base text-gray-800 mt-1 truncate";

const getRoleIcon = (role) => {
    switch (role) {
        case 'student':
            return <FaGraduationCap className={`text-2xl ${ICON_COLOR}`} />;
        case 'staff':
            return <FaChalkboardTeacher className={`text-2xl ${ICON_COLOR}`} />;
        case 'admin':
            return <FaShieldAlt className={`text-2xl ${ICON_COLOR}`} />;
        default:
            return <FaUserCircle className={`text-2xl ${ICON_COLOR}`} />;
    }
}

export default function ProfileCard({ profileData }) {
    if (!profileData) return null;

    const courseMap = {
        1: "CSE",
        2: "IT",
        3: "ADS",
        4: "CSBS",
        5: "ECE",
        6: "EEE",
        7: "MECH",
        8: "CIVIL",
    };

    const courseName = courseMap[profileData.dept_id] || "Department N/A";
    const courseDisplay =
        profileData.role === "student"
            ? `B.E. - ${courseName}`
            : profileData.role === "staff"
                ? courseName
                : courseMap[profileData.dept_id] || "Department N/A";

    const semester = (() => {
        if (profileData.role !== "student" || !profileData.class_id) return "N/A";
        const yearLevel = parseInt(profileData.class_id, 10);
        const currentMonth = new Date().getMonth() + 1;
        const isOddSem = currentMonth >= 7 && currentMonth <= 12;
        const currentSemester = (yearLevel * 2) - (isOddSem ? 1 : 0);
        return currentSemester;
    })();

    const roleTagClass = {
        student: "bg-sky-100 text-sky-800 border-sky-300",
        staff: "bg-indigo-100 text-indigo-800 border-indigo-300",
        admin: "bg-red-100 text-red-800 border-red-300",
    }[profileData.role] || "bg-gray-100 text-gray-700 border-gray-300";

    const hasMobile = profileData.mobile && profileData.mobile.toUpperCase() !== 'N/A';

    return (
        <div className={CARD_CLASSES}>
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
                <div className="flex items-center">
                    {getRoleIcon(profileData.role)}
                    <div className="ml-4">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {profileData.name}
                        </h1>
                        <p className="text-lg font-light text-gray-500 mt-1">
                            {profileData.regNo || profileData.employeeId}
                        </p>
                    </div>
                </div>

                <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize border ${roleTagClass}`}>
                    {profileData.role}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                <div className="flex flex-col p-3 rounded-lg bg-gray-50/50">
                    <span className={DETAIL_LABEL_CLASSES}>
                        {profileData.role === 'student' ? 'Course/Program' : 'Department'}
                    </span>
                    <span className={DETAIL_VALUE_CLASSES}>
                        {courseDisplay}
                    </span>
                </div>

                {profileData.role === "student" ? (
                    <div className="flex flex-col p-3 rounded-lg bg-gray-50/50">
                        <span className={DETAIL_LABEL_CLASSES}>
                            Current Semester
                        </span>
                        <span className={`${DETAIL_VALUE_CLASSES} ${ACCENT_COLOR_CLASSES} text-xl`}>
                            {semester}
                        </span>
                    </div>
                ) : profileData.role === "staff" && profileData.designation ? (
                    <div className="flex flex-col p-3 rounded-lg bg-gray-50/50">
                        <span className={DETAIL_LABEL_CLASSES}>
                            Designation
                        </span>
                        <span className={DETAIL_VALUE_CLASSES}>
                            {profileData.designation}
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col p-3 rounded-lg bg-gray-50/50">
                        <span className={DETAIL_LABEL_CLASSES}>Status</span>
                        <span className={DETAIL_VALUE_CLASSES}>Active</span>
                    </div>
                )}

                {hasMobile && (
                    <div className="flex flex-col p-3 rounded-lg bg-gray-50/50">
                        <span className={DETAIL_LABEL_CLASSES}>Mobile</span>
                        <span className={DETAIL_VALUE_CLASSES}>
                            {profileData.mobile}
                        </span>
                    </div>
                )}

                {/* Email is always present as the last item */}
                <div className={`flex flex-col p-3 rounded-lg bg-gray-50/50 ${!hasMobile ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                    <span className={DETAIL_LABEL_CLASSES}>Email</span>
                    <span className={DETAIL_VALUE_CLASSES}>
                        {profileData.email || "N/A"}
                    </span>
                </div>
            </div>

        </div>
    );
}