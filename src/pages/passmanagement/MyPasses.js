import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import { QRCodeCanvas } from "qrcode.react";
import { FaBus, FaUtensils, FaTicketAlt, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { DEPT_MAP, CLASS_MAP } from "../../constants/deptClass";


// --- Utility: Format Date nicely ---
const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

// --- Utility: Get only the latest pass of each type ---
const getLatestPasses = (allPasses) => {
    const passMap = {};
    allPasses.forEach((pass) => {
        const type = pass.pass_type;
        if (!passMap[type]) {
            passMap[type] = pass;
        } else {
            // Compare dates and keep the one that expires furthest in the future
            const currentPassDate = new Date(pass.valid_till);
            const storedPassDate = new Date(passMap[type].valid_till);
            if (currentPassDate > storedPassDate) {
                passMap[type] = pass;
            }
        }
    });
    // Return as an array
    return Object.values(passMap);
};

export default function MyPasses() {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPass, setSelectedPass] = useState(null);

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        try {
            const res = await fetch(`${BASE_URL}/studentPass`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error("Failed to fetch passes");
            const data = await res.json();

            // Filter to only show the most recent/valid passes
            const latestPasses = getLatestPasses(data);
            setPasses(latestPasses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingView />;
    if (!passes.length) return <EmptyView />;

    return (
        <div className="p-4 min-h-screen bg-slate-50 flex flex-col items-center">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6 self-start md:self-center tracking-tight">
                My Digital Wallet
            </h1>

            <div className="w-full max-w-md space-y-5">
                {passes.map((pass) => (
                    <TicketCard
                        key={pass.id}
                        pass={pass}
                        onClick={() => setSelectedPass(pass)}
                    />
                ))}
            </div>

            {selectedPass && (
                <FullscreenPass
                    pass={selectedPass}
                    onClose={() => setSelectedPass(null)}
                />
            )}
        </div>
    );
}

// --- Sub-Component: The Ticket Card (List View) ---
const TicketCard = ({ pass, onClick }) => {
    const isBus = pass.pass_type === "bus";
    const isActive = pass.is_valid === 1;

    // Unified Blue Theme
    const bgTheme = isBus
        ? "bg-gradient-to-br from-indigo-700 to-blue-600" // Deep Blue for Bus
        : "bg-gradient-to-br from-blue-500 to-cyan-400"; // Bright Blue/Cyan for Mess

    const icon = isBus ? <FaBus className="text-white/90 text-4xl" /> : <FaUtensils className="text-white/90 text-3xl" />;

    return (
        <div
            onClick={onClick}
            className={`relative w-full rounded-2xl shadow-lg overflow-hidden transform transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${bgTheme}`}
        >
            {/* Ticket Notches */}
            <div className="absolute -left-4 top-1/2 w-8 h-8 bg-slate-50 rounded-full transform -translate-y-1/2 z-10 shadow-inner"></div>
            <div className="absolute -right-4 top-1/2 w-8 h-8 bg-slate-50 rounded-full transform -translate-y-1/2 z-10 shadow-inner"></div>

            <div className="p-5 flex justify-between items-center text-white relative z-0">
                {/* Left Side: Info */}
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
                        {isBus ? "Transport" : "Daily Meal Access"}
                    </span>
                    <h2 className="text-2xl text-white font-black tracking-tight mb-2 drop-shadow-sm">
                        {isBus ? "Bus Pass" : "Jain Mess"}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-medium bg-black/15 px-3 py-1.5 rounded-full w-fit backdrop-blur-sm">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-400'}`}></div>
                        {pass.is_valid ? "Active Pass" : pass.is_expired ? "Expired" : "Revoked"}
                    </div>
                </div>

                {/* Right Side: Icon & Dates */}
                <div className="flex flex-col items-end gap-3 mr-2">
                    <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md shadow-sm">
                        {icon}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Valid Till</p>
                        <p className="text-sm font-bold font-mono tracking-tight">{formatDate(pass.valid_till)}</p>
                    </div>
                </div>
            </div>

            {/* Dashed Separator */}
            <div className="border-t-[2px] border-dashed border-white/25 mx-6"></div>

            {/* Bottom Strip */}
            <div className="px-6 py-3 flex justify-between items-center bg-black/10 text-white/90 text-xs font-medium">
                <span className="font-mono tracking-widest">ID:{pass.id.toString().padStart(5, '0')}</span>
                <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Tap to scan <span className="text-lg leading-none">&rsaquo;</span>
                </span>
            </div>
        </div>
    );
};

// --- Sub-Component: Fullscreen Modal ---
const FullscreenPass = ({ pass, onClose }) => {
    const isBus = pass.pass_type === "bus";
    const bgTheme = isBus
        ? "bg-gradient-to-br from-indigo-800 to-blue-700"
        : "bg-gradient-to-br from-blue-600 to-cyan-500";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            {/* Background Click to Close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* The Big Pass */}
            <div className={`relative w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ${bgTheme} animate-in zoom-in-95 duration-200`}>

                {/* Header */}
                <div className="p-6 pb-8 flex justify-between items-start text-white">
                    <div>
                        <h2 className="text-3xl text-white font-black uppercase tracking-tighter drop-shadow-sm">
                            {isBus ? "BUS PASS" : "JAIN MESS"}
                        </h2>
                        <p className="text-white/80 text-sm font-medium tracking-wide mt-1">Student Access Card</p>
                    </div>
                    <button onClick={onClose} className="bg-black/20 p-2.5 rounded-full hover:bg-black/40 transition backdrop-blur-sm">
                        <FaTimes className="text-white" />
                    </button>
                </div>

                {/* Main Content Area (The White Card) */}
                <div className="bg-white m-1.5 mt-0 rounded-b-[30px] rounded-t-[2rem] flex-1 flex flex-col items-center p-8 text-center relative">

                    {/* Status Badge */}
                    <div className={`absolute -top-5 px-6 py-2.5 rounded-full text-sm font-black tracking-wide shadow-md flex items-center gap-2 border-[3px] border-white ${pass.is_expired === 1 ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>
                        {pass.is_expired === 1 ? <FaExclamationCircle /> : <FaCheckCircle />}
                        {pass.is_expired === 1 ? "EXPIRED" : "READY TO SCAN"}
                    </div>

                    {/* QR Code Container */}
                    <div className="mt-8 mb-4 p-5 bg-white border-[3px] border-slate-100 rounded-3xl shadow-sm">
                        <QRCodeCanvas
                            value={`https://erp.mnmjec.in/#/passes/verify/${pass.qr_token}`}
                            size={180}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Align with Scanner</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6 w-full border-t border-gray-200 pt-6">

                        {/* Valid From */}
                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                                Valid From
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                                {formatDate(pass.valid_from)}
                            </p>
                        </div>

                        {/* Valid Till */}
                        <div className="text-right">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                                Valid Till
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                                {formatDate(pass.valid_till)}
                            </p>
                        </div>

                        {/* Student Name */}
                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                                Student Name
                            </p>
                            <p className="text-base font-bold text-gray-900">
                                {pass.name}
                            </p>
                        </div>

                        {/* Roll Number */}
                        <div className="text-right">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                                Roll No
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                                {pass.roll_no}
                            </p>
                        </div>

                        {/* Department */}
                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                                Department
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                                {DEPT_MAP[pass.dept_id] || "—"}
                            </p>
                        </div>

                        {/* Class */}
                        <div className="text-right">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                                Class
                            </p>
                            <p className="text-base font-semibold text-gray-800">
                                {CLASS_MAP[pass.class_id] || "—"}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Loading & Empty States ---
const LoadingView = () => (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 text-blue-600">
        <div className="animate-spin text-5xl mb-4"><FaUtensils /></div>
        <p className="animate-pulse font-medium text-slate-500">Accessing Wallet...</p>
    </div>
);

const EmptyView = () => (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6 text-center">
        <div className="bg-slate-200 p-8 rounded-full mb-6 text-slate-400 text-5xl shadow-inner">
            <FaTicketAlt />
        </div>
        <h2 className="text-2xl font-black text-slate-700 tracking-tight">No Passes Found</h2>
        <p className="text-slate-500 mt-2 font-medium">You don't have any active passes assigned to your account right now.</p>
    </div>
);