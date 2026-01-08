import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from "recharts";
import {
    FaChartBar,
    FaUsers,
    FaClipboardList,
    FaCheckCircle,
    FaTimesCircle,
    FaFilter,
    FaRedo,
    FaTrophy,
    FaUniversity
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP } from "../../constants/deptClass";

/* -------------------------------------------------------
   COLORS & CONSTANTS
-------------------------------------------------------- */
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];
const PIE_COLORS = ["#10B981", "#EF4444"]; // Green for Pass, Red for Fail

const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(99, 102, 241, 0.2)" : "none",
        padding: "4px",
        borderRadius: "0.75rem",
        "&:hover": { borderColor: "#cbd5e1" }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#eef2ff" : "white",
        color: state.isSelected ? "white" : "#1e293b",
        cursor: "pointer"
    }),
    menu: (base) => ({ ...base, borderRadius: "0.75rem", overflow: "hidden", zIndex: 50 })
};

export default function PlacementAnalytics({ user }) {

    /* ---------------- STATE ---------------- */
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [testWise, setTestWise] = useState([]);
    const [deptWise, setDeptWise] = useState([]);

    // Filters (Using objects for react-select)
    const [selectedTest, setSelectedTest] = useState(null);
    const [selectedDept, setSelectedDept] = useState(null);
    const [passFilter, setPassFilter] = useState(null);

    /* ---------------- FETCH ANALYTICS ---------------- */
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/placement-training/analytics`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setSummary(data.summary);
            setTestWise(data.test_wise || []);
            setDeptWise(data.dept_wise || []);

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load analytics data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    /* ---------------- MEMOIZED DATA & OPTIONS ---------------- */

    // 1. Transform Data for Charts
    const deptChartData = useMemo(() => {
        return deptWise.map(d => ({
            name: DEPT_MAP[d.dept_id] || `Dept ${d.dept_id}`,
            passPercentage: d.pass_percentage,
            attempts: d.attempts
        }));
    }, [deptWise]);

    const pieChartData = useMemo(() => {
        if (!summary) return [];
        const pass = summary.pass_percentage || 0;
        const fail = 100 - pass;
        return [
            { name: "Pass", value: parseFloat() },
            { name: "Fail", value: parseFloat() }
        ];
    }, [summary]);

    // 2. Filter Logic
    const filteredTests = useMemo(() => {
        let data = [...testWise];
        if (selectedTest) {
            data = data.filter(t => t.test_id === selectedTest.value);
        }
        if (passFilter) {
            data = data.filter(t =>
                passFilter.value === "PASS" ? t.pass_percentage >= 50 : t.pass_percentage < 50
            );
        }
        return data;
    }, [testWise, selectedTest, passFilter]);

    const filteredDept = useMemo(() => {
        let data = [...deptWise];
        if (selectedDept) {
            data = data.filter(d => d.dept_id === selectedDept.value);
        }
        return data;
    }, [deptWise, selectedDept]);

    // 3. Options for React Select
    const testOptions = testWise.map(t => ({ value: t.test_id, label: t.title }));
    const deptOptions = Object.entries(DEPT_MAP).map(([id, name]) => ({ value: Number(id), label: name }));
    const resultOptions = [
        { value: "PASS", label: "Pass (≥ 50%)" },
        { value: "FAIL", label: "Fail (< 50%)" }
    ];

    /* ---------------- ACCESS CONTROL ---------------- */
    if (user.role === "student") {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-100 p-6 rounded-full mb-4">
                    <FaTimesCircle className="text-4xl" />
                </div>
                <h2 className="text-lg font-bold text-slate-600">Access Restricted</h2>
                <p>Analytics are available for faculty only.</p>
            </div>
        );
    }

    /* ---------------- UI RENDERING ---------------- */
    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <span className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                                <FaChartBar size={20} />
                            </span>
                            Placement Analytics
                        </h1>
                        <p className="text-slate-500 mt-1 ml-14">Real-time insights into student performance.</p>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider shadow-sm">
                        Role: {user.role}
                    </span>
                </div>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* 1. SUMMARY CARDS */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    label="Total Students"
                                    value={summary.total_students}
                                    icon={<FaUsers />}
                                    color="text-blue-600"
                                    bg="bg-blue-50"
                                />
                                <StatCard
                                    label="Tests Conducted"
                                    value={summary.total_tests}
                                    icon={<FaClipboardList />}
                                    color="text-purple-600"
                                    bg="bg-purple-50"
                                />
                                <StatCard
                                    label="Total Attempts"
                                    value={summary.total_attempts}
                                    icon={<FaRedo />}
                                    color="text-amber-600"
                                    bg="bg-amber-50"
                                />
                                <StatCard
                                    label="Avg Pass Rate"
                                    value={`${summary.pass_percentage}%`}
                                    icon={<FaTrophy />}
                                    color="text-emerald-600"
                                    bg="bg-emerald-50"
                                    trend
                                />
                            </div>
                        )}

                        {/* 2. CHARTS SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Department Performance Bar Chart */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FaUniversity className="text-indigo-500" /> Department Performance (Pass %)
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={deptChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                                            <ChartTooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                cursor={{ fill: '#f8fafc' }}
                                            />
                                            <Bar dataKey="passPercentage" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} name="Pass Rate" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Overall Pass/Fail Pie Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Overall Success Rate</h3>
                                <div className="h-[300px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                        <div className="text-center">
                                            <span className="text-2xl font-bold text-slate-800">{summary?.pass_percentage}%</span>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Pass</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. FILTERS & TABLES */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            
                            {/* Filter Toolbar */}
                            <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wide min-w-fit">
                                    <FaFilter /> Filters:
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                    <Select
                                        styles={selectStyles}
                                        options={testOptions}
                                        value={selectedTest}
                                        onChange={setSelectedTest}
                                        placeholder="Filter by Test..."
                                        isClearable
                                    />

                                    {(user.role === "HOD" || user.role === "Principal") && (
                                        <Select
                                            styles={selectStyles}
                                            options={deptOptions}
                                            value={selectedDept}
                                            onChange={setSelectedDept}
                                            placeholder="Filter by Department..."
                                            isClearable
                                        />
                                    )}

                                    <Select
                                        styles={selectStyles}
                                        options={resultOptions}
                                        value={passFilter}
                                        onChange={setPassFilter}
                                        placeholder="Filter Result..."
                                        isClearable
                                    />

                                    <button
                                        onClick={() => {
                                            setSelectedTest(null);
                                            setSelectedDept(null);
                                            setPassFilter(null);
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors font-semibold text-sm h-[38px] mt-0.5"
                                    >
                                        <FaRedo size={12} /> Reset
                                    </button>
                                </div>
                            </div>

                            {/* Tables Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Test Wise Table */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 pl-1">Test Performance</h4>
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4">Test Name</th>
                                                    <th className="px-6 py-4 text-center">Attempts</th>
                                                    <th className="px-6 py-4 w-32">Pass Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredTests.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-8 text-center text-slate-400">No tests found</td></tr>
                                                ) : (
                                                    filteredTests.map(t => (
                                                        <tr key={t.test_id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-700">{t.title}</td>
                                                            <td className="px-6 py-4 text-center text-slate-500">{t.attempts}</td>
                                                            <td className="px-6 py-4">
                                                                <ProgressBar percentage={t.pass_percentage} />
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Dept Wise Table */}
                                {(user.role === "HOD" || user.role === "Principal") && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 pl-1">Department Stats</h4>
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4">Department</th>
                                                        <th className="px-6 py-4 text-center">Attempts</th>
                                                        <th className="px-6 py-4 w-32">Pass Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredDept.length === 0 ? (
                                                        <tr><td colSpan="3" className="p-8 text-center text-slate-400">No data found</td></tr>
                                                    ) : (
                                                        filteredDept.map(d => (
                                                            <tr key={d.dept_id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-slate-700">
                                                                    {DEPT_MAP[d.dept_id] || `Dept ${d.dept_id}`}
                                                                </td>
                                                                <td className="px-6 py-4 text-center text-slate-500">{d.attempts}</td>
                                                                <td className="px-6 py-4">
                                                                    <ProgressBar percentage={d.pass_percentage} />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------
   HELPER COMPONENTS
-------------------------------------------------------- */

const StatCard = ({ label, value, icon, color, bg, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} -mr-8 -mt-8 transition-transform group-hover:scale-150 opacity-50`}></div>
        <div className="relative flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{label}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 mt-2">{value}</h4>
            </div>
            <div className={`p-4 rounded-xl ${bg} ${color} text-2xl`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Live Metrics
            </div>
        )}
    </div>
);

const ProgressBar = ({ percentage }) => {
    // Determine color based on score
    let colorClass = "bg-red-500";
    if (percentage >= 75) colorClass = "bg-emerald-500";
    else if (percentage >= 50) colorClass = "bg-amber-500";

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className={`text-xs font-bold ${percentage >= 50 ? 'text-slate-700' : 'text-red-600'}`}>
                    {percentage}%
                </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                    className={`${colorClass} h-2 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const DashboardSkeleton = () => (
    <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-80 bg-slate-200 rounded-2xl"></div>
            <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
    </div>
);