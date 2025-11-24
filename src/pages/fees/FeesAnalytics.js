import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FaChartPie, FaFilter } from "react-icons/fa";
import { BASE_URL } from "../../constants/API";

export default function FeesAnalytics({ user }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    const [classes, setClasses] = useState([]);
    const [filteredYears, setFilteredYears] = useState([]);

    const [filters, setFilters] = useState({
        dept_id: "",
        year: "",
        fee_type: "",
        payment_status: "",
        jain: "",
        bus: "",
        hostel: "",
    });

    const token = localStorage.getItem("token");

    const deptOptions = [
        { value: "1", label: "CSE" },
        { value: "2", label: "AIDS" },
        { value: "3", label: "AI & DS" },
        { value: "4", label: "CSBS" },
        { value: "5", label: "MECH" },
        { value: "6", label: "CIVIL" },
        { value: "7", label: "ECE" },
        { value: "8", label: "EEE" },
    ];

    const feeTypeOptions = [
        { value: "SEMESTER", label: "Semester Fee" },
        { value: "HOSTEL", label: "Hostel Fee" },
        { value: "TRANSPORT", label: "Transport Fee" },
    ];

    const statusOptions = [
        { value: "PAID", label: "Fully Paid" },
        { value: "PARTIAL", label: "Partially Paid" },
        { value: "NOT PAID", label: "Unpaid" },
    ];

    const jainOptions = [
        { value: "1", label: "Jain" },
        { value: "0", label: "Non-Jain" },
    ];

    const busOptions = [
        { value: "1", label: "Bus Student" },
        { value: "0", label: "No Bus" },
    ];

    const hostelOptions = [
        { value: "1", label: "Hosteller" },
        { value: "0", label: "Day Scholar" },
    ];

    const yearOptions = filteredYears.map((yr) => ({
        value: yr,
        label: `${yr} Year`,
    }));

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${BASE_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClasses(await res.json());
        } catch { }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams(filters).toString();
            const res = await fetch(`${BASE_URL}/fees/analytics?${q}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setAnalytics(json.data || null);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchClasses();
        fetchAnalytics();
    }, []);

    useEffect(() => {
        if (!filters.dept_id) return setFilteredYears([]);

        const years = classes
            .filter((c) => c.dept_id == filters.dept_id)
            .map((c) => c.year);

        setFilteredYears([...new Set(years)]);
    }, [filters.dept_id, classes]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 mb-6 rounded-xl shadow-lg border-t-4 border-indigo-600">
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                    <FaChartPie className="text-indigo-600 mr-3" /> Fees Analytics
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Select
                        options={deptOptions}
                        placeholder="Department"
                        value={filters.dept_id ? deptOptions.find(o => o.value === filters.dept_id) : null}
                        onChange={(v) => setFilters({ ...filters, dept_id: v?.value || "", year: "" })}
                    />


                    <Select
                        options={yearOptions}
                        placeholder="Year"
                        isDisabled={!filters.dept_id}
                        value={filters.year ? yearOptions.find(o => o.value === filters.year) : null}
                        onChange={(v) => setFilters({ ...filters, year: v?.value || "" })}
                    />

                    <Select
                        options={feeTypeOptions}
                        placeholder="Fee Type"
                        value={filters.fee_type ? feeTypeOptions.find(o => o.value === filters.fee_type) : null}
                        onChange={(v) => setFilters({ ...filters, fee_type: v?.value || "" })}
                    />

                    <Select
                        options={statusOptions}
                        placeholder="Payment Status"
                        value={filters.payment_status ? statusOptions.find(o => o.value === filters.payment_status) : null}
                        onChange={(v) => setFilters({ ...filters, payment_status: v?.value || "" })}
                    />

                    <Select
                        options={jainOptions}
                        placeholder="Jain / Non-Jain"
                        value={filters.jain ? jainOptions.find(o => o.value === filters.jain) : null}
                        onChange={(v) => setFilters({ ...filters, jain: v?.value || "" })}
                    />

                    <Select
                        options={busOptions}
                        placeholder="Bus Filter"
                        value={filters.bus ? busOptions.find(o => o.value === filters.bus) : null}
                        onChange={(v) => setFilters({ ...filters, bus: v?.value || "" })}
                    />
                    <Select
                        options={hostelOptions}
                        placeholder="Hostel Filter"
                        value={filters.hostel ? hostelOptions.find(o => o.value === filters.hostel) : null}
                        onChange={(v) => setFilters({ ...filters, hostel: v?.value || "" })}
                    />

                </div>

                <button
                    onClick={fetchAnalytics}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-lg shadow flex items-center mr-3"
                >
                    <FaFilter className="mr-2" /> Apply Filters
                </button>

                <div className="flex justify-end gap-3 mt-4">


                    <button
                        onClick={() => {
                            setFilters({
                                dept_id: "",
                                year: "",
                                fee_type: "",
                                payment_status: "",
                                jain: "",
                                bus: "",
                                hostel: "",
                            });
                            setFilteredYears([]);
                            fetchAnalytics();
                        }}
                        className="px-5 py-3 bg-gray-300 text-black rounded-lg shadow"
                    >
                        Reset
                    </button>

                </div>

            </div>




            {loading ? (
                <p className="text-center">Loading…</p>
            ) : !analytics ? (
                <p className="text-center">No data found</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-600">
                        <h2 className="text-xl font-semibold mb-4">Overall Fee Status</h2>
                        <p className="text-lg mb-2">Collected: ₹{analytics.total_collected}</p>
                        <p className="text-lg mb-2">Pending: ₹{analytics.total_pending}</p>
                        <p className="text-lg">Students: {analytics.total_students}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-yellow-600">
                        <h2 className="text-xl font-semibold mb-4">Payment Breakdown</h2>
                        <p className="text-lg mb-2">Paid: {analytics.paid}</p>
                        <p className="text-lg mb-2">Partial: {analytics.partial}</p>
                        <p className="text-lg">Unpaid: {analytics.unpaid}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-600">
                        <h2 className="text-xl font-semibold mb-4">Fee Type Summary</h2>
                        <p className="mb-2">Semester: ₹{analytics.semester_dues || 0}</p>
                        <p className="mb-2">Hostel: ₹{analytics.hostel_dues || 0}</p>
                        <p>Transport: ₹{analytics.transport_dues || 0}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
