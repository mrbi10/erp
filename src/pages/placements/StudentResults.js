import React, { useEffect, useState, useMemo } from "react";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaChartLine,
    FaSearch,
    FaCalendarAlt,
    FaClipboardList,
    FaHistory,
    FaTrophy,
    FaBan,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { formatSubmittedAt } from "../../constants/dateUtils";

// --- Components ---

const StatCard = ({ icon, label, value, color }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        purple: "bg-violet-50 text-violet-600 border-violet-100",
    };

    return (
        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 lg:gap-8 transition-transform hover:-translate-y-1 duration-300">
            <div className={`p-4 lg:p-6 rounded-xl text-2xl lg:text-3xl border ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm lg:text-base font-medium text-slate-500 uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-800 mt-1">{value}</p>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const isPass = status?.toLowerCase() === "pass";
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full text-xs lg:text-sm font-bold uppercase tracking-wider border ${isPass
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
        >
            {isPass ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
            {status}
        </span>
    );
};

const ScoreBar = ({ percentage }) => {
    const num = parseFloat(percentage) || 0;
    let colorClass = "bg-rose-500";
    if (num >= 75) colorClass = "bg-emerald-500";
    else if (num >= 50) colorClass = "bg-amber-500";

    return (
        <div className="w-full max-w-[140px] lg:max-w-[200px]">
            <div className="flex justify-between text-xs lg:text-sm mb-1">
                <span className="font-bold text-slate-700">{num}%</span>
            </div>
            <div className="h-2 lg:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass} transition-all duration-500`}
                    style={{ width: `${num}%` }}
                />
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4 p-6 lg:p-10">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-center border-b border-slate-50 pb-4">
                <div className="h-10 w-10 lg:h-14 lg:w-14 bg-slate-100 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 lg:h-5 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-3 lg:h-4 bg-slate-100 rounded w-1/4"></div>
                </div>
                <div className="h-8 w-20 lg:w-32 bg-slate-100 rounded-full"></div>
            </div>
        ))}
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-slate-400">
        <div className="bg-slate-50 p-8 lg:p-12 rounded-full mb-6">
            <FaSearch className="text-4xl lg:text-6xl text-slate-300" />
        </div>
        <h3 className="text-xl lg:text-2xl font-bold text-slate-700">No Assessments Yet</h3>
        <p className="text-slate-500 mt-2 max-w-sm lg:max-w-md text-center text-sm lg:text-base">
            You haven't completed any placement assessments yet. Once you do, your results will appear here.
        </p>
    </div>
);

const AccessDenied = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <FaBan className="text-6xl text-rose-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Access Restricted</h1>
        <p className="mt-2">This page is exclusively for Student access.</p>
    </div>
);

// --- Main Student Component ---

