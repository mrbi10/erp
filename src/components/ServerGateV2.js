import React, { useState, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { 
  Wifi, 
  RefreshCw, 
  ShieldAlert, 
  Globe, 
  Mail,
  Lock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { BASE_URL } from "../constants/API";

// Logic: IP Detection (Original Logic Preserved)
function getLocalIP() {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return;
      const match = event.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
      if (match) {
        resolve(match[1]);
        pc.close();
      }
    };
  });
}

export default function ServerGate({ children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [localIP, setLocalIP] = useState(null);
  const [serverAllowed, setServerAllowed] = useState(null);
  const [serverDown, setServerDown] = useState(false);
  const [refreshCount, setRefreshCount] = useState(
    Number(sessionStorage.getItem("server_refresh_count") || 0)
  );

  useEffect(() => {
    let cancelled = false;
    const checkServer = () => {
      fetch(`${BASE_URL}/status`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (cancelled) return;
          if (data?.ok === true) {
            setServerAllowed(true);
            setServerDown(false);
          } else {
            setServerAllowed(false);
            setServerDown(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setServerAllowed(false);
            setServerDown(true);
          }
        });
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    getLocalIP().then(setLocalIP).catch(() => setLocalIP("Unavailable"));

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    const count = refreshCount + 1;
    sessionStorage.setItem("server_refresh_count", count);
    setRefreshCount(count);
    window.location.reload();
  };

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const spotlightBg = useMotionTemplate`
    radial-gradient(
      500px circle at ${mouseX}px ${mouseY}px,
      rgba(99, 102, 241, 0.1),
      transparent 80%
    )
  `;

  if (serverAllowed === true) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] text-slate-300 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      
      <motion.div
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-xl bg-slate-900/40 rounded-[32px] border border-slate-800/60 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {/* Subtle Interactive Background */}
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: spotlightBg }} />

        <div className="relative z-10 p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Lock className="text-indigo-400 w-6 h-6" />
            </div>
            <h1 className="text-white text-lg font-bold tracking-[0.2em] uppercase italic opacity-80">
              MNMJEC <span className="text-indigo-500">ERP</span>
            </h1>
          </div>

          {/* Status Message */}
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Access Restricted</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              {serverDown 
                ? "The application server is currently undergoing maintenance." 
                : "Unable to establish a secure handshake with the ERP core."}
            </p>
          </div>

          {/* Micro Diagnostics */}
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Node Identity</span>
                <span className="text-xs font-mono text-slate-300">{localIP || "Resolving..."}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1 block">Ref ID</span>
              <span className="text-xs font-mono text-indigo-400/80 uppercase">AK-1006</span>
            </div>
          </div>

          {/* Action Interface */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
            >
              <RefreshCw size={18} className={serverDown ? "animate-spin" : ""} />
              Reconnect System
            </button>
            
            <button
              onClick={() => window.location.href = "mailto:support@mnmjec.ac.in"}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50 rounded-xl font-semibold transition-all"
            >
              <Mail size={18} />
              Contact Support
            </button>
          </div>

          {/* Credits Segment - Integrated into Card */}
          <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <ShieldAlert size={12} />
              <span>System Design by</span>
              <a 
                href="https://abinanthan.in" 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-300 hover:text-indigo-400 transition-colors flex items-center gap-1 font-bold"
              >
                Abinanthan V <ExternalLink size={10} />
              </a>
            </div>
            <p className="text-[9px] text-slate-600 font-medium">
              © {new Date().getFullYear()} MNMJEC · CSE 22–26
            </p>
          </div>
        </div>
      </motion.div>

      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}