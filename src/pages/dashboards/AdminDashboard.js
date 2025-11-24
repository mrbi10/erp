// dashboards/AdminDashboard.jsx

import React from 'react';
import { FaUserTie, FaGraduationCap, FaChartLine, FaUsers } from "react-icons/fa";
import { AnnouncementsCard } from './StudentDashboard'; // Reuse card

// --- Admin-Specific Card ---
const AdminStatsCard = ({ staffCount, courseCount, activeUsers }) => (
    <div className="p-6 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-2xl h-full">
        <div className="flex items-center mb-4 border-b pb-2">
            <FaChartLine className="text-2xl text-red-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-800">System Statistics</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-xs text-gray-500">Staff Count</div>
                <div className="text-3xl font-extrabold text-red-700">{staffCount ?? "-"}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-xs text-gray-500">Total Courses</div>
                <div className="text-3xl font-extrabold text-red-700">{courseCount ?? "-"}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-xs text-gray-500">Active Users Today</div>
                <div className="text-3xl font-extrabold text-red-700">{activeUsers ?? "-"}</div>
            </div>
        </div>
    </div>
);

// --- Main Admin Dashboard Component ---

export default function AdminDashboard({ 
    profileCard, 
    announcements, 
    staffCount, 
    courseCount, 
    activeUsers 
}) {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Administrator Dashboard ⚙️</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Row 1: Profile & Quick Stats */}
        <div className="lg:col-span-1">{profileCard}</div>
        <div className="lg:col-span-3">
          <AdminStatsCard 
            staffCount={staffCount} 
            courseCount={courseCount} 
            activeUsers={activeUsers} 
          />
        </div>
        
        {/* Row 2: System-wide Announcements */}
        <div className="lg:col-span-2">
          <AnnouncementsCard announcements={announcements} />
        </div>

        {/* Placeholder for Admin links */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-6 bg-green-100 rounded-xl shadow-md flex flex-col items-center justify-center hover:bg-green-200 transition cursor-pointer">
                <FaUsers className="text-4xl text-green-700 mb-2" />
                <span className="font-semibold text-green-800">Manage Users</span>
            </div>
            <div className="p-6 bg-purple-100 rounded-xl shadow-md flex flex-col items-center justify-center hover:bg-purple-200 transition cursor-pointer">
                <FaGraduationCap className="text-4xl text-purple-700 mb-2" />
                <span className="font-semibold text-purple-800">System Setup</span>
            </div>
        </div>
      </div>
    </div>
  );
}