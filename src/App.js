// ** no yet for production

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ForgotPassword from './components/forgotpassword';
import ResetPassword from './components/resetpassword';
import NetworkAlert from './components/NetworkAlert';

import Home from './pages/orthers/Home';
import PageNotFound from './pages/orthers/PageNotFound';

import Dashboard from './pages/sidebar/Dashboard';
import Attendance from './pages/sidebar/Attendance';
import Marks from './pages/sidebar/Marks';
// ** import Reports from './pages/sidebar/Reports'; 
import Late from './pages/sidebar/Late';
import SecurityLateEntry from './pages/sidebar/SecurityLateEntry';
import Fees from './pages/sidebar/Fees';

import Students from './pages/students/Students';
import FacultyList from './pages/faculty/FacultyList';

import StudentAttendance from './pages/attendance/ViewAttendance';
import MarkAttendance from './pages/attendance/MarkAttendance';
import ReportsPage from './pages/attendance/Reports';
import ManageStaff from './pages/attendance/ManageStaff';

import EnterMarks from './pages/marks/EnterMarks';
import ViewMarks from './pages/marks/ViewMarks'
import PrincipalOverview from './pages/marks/PrincipalOverview';
import DepartmentAnalysis from './pages/marks/DepartmentAnalysis';
import TopPerformers from './pages/marks/TopPerformers';

import FeesStudentView from './pages/fees/FeesStudentView';
import FeesList from './pages/fees/FeesList';
import Feesanalytics from './pages/fees/FeesAnalytics';
import FeesAdd from './pages/fees/FeesAdd';

// ** import ProfileHub from './pages/sidebar/ProfileHub';
// ** import ProfileView from './pages/profilehub/ProfileView';
// ** import ProfileAdd from './pages/profilehub/ProfileAdd';

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


  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setSidebarOpen(false);
    window.location.href = "/erp/home";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 relative">
      <NetworkAlert />


      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onHamburgerClick={() => setSidebarOpen(prev => !prev)}
      />


      {user && (
        <Sidebar
          role={user.role}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}



      {/* <main className="pt-16 p-6 text-slate-800 dark:text-slate-100"> */}
      <main
        className={`
          pt-16 p-6 text-slate-800 dark:text-slate-100
          transition-all duration-300
          ${window.innerWidth <= 768 ? "pl-0" : sidebarOpen ? "pl-64" : "pl-16"}
        `}
      >

        <Routes>
          {/* Public routes */}
          <Route path="/erp" element={<Navigate to="/erp/home" />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="erp/home" element={<Home user={user} />} />


          {/* Protected routes */}
          {user && (
            <>
              <Route path="erp/dashboard" element={<Dashboard user={user} />} />
              <Route path="erp/students" element={<Students user={user} />} />
              <Route path="erp/faculty" element={<FacultyList user={user} />} />
              {/* <Route path="erp/reports" element={<Reports user={user} />} /> */}
              <Route path="erp/marks" element={<Marks user={user} />} />
              <Route path="erp/late" element={<Late user={user} />} />
              <Route path="erp/SecurityLateEntry" element={<SecurityLateEntry user={user} />} />

              {/* Attendance nested routes */}
              <Route path="erp/attendance" element={<Attendance user={user} />}>
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

              <Route path="erp/marks" element={<Marks user={user} />}>
                <Route path="enter" element={<EnterMarks />} />
                <Route path="view" element={<ViewMarks />} />
                <Route path="overview" element={<PrincipalOverview />} />
                <Route path="analysis" element={<DepartmentAnalysis />} />
                <Route path="top" element={<TopPerformers />} />
              </Route>

              <Route path="erp/fees" element={<Fees user={user} />}>
                <Route path="list" element={<FeesList user={user} />} />
                <Route path="student/:reg_no" element={<FeesStudentView user={user} />} />
                <Route path="analytics" element={<Feesanalytics user={user} />} />
                <Route path="add" element={<FeesAdd user={user} />} />
              </Route>


              {/* { <Route path="/erp/profilehub" element={<ProfileHub user={user} />}>
                <Route path="add" element={<ProfileAdd />} />
                <Route path="view" element={<ProfileView user={user} />} />
                <Route index element={<ProfileView user={user} />} />
              </Route>} */}

              <Route path="*" element={<PageNotFound />} />
            </>

          )}
        </Routes>

        {user && (
          <footer className="py-3 text-center text-[11px] text-gray-500 bg-white select-none">
            <p className="leading-tight">
              © {new Date().getFullYear()} MNMJEC
            </p>
            <p className="mt-1 tracking-wide">
              Designed by{" "}
              <a
                href="https:// **portfolio.mrbi.live"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 font-medium hover:text-black transition-colors"
              >
                Abinanthan&nbsp;V
              </a>{" "}
              <span className="opacity-70">· IV Year CSE</span>
            </p>
          </footer>
        )}

      </main>


    </div>
  );
}
