import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import {
    FaHistory,
    FaCalendarAlt,
    FaSyncAlt,
    FaSearch,
    FaUserClock,
    FaSignInAlt,
    FaSignOutAlt,
    FaExclamationCircle
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP } from "../../constants/deptClass";

const PERSON_OPTIONS = [
    { value: "ALL", label: "All Types" },
    { value: "STUDENT", label: "Students" },
    { value: "STAFF", label: "Staff" }
];

const STATUS_OPTIONS = [
    { value: "ALL", label: "All Status" },
    { value: "IN", label: "Checked In" },
    { value: "OUT", label: "Checked Out" },
    { value: "LATE", label: "Late Only" }
];

const DEPT_OPTIONS = [
    { value: "ALL", label: "All Departments" },
    ...Object.entries(DEPT_MAP).map(([id, name]) => ({
        value: id,
        label: name
    }))
];

const CLASS_OPTIONS = [
    { value: "ALL", label: "All Classes" },
    { value: 1, label: "I Year" },
    { value: 2, label: "II Year" },
    { value: 3, label: "III Year" },
    { value: 4, label: "IV Year" }
];

// Professional Select Styles
const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: "0.75rem",
        padding: "2px",
        borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
        boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.1)" : "none",
        "&:hover": { borderColor: "#d1d5db" },
        minHeight: "42px",
        fontSize: "0.875rem",
    }),
    menu: (base) => ({
        ...base,
        borderRadius: "0.75rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        zIndex: 50,
        marginTop: "4px",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#3b82f6"
            : state.isFocused
                ? "#eff6ff"
                : "white",
        color: state.isSelected ? "white" : "#1f2937",
        cursor: "pointer",
        fontSize: "0.875rem",
        padding: "10px 12px",
    }),
};

