import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useLocation } from "react-router-dom";


import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ForgotPassword from './components/forgotpassword';
import ResetPassword from './components/resetpassword';
// import NetworkAlert from './components/NetworkAlert';
import ServerGate from "./components/ServerGate";
//import AssistantButton from './components/AssistantButton';

import Home from './pages/orthers/Home';
import PageNotFound from './pages/orthers/PageNotFound';

import Dashboard from './pages/sidebar/Dashboard';
import Attendance from './pages/sidebar/Attendance';
import Marks from './pages/sidebar/Marks';
import Mess from './pages/sidebar/Mess';
// import Reports from './pages/sidebar/Reports';
import Lateentries from './pages/sidebar/Lateentries';
import AttendanceLogs from './pages/sidebar/AttendanceLogs';
import Announcement from './pages/sidebar/Announcement';
import SecurityLateEntry from './pages/sidebar/SecurityLateEntry';
// import Fees from './pages/sidebar/Fees';
// import Timetable from './pages/sidebar/Timetable';
// import StudentTimetable from './pages/sidebar/StudentTimetable';
import PlacementTraining from './pages/sidebar/PlacementTraining';
import ManageSubjects from './pages/sidebar/ManageSubjects';


import Students from './pages/students/Students';
import Faculty from './pages/faculty/Faculty';

import StudentAttendance from './pages/attendance/ViewAttendance';
import MarkAttendance from './pages/attendance/MarkAttendance';
import ReportsPage from './pages/attendance/Reports';
import ManageStaff from './pages/attendance/ManageStaff';

import EnterMarks from './pages/marks/EnterMarks';
import ViewMarks from './pages/marks/ViewMarks'
import PrincipalOverview from './pages/marks/PrincipalOverview';
import DepartmentAnalysis from './pages/marks/DepartmentAnalysis';
import TopPerformers from './pages/marks/TopPerformers';

// import FeesStudentView from './pages/fees/FeesStudentView';
// import FeesList from './pages/fees/FeesList';
// import Feesanalytics from './pages/fees/FeesAnalytics';
// import FeesAdd from './pages/fees/FeesAdd';

// import ProfileHub from './pages/sidebar/ProfileHub';
// import ProfileView from './pages/profilehub/ProfileView';
// import ProfileAdd from './pages/profilehub/ProfileAdd';



import StudentMyCourses from './pages/placementtraining/StudentMyCourses';
import StudentTests from './pages/placementtraining/StudentTests';
import PlacementResults from './pages/placementtraining/PlacementResults';
import TrainerCourses from './pages/placementtraining/TrainerCourses';
import TrainerManageTests from './pages/placementtraining/TrainerManageTests';
import PlacementAnalytics from './pages/placementtraining/PlacementAnalytics';
import TrainerAddQuestions from './pages/placementtraining/TrainerAddQuestions';
import StudentResults from './pages/placementtraining/StudentResults';



