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
import Feedback from './pages/sidebar/Feedback';
import StaffAccess from './pages/sidebar/StaffAccess';
import SupportTicket from './pages/sidebar/SupportTicket';
import SystemMonitor from './pages/sidebar/SystemMonitor';



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

import ProfileHub from './pages/sidebar/ProfileHub';
import ProfileHubView from './pages/profilehub/ProfileHubView';
import ProfileHubAdd from './pages/profilehub/ProfileHubAdd';
import ProfileHubActivities from './pages/profilehub/ProfileHubActivities';


import GiveFeedback from './pages/feedback/GiveFeedback'
import ViewFeedback from './pages/feedback/ViewFeedback'
import FeedbackAnalysis from './pages/feedback/FeedbackAnalysis'
import ManageFeedback from './pages/feedback/ManageFeedback'
import ManageFeedbackQuestions from './pages/feedback/ManageFeedbackQuestions'

import RaiseSupportTicket from './pages/support/RaiseSupportTicket';
import ViewSupportTicket from './pages/support/ViewSupportTicket';
import ManageTicket from './pages/support/ManageTicket';

import ViewStaffAccess from "./pages/StaffAccess/ViewStaffAccess";
import ManageStaffClassAccess from "./pages/StaffAccess/ManageStaffClassAccess";

import PassManagement from './pages/sidebar/PassManagement';
import MyPasses from './pages/passmanagement/MyPasses';
import ManagePasses from './pages/passmanagement/ManagePasses';
import PassVerify from './pages/passmanagement/PassVerify';


import StudentMyCourses from './pages/placementtraining/StudentMyCourses';
import StudentTests from './pages/placementtraining/StudentTests';
import PlacementResults from './pages/placementtraining/PlacementResults';
import TrainerCourses from './pages/placementtraining/TrainerCourses';
import TrainerManageTests from './pages/placementtraining/TrainerManageTests';
import PlacementAnalytics from './pages/placementtraining/PlacementAnalytics';
import TrainerAddQuestions from './pages/placementtraining/TrainerAddQuestions';
import StudentResults from './pages/placementtraining/StudentResults';
import PlacementAnswerReview from './pages/placementtraining/PlacementAnswerReview';



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
            <Route path="/passes/verify/:token" element={<PassVerify />} />

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
                <Route path="/system-monitor" element={<SystemMonitor />} />


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

                <Route path="/feedback" element={<Feedback user={user} />}>
                  <Route path="give" element={<GiveFeedback user={user} />} />
                  <Route path="view" element={<ViewFeedback user={user} />} />
                  <Route path="analysis" element={<FeedbackAnalysis user={user} />} />
                  <Route path="manage" element={<ManageFeedback user={user} />} />
                  <Route path="questions" element={<ManageFeedbackQuestions user={user} />} />
                </Route>

                <Route
                  path="/staffaccess"
                  element={
                    ['HOD', 'DeptAdmin', 'Principal'].includes(user.role)
                      ? <StaffAccess user={user} />
                      : <PageNotFound />
                  }
                >
                  <Route
                    path="view"
                    element={
                      ['HOD', 'DeptAdmin', 'Principal'].includes(user.role)
                        ? <ViewStaffAccess user={user} />
                        : <PageNotFound />
                    }
                  />
                  <Route
                    path="manage"
                    element={
                      ['HOD', 'DeptAdmin', 'Principal'].includes(user.role)
                        ? <ManageStaffClassAccess user={user} />
                        : <PageNotFound />
                    }
                  />
                </Route>
                <Route path="/support" element={<SupportTicket user={user} />}>
                  <Route path="raise" element={<RaiseSupportTicket />} />
                  <Route path="view" element={<ViewSupportTicket user={user} />} />
                  <Route path="manage" element={<ManageTicket />} />
                </Route>



                <Route path="/profilehub" element={<ProfileHub user={user} />}>
                  <Route path="add" element={<ProfileHubAdd />} />
                  <Route path="view" element={<ProfileHubView user={user} />} />
                  <Route path="activities" element={<ProfileHubActivities user={user} />} />
                  <Route index element={<ProfileHubView user={user} />} />
                </Route>

                <Route path="/passes" element={<PassManagement user={user} />}>
                  <Route path="my" element={<MyPasses />} />
                  <Route path="manage" element={<ManagePasses />} />
                </Route>


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

                  <Route
                    path="review"
                    element={
                      ['trainer', 'CA', 'HOD', 'Principal'].includes(user.role)
                        ? <PlacementAnswerReview user={user} />
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
              href="https://abinanthan.in"
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
