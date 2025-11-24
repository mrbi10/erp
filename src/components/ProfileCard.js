// components/ProfileCard.jsx
import React from 'react';

export default function ProfileCard({ profileData }) {
    if (!profileData) return null;

    const courseMap = {
        1: "CSE",
        2: "Data Science",
        3: "Information Technology",
        4: "Electronics & Communication",
        5: "Electrical & Electronics",
    };

    const courseName = courseMap[profileData.dept_id] || "Unknown";
    const courseDisplay =
        profileData.role === "student"
            ? `B.E - ${courseName}`
            : profileData.role === "staff"
            ? courseName
            : "Admin";

    // Semester calculation logic only for students
    const semester = (() => {
        if (profileData.role !== "student" || !profileData.class_id) return "N/A";
        const yearLevel = parseInt(profileData.class_id, 10);
        const currentMonth = new Date().getMonth() + 1;
        const isOddSem = currentMonth >= 7 && currentMonth <= 12; // Jul–Dec = odd sem
        return (yearLevel * 2) - (isOddSem ? 1 : 0);
    })();

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-sky-600 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-xl font-extrabold text-gray-900">{profileData.name}</div>
                    <div className="text-sm text-gray-500">
                        {profileData.regNo || profileData.employeeId || "ID: -"}
                    </div>
                </div>
            </div>

            {/* Common Info */}
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 border-t pt-3">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500">
                        Role/Designation
                    </span>
                    <span className="font-medium capitalize">{profileData.role}</span>
                </div>

                {/* STUDENT VIEW */}
                {profileData.role === "student" && (
                    <>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500">
                                Course/Dept
                            </span>
                            <span className="font-medium">{courseDisplay}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500">
                                Current Semester
                            </span>
                            <span className="font-medium">{semester}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500">
                                Mobile
                            </span>
                            <span className="font-medium">{profileData.mobile || "-"}</span>
                        </div>
                    </>
                )}

                {/* STAFF VIEW */}
                {profileData.role === "staff" && (
                    <>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500">
                                Department
                            </span>
                            <span className="font-medium">{courseName}</span>
                        </div>

                        {profileData.designation && (
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-500">
                                    Designation
                                </span>
                                <span className="font-medium">{profileData.designation}</span>
                            </div>
                        )}
                    </>
                )}

                {/* ADMIN VIEW (Optional) */}
                {profileData.role === "admin" && (
                    <div className="col-span-2 flex flex-col">
                        <span className="text-xs font-semibold text-gray-500">
                            Access Level
                        </span>
                        <span className="font-medium">System Administrator</span>
                    </div>
                )}

                {/* Common Email Section */}
                <div className="col-span-2 flex flex-col">
                    <span className="text-xs font-semibold text-gray-500">Email</span>
                    <span className="font-medium truncate">
                        {profileData.email || "-"}
                    </span>
                </div>
            </div>
        </div>
    );
}
