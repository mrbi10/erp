import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaPlus,
    FaClipboardList,
    FaEye,
    FaClock,
    FaTrophy,
    FaAward,
    FaRedo,
    FaCheckCircle,
    FaTimesCircle,
    FaUsers,
    FaBullhorn,
    FaLayerGroup,
    FaCalendarAlt,
    FaSpinner,
    FaStopCircle,
    FaCalendarTimes,
    FaMarker
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";
import NotifyModal from "../../components/NotifyModal";
import { parseUTC, now, formatIST, toMysqlDatetime, toLocalDateTimeInput, parseLocalDateTime } from "../../constants/dateUtils";


// --- Components ---

const TestSkeleton = () => (

    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-pulse">
        <div className="flex justify-between items-start mb-6">
            <div className="space-y-3 w-1/2">
                <div className="h-6 bg-slate-100 rounded-lg w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
            </div>
            <div className="h-8 bg-slate-100 rounded-full w-24"></div>
        </div>
        <div className="h-12 bg-slate-50 rounded-xl w-full"></div>
    </div>
);

const EmptyState = ({ onCreate }) => (

    <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
        <div className="bg-indigo-50 p-6 rounded-full mb-6">
            <FaClipboardList className="text-4xl text-indigo-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No tests created yet</h3>
        <p className="text-slate-500 mt-2 mb-8 max-w-sm">
            Create your first test to start assessing student performance for this course.
        </p>
        <button
            onClick={onCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
        >
            <FaPlus /> Create Test
        </button>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        LIVE: "bg-red-50 text-red-600 border-red-100 ring-red-500/10",
        SCHEDULED: "bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10",
        IDLE: "bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10",
    };

    const indicators = {
        LIVE: "bg-red-500 animate-pulse",
        SCHEDULED: "bg-amber-500",
        IDLE: "bg-slate-400",
    };

    return (
        <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 border ${styles[status]}`}
        >
            <span className={`w-2 h-2 rounded-full ${indicators[status]}`}></span>
            {status}
        </span>
    );
};

// --- Main Component ---

export default function TrainerManageTests() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // --- State ---
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [courseName, setCourseName] = useState("");

    const [notifyModal, setNotifyModal] = useState({
        open: false,
        test: null,
    });

    const [attemptsModal, setAttemptsModal] = useState({
        open: false,
        test: null,
        loading: false,
        data: null,
    });

    const [form, setForm] = useState({
        title: "",
        duration_minutes: "",
        total_marks: "",
        pass_mark: "",
        max_attempts: 1,
    });

    const [assignTest, setAssignTest] = useState({
        open: false,
        testId: null,
    });

    const [assignForm, setAssignForm] = useState({
        dept_ids: [],
        class_ids: [],
        publish_start: "",
        publish_end: "",
    });




    // --- Handlers ---

    const openEditTest = (test) => {
        setEditingTest(test);
        setForm({
            title: test.title,
            duration_minutes: test.duration_minutes,
            total_marks: test.total_marks,
            pass_mark: test.pass_mark,
            max_attempts: test.max_attempts,
        });
        setShowModal(true);
    };

    const openNotifyModal = (test) => {
        setNotifyModal({ open: true, test });
    };

    const fetchCourseName = async () => {
        try {
            const res = await fetch(`${BASE_URL}/placement-training/courses`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });


            const data = await res.json();
            if (!res.ok) throw new Error();

            const matchedCourse = data.courses.find(
                (c) => String(c.course_id) === String(courseId)
            );

            if (matchedCourse) {
                setCourseName(matchedCourse.name.toUpperCase());
            }
        } catch (err) {
            console.error("Failed to load course name");
        }



    };


    const openAttempts = async (test) => {
        setAttemptsModal({
            open: true,
            test,
            loading: true,
            data: null,
        });


        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}/attempts`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setAttemptsModal((prev) => ({
                ...prev,
                loading: false,
                data,
            }));
        } catch (err) {
            Swal.fire(
                "Error",
                err.message || "Failed to load attempts",
                "error"
            );
            setAttemptsModal({ open: false, test: null });
        }



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
        const nowtime = now();

        let start = assignForm.publish_start
            ? parseLocalDateTime(assignForm.publish_start)
            : nowtime;


        if (start < nowtime) start = nowtime;

        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        setAssignForm({
            ...assignForm,
            publish_start: toLocalDateTimeInput(start),
            publish_end: toLocalDateTimeInput(end),
        });
    };


    const submitTestAssignment = async () => {
        if (!form.duration_minutes) {
            return Swal.fire("Error", "Test duration invalid", "error");
        }


        if (!assignForm.publish_start || !assignForm.publish_end) {
            return Swal.fire(
                "Required",
                "Please set both Start and End times",
                "warning"
            );
        }



        const start = parseLocalDateTime(assignForm.publish_start);
        const end = parseLocalDateTime(assignForm.publish_end);

        if (!start || !end) {
            return Swal.fire("Error", "Invalid date/time selected", "error");
        }



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
                published: 1,
                publish_start: toMysqlDatetime(parseLocalDateTime(assignForm.publish_start)),
                publish_end: toMysqlDatetime(parseLocalDateTime(assignForm.publish_end)),
            };


            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${assignTest.testId}/assign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(payload),
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
                publish_end: "",
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
            const currentTest = tests.find((t) => t.test_id === testId);
            if (currentTest)
                setForm((prev) => ({
                    ...prev,
                    duration_minutes: currentTest.duration_minutes,
                }));


            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${testId}/assignments`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error();

            const existingDeptIds = [
                ...new Set(data.assignments.map((a) => a.dept_id)),
            ];
            const existingClassIds = [
                ...new Set(data.assignments.map((a) => a.class_id)),
            ];

            setAssignForm({
                dept_ids: existingDeptIds,
                class_ids: existingClassIds,
                publish_start: currentTest?.publish_start
                    ? toLocalDateTimeInput(new Date(currentTest.publish_start))
                    : "",
                publish_end: currentTest?.publish_end
                    ? toLocalDateTimeInput(parseUTC(currentTest.publish_end))
                    : "",
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
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            const data = await res.json();


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

            const body = isEdit ? form : { course_id: courseId, ...form };

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
        if (test.status === "LIVE") {
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

        const allDeptIds = Object.keys(DEPT_MAP).map(Number);
        const allClassIds = Object.keys(CLASS_MAP).map(Number);

        const deptSet = new Set(assignments.map(a => a.dept_id));
        const classSet = new Set(assignments.map(a => a.class_id));

        if (
            deptSet.size === allDeptIds.length &&
            classSet.size === allClassIds.length
        ) {
            return "All Departments • All Years";
        }

        const grouped = {};
        assignments.forEach(({ dept_id, class_id }) => {
            if (!grouped[dept_id]) grouped[dept_id] = new Set();
            grouped[dept_id].add(class_id);
        });

        const parts = Object.entries(grouped).map(([deptId, classIds]) => {
            const classes = [...classIds];

            if (classes.length === allClassIds.length) {
                return `${DEPT_MAP[deptId]} (All Years)`;
            }

            const classNames = classes
                .sort((a, b) => a - b)
                .map(id => CLASS_MAP[id]);

            return `${DEPT_MAP[deptId]} (${classNames.join(", ")})`;
        });

        if (parts.join(", ").length > 120) {
            return `${parts.length} Departments Assigned`;
        }

        return parts.join(" • ");
    };



    const updateTestStatus = async (test, action) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            if (test.total_marks <= 0) {
                Swal.fire(
                    "Cannot publish",
                    "Total marks must be greater than zero",
                    "warning"
                );
                return;
            }

            let payload = {};

            if (action === "publish_now") {
                const resAssign = await fetch(
                    `${BASE_URL}/placement-training/tests/${test.test_id}/assignments`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                if (!resAssign.ok) {
                    Swal.fire("Error", "Failed to verify assignments", "error");
                    return;
                }

                const assignData = await resAssign.json();

                if (!assignData.assignments || assignData.assignments.length === 0) {
                    Swal.fire(
                        "Action Blocked",
                        "You must assign classes before publishing.",
                        "warning"
                    );
                    return;
                }

                const nowTime = now();
                const duration = Number(test.duration_minutes);

                if (!Number.isFinite(duration) || duration <= 0) {
                    Swal.fire(
                        "Invalid Test",
                        "Test duration is invalid. Please edit test details.",
                        "error"
                    );
                    return;
                }

                const end = new Date(nowTime.getTime() + duration * 60000);

                console.log(nowTime, end);


                payload = {
                    published: 1,
                    publish_start: toMysqlDatetime(nowTime),
                    publish_end: toMysqlDatetime(end),
                };
            }

            if (action === "stop" || action === "cancel") {
                payload = {
                    published: 0,
                    publish_start: null,
                    publish_end: null,
                };
            }

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
            if (action === "cancel")
                successMsg = "Schedule cancelled. Test is now IDLE.";

            Swal.fire("Success", successMsg, "success");
            fetchTests();
        } catch (err) {
            Swal.fire("Error", err.message || "Server error", "error");
        } finally {
            setSubmitting(false);
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
            cancelButtonText: "Keep it",
        }).then((result) => {
            if (result.isConfirmed) {
                updateTestStatus(test, "cancel");
            }
        });
    };

    // --- Render Helpers ---

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-8">


                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <span className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl shadow-sm">
                                <FaClipboardList />
                            </span>
                            {courseName || "Loading..."} <span className="text-slate-300 font-light">|</span> Manage Tests
                        </h1>
                        <p className="text-slate-500 font-medium pl-14 max-w-2xl">
                            Configure assessments, questions, and schedules for this course.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
                    >
                        <FaPlus /> <span>Create Test</span>
                    </button>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="grid gap-6">
                        {[1, 2, 3].map((i) => (
                            <TestSkeleton key={i} />
                        ))}
                    </div>
                ) : tests.length === 0 ? (
                    <EmptyState onCreate={() => setShowModal(true)} />
                ) : (
                    <div className="grid gap-6">
                        {tests.map((t) => {
                            const isAssigned = t.assignments && t.assignments.length > 0;
                            const status = t.status;
                            const lockQuestions = status === "LIVE" || status === "SCHEDULED";

                            return (

                                <div

                                    key={t.test_id}
                                    className={`group bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 relative overflow-hidden
                ${status === "LIVE" ? "border-red-200 shadow-red-50 ring-1 ring-red-100" :
                                            status === "SCHEDULED" ? "border-amber-200 shadow-amber-50 ring-1 ring-amber-100" :
                                                "border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"}`}
                                >
                                    <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">

                                        {/* Left: Info */}
                                        <div className="flex-grow space-y-5">

                                            <div className="flex flex-wrap items-center gap-4">
                                                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                                    {t.title}
                                                </h2>
                                                <StatusBadge status={status} />
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-sm text-slate-600">
                                                    <FaClock className="text-indigo-400" />
                                                    <span className="font-semibold text-slate-900">{t.duration_minutes}</span>
                                                    <span className="text-slate-500">mins</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-sm text-slate-600">
                                                    <FaAward className="text-indigo-400" />
                                                    <span className="font-semibold text-slate-900">{t.total_marks}</span>
                                                    <span className="text-slate-500">marks</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-sm text-slate-600">
                                                    <FaTrophy className="text-amber-400" />
                                                    <span>
                                                        Pass: <span className="font-semibold text-slate-900">{t.pass_mark}%</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-sm text-slate-600">
                                                    <FaRedo className="text-emerald-400" />
                                                    <span>
                                                        Attempts: <span className="font-semibold text-slate-900">{t.max_attempts}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2 text-sm text-slate-500">
                                                    <FaUsers className="mt-1 text-slate-400" />
                                                    <span>
                                                        Assigned to: <span className="text-slate-700 font-medium">
                                                            {isAssigned ? formatAssignments(t.assignments) : "No classes assigned yet"}
                                                        </span>
                                                    </span>
                                                </div>

                                                {status !== "IDLE" && (
                                                    <div className="flex items-start gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100 inline-block">
                                                        <FaCalendarAlt className={status === "LIVE" ? "text-red-500 mt-1" : "text-amber-500 mt-1"} />
                                                        {status === "SCHEDULED" && (
                                                            <span>
                                                                Scheduled: <strong>{formatIST(new Date(t.publish_start))}</strong> to <strong>{formatIST(new Date(t.publish_end))}</strong>
                                                            </span>
                                                        )}
                                                        {status === "LIVE" && (
                                                            <span className="text-red-700 font-semibold">
                                                                Exam Ends at {formatIST(new Date(t.publish_end))} IST
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex lg:flex-col flex-wrap items-stretch lg:items-end justify-start lg:justify-center gap-2.5 lg:min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6">

                                            <button
                                                onClick={() => fetchTestAssignments(t.test_id)}
                                                className="btn-action flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all"
                                            >
                                                {status === "IDLE" ? "Assign & Schedule" : "Edit Assignments"} <FaLayerGroup />
                                            </button>

                                            <button
                                                onClick={() => navigate(`/placementtraining/tests/${t.test_id}/questions`)}
                                                disabled={lockQuestions}
                                                className={`btn-action flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all
                        ${lockQuestions
                                                        ? "text-slate-300 cursor-not-allowed bg-slate-50"
                                                        : "text-slate-600 hover:text-purple-700 hover:bg-purple-50"}`}
                                            >
                                                Manage Questions <FaClipboardList />
                                            </button>

                                            {status === "IDLE" && (
                                                <button
                                                    onClick={() => openEditTest(t)}
                                                    className="btn-action flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
                                                >
                                                    Edit Details
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteTest(t)}
                                                className="btn-action flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-all"
                                            >
                                                Delete Test
                                            </button>

                                            <button
                                                onClick={() => openNotifyModal(t)}
                                                className="btn-action flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all"
                                            >
                                                Manage Notifications <FaBullhorn />
                                            </button>

                                            <button
                                                onClick={() => navigate(`/placementtraining/results`)}
                                               // onClick={() => navigate(`/placementtraining/trainer-results/${t.test_id}`)}
                                                className="btn-action flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-semibold text-slate-600 hover:text-sky-700 hover:bg-sky-50 px-4 py-2 rounded-lg transition-all"
                                            >
                                                View Results <FaEye />
                                            </button>

                                            {/* Primary Action Button */}
                                            <div className="w-full h-px bg-slate-100 my-1 hidden lg:block"></div>

                                            {status === "IDLE" && (
                                                <button
                                                    onClick={() => updateTestStatus(t, "publish_now")}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 px-4 py-2.5 rounded-lg transition-all shadow-sm"
                                                >
                                                    Publish Now <FaBullhorn />
                                                </button>
                                            )}

                                            {status === "SCHEDULED" && (
                                                <button
                                                    onClick={() => confirmCancelSchedule(t)}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 px-4 py-2.5 rounded-lg transition-all shadow-sm"
                                                >
                                                    Cancel Schedule <FaCalendarTimes />
                                                </button>
                                            )}

                                            {status === "LIVE" && (
                                                <button
                                                    onClick={() => updateTestStatus(t, "stop")}
                                                    className="w-full flex items-center justify-center lg:justify-end gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-800 px-4 py-2.5 rounded-lg transition-all shadow-sm animate-pulse"
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

                {/* --- Create / Edit Test Modal --- */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute absolute inset-x-0 bottom-0 -top-8 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowModal(false)}
                        />
                        <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
                            {/* Modal Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800">
                                    {editingTest ? "Edit Test Details" : "Create New Test"}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <FaTimesCircle size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Test Title
                                    </label>
                                    <input
                                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                                        placeholder="e.g. Aptitude Final Assessment"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Duration (Mins)
                                        </label>
                                        <input
                                            type="number"
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                            value={form.duration_minutes}
                                            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Max Attempts
                                        </label>
                                        <input
                                            type="number"
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                            value={form.max_attempts}
                                            onChange={(e) => setForm({ ...form, max_attempts: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Total Marks
                                        </label>
                                        <input
                                            type="number"
                                            disabled
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                            value={form.total_marks}
                                            onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Pass Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                            value={form.pass_mark}
                                            onChange={(e) => setForm({ ...form, pass_mark: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTest}
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {submitting && <FaSpinner className="animate-spin" />}
                                    {editingTest ? "Update Test" : "Create Test"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Assign & Schedule Modal --- */}
                {assignTest.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute absolute inset-x-0 bottom-0 -top-8 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setAssignTest({ open: false, testId: null })}
                        />

                        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeInUp flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="px-8 py-6 bg-slate-900 flex items-center justify-between shrink-0">
                                <div className="text-white">
                                    <h2 className="text-white font-bold flex items-center gap-3">
                                        <FaLayerGroup className="text-grey-100" /> Assign & Schedule Test
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">Select audience and set availability window</p>
                                </div>
                                <button
                                    onClick={() => setAssignTest({ open: false, testId: null })}
                                    className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                >
                                    <FaTimesCircle size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">

                                {/* Section 1: Audience */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <FaUsers className="text-indigo-500" /> Target Audience
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Departments */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold uppercase text-slate-500">Departments</span>
                                                <button
                                                    onClick={toggleAllDepts}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    {assignForm.dept_ids.length === Object.keys(DEPT_MAP).length ? "Clear All" : "Select All"}
                                                </button>
                                            </div>
                                            <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[200px] custom-scrollbar">
                                                {Object.entries(DEPT_MAP).map(([id, name]) => (
                                                    <label key={id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all group">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                            checked={assignForm.dept_ids.includes(Number(id))}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setAssignForm((prev) => ({
                                                                    ...prev,
                                                                    dept_ids: checked
                                                                        ? [...prev.dept_ids, Number(id)]
                                                                        : prev.dept_ids.filter((d) => d !== Number(id)),
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Classes */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold uppercase text-slate-500">Years / Classes</span>
                                                <button
                                                    onClick={toggleAllClasses}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    {assignForm.class_ids.length === Object.keys(CLASS_MAP).length ? "Clear All" : "Select All"}
                                                </button>
                                            </div>
                                            <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[200px] custom-scrollbar">
                                                {Object.entries(CLASS_MAP).map(([id, name]) => (
                                                    <label key={id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all group">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                            checked={assignForm.class_ids.includes(Number(id))}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setAssignForm((prev) => ({
                                                                    ...prev,
                                                                    class_ids: checked
                                                                        ? [...prev.class_ids, Number(id)]
                                                                        : prev.class_ids.filter((c) => c !== Number(id)),
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Schedule */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <FaCalendarAlt className="text-indigo-500" /> Availability Window
                                    </h3>

                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Starts At</label>
                                                <input
                                                    type="datetime-local"
                                                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                    min={toLocalDateTimeInput(now())}
                                                    value={assignForm.publish_start || ""}
                                                    onChange={(e) => setAssignForm({ ...assignForm, publish_start: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Ends At</label>
                                                <input
                                                    type="datetime-local"
                                                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                    min={toLocalDateTimeInput(now())}
                                                    value={assignForm.publish_end || ""}
                                                    onChange={(e) => setAssignForm({ ...assignForm, publish_end: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <span className="text-xs font-bold text-slate-500 uppercase mr-3">Quick Duration Add:</span>
                                            <div className="inline-flex flex-wrap gap-2">
                                                {[1, 2, 3, 24].map((h) => (
                                                    <button
                                                        key={h}
                                                        onClick={() => handleDurationSelect(h)}
                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                                                    >
                                                        +{h} Hour{h > 1 ? 's' : ''}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-4 shrink-0">
                                <button
                                    onClick={() => setAssignTest({ open: false, testId: null })}
                                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitTestAssignment}
                                    disabled={submitting}
                                    className="px-8 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-300 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                    Confirm Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <NotifyModal
                open={notifyModal.open}
                test={notifyModal.test}
                onClose={() => setNotifyModal({ open: false, test: null })}
            />


            <style>{`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-fadeInUp {
      animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
  `}</style>
        </div>



    );
}