export default function StudentPlacementResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user?.role || "guest";

    useEffect(() => {
        if (role !== "student") {
            setLoading(false);
            return;
        }

        if (!token) {
            Swal.fire("Session expired", "Please login again", "warning");
            return;
        }

        const fetchMyResults = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${BASE_URL}/placement-training/student/results`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setResults(data.results || []);
            } catch (err) {
                Swal.fire("Error", "Failed to load your results", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchMyResults();
    }, [token, role]);

    const groupedResults = useMemo(() => {
        if (!results.length) return [];

        const groups = {};
        results.forEach((r) => {
            const key = r.test_id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        return Object.values(groups).map((group) => {
            const sortedGroup = [...group].sort(
                (a, b) => Number(b.attempt_no) - Number(a.attempt_no)
            );

            const passed = sortedGroup.filter((a) => a.pass_status === "pass");
            const bestAttempt = passed.length
                ? passed.reduce((a, b) =>
                    Number(a.percentage) > Number(b.percentage) ? a : b
                )
                : sortedGroup.reduce((a, b) =>
                    Number(a.percentage) > Number(b.percentage) ? a : b
                );

            return {
                latest: sortedGroup[0],
                allAttempts: sortedGroup,
                bestScore: Number(bestAttempt.percentage),
                key: sortedGroup[0].test_id,
            };
        });
    }, [results]);

    const toggleRow = (key) => {
        setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const stats = useMemo(() => {
        const uniqueTests = groupedResults.length;
        const passedTests = groupedResults.filter(
            (g) =>
                g.latest.pass_status === "pass" ||
                g.allAttempts.some((a) => a.pass_status === "pass")
        ).length;

        const totalBestScore = groupedResults.reduce(
            (sum, g) => sum + g.bestScore,
            0
        );
        const avgScore = uniqueTests
            ? (totalBestScore / uniqueTests).toFixed(1)
            : 0;

        return {
            totalTests: uniqueTests,
            passed: passedTests,
            avgScore: avgScore,
        };
    }, [groupedResults]);

    if (role !== "student") {
        return <AccessDenied />;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 lg:p-14 font-sans text-slate-800">
            {/* RESPONSIVE CONTAINER:
         - max-w-[95%]: Takes up most of the screen on desktops.
         - 2xl:max-w-[1800px]: Prevents it from looking too stretched on massive 4k screens.
      */}
            <div className="w-full max-w-[95%] 2xl:max-w-[1800px] mx-auto space-y-8 lg:space-y-12">

                {/* Header */}
                <div>
                    <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-extrabold text-slate-900 tracking-tight">
                        My Performance
                    </h1>
                    <p className="text-slate-500 lg:text-lg mt-2">
                        Track your assessment history and progress.
                    </p>
                </div>

                {/* Stats */}
                {(loading || groupedResults.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 animate-fadeIn">
                        <StatCard
                            icon={<FaClipboardList />}
                            label="Tests Taken"
                            value={loading ? "-" : stats.totalTests}
                            color="blue"
                        />
                        <StatCard
                            icon={<FaCheckCircle />}
                            label="Tests Passed"
                            value={loading ? "-" : stats.passed}
                            color="green"
                        />
                        <StatCard
                            icon={<FaChartLine />}
                            label="Avg. Best Score"
                            value={loading ? "-" : `${stats.avgScore}%`}
                            color="purple"
                        />
                    </div>
                )}

                {/* Results List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <LoadingSkeleton />
                    ) : groupedResults.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="overflow-x-hidden w-full">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-5 lg:p-6 text-left">Assessment Details</th>
                                        <th className="p-5 lg:p-6 text-left w-64">Latest Score</th>
                                        <th className="p-5 lg:p-6 text-left">Result</th>
                                        <th className="p-5 lg:p-6 text-left">Attempts</th>
                                        <th className="p-5 lg:p-6 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm lg:text-base">
                                    {groupedResults.map((item) => {
                                        const r = item.latest;
                                        const isExpanded = expandedRows[item.key];
                                        const attemptCount = item.allAttempts.length;

                                        return (
                                            <React.Fragment key={item.key}>
                                                <tr
                                                    onClick={() => toggleRow(item.key)}
                                                    className={`
                            cursor-pointer transition-all duration-200 group relative
                            ${isExpanded
                                                            ? "bg-indigo-50/50"
                                                            : "hover:bg-slate-50 hover:scale-[1.002]"
                                                        }
                          `}
                                                >
                                                    <td className="p-5 lg:p-6">
                                                        <div className="flex items-start gap-3 lg:gap-4">
                                                            <div className="mt-1 p-2 lg:p-3 bg-indigo-50 text-indigo-600 rounded-lg text-lg lg:text-xl">
                                                                <FaClipboardList />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm lg:text-lg">
                                                                    {r.test_title}
                                                                </div>
                                                                <div className="text-xs lg:text-sm font-medium text-slate-500 mt-1">
                                                                    {r.course_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 lg:p-6">
                                                        <ScoreBar percentage={r.percentage} />
                                                    </td>
                                                    <td className="p-5 lg:p-6">
                                                        <StatusBadge status={r.pass_status} />
                                                    </td>
                                                    <td className="p-5 lg:p-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm lg:text-base font-semibold text-slate-700 bg-slate-100 px-2 lg:px-3 py-1 rounded">
                                                                {attemptCount}
                                                            </span>
                                                            {/* {attemptCount > 1 && (
                                <span className="text-[10px] lg:text-xs text-slate-400">
                                  (Click to view history)
                                </span>
                              )} */}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 lg:p-6 text-sm lg:text-base text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt className="text-slate-300" />
                                                            {formatSubmittedAt(r.submitted_at)}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="bg-slate-50 shadow-inner">
                                                        <td colSpan="5" className="p-4 md:p-6 lg:p-8">
                                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-[95%] lg:max-w-6xl mx-auto">
                                                                <div className="px-5 lg:px-8 py-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                                                    <div className="flex items-center gap-2 text-xs lg:text-sm font-bold text-slate-600 uppercase tracking-wider">
                                                                        <FaHistory className="text-indigo-500" />
                                                                        Detailed History
                                                                    </div>
                                                                </div>
                                                                <table className="w-full text-left text-sm lg:text-base">
                                                                    <thead>
                                                                        <tr className="bg-white border-b border-slate-100 text-slate-400 text-xs lg:text-sm uppercase tracking-wide">
                                                                            <th className="px-6 lg:px-8 py-4 font-semibold">
                                                                                Attempt
                                                                            </th>
                                                                            <th className="px-6 lg:px-8 py-4 font-semibold">
                                                                                Date
                                                                            </th>
                                                                            <th className="px-6 lg:px-8 py-4 font-semibold">
                                                                                Score
                                                                            </th>
                                                                            <th className="px-6 lg:px-8 py-4 font-semibold">
                                                                                Status
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50">
                                                                        {item.allAttempts.map((hist, hIdx) => {
                                                                            // LOGIC FIX: Check pass_status AND if it matches best score
                                                                            const isPass = hist.pass_status?.toLowerCase() === "pass";
                                                                            const isBest = Number(hist.percentage) === item.bestScore;
                                                                            const showTrophy = isPass && isBest && attemptCount > 1;

                                                                            return (
                                                                                <tr
                                                                                    key={hIdx}
                                                                                    className="hover:bg-indigo-50/30"
                                                                                >
                                                                                    <td className="px-6 lg:px-8 py-4">
                                                                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 lg:px-3 py-1 rounded text-xs lg:text-sm">
                                                                                            #{hist.attempt_no}
                                                                                        </span>
                                                                                        {hIdx === 0 && (
                                                                                            <span className="ml-2 text-[10px] lg:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                                                                LATEST
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-6 lg:px-8 py-4 text-slate-600 font-medium">
                                                                                        {formatSubmittedAt(hist.submitted_at)}
                                                                                    </td>
                                                                                    <td className="px-6 lg:px-8 py-4">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="font-semibold text-slate-700">
                                                                                                {hist.percentage}%
                                                                                            </span>

                                                                                            {/* TROPHY LOGIC APPLIED HERE */}
                                                                                            {showTrophy && (
                                                                                                <FaTrophy
                                                                                                    className="text-amber-400 text-lg lg:text-xl"
                                                                                                    title="Best Passed Score"
                                                                                                />
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-6 lg:px-8 py-4">
                                                                                        <StatusBadge status={hist.pass_status} />
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
        </div>
    );
}