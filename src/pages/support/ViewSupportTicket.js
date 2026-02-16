import React, { useEffect, useState, useMemo } from "react";
import {
    FaSearch,
    FaFilter,
    FaTicketAlt,
    FaCheckCircle,
    FaExclamationCircle,
    FaClock,
    FaTimesCircle,
    FaPaperclip,
    FaExpand,
    FaTimes,
    FaSpinner,
    FaInbox
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // npm install framer-motion
import { useNavigate } from "react-router-dom";


import { BASE_URL } from "../../constants/API";

// --- UTILITY: STATUS CONFIGURATION ---
const STATUS_CONFIG = {
    OPEN: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <FaExclamationCircle />,
        label: "Open"
    },
    IN_PROGRESS: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <FaClock />,
        label: "In Progress"
    },
    RESOLVED: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <FaCheckCircle />,
        label: "Resolved"
    },
    CLOSED: {
        color: "bg-slate-100 text-slate-600 border-slate-200",
        icon: <FaTimesCircle />,
        label: "Closed"
    },
    DEFAULT: {
        color: "bg-gray-50 text-gray-600 border-gray-200",
        icon: <FaTicketAlt />,
        label: "Unknown"
    }
};

const getStatusStyle = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;

// --- COMPONENT: IMAGE MODAL ---
const ImageModal = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-red-400 text-3xl transition-colors"
                >
                    <FaTimes />
                </button>
                <img src={src} alt="Full Preview" className="rounded-lg shadow-2xl max-h-[85vh] object-contain bg-white" />
            </motion.div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function ViewSupportTicket({ user }) {
    const token = localStorage.getItem("token");

    // --- STATE ---
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // UI Interactions
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate();

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const endpoint = user.role === "Admin" ? "/support/all" : "/support/my";

                const res = await fetch(`${BASE_URL}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();
                // Sort by newest first
                const sortedData = Array.isArray(data)
                    ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    : [];

                setTickets(sortedData);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [user.role, token]);

    // --- COMPUTED DATA ---

    // 1. Filter Logic
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const matchesStatus = filterStatus === "ALL" || ticket.status === filterStatus;
            const matchesSearch =
                ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.ticket_id?.toString().includes(searchQuery) ||
                ticket.description?.toLowerCase().includes(searchQuery);

            return matchesStatus && matchesSearch;
        });
    }, [tickets, filterStatus, searchQuery]);

    // 2. Stats Logic
    const stats = useMemo(() => {
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === "OPEN").length,
            resolved: tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
            pending: tickets.filter(t => t.status === "IN_PROGRESS").length
        };
    }, [tickets]);

    // --- RENDER HELPERS ---

    const formatDate = (dateString) => {
        if (!dateString || typeof dateString !== "string") return "";

        const [datePart, timePartFull] = dateString.split("T");
        if (!datePart || !timePartFull) return dateString;

        const [year, month, day] = datePart.split("-");
        const timePart = timePartFull.split(".")[0];
        const [hour, minute] = timePart.split(":");

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year} ${hour}:${minute}`;
    };




    const parseFiles = (filesData) => {
        try {
            if (Array.isArray(filesData)) return filesData;
            if (typeof filesData === "string") return JSON.parse(filesData);
            return [];
        } catch (e) {
            return [];
        }
    };

    // --- RENDER ---

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <AnimatePresence>
                {selectedImage && <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER & STATS */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {user.role === "Admin" ? "Support Dashboard" : "My Support Tickets"}
                            </h1>
                            <p className="text-slate-500 mt-1">
                                {user.role === "Admin" ? "Manage and resolve incoming inquiries" : "Track the status of your requests"}
                            </p>
                        </div>
                        {/* Quick Action (Optional) */}
                        {user.role !== "Admin" && (
                            <button
                                onClick={() => navigate("/support/raise")}
                                className="hidden md:block px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
                            >
                                + New Ticket
                            </button>
                        )}

                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Tickets" value={stats.total} icon={<FaInbox />} color="bg-white border-slate-200 text-slate-700" />
                        <StatCard label="Open" value={stats.open} icon={<FaExclamationCircle />} color="bg-blue-50 border-blue-100 text-blue-600" />
                        <StatCard label="In Progress" value={stats.pending} icon={<FaClock />} color="bg-amber-50 border-amber-100 text-amber-600" />
                        <StatCard label="Resolved" value={stats.resolved} icon={<FaCheckCircle />} color="bg-emerald-50 border-emerald-100 text-emerald-600" />
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-20">

                    {/* Search */}
                    <div className="relative w-full md:max-w-md">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Subject, or content..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`
                  px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                  ${filterStatus === status
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}
                `}
                            >
                                {status.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TICKET LIST */}
                <div className="space-y-4 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <FaSpinner className="animate-spin text-4xl mb-4 text-indigo-500" />
                            <p>Loading tickets...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                            <FaInbox className="text-6xl mb-4 text-slate-200" />
                            <h3 className="text-lg font-semibold text-slate-600">No tickets found</h3>
                            <p className="text-sm">Try adjusting your filters or search query.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredTickets.map((ticket) => {
                                const files = parseFiles(ticket.files);
                                const statusStyle = getStatusStyle(ticket.status);

                                return (
                                    <motion.div
                                        key={ticket.ticket_id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                    >
                                        <div className="p-5 md:p-6 grid md:grid-cols-12 gap-6">

                                            {/* Left: Info */}
                                            <div className="md:col-span-8 lg:col-span-9 space-y-3">
                                                <div className="flex items-start justify-between md:justify-start md:items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${statusStyle.color}`}>
                                                        {statusStyle.icon}
                                                        {statusStyle.label}
                                                    </span>
                                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                        #{ticket.ticket_id}
                                                    </span>
                                                    {/* Priority Badge (If applicable based on your Raise Ticket form) */}
                                                    {ticket.priority && (
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border 
                                ${ticket.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                ticket.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                    'bg-blue-50 text-blue-600 border-blue-100'}
                             `}>
                                                            {ticket.priority}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">
                                                        {ticket.subject}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                                        <span>Module: <strong className="text-slate-600">{ticket.module || "General"}</strong></span>
                                                        <span>•</span>
                                                        <span>{formatDate(ticket.created_at)}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed">
                                                        {ticket.description}
                                                    </p>
                                                </div>

                                                {/* Attachments */}
                                                {files.length > 0 && (
                                                    <div className="flex flex-wrap gap-3 mt-4">
                                                        {files.filter(f => f && f.file_path).map((file) => {
                                                            const fileName = file.file_path.split("/").pop();
                                                            const fileUrl = `${BASE_URL}/uploads/support/${fileName}`;

                                                            return (
                                                                <div
                                                                    key={file.file_id}
                                                                    onClick={() => setSelectedImage(fileUrl)}
                                                                    className="group relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in bg-slate-50"
                                                                >
                                                                    <img
                                                                        src={fileUrl}
                                                                        alt="attachment"
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                        <FaExpand className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Resolution / Meta */}
                                            <div className="md:col-span-4 lg:col-span-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">

                                                <div className="space-y-4">
                                                    {ticket.resolution_notes ? (
                                                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                <FaCheckCircle /> Resolution
                                                            </h4>
                                                            <p className="text-sm text-slate-700">
                                                                {ticket.resolution_notes}
                                                            </p>
                                                            {ticket.resolved_at && (
                                                                <p className="text-[10px] text-emerald-600 mt-2 text-right">
                                                                    {formatDate(ticket.resolved_at)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                                                            <p className="text-xs text-slate-400 font-medium italic">
                                                                No resolution provided yet.
                                                                <br />
                                                                Support team is reviewing.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {user.role === "Admin" && (
                                                    <div className="mt-4 flex justify-end">
                                                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                            Manage Ticket &rarr;
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>

                                        {/* Footer Strip (Optional for extra styling) */}
                                        <div className={`h-1 w-full ${statusStyle.color.split(' ')[0].replace('bg-', 'bg-gradient-to-r from-white to-')}`}></div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENT: STAT CARD ---
const StatCard = ({ label, value, icon, color }) => (
    <div className={`p-4 rounded-2xl border flex flex-col items-center md:items-start justify-between gap-2 shadow-sm ${color}`}>
        <div className="flex items-center justify-between w-full">
            <span className="text-2xl md:text-3xl font-bold">{value}</span>
            <span className="opacity-80 text-xl">{icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
    </div>
);