// EnhancedDashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaExclamationTriangle, FaChartLine } from "react-icons/fa";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { BASE_URL } from "../../constants/API";

// Import the new role-specific dashboards
import StudentDashboard from "../dashboards/StudentDashboard";
import StaffDashboard from "../dashboards/StaffDashboard";
import PrincipalDashboard from "../dashboards/PrincipalDashboard";
import ProfileCard from "../../components/ProfileCard";
import HodDashboard from "../dashboards/HodDashboard";


// Register Chart.js components once globally
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);


export default function EnhancedDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState({});
  const [profile, setProfile] = useState(user);
  const profileData = profile;
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [timetableToday, setTimetableToday] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees] = useState({});
  const [library, setLibrary] = useState([]);
  const [messMenu, setMessMenu] = useState({});
  const token = localStorage.getItem('token');

  // Utility function to decode JWT payload (kept as is)
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const api = axios.create({
    baseURL: BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // 1. Fetch User Profile/Details & Attendance Summary (for student roll_no)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        // Fallback to user prop if profile fetch fails
        setProfile(user);
      }
    };

    // Only fetch the profile if a token exists.
    if (token && user?.role) {
      fetchUserProfile();
    }
  }, [user, token]);


  // 2. Fetch Dashboard Data
  // -----------------------------
  // Attendance Summary
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const fetchAttendance = async () => {
      try {
        const res = await api.get("/attendance/summary");
        console.log("📘 Attendance Summary:", res.data);
        setAttendanceSummary(res.data);
      } catch (err) {
        console.error("⚠️ Attendance fetch failed, using fallback", err);
        setAttendanceSummary([]); // or fallback data
      }
    };

    fetchAttendance();
  }, [user, token]);

  // -----------------------------
  // Performance
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const fetchPerformance = async () => {
      try {
        const res = await api.get(`/performance/${user.roll_no}`);
        console.log("📗 Performance:", res.data);
        setPerformance(res.data);
      } catch (err) {
        console.error("⚠️ Performance fetch failed, using fallback", err);
        setPerformance([]);
      }
    };

    fetchPerformance();
  }, [user, token]);

  // -----------------------------
  // Today's Timetable
  useEffect(() => {
    console.log("🎯 useEffect triggered - user:", user);

    if (!user) return console.log("⛔ No user yet");
    if (user.role !== "student") return console.log("🚫 Not a student");
    if (!user.roll_no) return console.log("⚠️ No roll_no in user");

    const fetchTimetable = async () => {
      try {
        console.log("📡 Fetching timetable for", user.roll_no);
        const res = await api.get(`/timetable/today/${user.roll_no}`);
        console.log("📅 Timetable Today:", res.data);
        setTimetableToday(res.data);
      } catch (err) {
        console.error("⚠️ Timetable fetch failed", err);
        setTimetableToday([]);
      }
    };

    fetchTimetable();
  }, [user, token]);



  console.log("🧩 User object in EnhancedDashboard:", user);


  // -----------------------------
  // Announcements
  useEffect(() => {

    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/announcements");
        console.log("📢 Announcements:", res.data);
        setAnnouncements(res.data);
      } catch (err) {
        console.error("⚠️ Announcements fetch failed", err);
        setAnnouncements([]);
      }
    };

    fetchAnnouncements();
  }, [user, token]);


  // -----------------------------
  // Assignments
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/assignments/${user.roll_no}`);
        console.log("📝 Assignments:", res.data);
        setAssignments(res.data);
      } catch (err) {
        console.error("⚠️ Assignments fetch failed", err);
        setAssignments([]);
      }
    };

    fetchAssignments();
  }, [user, token]);

  // -----------------------------
  // Fees
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const fetchFees = async () => {
      try {
        const res = await api.get(`/fees/${user.roll_no}`);
        console.log("💰 Fees:", res.data);
        setFees(res.data);
      } catch (err) {
        console.error("⚠️ Fees fetch failed", err);
        setFees({});
      }
    };

    fetchFees();
  }, [user, token]);

  // -----------------------------
  // Library
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const fetchLibrary = async () => {
      try {
        const res = await api.get("/library");
        console.log("📚 Library Data:", res.data);
        setLibrary(res.data);
      } catch (err) {
        console.error("⚠️ Library fetch failed", err);
        setLibrary([]);
      }
    };

    fetchLibrary();
  }, [user, token]);

  // -----------------------------
  // Mess Menu
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const fetchMessMenu = async () => {
      try {
        const res = await api.get("/mess");
        console.log("🍽️ Mess Menu:", res.data);
        setMessMenu(res.data);
      } catch (err) {
        console.error("⚠️ Mess Menu fetch failed", err);
        setMessMenu({});
      }
    };

    fetchMessMenu();
  }, [user, token]);


  // --- Main Render Logic ---

  // if (loading) return (
  //   <div className="p-6 min-h-screen bg-sky-50 flex items-center justify-center">
  //     <div className="text-lg font-semibold text-sky-700 flex items-center">
  //       <FaChartLine className="animate-pulse mr-3" /> Loading dashboard...
  //     </div>
  //   </div>
  // );
  // if (error) return (
  //   <div className="p-6 text-red-600 bg-red-100 border border-red-400 rounded-lg m-4">
  //     <FaExclamationTriangle className="inline mr-2" /> Error: {error}
  //   </div>
  // );

  if (user.role === "principal") {
    return <PrincipalDashboard />;
  }

   if (user.role === "HOD") {
    return <HodDashboard />;
  }

  // Common profile card
  const profileCard = <ProfileCard profileData={profile} />;

  console.log(profileData);

  switch (user.role) {
    case "student":
      return (
        <StudentDashboard
          profileData={profileData}
          profileCard={profileCard}
          attendanceSummary={attendanceSummary}
          performance={performance}
          timetableToday={timetableToday}
          announcements={announcements}
          assignments={assignments}
          fees={fees}
          library={library}
          messMenu={messMenu}
          token={token}
        />
      );

    case "Staff":
      return (
        <StaffDashboard
          profileCard={profileCard}
          assignments={assignments}
          announcements={announcements}
        />
      );

    case "CA":
      return (
        <StaffDashboard
          profileCard={profileCard}
          assignments={assignments}
          announcements={announcements}
        />
      );

    case "Principal":
      return (
        <PrincipalDashboard
          profileData={profileData}
          profileCard={profileCard}
          announcements={announcements}
        />
      );

    default:
      return (
        <div className="p-6 text-red-600">
          <FaExclamationTriangle className="inline mr-2" /> This user does not have a dashboard.
        </div>
      );
  }



}