import React, { useState, useEffect } from "react";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import {
    FaIdCard,
    FaSearch,
    FaCheck,
    FaUsers,
    FaFilter
} from "react-icons/fa";
import Swal from "sweetalert2";

const deptOptions = Object.entries(DEPT_MAP).map(([val, label]) => ({
    value: Number(val),
    label
}));

const classOptions = Object.entries(CLASS_MAP).map(([val, label]) => ({
    value: Number(val),
    label
}));



const passTypeOptions = [
    { value: "bus", label: "Bus Pass" },
    { value: "jain_mess", label: "Jain Mess Pass" }
];

export default function ManagePasses() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering State
    const [searchTerm, setSearchTerm] = useState("");
    const [deptFilter, setDeptFilter] = useState(null);
    const [classFilter, setClassFilter] = useState(null);

    // Assignment State
    const [selectedType, setSelectedType] = useState(passTypeOptions[0]);
    const [validFrom, setValidFrom] = useState("");
    const [validTill, setValidTill] = useState("");
    const [selectedStudents, setSelectedStudents] = useState([]);
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase();
    const userDeptId = user?.dept_id;
    const userClassId = user?.assigned_class_id;


    const filteredDeptOptions =
        role === "DeptAdmin" || role === "CA" || role === "HOD"
            ? deptOptions.filter(d => d.value === userDeptId)
            : deptOptions;

    const filteredClassOptions =
        role === "CA"
            ? classOptions.filter(c => c.value === userClassId)
            : classOptions;



    /* ================= FETCH DATA ================= */
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!role) return;

        if (role === "ca") {
            const dept = deptOptions.find(d => d.value === userDeptId);
            const cls = classOptions.find(c => c.value === userClassId);

            setDeptFilter(dept || null);
            setClassFilter(cls || null);
        }

        if (role === "hod" || role === "deptadmin") {
            const dept = deptOptions.find(d => d.value === userDeptId);
            setDeptFilter(dept || null);
        }
    }, [role, userDeptId, userClassId]);


    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [studentsRes, passesRes] = await Promise.all([
                fetch(`${BASE_URL}/students`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/studentPass`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (!studentsRes.ok || !passesRes.ok) throw new Error("Failed to fetch data");

            const studentsData = await studentsRes.json();
            const passesData = await passesRes.json();

            const passMap = {};
            passesData.forEach(pass => {
                if (!passMap[pass.user_id]) {
                    passMap[pass.user_id] = {
                        bus_pass_id: null,
                        mess_pass_id: null,
                        has_bus_pass: false,
                        has_mess_pass: false
                    };
                }

                if (pass.pass_type === "bus" && pass.is_valid === 1) {
                    passMap[pass.user_id].has_bus_pass = true;
                    passMap[pass.user_id].bus_pass_id = pass.id;
                }

                if (pass.pass_type === "jain_mess" && pass.is_valid === 1) {
                    passMap[pass.user_id].has_mess_pass = true;
                    passMap[pass.user_id].mess_pass_id = pass.id;
                }
            });


            const merged = studentsData.map(student => ({
                ...student,
                has_bus_pass: passMap[student.user_id]?.has_bus_pass || false,
                has_mess_pass: passMap[student.user_id]?.has_mess_pass || false,
                bus_pass_id: passMap[student.user_id]?.bus_pass_id || null,
                mess_pass_id: passMap[student.user_id]?.mess_pass_id || null
            }));

            setStudents(merged);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= FILTERING LOGIC ================= */
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.roll_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter ? s.dept_id === deptFilter.value : true;
        const matchesClass = classFilter ? s.class_id === classFilter.value : true;

        return matchesSearch && matchesDept && matchesClass;
    });

    /* ================= SELECTION LOGIC ================= */
    const toggleSelect = (id) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Only select filtered students who don't already have the selected pass
            const selectableIds = filteredStudents
                .filter(student => !(
                    (selectedType.value === "bus" && student.has_bus_pass) ||
                    (selectedType.value === "jain_mess" && student.has_mess_pass)
                ))
                .map(s => s.user_id);
            setSelectedStudents(selectableIds);
        } else {
            setSelectedStudents([]);
        }
    };

    /* ================= API ACTIONS ================= */
    const handleAssign = async () => {
        if (!validFrom || !validTill) return Swal.fire("Missing Dates", "Please select validity dates.", "warning");
        if (selectedStudents.length === 0) return Swal.fire("No Students", "Please select at least one student.", "warning");

        const payload = selectedStudents.map(id => ({
            user_id: id,
            pass_type: selectedType.value,
            valid_from: validFrom,
            valid_till: validTill
        }));

        try {
            const res = await fetch(`${BASE_URL}/studentPass`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to assign passes");

            await Swal.fire({ icon: "success", title: "Success", text: "Passes assigned successfully!" });
            setSelectedStudents([]);
            fetchData(); // Refresh data
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };

    const handleRevoke = async (passId) => {
        const confirm = await Swal.fire({
            title: "Revoke Pass?",
            text: "This will remove access immediately.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, revoke"
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`${BASE_URL}/studentPass/${passId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (!res.ok) throw new Error();
            await Swal.fire("Revoked", "Pass removed successfully", "success");
            fetchData(); // Refresh data
        } catch {
            Swal.fire("Error", "Failed to revoke pass", "error");
        }
    };

    /* ================= RENDER ================= */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-indigo-600 bg-gray-50">
                <FaUsers className="text-5xl animate-bounce mb-4" />
                <p className="text-xl font-semibold animate-pulse">Loading Students Database...</p>
            </div>
        );
    }

    // React-Select custom styles for cleaner UI integration
    const selectStyles = {
        control: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            padding: '2px',
            boxShadow: 'none',
            '&:hover': { borderColor: '#6366f1' }
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };


    const isAllSelected = filteredStudents.length > 0 && selectedStudents.length === filteredStudents.filter(s => !(selectedType.value === "bus" && s.has_bus_pass) && !(selectedType.value === "jain_mess" && s.has_mess_pass)).length;

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-50 font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl text-white md:text-3xl font-bold flex items-center gap-3">
                            <FaIdCard /> Manage Student Passes
                        </h1>
                        <p className="text-indigo-200 mt-1 text-sm">Filter students and bulk assign digital passes.</p>
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm font-bold shadow-inner">
                        {selectedStudents.length} Selected
                    </div>
                </div>

                <div className="p-6">
                    {/* TOP SECTION: Filters & Assignment Controls */}
                    <div className="grid lg:grid-cols-12 gap-6 mb-6">

                        {/* Zone 1: Find Students */}
                        <div className="lg:col-span-7 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <FaFilter /> Step 1: Find Students
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by Name or Register No..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <Select
                                        options={filteredDeptOptions}
                                        isClearable={role === "admin"}
                                        isDisabled={role === "ca" || role === "hod" || role === "deptadmin"}
                                        placeholder="Any Department"
                                        value={deptFilter}
                                        onChange={setDeptFilter}
                                        styles={selectStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />

                                </div>
                                <div>
                                    <Select
                                        options={filteredClassOptions}
                                        isClearable={role !== "ca"}
                                        isDisabled={role === "ca"}
                                        placeholder="Any Year/Class"
                                        value={classFilter}
                                        onChange={setClassFilter}
                                        styles={selectStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />

                                </div>
                            </div>
                        </div>

                        {/* Zone 2: Assign Passes */}
                        <div className="lg:col-span-5 bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                            <h2 className="text-sm font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <FaCheck /> Step 2: Configure & Assign
                            </h2>
                            <div className="space-y-4">
                                <Select
                                    options={passTypeOptions}
                                    value={selectedType}
                                    onChange={(option) => {
                                        setSelectedType(option);
                                        setSelectedStudents([]); // Reset selection when changing type
                                    }}
                                    styles={selectStyles}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Valid From</label>
                                        <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Valid Till</label>
                                        <input type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAssign}
                                    disabled={selectedStudents.length === 0}
                                    className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${selectedStudents.length > 0 ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg" : "bg-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    Issue Pass to {selectedStudents.length} Students
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABLE SECTION */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[50vh]">
                            <table className="min-w-full text-left bg-white text-sm">
                                <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 w-16 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="p-4 font-bold uppercase tracking-wider text-xs">Register No</th>
                                        <th className="p-4 font-bold uppercase tracking-wider text-xs">Name</th>
                                        <th className="p-4 font-bold uppercase tracking-wider text-xs">Dept / Year</th>
                                        <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Bus Pass</th>
                                        <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Mess Pass</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-400">
                                                No students found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map(student => {
                                            const disabled = (selectedType.value === "bus" && student.has_bus_pass) ||
                                                (selectedType.value === "jain_mess" && student.has_mess_pass);

                                            return (
                                                <tr key={student.user_id} className={`hover:bg-indigo-50/50 transition-colors ${selectedStudents.includes(student.user_id) ? "bg-indigo-50" : ""}`}>
                                                    <td className="p-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={disabled}
                                                            checked={selectedStudents.includes(student.user_id)}
                                                            onChange={() => toggleSelect(student.user_id)}
                                                            className={`w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                                                        />
                                                    </td>
                                                    <td className="p-4 font-mono font-medium text-gray-700">{student.roll_no}</td>
                                                    <td className="p-4 font-semibold text-gray-900">{student.name}</td>
                                                    <td className="p-4 text-gray-600">
                                                        <div className="flex flex-col">
                                                            <span>{DEPT_MAP[student.dept_id] || student.dept_id}</span>
                                                            <span className="text-xs text-gray-400">{CLASS_MAP[student.class_id] || student.class_id}</span>
                                                        </div>
                                                    </td>

                                                    {/* Pass Status Columns */}
                                                    <td className="p-4 text-center">
                                                        {student.has_bus_pass ? (
                                                            <span onClick={() => handleRevoke(student.bus_pass_id)} className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold uppercase rounded bg-green-100 text-green-700 hover:bg-red-500 hover:text-white transition-colors cursor-pointer" title="Click to Revoke">
                                                                Active &times;
                                                            </span>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {student.has_mess_pass ? (
                                                            <span onClick={() => handleRevoke(student.mess_pass_id)} className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold uppercase rounded bg-green-100 text-green-700 hover:bg-red-500 hover:text-white transition-colors cursor-pointer" title="Click to Revoke">
                                                                Active &times;
                                                            </span>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}