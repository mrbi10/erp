import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { BASE_URL } from "../../constants/API";
import { FaPlus, FaLock, FaSpinner } from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

const ACADEMIC_YEAR_OPTIONS = [
    { value: "2022-2023", label: "2022–2023" },
    { value: "2023-2024", label: "2023–2024" },
    { value: "2024-2025", label: "2024–2025" },
    { value: "2025-2026", label: "2025–2026" },
    { value: "2026-2027", label: "2026–2027" },
];



export const DEPT_OPTIONS = Object.entries(DEPT_MAP).map(
    ([id, name]) => ({ value: Number(id), label: name })
);

export const CLASS_OPTIONS = Object.entries(CLASS_MAP).map(
    ([id, label]) => ({ value: Number(id), label })
);


export default function ManageFeedback({ user }) {
    /* -------------------- STATE (ALWAYS FIRST) -------------------- */
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [form, setForm] = useState({
        dept_id: "",
        class_id: "",
        academic_year: "",
        title: "",
        start_date: "",
        end_date: ""
    });



    const token = localStorage.getItem("token");

    /* -------------------- EFFECT -------------------- */
    useEffect(() => {
        if (!["CA", "HOD", "Principal"].includes(user.role)) {
            setLoading(false);
            return;
        }

        const fetchSessions = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${BASE_URL}/feedback/sessions`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSessions(res.data || []);
            } catch {
                Swal.fire("Error", "Failed to load sessions", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [user.role, token]);

    /* -------------------- ACCESS GUARD (RENDER LEVEL) -------------------- */
    if (!["CA", "HOD", "Principal"].includes(user.role)) {
        return (
            <div className="p-6 text-center text-gray-500">
                Access denied.
            </div>
        );
    }

    /* -------------------- HANDLERS -------------------- */

    const handleCreateSession = async () => {
        const { dept_id, class_id, academic_year, title, start_date, end_date } = form;

        if (!dept_id || !class_id || !academic_year || !title || !start_date || !end_date) {
            Swal.fire("Missing data", "Fill all fields", "warning");
            return;
        }


        if (new Date(start_date) > new Date(end_date)) {
            Swal.fire("Invalid dates", "Start date must be before end date", "warning");
            return;
        }

        const confirm = await Swal.fire({
            title: "Create Feedback Session?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Create"
        });

        if (!confirm.isConfirmed) return;

        try {
            setCreating(true);

            await axios.post(
                `${BASE_URL}/feedback/session`,
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );


            Swal.fire("Created", "Feedback session created", "success");
            setForm({
                dept_id: "",
                class_id: "",
                academic_year: "",
                title: "",
                start_date: "",
                end_date: ""
            });

            const res = await axios.get(
                `${BASE_URL}/feedback/sessions`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSessions(res.data || []);

        } catch {
            Swal.fire("Error", "Failed to create session", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleCloseSession = async (sessionId) => {
        const confirm = await Swal.fire({
            title: "Close this session?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Close"
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.patch(
                `${BASE_URL}/feedback/session/${sessionId}/close`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire("Closed", "Session closed", "success");

            setSessions(prev =>
                prev.map(s =>
                    s.session_id === sessionId ? { ...s, is_active: 0 } : s
                )
            );
        } catch {
            Swal.fire("Error", "Failed to close session", "error");
        }
    };

    /* -------------------- RENDER -------------------- */

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">

            <h1 className="text-2xl font-extrabold text-gray-800">
                Manage Feedback Sessions
            </h1>

            {/* CREATE SESSION */}
            <div className="bg-white p-6 rounded-xl border space-y-4">
                <h2 className="font-bold flex items-center gap-2">
                    <FaPlus /> Create Session
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        options={DEPT_OPTIONS}
                        placeholder="Select Department"
                        value={DEPT_OPTIONS.find(opt => opt.value === form.dept_id) || null}
                        onChange={(opt) =>
                            setForm({ ...form, dept_id: opt.value })
                        }
                        classNamePrefix="react-select"
                    />


                    <Select
                        options={CLASS_OPTIONS}
                        placeholder="Select Class"
                        value={CLASS_OPTIONS.find(opt => opt.value === form.class_id) || null}
                        onChange={(opt) =>
                            setForm({ ...form, class_id: opt.value })
                        }
                        classNamePrefix="react-select"
                    />

                    <Select
                        options={ACADEMIC_YEAR_OPTIONS}
                        placeholder="Select Academic Year"
                        value={ACADEMIC_YEAR_OPTIONS.find(
                            opt => opt.value === form.academic_year
                        )}
                        onChange={(opt) =>
                            setForm({ ...form, academic_year: opt ? opt.value : "" })
                        }
                        classNamePrefix="react-select"
                    />

                    <input
                        placeholder="Title"
                        className="p-3 border rounded-lg"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                    <input
                        type="date"
                        className="p-3 border rounded-lg"
                        value={form.start_date}
                        onChange={e => setForm({ ...form, start_date: e.target.value })}
                    />
                    <input
                        type="date"
                        className="p-3 border rounded-lg"
                        value={form.end_date}
                        onChange={e => setForm({ ...form, end_date: e.target.value })}
                    />
                </div>

                <button
                    onClick={handleCreateSession}
                    disabled={creating}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center gap-2"
                >
                    {creating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                    Create
                </button>
            </div>

            {/* SESSION LIST */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left">Title</th>
                            <th className="p-4">Academic Year</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sessions.map(s => (
                            <tr key={s.session_id}>
                                <td className="p-4 font-medium">{s.title}</td>
                                <td className="p-4 text-center">{s.academic_year}</td>
                                <td className="p-4 text-center">
                                    {s.is_active ? "Active" : "Closed"}
                                </td>
                                <td className="p-4 text-right">
                                    {s.is_active && (
                                        <button
                                            onClick={() => handleCloseSession(s.session_id)}
                                            className="text-red-600 flex items-center gap-1"
                                        >
                                            <FaLock /> Close
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {sessions.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-6 text-center text-gray-400">
                                    No sessions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
