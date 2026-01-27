import React, { useEffect, useState } from "react";
import {
    FaTimes,
    FaBell,
    FaEnvelope,
    FaClock,
    FaSave,
    FaPaperPlane,
    FaCog,
    FaUsers,
    FaCheckCircle,
    FaInfoCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BASE_URL } from "../constants/API";
import { DEPT_MAP, CLASS_MAP } from "../constants/deptClass";

// Simple Tab Component for cleaner navigation
const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors border-b-2 ${active
            ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
    >
        <Icon /> {label}
    </button>
);

export default function NotifyModal({ open, test, onClose }) {
    const [activeTab, setActiveTab] = useState("settings");
    const [loading, setLoading] = useState(false);
    const [dirty, setDirty] = useState(false);


    // Data States
    const [settings, setSettings] = useState({
        events: { ASSIGNED: true, PUBLISHED: true, REMINDER: false, RESULT: true },
        channels: { EMAIL: true, PORTAL: true },
        reminder_hours_before: 24,
    });

    const [recipients, setRecipients] = useState({
        loading: false,
        loaded: false,
        count: 0,
        groups: [],
        search: "",
        expandedKey: null,
    });

    // Load Settings on Open
    useEffect(() => {
        if (!open || !test) return;
        loadSettings();
        // Reset tabs
        setActiveTab("settings");
    }, [open, test]);

    // Load Recipients only when needed (Audience tab or Manual tab)
    useEffect(() => {
        if ((activeTab === 'audience' || activeTab === 'manual') && !recipients.loaded && open) {
            loadRecipients();
        }
    }, [activeTab, open]);

    const loadSettings = async () => {
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}/notifications`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.settings) setSettings(data.settings);
            }
        } catch (err) { console.error(err); }
    };

    const loadRecipients = async () => {
        setRecipients(p => ({ ...p, loading: true }));
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}/assignments`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            const data = await res.json();
            setRecipients({
                loading: false,
                loaded: true,
                count: data.stats?.with_email || 0,
                groups: data.groups || [],
                search: "",
                expandedKey: null
            });
        } catch {
            setRecipients(p => ({ ...p, loading: false }));
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}/notifications`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(settings),
                }
            );
            if (!res.ok) throw new Error();
            Swal.fire({
                icon: 'success',
                title: 'Settings Saved',
                text: 'Automatic notification rules have been updated.',
                timer: 1500,
                showConfirmButton: false
            });
            setDirty(false);
        } catch {
            Swal.fire("Error", "Failed to save settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const sendManual = async (type) => {
        // We ensure recipients are loaded to show the count in the alert
        if (!recipients.loaded) await loadRecipients();

        const confirm = await Swal.fire({
            title: `Send ${type} Blast?`,
            html: `
        <div class="text-left bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p class="mb-2">You are about to send a <b>manual notification</b>.</p>
          <ul class="list-disc pl-4 text-sm text-slate-600">
            <li>Target: <b>${recipients.count} students</b></li>
            <li>Channel: <b>Email & Portal</b></li>
          </ul>
        </div>
      `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5", // Indigo
            confirmButtonText: "Yes, Send Now",
            cancelButtonText: "Cancel"
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(
                `${BASE_URL}/placement-training/tests/${test.test_id}/notifications/send`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    // Important: We send the type. The backend should handle the logic independent of "Settings"
                    body: JSON.stringify({ type }),
                }
            );
            if (!res.ok) throw new Error();
            Swal.fire("Sent", "Notification blast initiated successfully", "success");
        } catch {
            Swal.fire("Error", "Failed to send notification", "error");
        }
    };

    if (!open || !test) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeInUp">

                {/* Header */}
                <div className="px-6 py-5 border-b bg-white flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Notification Manager</h2>
                        <p className="text-sm text-slate-500 mt-1">{test.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b bg-white sticky top-0 z-10">
                    <TabButton
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                        icon={FaCog}
                        label={
                            <span className="flex items-center gap-2">
                                Auto-Rules
                                {dirty && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                            </span>
                        }
                    />
                    <TabButton
                        active={activeTab === 'manual'}
                        onClick={() => setActiveTab('manual')}
                        icon={FaPaperPlane}
                        label="Manual Broadcast"
                    />
                    <TabButton
                        active={activeTab === 'audience'}
                        onClick={() => setActiveTab('audience')}
                        icon={FaUsers}
                        label={`Audience (${recipients.count})`}
                    />
                </div>

                {/* Body Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

                    {/* TAB 1: SETTINGS */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                                <FaInfoCircle className="text-blue-500 mt-1 shrink-0" />
                                <p className="text-sm text-blue-700">
                                    These settings control <b>automatic</b> emails triggered by system events.
                                    Remember to save changes.
                                </p>
                            </div>

                            {/* Events */}
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Automatic Triggers</h3>
                                <div className="space-y-3">
                                    {Object.entries(settings.events).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:border-indigo-200 transition">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${value ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <FaBell />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700">{key.replace("_", " ")}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {key === 'ASSIGNED' && "When test is assigned to students"}
                                                        {key === 'PUBLISHED' && "When test is made live"}
                                                        {key === 'RESULT' && "When results are declared"}
                                                        {key === 'REMINDER' && "Before the test starts"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Toggle Switch */}
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={value}
                                                    onChange={() => {
                                                        setDirty(true);
                                                        setSettings(p => ({
                                                            ...p,
                                                            events: { ...p.events, [key]: !value }
                                                        }));
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Channels */}
                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Delivery Channels</h3>
                                <div className="flex gap-4">
                                    {['EMAIL', 'PORTAL'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSettings(p => ({ ...p, channels: { ...p.channels, [type]: !p.channels[type] } }))}
                                            className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${settings.channels[type]
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {type === 'EMAIL' ? <FaEnvelope /> : <FaBell />} {type}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Reminder Specific */}
                            {settings.events.REMINDER && (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-4 animate-fadeIn">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FaClock /></div>
                                    <div className="flex-1">
                                        <label className="text-sm font-semibold text-slate-700 block mb-1">Send Reminder</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min="1" max="72"
                                                value={settings.reminder_hours_before}
                                                onChange={(e) => setSettings({ ...settings, reminder_hours_before: parseInt(e.target.value) })}
                                                className="w-20 px-2 py-1 border rounded text-center font-bold text-slate-700"
                                            />
                                            <span className="text-sm text-slate-500">hours before test start</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: MANUAL BROADCAST */}
                    {activeTab === 'manual' && (
                        <div className="flex flex-col h-full justify-center space-y-8 py-4">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaPaperPlane size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Manual Broadcast</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Manually trigger notifications immediately. This ignores your "Auto-Rules" settings and sends a one-time blast.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => sendManual("ASSIGNED")}
                                    className="p-6 bg-white border-2 border-slate-100 hover:border-indigo-500 hover:shadow-lg rounded-2xl transition group text-left"
                                >
                                    <span className="font-bold text-slate-700 group-hover:text-indigo-600 block mb-1">Assignment Alert</span>
                                    <span className="text-xs text-slate-500 block">"You have been assigned a new test..."</span>
                                </button>

                                <button
                                    onClick={() => sendManual("RESULT")}
                                    className="p-6 bg-white border-2 border-slate-100 hover:border-indigo-500 hover:shadow-lg rounded-2xl transition group text-left"
                                >
                                    <span className="font-bold text-slate-700 group-hover:text-indigo-600 block mb-1">Result Declaration</span>
                                    <span className="text-xs text-slate-500 block">"Your results are now available..."</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: AUDIENCE */}
                    {activeTab === 'audience' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase text-slate-500">Target Audience</h3>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                    {recipients.count} Students
                                </span>
                            </div>

                            <input
                                type="text"
                                placeholder="Search students..."
                                value={recipients.search}
                                onChange={(e) => setRecipients(p => ({ ...p, search: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />

                            <div className="space-y-2">
                                {recipients.loading ? (
                                    <div className="text-center py-8 text-slate-400">Loading student data...</div>
                                ) : (
                                    recipients.groups.map((g) => {
                                        const key = `${g.dept_id}_${g.class_id}`;
                                        const isExpanded = recipients.expandedKey === key;
                                        return (
                                            <div key={key} className="bg-white border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => setRecipients(p => ({ ...p, expandedKey: isExpanded ? null : key }))}
                                                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50"
                                                >
                                                    <span className="font-semibold text-slate-700 text-sm">
                                                        {DEPT_MAP[g.dept_id]} • {CLASS_MAP[g.class_id]}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{g.count}</span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t max-h-48 overflow-y-auto bg-slate-50 p-2">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-slate-400 font-medium">
                                                                <tr><th className="p-2">Name</th><th className="p-2">Email</th></tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200">
                                                                {g.students
                                                                    .filter(s => s.name.toLowerCase().includes(recipients.search.toLowerCase()))
                                                                    .map((s, i) => (
                                                                        <tr key={i}>
                                                                            <td className="p-2 text-slate-700">{s.name}</td>
                                                                            <td className="p-2 text-slate-500">{s.email || "-"}</td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'settings' && (
                    <div className="p-4 border-t bg-white flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg text-sm">
                            Cancel
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={loading}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-lg shadow-slate-300 hover:shadow-slate-400 hover:-translate-y-0.5 transition flex items-center gap-2"
                        >
                            {loading ? "Saving..." : <><FaSave /> Save Rules</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}