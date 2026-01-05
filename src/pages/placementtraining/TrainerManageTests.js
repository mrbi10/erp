import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaClipboardList, FaEye } from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";


export default function TrainerManageTests() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        title: "",
        duration_minutes: "",
        total_marks: 100,
        pass_mark: 40,
        max_attempts: 1,
    });

    const [assignTest, setAssignTest] = useState({
        open: false,
        testId: null
    });

    const [assignForm, setAssignForm] = useState({
        dept_ids: [],
        class_ids: [],
        publish_start: "",
        publish_end: ""
    });



    const submitTestAssignment = async () => {
        const assignments = [];


        for (const d of assignForm.dept_ids) {
            for (const c of assignForm.class_ids) {
                assignments.push({ dept_id: d, class_id: c });
            }
        }

        if (assignments.length === 0) {
            return Swal.fire("Required", "Select dept & class", "warning");
        }

        try {
            const res = await fetch(

                `${BASE_URL}/placement-training/tests/${assignTest.testId}/assign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        assignments,
                        publish_start: assignForm.publish_start,
                        publish_end: assignForm.publish_end
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                return Swal.fire("Error", data.message, "error");
            }

            Swal.fire("Assigned", "Test assigned successfully", "success");
            setAssignTest({ open: false, testId: null });
            setAssignForm({
                dept_ids: [],
                class_ids: [],
                publish_start: "",
                publish_end: ""
            });

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    const fetchTestAssignments = async (testId) => {
        const res = await fetch(
            `${BASE_URL}/placement-training/tests/${testId}/assignments`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
        );
        const data = await res.json();

        setAssignForm({
            dept_ids: [...new Set(data.assignments.map(a => a.dept_id))],
            class_ids: [...new Set(data.assignments.map(a => a.class_id))]
        });
    };

    // -----------------------------
    // Fetch tests
    // -----------------------------
    const fetchTests = async () => {
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/courses/${courseId}/tests`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await res.json();
            setTests(data.tests || []);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load tests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [courseId]);

    // -----------------------------
    // Create test
    // -----------------------------
    const handleCreateTest = async () => {
        if (!form.title || !form.duration_minutes) {
            return Swal.fire("Required", "Fill all required fields", "warning");
        }

        try {
            const res = await fetch(`${BASE_URL}/placement-training/tests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    course_id: courseId,
                    ...form,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                return Swal.fire("Error", data.message || "Failed", "error");
            }

            Swal.fire("Created", "Test created successfully", "success");
            setShowModal(false);
            setForm({
                title: "",
                duration_minutes: "",
                total_marks: 100,
                pass_mark: 40,
                max_attempts: 1,
            });
            fetchTests();

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    const formatAssignments = (assignments = []) => {
        if (!assignments.length) return "Not assigned";

        return assignments
            .map(a => `${DEPT_MAP[a.dept_id]} - ${CLASS_MAP[a.class_id]}`)
            .join(", ");
    };


    // -----------------------------
    // Publish / Unpublish
    // -----------------------------
    const publishTest = async (testId) => {
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${testId}/publish`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await res.json();

            if (data.success) {
                Swal.fire("Published", "Test is now live", "success");
                fetchTests(); // reload tests
            } else {
                Swal.fire("Error", data.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Server error", "error");
        }
    };


    // -----------------------------
    // UI
    // -----------------------------
    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FaClipboardList className="text-sky-600" />
                    Manage Tests
                </h1>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg"
                >
                    <FaPlus />
                    Create Test
                </button>
            </div>

            {/* Tests */}
            {loading ? (
                <p className="text-gray-500">Loading tests...</p>
            ) : tests.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
                    No tests created yet
                </div>
            ) : (
                <div className="space-y-4">
                    {tests.map((t) => {
                        const isAssigned = t.assignments && t.assignments.length > 0;

                        return (
                            <div
                                key={t.test_id}
                                className="bg-white p-5 rounded-xl shadow flex justify-between items-center"
                            >
                                <div>
                                    <h2 className="text-lg font-bold">{t.title}</h2>
                                    <p className="text-sm text-gray-600">
                                        Duration: {t.duration_minutes} mins | Pass: {t.pass_mark} | Attempts: {t.max_attempts}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Assigned to:{" "}
                                        <span className="font-medium">
                                            {isAssigned ? formatAssignments(t.assignments) : "Not assigned"}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={async () => {
                                            await fetchTestAssignments(t.test_id);
                                            setAssignTest({ open: true, testId: t.test_id });
                                        }}
                                        className="text-orange-600 hover:text-orange-800"
                                    >
                                        Assign
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigate(`/placementtraining/tests/${t.test_id}/questions`)
                                        }
                                        className="text-purple-600 hover:text-purple-800"
                                        disabled={t.published === 1}
                                    >
                                        Questions
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigate(`/placementtraining/trainer-results/${t.test_id}`)
                                        }
                                        className="text-sky-600 hover:text-sky-800 flex items-center gap-1"
                                    >
                                        <FaEye />
                                        Results
                                    </button>

                                    <button
                                        onClick={() => publishTest(t.test_id)}
                                        disabled={!isAssigned}
                                        className={`px-3 py-1 rounded text-white ${!isAssigned
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : t.published === 1
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-green-600 hover:bg-green-700"
                                            }`}
                                    >
                                        {t.published === 1 ? "Unpublish" : "Publish"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

            )}

            {/* Create Test Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Create Test</h2>

                        <div className="space-y-3">
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Test title *"
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                            />
                           

                            <input
                                type="number"
                                className="w-full border p-2 rounded"
                                placeholder="Duration (minutes) *"
                                value={form.duration_minutes}
                                onChange={(e) =>
                                    setForm({ ...form, duration_minutes: e.target.value })
                                }
                            />

                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="number"
                                    className="border p-2 rounded"
                                    placeholder="Total marks"
                                    value={form.total_marks}
                                    onChange={(e) =>
                                        setForm({ ...form, total_marks: e.target.value })
                                    }
                                />
                                <input
                                    type="number"
                                    className="border p-2 rounded"
                                    placeholder="Pass mark"
                                    value={form.pass_mark}
                                    onChange={(e) =>
                                        setForm({ ...form, pass_mark: e.target.value })
                                    }
                                />
                                <input
                                    type="number"
                                    className="border p-2 rounded"
                                    placeholder="Max attempts"
                                    value={form.max_attempts}
                                    onChange={(e) =>
                                        setForm({ ...form, max_attempts: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTest}
                                className="px-4 py-2 bg-sky-600 text-white rounded"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {assignTest.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Assign Test</h2>

                        {/* Department */}
                        <div className="mb-4">
                            <label className="text-sm font-medium">Departments</label>
                            <select
                                multiple
                                className="w-full border p-2 rounded mt-1"
                                value={assignForm.dept_ids}
                                onChange={(e) =>
                                    setAssignForm({
                                        ...assignForm,
                                        dept_ids: Array.from(
                                            e.target.selectedOptions,
                                            o => Number(o.value)
                                        )
                                    })
                                }
                            >
                                {Object.entries(DEPT_MAP).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* Class */}
                        <div className="mb-6">
                            <label className="text-sm font-medium">Classes / Years</label>
                            <select
                                multiple
                                className="w-full border p-2 rounded mt-1"
                                value={assignForm.class_ids}
                                onChange={(e) =>
                                    setAssignForm({
                                        ...assignForm,
                                        class_ids: Array.from(
                                            e.target.selectedOptions,
                                            o => Number(o.value)
                                        )
                                    })
                                }
                            >
                                {Object.entries(CLASS_MAP).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="datetime-local"
                                className="border p-2 rounded"
                                value={assignForm.publish_start || ""}
                                onChange={e =>
                                    setAssignForm({ ...assignForm, publish_start: e.target.value })
                                }
                            />
                            <input
                                type="datetime-local"
                                className="border p-2 rounded"
                                value={assignForm.publish_end || ""}
                                onChange={e =>
                                    setAssignForm({ ...assignForm, publish_end: e.target.value })
                                }
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setAssignTest({ open: false, testId: null })}
                                className="px-4 py-2 border rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitTestAssignment}
                                className="px-4 py-2 bg-orange-600 text-white rounded"
                            >
                                Assign
                            </button>
                        </div>
                    </div>


                </div>

            )}



        </div>

    );
}
