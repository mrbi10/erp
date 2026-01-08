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
    FaLayerGroup,
    FaCalendarAlt,
    FaSpinner,
    FaStopCircle,
    FaCalendarTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";

export default function TrainerManageTests() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [courseName, setCourseName] = useState("");


    const [attemptsModal, setAttemptsModal] = useState({
        open: false,
        test: null,
        loading: false,
        data: null
    });

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

    const openEditTest = (test) => {
        setEditingTest(test);
        setForm({
            title: test.title,
            duration_minutes: test.duration_minutes,
            total_marks: test.total_marks,
            pass_mark: test.pass_mark,
            max_attempts: test.max_attempts
        });
        setShowModal(true);
    };

    const fetchCourseName = async () => {
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/courses`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error();

            const matchedCourse = data.courses.find(
                c => String(c.course_id) === String(courseId)
            );

            if (matchedCourse) {
                setCourseName(matchedCourse.name.toUpperCase());
            }
        } catch (err) {
            console.error("Failed to load course name");
        }
    };



    const toLocalDateTimeInput = (date) => {
        const pad = (n) => n.toString().padStart(2, "0");
        return (
            date.getFullYear() + "-" +
            pad(date.getMonth() + 1) + "-" +
            pad(date.getDate()) + "T" +
            pad(date.getHours()) + ":" +
            pad(date.getMinutes())
        );
    };

    const openAttempts = async (test) => {
        setAttemptsModal({
            open: true,
            test,
            loading: true,
            data: null
        });

        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}/attempts`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setAttemptsModal(prev => ({
                ...prev,
                loading: false,
                data
            }));
        } catch (err) {
            Swal.fire("Error", err.message || "Failed to load attempts", "error");
            setAttemptsModal({ open: false, test: null });
        }
    };

    const getTestStatus = (t) => {
        if (!t.publish_start || !t.publish_end || t.published !== 1) {
            return "IDLE";
        }

        const now = new Date();
        const start = new Date(t.publish_start);
        const end = new Date(t.publish_end);

        if (now < start) return "SCHEDULED";
        if (now >= start && now <= end) return "LIVE";
        return "IDLE";
    };

    const toggleAllDepts = () => {
        const allIds = Object.keys(DEPT_MAP).map(Number);
        if (assignForm.dept_ids.length === allIds.length) {
            setAssignForm({ ...assignForm, dept_ids: [] });
        } else {
            setAssignForm({ ...assignForm, dept_ids: allIds });
        }
    };

    const toggleAllClasses = () => {
        const allIds = Object.keys(CLASS_MAP).map(Number);
        if (assignForm.class_ids.length === allIds.length) {
            setAssignForm({ ...assignForm, class_ids: [] });
        } else {
            setAssignForm({ ...assignForm, class_ids: allIds });
        }
    };

    const handleDurationSelect = (hours) => {
        const now = new Date();

        let start = assignForm.publish_start
            ? new Date(assignForm.publish_start)
            : now;

        if (start < now) start = now;

        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        setAssignForm({
            ...assignForm,
            publish_start: toLocalDateTimeInput(start),
            publish_end: toLocalDateTimeInput(end)
        });
    };

    const submitTestAssignment = async () => {
        if (!form.duration_minutes) {
            return Swal.fire("Error", "Test duration invalid", "error");
        }

        if (!assignForm.publish_start || !assignForm.publish_end) {
            return Swal.fire("Required", "Please set both Start and End times", "warning");
        }

        const start = new Date(assignForm.publish_start);
        const end = new Date(assignForm.publish_end);

        const minEnd = new Date(start);
        minEnd.setMinutes(minEnd.getMinutes() + Number(form.duration_minutes));

        if (end < minEnd) {
            return Swal.fire(
                "Invalid Window",
                "Exam window must be at least test duration",
                "error"
            );
        }

        const assignments = [];
        for (const d of assignForm.dept_ids) {
            for (const c of assignForm.class_ids) {
                assignments.push({ dept_id: d, class_id: c });
            }
        }

        if (!assignments.length) {
            return Swal.fire(
                "Required",
                "Please select at least one department and class",
                "warning"
            );
        }

        setSubmitting(true);
        try {
            const payload = {
                assignments,
                publish_start: assignForm.publish_start,
                publish_end: assignForm.publish_end,
                published: 1
            };

            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${assignTest.testId}/assign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            Swal.fire("Scheduled", "Test scheduled successfully", "success");

            setAssignTest({ open: false, testId: null });
            setAssignForm({
                dept_ids: [],
                class_ids: [],
                publish_start: "",
                publish_end: ""
            });

            fetchTests();
        } catch (err) {
            Swal.fire("Error", err.message || "Server error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const fetchTestAssignments = async (testId) => {
        try {
            setAssignTest({ open: true, testId });
            const currentTest = tests.find(t => t.test_id === testId);
            if (currentTest) setForm(prev => ({ ...prev, duration_minutes: currentTest.duration_minutes }));

            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${testId}/assignments`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            const data = await res.json();
            if (!res.ok) throw new Error();

            const existingDeptIds = [...new Set(data.assignments.map(a => a.dept_id))];
            const existingClassIds = [...new Set(data.assignments.map(a => a.class_id))];

            setAssignForm({
                dept_ids: existingDeptIds,
                class_ids: existingClassIds,
                publish_start: currentTest?.publish_start
                    ? toLocalDateTimeInput(new Date(currentTest.publish_start))
                    : "",
                publish_end: currentTest?.publish_end
                    ? toLocalDateTimeInput(new Date(currentTest.publish_end))
                    : ""
            });

        } catch (err) {
            console.error(err);
        }
    };

    const fetchTests = async () => {
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/courses/${courseId}/tests`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
            const data = await res.json();

            const testsWithAssignments = await Promise.all(
                (data.tests || []).map(async (t) => {
                    const r = await fetch(
                        `${BASE_URL}/placement-training/tests/${t.test_id}/assignments`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                    );
                    const a = await r.json();
                    return {
                        ...t,
                        assignments: a.assignments || []
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
        fetchCourseName();
        fetchTests();
    }, [courseId]);


    const handleSaveTest = async () => {
        if (!form.title || !form.duration_minutes) {
            return Swal.fire("Required", "Fill all required fields", "warning");
        }

        const isEdit = Boolean(editingTest);

        try {
            const url = isEdit
                ? `${BASE_URL}/placement-training/tests/${editingTest.test_id}/details`
                : `${BASE_URL}/placement-training/tests`;

            const method = isEdit ? "PATCH" : "POST";

            const body = isEdit
                ? form
                : { course_id: courseId, ...form };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            Swal.fire(
                isEdit ? "Updated" : "Created",
                `Test ${isEdit ? "updated" : "created"} successfully`,
                "success"
            );

            setShowModal(false);
            setEditingTest(null);
            setForm({
                title: "",
                duration_minutes: "",
                total_marks: 100,
                pass_mark: 40,
                max_attempts: 1,
            });

            fetchTests();
        } catch (err) {
            Swal.fire("Error", err.message || "Server error", "error");
        }
    };

    const deleteTest = async (test) => {
        const status = getTestStatus(test);

        if (status === "LIVE") {
            return Swal.fire("Blocked", "Stop the exam before deleting", "warning");
        }

        const confirm = await Swal.fire({
            title: "Delete test?",
            text: "All questions, assignments and results will be removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            confirmButtonText: "Yes, delete",
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            Swal.fire("Deleted", "Test removed successfully", "success");
            fetchTests();
        } catch (err) {
            Swal.fire("Error", err.message || "Server error", "error");
        }
    };

    const formatAssignments = (assignments = []) => {
        if (!assignments.length) return "Not assigned";
        if (assignments.length > 3) return `${assignments.length} Classes Assigned`;
        return assignments
            .map(a => `${DEPT_MAP[a.dept_id]} - ${CLASS_MAP[a.class_id]}`)
            .join(", ");
    };

    const updateTestStatus = async (test, action) => {
        let payload = {};

        if (action === "publish_now") {
            if (!test.assignments || test.assignments.length === 0) {
                return Swal.fire("Action Blocked", "You must assign classes before publishing.", "warning");
            }

            const now = new Date();
            const end = new Date(now.getTime() + test.duration_minutes * 60000);

            payload = {
                published: 1,
                publish_start: toLocalDateTimeInput(now),
                publish_end: toLocalDateTimeInput(end)
            };
        }

        if (action === "stop" || action === "cancel") {
            payload = {
                published: 0,
                publish_start: null,
                publish_end: null
            };
        }

        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            let successMsg = "";
            if (action === "publish_now") successMsg = "Test is now LIVE";
            if (action === "stop") successMsg = "Test returned to IDLE state";
            if (action === "cancel") successMsg = "Schedule cancelled. Test is now IDLE.";

            Swal.fire("Success", successMsg, "success");
            fetchTests();
        } catch (err) {
            Swal.fire("Error", err.message || "Server error", "error");
        }
    };

    const confirmCancelSchedule = (test) => {
        Swal.fire({
            title: "Cancel Schedule?",
            text: "The test will revert to Draft mode. Students will not see it.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#d97706",
            confirmButtonText: "Yes, Cancel Schedule",
            cancelButtonText: "Keep it"
        }).then((result) => {
            if (result.isConfirmed) {
                updateTestStatus(test, "cancel");
            }
        });
    };

    const TestSkeleton = () => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
            <div className="flex justify-between">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
            </div>
            <div className="h-10 bg-slate-100 rounded w-full"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                                <FaClipboardList />
                            </span>
                            {courseName} – Manage Tests
                        </h1>

                        <p className="text-slate-500 mt-1 ml-11">
                            Configure assessments, questions, and schedules.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <FaPlus /> Create Test
                    </button>
                </div>

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
                        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
                            Create Test
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {tests.map((t) => {
                            const isAssigned = t.assignments && t.assignments.length > 0;
                            const status = getTestStatus(t);
                            const lockQuestions = status === "LIVE" || status === "SCHEDULED";

                            return (
                                <div
                                    key={t.test_id}
                                    className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 
                                    ${status === "LIVE" ? "border-green-200 shadow-green-100" :
                                            status === "SCHEDULED" ? "border-amber-200 shadow-amber-50" :
                                                "border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10"}`}
                                >
                                    <div className="flex flex-col lg:flex-row justify-between gap-6">

                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>

                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 
                                                    ${status === "LIVE" ? "bg-red-100 text-red-600 animate-pulse" :
                                                        status === "SCHEDULED" ? "bg-amber-100 text-amber-700" :
                                                            "bg-slate-100 text-slate-500"}`}>
                                                    <div className={`w-2 h-2 rounded-full 
                                                        ${status === "LIVE" ? "bg-red-600" :
                                                            status === "SCHEDULED" ? "bg-amber-500" :
                                                                "bg-slate-400"}`}></div>
                                                    {status}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <FaClock className="text-indigo-400" />
                                                    <span>
                                                        <span className="font-medium">Duration:</span>{" "}
                                                        <span className="font-semibold">{t.duration_minutes} min</span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <FaTrophy className="text-amber-400" />
                                                    <span>
                                                        <span className="font-medium">Pass Mark:</span>{" "}
                                                        <span className="font-semibold">{t.pass_mark}</span>
                                                        <span className="text-slate-400"> / </span>
                                                        <span className="font-semibold">{t.total_marks}</span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <FaRedo className="text-emerald-400" />
                                                    <span>
                                                        <span className="font-medium">Attempts:</span>{" "}
                                                        <span className="font-semibold">{t.max_attempts}</span>
                                                    </span>
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

                                            {status !== "IDLE" && (
                                                <div className="mt-2 text-xs flex items-center gap-2 text-slate-500">
                                                    <FaCalendarAlt />
                                                    {status === "SCHEDULED" && (
                                                        <span>
                                                            Scheduled: <strong>{new Date(t.publish_start).toLocaleString()
                                                            }</strong> to <strong>{new Date(t.publish_end).toLocaleString()}</strong>
                                                        </span>
                                                    )}
                                                    {status === "LIVE" && (
                                                        <span className="text-red-600 font-semibold">
                                                            Ends at {new Date(t.publish_end).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex lg:flex-col items-center lg:items-end justify-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">

                                            <button
                                                onClick={() => fetchTestAssignments(t.test_id)}
                                                className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors"
                                            >
                                                {status === "IDLE" ? "Assign & Schedule" : "Edit Assignments"} <FaLayerGroup />
                                            </button>

                                            <button
                                                onClick={() => navigate(`/placementtraining/tests/${t.test_id}/questions`)}
                                                disabled={lockQuestions}
                                                className={`w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold px-3 py-1.5 rounded transition-colors ${lockQuestions
                                                    ? "text-slate-300 cursor-not-allowed"
                                                    : "text-slate-600 hover:text-purple-600 hover:bg-purple-50"
                                                    }`}
                                            >
                                                Manage Questions <FaClipboardList />
                                            </button>

                                            {status === "IDLE" && (
                                                <button
                                                    onClick={() => openEditTest(t)}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded"
                                                >
                                                    Edit Test
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteTest(t)}
                                                className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded"
                                            >
                                                Delete Test
                                            </button>

                                            <button
                                                onClick={() => navigate(`/placementtraining/trainer-results/${t.test_id}`)}
                                                className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 px-3 py-1.5 rounded hover:bg-sky-50 transition-colors"
                                            >
                                                View Results <FaEye />
                                            </button>

                                            <div className="h-px w-full bg-slate-100 my-1 hidden lg:block"></div>

                                            {status === "IDLE" && (
                                                <button
                                                    onClick={() => updateTestStatus(t, "publish_now")}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-bold text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    Publish Now <FaBullhorn />
                                                </button>
                                            )}

                                            {status === "SCHEDULED" && (
                                                <button
                                                    onClick={() => confirmCancelSchedule(t)}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    Cancel Schedule <FaCalendarTimes />
                                                </button>
                                            )}

                                            {status === "LIVE" && (
                                                <button
                                                    onClick={() => updateTestStatus(t, "stop")}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    Stop Exam <FaStopCircle />
                                                </button>
                                            )}

                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
                        <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800">
                                    {editingTest ? "Edit Test" : "Create New Test"}
                                </h2>
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
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                                <button onClick={handleSaveTest} disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95 flex items-center gap-2">
                                    {submitting && <FaSpinner className="animate-spin" />}{editingTest ? "Update Test" : "Create Test"}

                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {assignTest.open && (
                    <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                            onClick={() => setAssignTest({ open: false, testId: null })}
                        />

                        {/* Modal */}
                        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeInUp flex flex-col max-h-[92vh]">

                            {/* Header */}
                            <div className="px-7 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-between shrink-0">
                                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                                    <FaLayerGroup /> Assign & Schedule Test
                                </h2>
                                <button
                                    onClick={() => setAssignTest({ open: false, testId: null })}
                                    className="text-white/70 hover:text-white transition"
                                >
                                    <FaTimesCircle size={22} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-7 space-y-8 overflow-y-auto custom-scrollbar">

                                {/* Audience */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <FaUsers className="text-indigo-500" /> Who can take this test
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Departments */}
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold uppercase text-slate-500">
                                                    Departments
                                                </span>
                                                <button
                                                    onClick={toggleAllDepts}
                                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                                >
                                                    {assignForm.dept_ids.length === Object.keys(DEPT_MAP).length
                                                        ? "Clear"
                                                        : "Select all"}
                                                </button>
                                            </div>

                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                {Object.entries(DEPT_MAP).map(([id, name]) => (
                                                    <label
                                                        key={id}
                                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border hover:border-indigo-400 cursor-pointer transition"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-indigo-600 rounded"
                                                            checked={assignForm.dept_ids.includes(Number(id))}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setAssignForm(prev => ({
                                                                    ...prev,
                                                                    dept_ids: checked
                                                                        ? [...prev.dept_ids, Number(id)]
                                                                        : prev.dept_ids.filter(d => d !== Number(id))
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Classes */}
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold uppercase text-slate-500">
                                                    Classes / Years
                                                </span>
                                                <button
                                                    onClick={toggleAllClasses}
                                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                                >
                                                    {assignForm.class_ids.length === Object.keys(CLASS_MAP).length
                                                        ? "Clear"
                                                        : "Select all"}
                                                </button>
                                            </div>

                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                {Object.entries(CLASS_MAP).map(([id, name]) => (
                                                    <label
                                                        key={id}
                                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border hover:border-indigo-400 cursor-pointer transition"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-indigo-600 rounded"
                                                            checked={assignForm.class_ids.includes(Number(id))}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setAssignForm(prev => ({
                                                                    ...prev,
                                                                    class_ids: checked
                                                                        ? [...prev.class_ids, Number(id)]
                                                                        : prev.class_ids.filter(c => c !== Number(id))
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <FaCalendarAlt className="text-indigo-500" /> Test availability
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Start */}
                                        <div className="bg-white border rounded-2xl p-4">
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                                                Starts at
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                min={toLocalDateTimeInput(new Date())}
                                                value={assignForm.publish_start || ""}
                                                onChange={e =>
                                                    setAssignForm({ ...assignForm, publish_start: e.target.value })
                                                }
                                            />
                                        </div>

                                        {/* End */}
                                        <div className="bg-white border rounded-2xl p-4">
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                                                Ends at
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                min={toLocalDateTimeInput(new Date())}
                                                value={assignForm.publish_end || ""}
                                                onChange={e =>
                                                    setAssignForm({ ...assignForm, publish_end: e.target.value })
                                                }
                                            />

                                            {/* Quick duration */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {[1, 2, 3, 24].map(h => (
                                                    <button
                                                        key={h}
                                                        onClick={() => handleDurationSelect(h)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                                    >
                                                        +{h}h
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-7 py-5 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
                                <button
                                    onClick={() => setAssignTest({ open: false, testId: null })}
                                    className="px-4 py-2 text-slate-500 font-semibold hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitTestAssignment}
                                    disabled={submitting}
                                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg transition active:scale-95 flex items-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                    Confirm Schedule
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>
        </div>
    );
}