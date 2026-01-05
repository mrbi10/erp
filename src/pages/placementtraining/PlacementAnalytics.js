import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
    FaChartBar,
    FaUsers,
    FaClipboardList,
    FaCheckCircle,
    FaTimesCircle,
    FaFilter,
    FaRedo
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP } from "../../constants/deptClass";

/* -------------------------------------------------------
   Placement Analytics – Single Page for ALL ROLES
-------------------------------------------------------- */

export default function PlacementAnalytics({ user }) {

    /* ---------------- STATE ---------------- */

    const [loading, setLoading] = useState(true);

    const [summary, setSummary] = useState(null);
    const [testWise, setTestWise] = useState([]);
    const [deptWise, setDeptWise] = useState([]);

    // filters
    const [selectedTest, setSelectedTest] = useState("ALL");
    const [selectedDept, setSelectedDept] = useState("ALL");
    const [passFilter, setPassFilter] = useState("ALL");



    /* ---------------- FETCH ANALYTICS ---------------- */

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `${BASE_URL}/placement-training/analytics`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await res.json();

            if (!res.ok) {
                return Swal.fire("Error", data.message, "error");
            }

            setSummary(data.summary);
            setTestWise(data.test_wise || []);
            setDeptWise(data.dept_wise || []);

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    /* ---------------- FILTERED DATA ---------------- */

    const filteredTests = useMemo(() => {
        let data = [...testWise];

        if (selectedTest !== "ALL") {
            data = data.filter(t => t.test_id === Number(selectedTest));
        }

        if (passFilter !== "ALL") {
            data = data.filter(t =>
                passFilter === "PASS"
                    ? t.pass_percentage >= 50
                    : t.pass_percentage < 50
            );
        }

        return data;
    }, [testWise, selectedTest, passFilter]);

    const filteredDept = useMemo(() => {
        let data = [...deptWise];

        if (selectedDept !== "ALL") {
            data = data.filter(d => d.dept_id === Number(selectedDept));
        }

        return data;
    }, [deptWise, selectedDept]);

    /* ---------------- ACCESS CONTROL ---------------- */

    if (user.role === "student") {
        return (
            <div className="p-8 bg-white rounded-xl shadow text-center text-gray-600">
                <FaTimesCircle className="text-red-500 text-4xl mx-auto mb-4" />
                Analytics is not available for students.
            </div>
        );
    }

    /* ---------------- HELPERS ---------------- */

    const resetFilters = () => {
        setSelectedTest("ALL");
        setSelectedDept("ALL");
        setPassFilter("ALL");
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="p-6 space-y-8">

            {/* ---------------- HEADER ---------------- */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <FaChartBar className="text-indigo-600" />
                    Placement Analytics
                </h1>

                <span className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                    {user.role}
                </span>
            </div>

            {/* ---------------- SUMMARY ---------------- */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SummaryCard
                        label="Students"
                        value={summary.total_students}
                        icon={<FaUsers />}
                    />
                    <SummaryCard
                        label="Tests"
                        value={summary.total_tests}
                        icon={<FaClipboardList />}
                    />
                    <SummaryCard
                        label="Attempts"
                        value={summary.total_attempts}
                        icon={<FaClipboardList />}
                    />
                    <SummaryCard
                        label="Pass %"
                        value={`${summary.pass_percentage || 0}%`}
                        icon={<FaCheckCircle />}
                        green
                    />
                </div>
            )}

            {/* ---------------- FILTERS ---------------- */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <FaFilter />
                    Filters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    {/* Test filter */}
                    <select
                        className="border p-2 rounded"
                        value={selectedTest}
                        onChange={e => setSelectedTest(e.target.value)}
                    >
                        <option value="ALL">All Tests</option>
                        {testWise.map(t => (
                            <option key={t.test_id} value={t.test_id}>
                                {t.title}
                            </option>
                        ))}
                    </select>

                    {/* Dept filter */}
                    {(user.role === "HOD" || user.role === "Principal") && (
                        <select
                            className="border p-2 rounded"
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                        >
                            <option value="ALL">All Departments</option>
                            {Object.entries(DEPT_MAP).map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Pass filter */}
                    <select
                        className="border p-2 rounded"
                        value={passFilter}
                        onChange={e => setPassFilter(e.target.value)}
                    >
                        <option value="ALL">All Results</option>
                        <option value="PASS">Pass ≥ 50%</option>
                        <option value="FAIL">Fail &lt; 50%</option>
                    </select>

                    <button
                        onClick={resetFilters}
                        className="flex items-center justify-center gap-2 border rounded hover:bg-gray-100"
                    >
                        <FaRedo />
                        Reset
                    </button>

                </div>
            </div>

            {/* ---------------- TEST WISE ---------------- */}
            <AnalyticsTable
                title="Test-wise Performance"
                columns={["Test", "Attempts", "Pass %"]}
                data={filteredTests.map(t => ({
                    key: t.test_id,
                    values: [t.title, t.attempts, `${t.pass_percentage}%`]
                }))}
            />

            {/* ---------------- DEPT WISE ---------------- */}
            {(user.role === "HOD" || user.role === "Principal") && (
                <AnalyticsTable
                    title="Department-wise Performance"
                    columns={["Department", "Attempts", "Pass %"]}
                    data={filteredDept.map(d => ({
                        key: d.dept_id,
                        values: [
                            DEPT_MAP[d.dept_id] || d.dept_id,
                            d.attempts,
                            `${d.pass_percentage}%`
                        ]
                    }))}
                />
            )}

            {loading && (
                <div className="text-center text-gray-500">
                    Loading analytics...
                </div>
            )}

        </div>
    );
}

/* -------------------------------------------------------
   REUSABLE COMPONENTS
-------------------------------------------------------- */

function SummaryCard({ label, value, icon, green }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
            <div
                className={`text-3xl p-3 rounded-full ${green ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"
                    }`}
            >
                {icon}
            </div>
            <div>
                <div className="text-sm text-gray-500">{label}</div>
                <div className="text-2xl font-bold">{value}</div>
            </div>
        </div>
    );
}

function AnalyticsTable({ title, columns, data }) {
    return (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
            <div className="p-4 font-semibold text-gray-700 border-b">
                {title}
            </div>

            {data.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                    No data available
                </div>
            ) : (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="px-4 py-3 text-left">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => (
                            <tr key={row.key} className="border-t hover:bg-gray-50">
                                {row.values.map((v, i) => (
                                    <td key={i} className="px-4 py-3">
                                        {v}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
