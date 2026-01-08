import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaGraduationCap,
  FaClock,
  FaChevronRight,
  FaPlay,
  FaHistory,
  FaLock,
  FaExclamationCircle,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrophy,
  FaChartLine,
  FaArrowLeft,
  FaFilter
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

/**
 * ------------------------------------------------------------------
 * INTERNAL COMPONENT: STATS CARD
 * Displays summary metrics at the top of the dashboard
 * ------------------------------------------------------------------
 */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
      <Icon />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

/**
 * ------------------------------------------------------------------
 * INTERNAL COMPONENT: TEST ITEM CARD
 * Represents a single test inside the course detail view
 * ------------------------------------------------------------------
 */
const TestItemCard = ({ test, attemptsTaken, onStart }) => {
  const maxAttempts = test.max_attempts || 1;
  const isLimitReached = attemptsTaken >= maxAttempts;
  const percentage = Math.min((attemptsTaken / maxAttempts) * 100, 100);

  return (
    <div className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 ${isLimitReached
      ? "border-slate-100 bg-slate-50 opacity-80"
      : "border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10"
      }`}>
      {/* Visual Status Indicator Strip */}
      <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-lg ${isLimitReached ? "bg-slate-300" : "bg-gradient-to-b from-indigo-500 to-purple-500"
        }`}></div>

      <div className="pl-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

        {/* Test Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-lg font-bold leading-tight ${isLimitReached ? 'text-slate-500' : 'text-slate-800'}`}>
              {test.title}
            </h4>
            {isLimitReached && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 uppercase">
                Completed
              </span>
            )}
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              <FaClock className="text-indigo-400" />
              {test.duration_minutes} Mins
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              <FaHistory className={isLimitReached ? "text-red-400" : "text-green-500"} />
              {attemptsTaken} / {maxAttempts} Attempts
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="w-full md:w-auto flex flex-col items-end gap-2">
          <button
            onClick={() => onStart(test.test_id)}
            disabled={isLimitReached}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${isLimitReached
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
              }`}
          >
            {isLimitReached ? <FaLock /> : <FaPlay />}
            {isLimitReached ? "Locked" : "Start Now"}
          </button>
        </div>
      </div>

      {/* Progress Bar (Visual Flair) */}
      {!isLimitReached && (
        <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * ------------------------------------------------------------------
 * MAIN COMPONENT
 * ------------------------------------------------------------------
 */
export default function StudentMyCourses() {
  const navigate = useNavigate();

  // --- Global State ---
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalActiveTestsCount, setGlobalActiveTestsCount] = useState(0);


  // --- Drawer / Test Detail State ---
  // When 'selectedCourse' is not null, the drawer is open.
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTests, setActiveTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [attemptsMap, setAttemptsMap] = useState({});

  // ----------------------------------------------------------------
  // API: Fetch All Courses
  // ----------------------------------------------------------------
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`${BASE_URL}/placement-training/student/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setCourses(data.courses || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not load courses", "error");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (!courses.length) return;

    const preloadActiveTests = async () => {
      let count = 0;

      for (const course of courses) {
        const res = await fetch(
          `${BASE_URL}/placement-training/student/courses/${course.course_id}/tests`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        const data = await res.json();
        if (!res.ok) continue;

        const tests = data.tests || [];

        for (const test of tests) {
          // 1️⃣ check LIVE
          const now = new Date();
          const start = new Date(test.publish_start);
          const end = new Date(test.publish_end);

          if (now < start || now > end) continue;

          // 2️⃣ check attempts
          const attempts = await fetchMyAttempts(test.test_id);
          if (attempts >= (test.max_attempts || 1)) continue;

          count++;
        }
      }

      setGlobalActiveTestsCount(count);
    };

    preloadActiveTests();
  }, [courses]);


  useEffect(() => {
    fetchCourses();
  }, []);

  const isTestLive = (test) => {
    if (!test.publish_start || !test.publish_end) return false;

    const now = new Date();
    const start = new Date(test.publish_start);
    const end = new Date(test.publish_end);

    return now >= start && now <= end;
  };


  const activeTestsCount = useMemo(() => {
    console.log("🧪 Recalculating activeTestsCount");

    return activeTests.filter((test) => {
      const attemptsTaken = attemptsMap[String(test.test_id)] || 0;
      const maxAttempts = test.max_attempts || 1;

      const live = isTestLive(test);

      console.log("➡️ Test check:", {
        test_id: test.test_id,
        publish_start: test.publish_start,
        publish_end: test.publish_end,
        live,
        attemptsTaken,
        maxAttempts
      });

      return live && attemptsTaken < maxAttempts;
    }).length;
  }, [activeTests, attemptsMap]);


  // ----------------------------------------------------------------
  // API: Fetch Attempts (Single Test)
  // ----------------------------------------------------------------
  const fetchMyAttempts = async (testId) => {
    try {
      const res = await fetch(`${BASE_URL}/placement-training/tests/${testId}/attempts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) return 0;

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const me = data.students?.find((s) => String(s.roll_no) === String(user.roll_no));
      return me ? me.latest_attempt : 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  // ----------------------------------------------------------------
  // API: Fetch Tests for Selected Course
  // ----------------------------------------------------------------
  const loadTestsForCourse = async (course) => {
    // 1. Set selected course (Opens drawer)
    setSelectedCourse(course);
    setLoadingTests(true);
    setActiveTests([]); // Clear old data to force "fresh" feel

    try {
      // 2. Fetch Tests
      const res = await fetch(`${BASE_URL}/placement-training/student/courses/${course.course_id}/tests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Oops", data.message, "error");
        setLoadingTests(false);
        return;
      }

      const tests = data.tests || [];
      setActiveTests(tests);

      // 3. Parallel Fetch of Attempts
      const attemptsResult = {};
      await Promise.all(
        tests.map(async (t) => {
          const count = await fetchMyAttempts(t.test_id);
          attemptsResult[t.test_id] = count;
        })
      );

      setAttemptsMap((prev) => ({ ...prev, ...attemptsResult }));

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load tests", "error");
    } finally {
      setLoadingTests(false);
    }
  };

  // ----------------------------------------------------------------
  // Logic: Filter Courses
  // ----------------------------------------------------------------
  const filteredCourses = useMemo(() => {
    return courses.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [courses, searchTerm]);

  // ----------------------------------------------------------------
  // Logic: Close Drawer
  // ----------------------------------------------------------------
  const closeDrawer = () => {
    setSelectedCourse(null);
  };

  // ----------------------------------------------------------------
  // Render: Loading Skeletons
  // ----------------------------------------------------------------
  const RenderSkeletons = () => (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-pulse flex flex-col h-64">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-full mb-1"></div>
          <div className="h-4 bg-slate-100 rounded w-2/3 mb-auto"></div>
          <div className="h-12 bg-slate-100 rounded-2xl w-full mt-4"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-800 pb-20 relative overflow-x-hidden">




      {/* =======================
            DASHBOARD STATS 
        ======================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={FaBookOpen}
          label="Total Courses"
          value={courses.length}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={FaTrophy}
          label="Active Tests"
          value={globalActiveTestsCount}
          color="bg-amber-50 text-amber-600"
        />


      </div>

      {/* =======================
            COURSE GRID
        ======================== */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          My Courses <span className="text-sm font-normal text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">{filteredCourses.length}</span>
        </h2>
        <button onClick={fetchCourses} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors">
          <FaSyncAlt className={loadingCourses ? "animate-spin" : ""} />
        </button>
      </div>

      {loadingCourses ? (
        <RenderSkeletons />
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <FaFilter size={30} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No courses found</h3>
          <p className="text-slate-500">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((c) => (
            <div
              key={c.course_id}
              onClick={() => loadTestsForCourse(c)}
              className="group cursor-pointer bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:to-indigo-500/5 transition-all duration-500 pointer-events-none"></div>

              <div className="p-6 flex-1">

                {/* Title & Desc */}
                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {c.name}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {c.description || "Master the concepts with our curated test series."}
                </p>
              </div>

              {/* Footer Button Simulation */}
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
                <div className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all">
                  View Tests
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =======================
          SLIDE-OVER DRAWER (Desktop) / FULL MODAL (Mobile)
          This replaces the accordion logic
      ======================== */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeDrawer}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-full md:w-[600px] h-full bg-[#F8FAFC] shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right">

            {/* Header */}
            <div className="bg-white px-6 py-5 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeDrawer}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <FaArrowLeft />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{selectedCourse.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">Tests & Assessments</p>
                </div>
              </div>

              <button
                onClick={() => loadTestsForCourse(selectedCourse)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <FaSyncAlt className={loadingTests ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {loadingTests ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-white rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : activeTests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <FaExclamationCircle className="text-4xl text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Tests Available</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    There are currently no active tests published for this course. Please check back later.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary for Drawer */}
                  <div className="bg-indigo-600 text-white p-5 rounded-2xl mb-6 shadow-lg shadow-indigo-300">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Total Assessments</p>
                        <h3 className="text-3xl font-black">{activeTests.length}</h3>
                      </div>
                      <FaBookOpen className="text-4xl text-indigo-400 opacity-50" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 pl-2">Available Tests</h4>

                  {activeTests.map((test) => (
                    <TestItemCard
                      key={test.test_id}
                      test={test}
                      attemptsTaken={attemptsMap[test.test_id] || 0}
                      onStart={(id) => navigate(`/placementtraining/tests/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline Styles for Animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}