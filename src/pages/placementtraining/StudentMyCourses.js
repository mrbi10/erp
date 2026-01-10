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
  FaFilter,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

/**
 * ------------------------------------------------------------------
 * SUB-COMPONENT: STATS CARD
 * Accessible, semantic card for summary metrics.
 * ------------------------------------------------------------------
 */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <article 
    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md"
    role="status"
  >
    <div 
      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm ${color}`}
      aria-hidden="true"
    >
      <Icon />
    </div>
    <div className="flex flex-col">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
        {value}
      </h3>
    </div>
  </article>
);

/**
 * ------------------------------------------------------------------
 * SUB-COMPONENT: TEST ITEM CARD
 * Displays individual test details with progress visualization.
 * ------------------------------------------------------------------
 */
const TestItemCard = ({ test, attemptsTaken, onStart }) => {
  const maxAttempts = test.max_attempts || 1;
  const isLimitReached = attemptsTaken >= maxAttempts;
  const percentage = Math.min((attemptsTaken / maxAttempts) * 100, 100);

  // Helper for accessibility labels
  const statusLabel = isLimitReached ? "Completed" : "Available";
  const actionLabel = isLimitReached ? "Test Locked" : `Start ${test.title}`;

  return (
    <div 
      className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 ${
        isLimitReached
          ? "border-slate-100 bg-slate-50/80 opacity-90"
          : "border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5"
      }`}
      role="article"
      aria-label={`${test.title} - ${statusLabel}`}
    >
      {/* Status Strip */}
      <div 
        className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full transition-colors ${
          isLimitReached ? "bg-slate-300" : "bg-indigo-500"
        }`} 
        aria-hidden="true"
      />

      <div className="pl-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
        {/* Content Section */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className={`text-lg font-bold leading-tight ${
              isLimitReached ? 'text-slate-500' : 'text-slate-900'
            }`}>
              {test.title}
            </h4>
            {isLimitReached && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 uppercase tracking-wide">
                Completed
              </span>
            )}
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-3">
            <div 
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50"
              title="Duration"
            >
              <FaClock className="text-indigo-500" aria-hidden="true" />
              <span>{test.duration_minutes} Mins</span>
            </div>

            <div 
              className={`flex items-center gap-2 text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 ${
                isLimitReached ? "text-slate-500" : "text-slate-700"
              }`}
              title="Attempts Used"
            >
              <FaHistory 
                className={isLimitReached ? "text-slate-400" : "text-emerald-500"} 
                aria-hidden="true"
              />
              <span>{attemptsTaken} / {maxAttempts} Attempts</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto flex-shrink-0">
          <button
            onClick={() => onStart(test.test_id)}
            disabled={isLimitReached}
            aria-label={actionLabel}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLimitReached
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
            }`}
          >
            {isLimitReached ? <FaLock aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
            <span>{isLimitReached ? "Locked" : "Start Now"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {!isLimitReached && (
        <div 
          className="mt-5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={attemptsTaken}
          aria-valuemin="0"
          aria-valuemax={maxAttempts}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * ------------------------------------------------------------------
 * SUB-COMPONENT: SKELETON LOADER
 * ------------------------------------------------------------------
 */
const CourseSkeleton = () => (
  <div 
    className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col h-72 animate-pulse"
    aria-hidden="true"
  >
    <div className="flex justify-between items-start mb-6">
      <div className="h-5 bg-slate-200 rounded w-1/3" />
      <div className="h-10 w-10 bg-slate-200 rounded-full" />
    </div>
    <div className="space-y-3 flex-1">
      <div className="h-7 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-full" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
    </div>
    <div className="h-10 bg-slate-100 rounded-xl w-full mt-6" />
  </div>
);

/**
 * ------------------------------------------------------------------
 * MAIN COMPONENT: STUDENT MY COURSES
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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTests, setActiveTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [attemptsMap, setAttemptsMap] = useState({});

  // ----------------------------------------------------------------
  // API: Fetch All Courses & Preload Stats
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
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Could not load courses. Please try again.",
        confirmButtonColor: "#4f46e5"
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Preload logic (Preserved strictly as per instructions)
  useEffect(() => {
    if (!courses.length) return;

    const preloadActiveTests = async () => {
      let count = 0;

      // Sequential fetching as per original logic requirement
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
          // 1. Check Live Status
          const now = new Date();
          const start = new Date(test.publish_start);
          const end = new Date(test.publish_end);

          if (now < start || now > end) continue;

          // 2. Check Attempts
          const attempts = await fetchMyAttempts(test.test_id);
          if (attempts >= (test.max_attempts || 1)) continue;

          count++;
        }
      }
      setGlobalActiveTestsCount(count);
    };

    preloadActiveTests();
  }, [courses]);

  // ----------------------------------------------------------------
  // Helper: Live Check
  // ----------------------------------------------------------------
  const isTestLive = (test) => {
    if (!test.publish_start || !test.publish_end) return false;
    const now = new Date();
    const start = new Date(test.publish_start);
    const end = new Date(test.publish_end);
    return now >= start && now <= end;
  };

  // ----------------------------------------------------------------
  // Memoized Calculation: Active Tests (with original logs preserved)
  // ----------------------------------------------------------------
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
        maxAttempts,
      });

      return live && attemptsTaken < maxAttempts;
    }).length;
  }, [activeTests, attemptsMap]);

  // ----------------------------------------------------------------
  // API: Fetch Single Test Attempts
  // ----------------------------------------------------------------
  const fetchMyAttempts = async (testId) => {
    try {
      const res = await fetch(`${BASE_URL}/placement-training/tests/${testId}/attempts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) return 0;

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      // Safe defensive access
      const me = data.students?.find((s) => String(s.roll_no) === String(user.roll_no));
      return me ? me.latest_attempt : 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  // ----------------------------------------------------------------
  // API: Load Drawer Data
  // ----------------------------------------------------------------
  const loadTestsForCourse = async (course) => {
    setSelectedCourse(course);
    setLoadingTests(true);
    setActiveTests([]); 

    try {
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

      // Parallel Fetch of Attempts
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
  // Logic: Filter
  // ----------------------------------------------------------------
  const filteredCourses = useMemo(() => {
    return courses.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [courses, searchTerm]);

  const closeDrawer = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative overflow-x-hidden">
      
      {/* 1. Dashboard Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </section>

      {/* 2. Course Grid Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Courses
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-500 shadow-sm">
              {filteredCourses.length}
            </span>
          </div>
          
          <button 
            onClick={fetchCourses} 
            className="p-2.5 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all"
            aria-label="Refresh Courses"
            title="Refresh Courses"
          >
            <FaSyncAlt className={loadingCourses ? "animate-spin" : ""} />
          </button>
        </div>
      </section>

      {/* 3. Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loadingCourses ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : filteredCourses.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-300 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-400">
              <FaFilter size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No courses found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              We couldn't find any courses matching your criteria. Try adjusting your search terms or refresh the page.
            </p>
          </div>
        ) : (
          /* Course Grid */
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((c) => (
              <div
                key={c.course_id}
                onClick={() => loadTestsForCourse(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadTestsForCourse(c);
                  }
                }}
                tabIndex={0}
                role="button"
                className="group cursor-pointer bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={`View tests for ${c.name}`}
              >
                {/* Content */}
                <div className="p-7 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {c.description || "Master the concepts with our curated test series. Click to view available assessments."}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="px-7 py-5 border-t border-slate-100 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors">
                  <div className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all shadow-sm">
                    View Tests <FaChevronRight className="text-xs opacity-70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Drawer / Modal Overlay */}
      {selectedCourse && (
        <div 
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeDrawer}
            aria-hidden="true"
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full md:w-[600px] h-full bg-slate-50 shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right">
            
            {/* Drawer Header */}
            <div className="bg-white px-6 py-5 border-b border-slate-200 flex justify-between items-center shadow-sm z-10 sticky top-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeDrawer}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label="Close drawer"
                >
                  <FaArrowLeft />
                </button>
                <div>
                  <h2 id="drawer-title" className="text-lg font-bold text-slate-900 line-clamp-1">
                    {selectedCourse.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Tests & Assessments</p>
                </div>
              </div>

              <button
                onClick={() => loadTestsForCourse(selectedCourse)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <FaSyncAlt className={loadingTests ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {loadingTests ? (
                /* Loading State inside Drawer */
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : activeTests.length === 0 ? (
                /* Empty State inside Drawer */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <FaExclamationCircle className="text-3xl text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No Tests Available</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    There are currently no active tests published for this course.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Assessments</p>
                        <h3 className="text-4xl font-black tracking-tight">{activeTests.length}</h3>
                      </div>
                      <FaBookOpen className="text-5xl text-indigo-400/30" />
                    </div>
                  </div>

                  {/* List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">Available Tests</h4>
                    <div className="space-y-4">
                      {activeTests.map((test) => (
                        <TestItemCard
                          key={test.test_id}
                          test={test}
                          attemptsTaken={attemptsMap[test.test_id] || 0}
                          onStart={(id) => navigate(`/placementtraining/tests/${id}`)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Styles (Scoped) */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Refined Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}