export default function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);

      if (!decoded.sessionExpiry) return;

      const remaining = decoded.sessionExpiry - Date.now();

      if (remaining <= 0) {
        handleLogout();
        return;
      }

      const timer = setTimeout(() => {
        handleLogout();
      }, remaining);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Token decode error:", err);
      handleLogout();
    }
  }, [user]);

  const location = useLocation();

  const isExamRoute =
    location.pathname.startsWith("/placementtraining/tests/") &&
    location.pathname.split("/").length === 4;



  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setSidebarOpen(false);
    window.location.href = "/";
  };

  return (

    <ServerGate>


      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 relative">

        {/* <NetworkAlert /> */}



        {!isExamRoute && (
          <Header
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onHamburgerClick={() => setSidebarOpen(prev => !prev)}
          />
        )}

        {user && !isExamRoute && (
          <Sidebar
            role={user.role}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* <main className="pt-16 p-6 text-slate-800 dark:text-slate-100"> */}
        <main
          className={`
          ${isExamRoute ? "" : "pt-24 p-6"}
          text-slate-800 dark:text-slate-100
          transition-all duration-300
          ${!isExamRoute && window.innerWidth > 768
              ? sidebarOpen
                ? "pl-64"
                : "pl-16"
              : "pl-0"}
        `}
        >

          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />
            <Route path="/home" element={<Home user={user} />} />
            <Route path="/" element={<Home user={user} />} />

            {/* Protected routes */}
            {user && (
              <>
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/students" element={<Students user={user} />} />
                <Route path="/faculty" element={<Faculty user={user} />} />
                {/* <Route path="/reports" element={<Reports user={user} />} /> */}
                {/* <Route path="/marks" element={<Marks user={user} />} /> */}
                <Route path="/lateentries" element={<Lateentries user={user} />} />
                <Route path="/attendancelogs" element={<AttendanceLogs user={user} />} />
                <Route path="/mess" element={<Mess user={user} />} />
                <Route path="/announcement" element={<Announcement user={user} />} />
                {/* <Route path="/timetable" element={<Timetable user={user} />} /> */}
                {/* <Route path="/StudentTimetable" element={<StudentTimetable user={user} />} /> */}
                <Route path="/SecurityLateEntry" element={<SecurityLateEntry user={user} />} />
                <Route path="/managesubjects" element={<ManageSubjects user={user} />} />

                {/* Attendance nested routes */}
                <Route path="/attendance" element={<Attendance user={user} />}>
                  <Route
                    path="view"
                    element={user.role === 'student' ? <StudentAttendance user={user} /> : <PageNotFound />}
                  />
                  <Route
                    path="mark"
                    element={user.role !== 'student' ? <MarkAttendance user={user} /> : <PageNotFound />}
                  />
                  <Route
                    path="reports"
                    element={user.role !== 'student' ? <ReportsPage user={user} /> : <PageNotFound />}
                  />
                  <Route
                    path="manage"
                    element={user.role === 'HOD' ? <ManageStaff user={user} /> : <PageNotFound />}
                  />
                  <Route path="*" element={<PageNotFound />} />
                </Route>

                <Route path="/marks" element={<Marks user={user} />}>
                  <Route path="enter" element={<EnterMarks />} />
                  <Route path="view" element={<ViewMarks />} />
                  <Route path="overview" element={<PrincipalOverview />} />
                  <Route path="analysis" element={<DepartmentAnalysis />} />
                  <Route path="top" element={<TopPerformers />} />
                </Route>

                {/* <Route path="/fees" element={<Fees user={user} />}>
                <Route path="list" element={<FeesList user={user} />} />
                <Route path="student/:reg_no" element={<FeesStudentView user={user} />} />
                <Route path="analytics" element={<Feesanalytics user={user} />} />
                <Route path="add" element={<FeesAdd user={user} />} />
              </Route> */}


                {/* <Route path="/profilehub" element={<ProfileHub user={user} />}>
                <Route path="add" element={<ProfileAdd />} />
                <Route path="view" element={<ProfileView user={user} />} />
                <Route index element={<ProfileView user={user} />} />
              </Route> */}

                <Route path="/placementtraining" element={<PlacementTraining user={user} />}>

                  {/* ===== STUDENT ===== */}
                  <Route
                    path="my-courses"
                    element={user.role === 'student' ? <StudentMyCourses user={user} /> : <PageNotFound />}
                  />

                  <Route
                    path="result"
                    element={user.role === 'student' ? <StudentResults user={user} /> : <PageNotFound />}
                  />

                  <Route
                    path="tests"
                    element={user.role === 'student' ? <StudentTests user={user} /> : <PageNotFound />}
                  />

                  <Route
                    path="tests/:testId"
                    element={user.role === 'student' ? <StudentTests user={user} /> : <PageNotFound />}
                  />

                  {/* ===== COMMON RESULTS (ROLE-BASED DATA) ===== */}
                  <Route
                    path="results"
                    element={
                      ['trainer', 'CA', 'HOD', 'Principal'].includes(user.role)
                        ? <PlacementResults user={user} />
                        : <PageNotFound />
                    }
                  />

                  {/* ===== COMMON ANALYTICS (ROLE-BASED DATA) ===== */}
                  <Route
                    path="analytics"
                    element={
                      ['trainer', 'CA', 'HOD', 'Principal'].includes(user.role)
                        ? <PlacementAnalytics user={user} />
                        : <PageNotFound />
                    }
                  />

                  {/* ===== TRAINER ===== */}
                  <Route
                    path="courses"
                    element={user.role === 'trainer' ? <TrainerCourses user={user} /> : <PageNotFound />}
                  />

                  <Route
                    path="tests/manage/:courseId"
                    element={user.role === 'trainer' ? <TrainerManageTests user={user} /> : <PageNotFound />}
                  />

                  <Route
                    path="tests/:testId/questions"
                    element={user.role === 'trainer' ? <TrainerAddQuestions /> : <PageNotFound />}
                  />

                  <Route path="*" element={<PageNotFound />} />
                </Route>



                <Route path="*" element={<PageNotFound />} />
              </>
            )}
          </Routes>
        </main>
        <footer className="py-3 text-center text-[11px] text-gray-500 bg-white select-none">
          <p className="leading-tight">
            © {new Date().getFullYear()} MNMJEC
          </p>
          <p className="mt-1 tracking-wide">
            Designed by{" "}
            <a
              href="https://portfolio.mrbi.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 font-medium hover:text-black transition-colors"
            >
              Abinanthan&nbsp;V
            </a>{" "}
            <span className="opacity-70">· 2022–2026 batch · CSE, MNMJEC</span>
          </p>
        </footer>

        {/* //   {user && <AssistantButton user={user} />} */}


      </div>
    </ServerGate>

  );
}
