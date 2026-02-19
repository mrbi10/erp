import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Select from "react-select"; // npm install react-select
import { motion, AnimatePresence } from "framer-motion"; // npm install framer-motion
import {
    FaSearch,
    FaFilter,
    FaColumns,
    FaList,
    FaSync,
    FaCheckCircle,
    FaSpinner,
    FaExclamationTriangle,
    FaClock,
    FaTimesCircle,
    FaPaperPlane,
    FaExpand,
    FaTimes,
    FaCalendarAlt,
    FaUser,
    FaTag
} from "react-icons/fa";

import { BASE_URL } from "../../constants/API";

// --- CONSTANTS & CONFIGURATION ---

const VIEWS = {
    KANBAN: "kanban",
    LIST: "list"
};

const STATUS_CONFIG = {
    OPEN: {
        label: "Open",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: <FaExclamationTriangle />,
        description: "Tickets awaiting initial review"
    },
    IN_PROGRESS: {
        label: "In Progress",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: <FaClock />,
        description: "Currently being worked on"
    },
    RESOLVED: {
        label: "Resolved",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: <FaCheckCircle />,
        description: "Issue fixed, awaiting closure"
    },
    CLOSED: {
        label: "Closed",
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        icon: <FaTimesCircle />,
        description: "Archived tickets"
    }
};

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
        fontSize: '0.875rem'
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : 'white',
        color: state.isSelected ? 'white' : '#1e293b',
        cursor: 'pointer',
        fontSize: '0.875rem'
    })
};

// --- SUB-COMPONENT: SKELETON LOADER ---
const SkeletonBoard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 h-96 rounded-xl p-4 space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-white rounded-lg shadow-sm"></div>
                <div className="h-24 bg-white rounded-lg shadow-sm"></div>
            </div>
        ))}
    </div>
);

// --- MAIN COMPONENT ---