export default function AttendanceLogs({ user }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [personType, setPersonType] = useState(() =>
        user?.role === "CA"
            ? PERSON_OPTIONS.find(p => p.value === "STUDENT")
            : PERSON_OPTIONS[0]
    );

    const [deptFilter, setDeptFilter] = useState(() =>
        user?.role === "CA" ? String(user.dept_id) : "ALL"
    );

    const [status, setStatus] = useState(STATUS_OPTIONS[0]);

    const token = localStorage.getItem("token");
    const [fromDate, setFromDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [toDate, setToDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );

    const [classFilter, setClassFilter] = useState(() =>
        user?.role === "CA" ? String(user.assigned_class_id) : "ALL"
    );

    const [peopleOptions, setPeopleOptions] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [peopleLoading, setPeopleLoading] = useState(false);


    useEffect(() => {
        const fetchPeople = async () => {
            if (
                deptFilter === "ALL" ||
                personType.value === "ALL"
            ) {
                setPeopleOptions([]);
                setSelectedPerson(null);
                return;
            }

            setPeopleLoading(true);
            try {
                const token = localStorage.getItem("token");

                const params = new URLSearchParams({
                    dept_id: deptFilter,
                    type: personType.value, // STAFF | STUDENT
                });

                if (personType.value === "STUDENT" && classFilter !== "ALL") {
                    params.append("class_id", classFilter);
                }

                const res = await fetch(
                    `${BASE_URL}/attendance-logs/people?${params}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const json = await res.json();
                if (!json.success) throw new Error(json.message);

                setPeopleOptions(
                    json.data.map(p => ({
                        value: p.person_id,
                        label:
                            personType.value === "STUDENT" ? (
                                <div className="flex flex-col leading-tight">
                                    <span className="font-medium">{p.name}</span>
                                    <span className="text-xs text-gray-500">{p.roll_no}</span>
                                </div>
                            ) : (
                                p.name
                            )
                    }))
                );
            } catch (err) {
                Swal.fire("Error", err.message, "error");
                setPeopleOptions([]);
            } finally {
                setPeopleLoading(false);
            }
        };

        fetchPeople();
    }, [deptFilter, personType, classFilter]);


    useEffect(() => {
        if (!user) return;

        if (user.role === "CA") {
            setPersonType(PERSON_OPTIONS.find(p => p.value === "STUDENT"));
            setDeptFilter(String(user.dept_id));
            setClassFilter(String(user.assigned_class_id));
        }
    }, [user]);

    // Stabilize fetch function reference
    const fetchLogs = useCallback(async () => {


        setLoading(true);
        try {
            const params = new URLSearchParams({
                from_date: fromDate,
                to_date: toDate,
                person_type: personType.value,
                status: status.value,
                dept_filter: deptFilter,
                class_filter: classFilter
            });

            if (selectedPerson) {
                params.append("person_id", selectedPerson.value);
            }
            const res = await fetch(
                `${BASE_URL}/attendance-logs/history?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const json = await res.json();
            if (!json.success) throw new Error(json.message);

            setLogs(json.data);
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [
        fromDate,
        toDate,
        personType,
        status,
        deptFilter,
        classFilter,
        selectedPerson,
        token
    ]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <FaHistory className="text-xl" />
                            </span>
                            Attendance Logs
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            View comprehensive entry/exit history and analyze attendance patterns.
                        </p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="group flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-70"
                    >
                        <FaSyncAlt className={`text-sm ${loading ? "animate-spin" : ""}`} />
                        <span>{loading ? "Syncing..." : "Refresh Logs"}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 flex flex-wrap gap-4 items-center">

                    {/* From Date */}
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border bg-gray-50"
                    />

                    {/* To Date */}
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border bg-gray-50"
                    />

                    <Select
                        options={PERSON_OPTIONS}
                        value={personType}
                        onChange={setPersonType}
                        styles={selectStyles}
                        className="min-w-[180px]"
                        isDisabled={user?.role === "CA"}
                    />

                    <Select
                        options={STATUS_OPTIONS}
                        value={status}
                        onChange={setStatus}
                        styles={selectStyles}
                        className="min-w-[180px]"
                    />

                    <Select
                        options={DEPT_OPTIONS}
                        value={DEPT_OPTIONS.find(d => d.value === deptFilter)}
                        onChange={(o) => setDeptFilter(o.value)}
                        styles={selectStyles}
                        className="min-w-[200px]"
                        isDisabled={user?.role === "CA"}
                    />

                    {personType.value === "STUDENT" && (
                        <Select
                            options={CLASS_OPTIONS}
                            value={CLASS_OPTIONS.find(c => c.value === classFilter)}
                            onChange={(o) => setClassFilter(o.value)}
                            styles={selectStyles}
                            className="min-w-[180px]"
                            isDisabled={user?.role === "CA"}
                        />
                    )}

                    <div className="min-w-[240px]">
                        <Select
                            styles={selectStyles}
                            options={peopleOptions}
                            value={selectedPerson}
                            onChange={setSelectedPerson}
                            isDisabled={
                                deptFilter === "ALL" ||
                                personType.value === "ALL"
                            }
                            isLoading={peopleLoading}
                            placeholder={
                                personType.value === "STAFF"
                                    ? "Select Staff"
                                    : personType.value === "STUDENT"
                                        ? "Select Student"
                                        : "Select Person"
                            }
                        />
                    </div>

                </div>

                {/* Table Container */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {loading ? (
                                    // Loading Skeleton
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    // Empty State
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <FaSearch className="text-2xl text-gray-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">No logs found</h3>
                                                <p className="text-gray-500 mt-1">Try adjusting the date or filters to see records.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Data Rows
                                    logs.map((l, i) => (
                                        <tr key={i} className="hover:bg-gray-50/80 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                        {l.name?.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="font-semibold text-gray-900 text-sm">
                                                        {l.name}
                                                        {l.person_type === "STUDENT" && l.roll_no && (
                                                            <span className="text-xs text-gray-400 ml-2">
                                                                - {l.roll_no}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${l.person_type === 'STUDENT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                                    }`}>
                                                    <FaUserClock className="mr-1.5 opacity-70" /> {l.person_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {DEPT_MAP[l.dept_id] || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${l.entry_type === "IN"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                                    }`}>
                                                    {l.entry_type === "IN" ? <FaSignInAlt /> : <FaSignOutAlt />}
                                                    {l.entry_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {l.entry_time}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {l.is_late ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                                                        <FaExclamationCircle />
                                                        <span>{l.late_minutes}m Late</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs font-medium">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Stats */}
                    {!loading && logs.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">
                                Total Logs: <span className="text-gray-900">{logs.length}</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}