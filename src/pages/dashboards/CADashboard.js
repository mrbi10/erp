// src/pages/dashboard/CADashboard.js
import React from "react";

export default function CADashboard({ data, loading, error }) {
  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Class Advisor Dashboard</h2>
      {/* Keep your existing CA logic here */}
    </div>
  );
}
