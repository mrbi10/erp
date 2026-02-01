import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaBriefcase,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaSearch,
    FaFilter,
    FaCalendarAlt,
    FaFileAlt,
    FaDownload,
    FaLayerGroup,
    FaSpinner,
    FaFolderOpen
} from "react-icons/fa";
import { BASE_URL } from "../../constants/API";

// ---------------------------
// Constants & Config
// ---------------------------

const STATUS_CONFIG = {
    VERIFIED: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        icon: FaCheckCircle,
        label: "Verified"
    },
    REJECTED: {
        bg: "bg-red-50",
        text: "text-red-600",
        border: "border-red-100",
        icon: FaTimesCircle,
        label: "Rejected"
    },
    PENDING: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        icon: FaClock,
        label: "Pending Review"
    }
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

// ---------------------------
// Components
// ---------------------------

// 1. Insight Pill (Consistent with Dashboard)
const InsightPill = ({ label, count, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1 }}
        className="bg-white px-5 py-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4 min-w-[180px] hover:shadow-lg transition-all duration-300"
    >
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split("-")[1]}-600`}>
            <Icon className="text-xl" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                {label}
            </p>
            <p className="text-xl font-extrabold text-slate-800">{count}</p>
        </div>
    </motion.div>
);

// 2. Activity Card (The main item view)
const ActivityCard = ({ activity, index }) => {
    const status = STATUS_CONFIG[activity.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = status.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 flex flex-col h-full"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-gray-50 text-xs font-bold text-gray-500 border border-gray-100 uppercase tracking-wide">
                        {activity.activity_type}
                    </span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.text} ${status.border}`}>
                    <StatusIcon />
                    <span>{status.label}</span>
                </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                {activity.title}
            </h3>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-4">
                <FaCalendarAlt />
                <span>{formatDate(activity.start_date)}</span>
                <span className="text-gray-300">•</span>
                <span>{formatDate(activity.end_date)}</span>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-6 flex-grow">
                {activity.description || "No description provided."}
            </p>

            {activity.status === "REJECTED" && activity.remarks && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
                    <strong>Remarks:</strong> {activity.remarks}
                </div>
            )}

            {/* Footer / Files */}
            <div className="pt-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <FaFileAlt /> Evidence
                </p>

                {activity.files && activity.files.length > 0 ? (
                    <div className="space-y-2">
                        {activity.files
                            .filter(Boolean)
                            .map((file) => (
                                <a
                                    key={file.file_id}
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-colors group/file text-decoration-none"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                            <FaFileAlt className="text-xs" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 truncate group-hover/file:text-blue-700">
                                            {file.file_type || "Document"}
                                        </span>
                                    </div>
                                    <FaDownload className="text-gray-300 text-xs group-hover/file:text-blue-500" />
                                </a>
                            ))}
                    </div>
                ) : (
                    <div className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded-lg text-center">
                        No files attached
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// 3. Skeleton Loader
const SkeletonCard = () => (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 h-80 animate-pulse">
        <div className="flex justify-between mb-4">
            <div className="w-20 h-6 bg-gray-100 rounded-lg"></div>
            <div className="w-24 h-6 bg-gray-100 rounded-full"></div>
        </div>
        <div className="w-3/4 h-8 bg-gray-100 rounded-xl mb-3"></div>
        <div className="w-1/2 h-4 bg-gray-100 rounded mb-6"></div>
        <div className="space-y-2 mb-8">
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
        </div>
        <div className="h-16 bg-gray-50 rounded-xl"></div>
    </div>
);

// ---------------------------
// Main Component
// ---------------------------

export default function ProfileHubActivities() {
    // State
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const token = localStorage.getItem("token");

    /* ================= FETCH ================= */

    useEffect(() => {
        fetchActivities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${BASE_URL}/profilehub/my-activities`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setActivities(res.data);

        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setLoading(false), 600);
        }
    };



    /* ================= COMPUTED ================= */

    const stats = useMemo(() => ({
        total: activities.length,
        verified: activities.filter(a => a.status === "VERIFIED").length,
        pending: activities.filter(a => !["VERIFIED", "REJECTED"].includes(a.status)).length,
    }), [activities]);

    const filteredData = useMemo(() => {
        return activities.filter(item => {
            // Status Filter
            const matchStatus =
                filterStatus === "ALL" ? true :
                    filterStatus === "PENDING" ? (item.status !== "VERIFIED" && item.status !== "REJECTED") :
                        item.status === filterStatus;

            // Search Filter
            const query = searchQuery.toLowerCase();
            const matchSearch =
                !query ||
                item.title?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.activity_type?.toLowerCase().includes(query);

            return matchStatus && matchSearch;
        });
    }, [activities, filterStatus, searchQuery]);

    /* ================= RENDER ================= */

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                <FaLayerGroup className="text-xl" />
                            </span>
                            My Portfolio
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium ml-1">
                            Track your certifications, events, and achievements
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.href = '#/profilehub/add'}
                        className="group flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <FaFolderOpen className="text-sm" />
                        <span>Submit Activity</span>
                    </button>
                </div>

                {/* --- STATS PILLS --- */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <InsightPill
                        label="Total Entries"
                        count={stats.total}
                        icon={FaBriefcase}
                        color="bg-blue-50 text-blue-600"
                        delay={0}
                    />
                    <InsightPill
                        label="Verified"
                        count={stats.verified}
                        icon={FaCheckCircle}
                        color="bg-emerald-50 text-emerald-600"
                        delay={1}
                    />
                    <InsightPill
                        label="Pending"
                        count={stats.pending}
                        icon={FaClock}
                        color="bg-amber-50 text-amber-600"
                        delay={2}
                    />
                </div>

                {/* --- FILTERS & TOOLBAR --- */}
                <div className="bg-white rounded-2xl p-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col md:flex-row gap-4 items-center z-20 relative sticky top-4 backdrop-blur-xl bg-white/90">

                    {/* Status Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl shrink-0">
                        {[
                            { id: "ALL", label: "All" },
                            { id: "VERIFIED", label: "Verified" },
                            { id: "PENDING", label: "Pending" },
                            { id: "REJECTED", label: "Rejected" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`
                  px-5 py-2.5 rounded-lg text-sm font-bold transition-all
                  ${filterStatus === tab.id
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                    }
                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                    {/* Search Bar */}
                    <div className="relative w-full">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-gray-400"
                        />
                    </div>

                    <div className="pr-4 hidden md:block">
                        <FaFilter className="text-gray-300" />
                    </div>
                </div>

                {/* --- GRID LAYOUT --- */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredData.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-20 text-center flex flex-col items-center bg-white rounded-3xl border border-dashed border-gray-200"
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <FaSearch className="text-3xl text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No activities found</h3>
                        <p className="text-gray-400 mt-1 max-w-sm">
                            Try adjusting your filters or search query, or add a new activity to get started.
                        </p>
                        {filterStatus !== "ALL" && (
                            <button
                                onClick={() => { setFilterStatus("ALL"); setSearchQuery(""); }}
                                className="mt-6 text-blue-600 font-bold hover:underline"
                            >
                                Clear Filters
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {filteredData.map((activity, index) => (
                                <ActivityCard
                                    key={activity.activity_id}
                                    activity={activity}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

            </div>
        </div>
    );
}