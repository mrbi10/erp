import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaPlus,
    FaClipboardList,
    FaEye,
    FaClock,
    FaTrophy,
    FaRedo,
    FaCheckCircle,
    FaTimesCircle,
    FaUsers,
    FaArrowLeft,
    FaBullhorn,
    FaLayerGroup
} from "react-icons/fa";
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

    // -----------------------------
    // Logic (Unchanged)
    // -----------------------------
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

    // -----------------------------
    // Fetch Existing Assignments
    // -----------------------------
    const fetchTestAssignments = async (testId) => {
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${testId}/assignments`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch assignments");
            }

            // 1. Extract unique IDs from the response rows
            const existingDeptIds = [...new Set(data.assignments.map((a) => a.dept_id))];
            const existingClassIds = [...new Set(data.assignments.map((a) => a.class_id))];

            // 2. Update form state
            // Note: Since backend doesn't return dates, we reset them to "" to keep inputs controlled
            setAssignForm({
                dept_ids: existingDeptIds,
                class_ids: existingClassIds,
                publish_start: "",
                publish_end: ""
            });

            // 3. Open the modal
            setAssignTest({ open: true, testId: testId });

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Could not load existing assignments", "error");
        }
    };

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

            // Attach assignments per test
            const testsWithAssignments = await Promise.all(
                (data.tests || []).map(async (t) => {
                    const r = await fetch(
                        `${BASE_URL}/placement-training/tests/${t.test_id}/assignments`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );
                    const a = await r.json();

                    return {
                        ...t,
                        assignments: a.assignments || [],
                    };
                })
            );

            setTests(testsWithAssignments);
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

            if (!res.ok) {
                return Swal.fire("Error", data.message, "error");
            }

            Swal.fire("Published", "Test is now live", "success");
            fetchTests();
        } catch (err) {
            Swal.fire("Error", "Server error", "error");
        }
    };

    // -----------------------------
    // UI Helpers
    // -----------------------------
    const TestSkeleton = () => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
            <div className="flex justify-between">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
            </div>
            <div className="flex gap-4 mb-6">
                <div className="h-4 bg-slate-100 rounded w-20"></div>
                <div className="h-4 bg-slate-100 rounded w-20"></div>
                <div className="h-4 bg-slate-100 rounded w-20"></div>
            </div>
            <div className="h-10 bg-slate-100 rounded w-full"></div>
        </div>
    );

    // -----------------------------
    // Main Render
    // -----------------------------
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 mb-2 text-sm font-semibold transition-colors"
                        >
                            <FaArrowLeft /> Back to Courses
                        </button>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                                <FaClipboardList />
                            </span>
                            Manage Tests
                        </h1>
                        <p className="text-slate-500 mt-1 ml-11">Configure assessments, questions, and schedules.</p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <FaPlus /> Create Test
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <TestSkeleton key={i} />)}
                    </div>
                ) : tests.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <FaClipboardList className="text-4xl text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">No tests created yet</h3>
                        <p className="text-slate-500 mt-2 mb-6 max-w-sm">
                            Create your first test to start assessing student performance for this course.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-indigo-600 font-semibold hover:underline"
                        >
                            Create New Test
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {tests.map((t) => {
                            const isAssigned = t.assignments && t.assignments.length > 0;
                            const isPublished = t.published === 1;

                            return (
                                <div
                                    key={t.test_id}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                                >
                                    <div className="flex flex-col lg:flex-row justify-between gap-6">

                                        {/* Test Info */}
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${isPublished ? "bg-green-500" : "bg-slate-400"}`}></div>
                                                    {isPublished ? "Live" : "Draft"}
                                                </span>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <FaClock className="text-indigo-400" />
                                                    <span className="font-semibold">{t.duration_minutes}m</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <FaTrophy className="text-amber-400" />
                                                    <span className="font-semibold">{t.pass_mark} / {t.total_marks} Marks</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <FaRedo className="text-emerald-400" />
                                                    <span className="font-semibold">{t.max_attempts} Attempt(s)</span>
                                                </div>
                                            </div>

                                            <div className="text-xs text-slate-400 flex items-start gap-2">
                                                <FaUsers className="mt-0.5" />
                                                <span>
                                                    Assigned to: <span className="text-slate-600 font-medium ml-1">
                                                        {isAssigned ? formatAssignments(t.assignments) : "No classes assigned yet"}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions Toolbar */}
                                        <div className="flex lg:flex-col items-center lg:items-end justify-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">

                                            <button
                                                onClick={() => fetchTestAssignments(t.test_id)} // Calls the function above
                                                className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors"
                                            >
                                                Assign Classes <FaLayerGroup />
                                            </button>

                                            <button
                                                onClick={() => navigate(`/placementtraining/tests/${t.test_id}/questions`)}
                                                disabled={isPublished}
                                                className={`w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold px-3 py-1.5 rounded transition-colors ${isPublished
                                                    ? "text-slate-300 cursor-not-allowed"
                                                    : "text-slate-600 hover:text-purple-600 hover:bg-purple-50"
                                                    }`}
                                            >
                                                Manage Questions <FaClipboardList />
                                            </button>

                                            <button
                                                onClick={() => navigate(`/placementtraining/trainer-results/${t.test_id}`)}
                                                className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 px-3 py-1.5 rounded hover:bg-sky-50 transition-colors"
                                            >
                                                View Results <FaEye />
                                            </button>

                                            <div className="h-px w-full bg-slate-100 my-1 hidden lg:block"></div>

                                            <button
                                                onClick={() => publishTest(t.test_id)}
                                                disabled={!isAssigned}
                                                className={`w-full px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${!isAssigned
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                    : isPublished
                                                        ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                                        : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200"
                                                    }`}
                                            >
                                                {isPublished ? (
                                                    <>Stop Exam <FaTimesCircle /></>
                                                ) : (
                                                    <>Publish Live <FaBullhorn /></>
                                                )}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- Create Test Modal --- */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
                        <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">

                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800">Create New Test</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                                    <input
                                        className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                                        placeholder="e.g. Aptitude Final Assessment"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Mins)</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                                            value={form.duration_minutes}
                                            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Attempts</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                                            value={form.max_attempts}
                                            onChange={(e) => setForm({ ...form, max_attempts: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Marks</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                                            value={form.total_marks}
                                            onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pass Mark</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                                            value={form.pass_mark}
                                            onChange={(e) => setForm({ ...form, pass_mark: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTest}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95"
                                >
                                    Create Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Assign Modal --- */}
                {assignTest.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAssignTest({ open: false, testId: null })} />
                        <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">

                            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FaLayerGroup /> Assign Test
                                </h2>
                                <button onClick={() => setAssignTest({ open: false, testId: null })} className="text-white/80 hover:text-white">
                                    <FaTimesCircle size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Departments</label>
                                    <select
                                        multiple
                                        className="w-full border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 bg-slate-50"
                                        value={assignForm.dept_ids}
                                        onChange={(e) =>
                                            setAssignForm({
                                                ...assignForm,
                                                dept_ids: Array.from(e.target.selectedOptions, o => Number(o.value))
                                            })
                                        }
                                    >
                                        {Object.entries(DEPT_MAP).map(([id, name]) => (
                                            <option key={id} value={id} className="p-1.5 rounded hover:bg-indigo-100 cursor-pointer">{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Classes / Years</label>
                                    <select
                                        multiple
                                        className="w-full border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 bg-slate-50"
                                        value={assignForm.class_ids}
                                        onChange={(e) =>
                                            setAssignForm({
                                                ...assignForm,
                                                class_ids: Array.from(e.target.selectedOptions, o => Number(o.value))
                                            })
                                        }
                                    >
                                        {Object.entries(CLASS_MAP).map(([id, name]) => (
                                            <option key={id} value={id} className="p-1.5 rounded hover:bg-indigo-100 cursor-pointer">{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Publish Start</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                                            value={assignForm.publish_start || ""}
                                            onChange={e => setAssignForm({ ...assignForm, publish_start: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Publish End</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                                            value={assignForm.publish_end || ""}
                                            onChange={e => setAssignForm({ ...assignForm, publish_end: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setAssignTest({ open: false, testId: null })}
                                    className="px-4 py-2 text-slate-500 font-semibold hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitTestAssignment}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Confirm Assignment <FaCheckCircle />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
}