export default function ManageTicket() {
    const token = localStorage.getItem("token");

    // --- STATE MANAGEMENT ---
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState(VIEWS.KANBAN);

    // Filtering State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterModule, setFilterModule] = useState(null);
    const [filterPriority, setFilterPriority] = useState(null);

    // Inspector Panel State (The Ticket currently being edited)
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [resolutionNote, setResolutionNote] = useState("");
    const [updatingId, setUpdatingId] = useState(null); // specific ID loading state

    // --- DATA FETCHING ---

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/support/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to load data");

            const data = await res.json();
            // Ensure tickets are sorted by newest first
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setTickets(sorted);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            Swal.fire("Error", "Could not load tickets. Please check connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // --- COMPUTED DATA (MEMO) ---

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch =
                t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(t.ticket_id).includes(searchQuery);

            const matchesModule = filterModule ? t.module === filterModule.value : true;
            const matchesPriority = filterPriority ? t.priority === filterPriority.value : true;

            return matchesSearch && matchesModule && matchesPriority;
        });
    }, [tickets, searchQuery, filterModule, filterPriority]);

    const stats = useMemo(() => {
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === "OPEN").length,
            critical: tickets.filter(t => t.priority === "Critical" && t.status !== "CLOSED").length,
            resolved: tickets.filter(t => t.status === "RESOLVED").length
        };
    }, [tickets]);

    const moduleOptions = useMemo(() => {
        const uniqueModules = [...new Set(tickets.map(t => t.module).filter(Boolean))];
        return uniqueModules.map(m => ({ value: m, label: m }));
    }, [tickets]);

    const priorityOptions = [
        { value: "Low", label: "Low Priority" },
        { value: "Medium", label: "Medium Priority" },
        { value: "High", label: "High Priority" },
        { value: "Critical", label: "Critical" }
    ];

    // --- ACTIONS ---

    const handleOpenInspector = (ticket) => {
        setSelectedTicket(ticket);
        setResolutionNote(ticket.resolution_notes || "");
    };

    const handleCloseInspector = () => {
        setSelectedTicket(null);
        setResolutionNote("");
    };

    const updateStatus = async (newStatus) => {
        if (!selectedTicket) return;

        // UX Guard: Require a note for Resolution
        if (newStatus === "RESOLVED" && resolutionNote.length < 5) {
            Swal.fire("Note Required", "Please add a resolution note before resolving the ticket.", "warning");
            return;
        }

        setUpdatingId(selectedTicket.ticket_id);

        try {
            const res = await fetch(`${BASE_URL}/support/${selectedTicket.ticket_id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    resolution_notes: resolutionNote
                })
            });

            if (!res.ok) throw new Error("Update failed");

            // Optimistic Update locally
            setTickets(prev => prev.map(t =>
                t.ticket_id === selectedTicket.ticket_id
                    ? { ...t, status: newStatus, resolution_notes: resolutionNote }
                    : t
            ));

            // Update the selected ticket view as well
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));

            Swal.fire({
                icon: 'success',
                title: 'Updated',
                text: `Ticket #${selectedTicket.ticket_id} moved to ${newStatus}`,
                timer: 1500,
                showConfirmButton: false
            });

            // If closed, maybe close inspector? Let's keep it open for review.

        } catch (err) {
            Swal.fire("Error", "Failed to update status", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    // --- RENDER HELPERS ---

    const renderFiles = (filesData) => {
        let files = [];
        try {
            files = typeof filesData === "string" ? JSON.parse(filesData) : (filesData || []);
        } catch (e) { files = []; }

        if (!files.length) return null;

        return (
            <div className="flex gap-2 flex-wrap mt-3">
                {files.filter(f => f?.file_path).map((f) => (
                    <div key={f.file_id} className="relative group overflow-hidden rounded-lg border border-slate-200 w-20 h-20">
                        <img
                            src={`${BASE_URL}/uploads/support/${f.file_path.split("/").pop()}`}
                            alt="attachment"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in"
                            onClick={() => window.open(`${BASE_URL}/uploads/support/${f.file_path.split("/").pop()}`, '_blank')}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 relative overflow-x-hidden">

            {/* HEADER SECTION */}
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Title & Stats */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ticket Management</h1>
                        <p className="text-slate-500 mt-1">Oversee, track, and resolve support requests.</p>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                        <StatPill label="Total" value={stats.total} color="bg-white border-slate-200 text-slate-700" />
                        <StatPill label="Open" value={stats.open} color="bg-blue-50 border-blue-200 text-blue-700" />
                        <StatPill label="Critical" value={stats.critical} color="bg-red-50 border-red-200 text-red-700" />
                        <StatPill label="Resolved" value={stats.resolved} color="bg-emerald-50 border-emerald-200 text-emerald-700" />
                    </div>
                </div>

                {/* TOOLBAR */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-10">

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search ID or Subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Filters */}
                        <div className="w-full md:w-48">
                            <Select
                                placeholder="Filter Module"
                                options={moduleOptions}
                                value={filterModule}
                                onChange={setFilterModule}
                                isClearable
                                styles={customSelectStyles}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                placeholder="Priority"
                                options={priorityOptions}
                                value={filterPriority}
                                onChange={setFilterPriority}
                                isClearable
                                styles={customSelectStyles}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                        <button
                            onClick={() => setViewMode(VIEWS.KANBAN)}
                            className={`p-2 rounded-lg transition-all ${viewMode === VIEWS.KANBAN ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Kanban Board"
                        >
                            <FaColumns />
                        </button>
                        <button
                            onClick={() => setViewMode(VIEWS.LIST)}
                            className={`p-2 rounded-lg transition-all ${viewMode === VIEWS.LIST ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <FaList />
                        </button>
                        <button
                            onClick={fetchTickets}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:rotate-180 transition-all duration-500"
                            title="Refresh Data"
                        >
                            <FaSync />
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                {loading ? (
                    <SkeletonBoard />
                ) : (
                    <div className="min-h-[600px]">
                        {viewMode === VIEWS.KANBAN ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                                {Object.keys(STATUS_CONFIG).map(statusKey => (
                                    <KanbanColumn
                                        key={statusKey}
                                        statusKey={statusKey}
                                        config={STATUS_CONFIG[statusKey]}
                                        tickets={filteredTickets.filter(t => t.status === statusKey)}
                                        onCardClick={handleOpenInspector}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                                        <tr>
                                            <th className="p-4">ID</th>
                                            <th className="p-4">Subject</th>
                                            <th className="p-4">Module</th>
                                            <th className="p-4">Priority</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTickets.map(ticket => (
                                            <tr
                                                key={ticket.ticket_id}
                                                onClick={() => handleOpenInspector(ticket)}
                                                className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                                            >
                                                <td className="p-4 font-mono text-slate-500">#{ticket.ticket_id}</td>
                                                <td className="p-4 font-medium text-slate-800">{ticket.subject}</td>
                                                <td className="p-4 text-slate-600">{ticket.module}</td>
                                                <td className="p-4">
                                                    <PriorityBadge priority={ticket.priority} />
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge status={ticket.status} />
                                                </td>
                                                <td className="p-4 text-right text-slate-500">
                                                    {new Date(ticket.created_at).toLocaleDateString("en-IN", { year: '2-digit', month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTickets.length === 0 && (
                                            <tr><td colSpan="6" className="p-8 text-center text-slate-400">No tickets found matching your filters.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* INSPECTOR SLIDE-OVER PANEL */}
            <AnimatePresence>
                {selectedTicket && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseInspector}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-mono text-xs text-slate-400 bg-white border px-2 py-0.5 rounded">#{selectedTicket.ticket_id}</span>
                                        <PriorityBadge priority={selectedTicket.priority} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 leading-snug">{selectedTicket.subject}</h2>
                                </div>
                                <button onClick={handleCloseInspector} className="text-slate-400 hover:text-slate-700 p-1">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="p-6 space-y-8 flex-1">

                                {/* Meta Grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Module</span>
                                        <div className="flex items-center gap-2 mt-1 text-slate-700 font-medium">
                                            <FaTag className="text-indigo-400" /> {selectedTicket.module || "General"}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Reported By</span>
                                        <div className="flex items-center gap-2 mt-1 text-slate-700 font-medium">
                                            <FaUser className="text-indigo-400" /> {selectedTicket.user_id || "User"}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Created</span>
                                        <div className="flex items-center gap-2 mt-1 text-slate-700 font-medium">
                                            <FaCalendarAlt className="text-indigo-400" />
                                            {new Date(selectedTicket.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Description */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Issue Description</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {selectedTicket.description}
                                    </p>
                                </div>

                                {/* Attachments */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Attachments</h3>
                                    {renderFiles(selectedTicket.files) || <span className="text-slate-400 text-sm italic">No attachments.</span>}
                                </div>

                                <hr className="border-slate-100" />

                                {/* Resolution Area */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <FaPaperPlane className="text-indigo-500" /> Resolution & Notes
                                    </h3>
                                    <textarea
                                        className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none transition-shadow"
                                        placeholder="Type internal notes or resolution details here..."
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0 z-10 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                    <span>Current Status: <strong className="uppercase">{selectedTicket.status}</strong></span>
                                    {updatingId && <span className="flex items-center gap-1 text-indigo-600"><FaSpinner className="animate-spin" /> Saving...</span>}
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Dynamic Buttons based on status workflow */}
                                    <ActionButton
                                        label="In Progress"
                                        color="bg-amber-100 text-amber-700 hover:bg-amber-200"
                                        onClick={() => updateStatus("IN_PROGRESS")}
                                        disabled={selectedTicket.status === "IN_PROGRESS"}
                                    />
                                    <ActionButton
                                        label="Resolve"
                                        color="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                        onClick={() => updateStatus("RESOLVED")}
                                        disabled={selectedTicket.status === "RESOLVED"}
                                    />
                                    <ActionButton
                                        label="Close"
                                        color="bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        onClick={() => updateStatus("CLOSED")}
                                        disabled={selectedTicket.status === "CLOSED"}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const KanbanColumn = ({ statusKey, config, tickets, onCardClick }) => (
    <div className="flex flex-col h-full">
        {/* Column Header */}
        <div className={`flex items-center justify-between p-3 rounded-t-xl border-t border-x ${config.bg} ${config.border}`}>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                <span className={config.text}>{config.icon}</span>
                {config.label}
            </div>
            <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-slate-600 shadow-sm">
                {tickets.length}
            </span>
        </div>

        {/* Column Body */}
        <div className="bg-slate-100/50 flex-1 p-3 rounded-b-xl border-x border-b border-slate-200 min-h-[500px] space-y-3">
            {tickets.map(ticket => (
                <motion.div
                    layoutId={ticket.ticket_id}
                    key={ticket.ticket_id}
                    onClick={() => onCardClick(ticket)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-[10px] text-slate-400 group-hover:text-indigo-500">#{ticket.ticket_id}</span>
                        <PriorityBadge priority={ticket.priority} size="xs" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 mb-2 line-clamp-2 leading-tight">
                        {ticket.subject}
                    </h4>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                        <span>{ticket.module}</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString("en-IN", { year: '2-digit', month: 'short', day: 'numeric' })}</span>
                    </div>
                </motion.div>
            ))}
            {tickets.length === 0 && (
                <div className="text-center py-10 opacity-40 text-xs">No tickets</div>
            )}
        </div>
    </div>
);

const StatPill = ({ label, value, color }) => (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border shadow-sm min-w-[140px] ${color}`}>
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
    </div>
);

const PriorityBadge = ({ priority, size = "sm" }) => {
    const styles = {
        Critical: "bg-red-100 text-red-700 border-red-200",
        High: "bg-orange-100 text-orange-700 border-orange-200",
        Medium: "bg-blue-100 text-blue-700 border-blue-200",
        Low: "bg-slate-100 text-slate-600 border-slate-200"
    };
    const color = styles[priority] || styles.Low;
    const padding = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

    return (
        <span className={`${color} ${padding} rounded border font-bold uppercase tracking-wide inline-block`}>
            {priority || "Low"}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const conf = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    return (
        <span className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-xs font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
            {conf.icon} {conf.label}
        </span>
    );
};

const ActionButton = ({ label, color, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all transform active:scale-95 ${color} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
    >
        {label}
    </button>
);