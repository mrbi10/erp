import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import logo from "../assests/logo2.png";
import { BASE_URL } from "../constants/API";


function getLocalIP() {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");

    pc.createOffer().then(offer => pc.setLocalDescription(offer));

    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return;

      const match = event.candidate.candidate.match(
        /([0-9]{1,3}(\.[0-9]{1,3}){3})/
      );

      if (match) {
        resolve(match[1]);
        pc.close();
      }
    };
  });
}


// --- ICONS ---
const Icons = {
  Lock: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  Wifi: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
  ),
  Globe: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
  ),
  Ban: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>
  )
};

// --- COMPONENTS ---

const RadarPulse = () => {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {/* Center Anchor */}
      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-700 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
        <Icons.Lock className="w-4 h-4 text-white" />
      </div>
      {/* Ripples */}
      {[0, 1].map((index) => (
        <motion.div
          key={index}
          className="absolute inset-0 border border-indigo-500/40 rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0], scale: [0.8, 2] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

export default function ServerGate({ children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);


  const [localIP, setLocalIP] = useState(null);
  const [serverAllowed, setServerAllowed] = useState(null);
  const isCampusNetwork = localIP?.startsWith("192.168.6.");
  useEffect(() => {
    let cancelled = false;

    fetch(`${BASE_URL}/status`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (!cancelled) {
          setServerAllowed(data?.ok === true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerAllowed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getLocalIP()
      .then(setLocalIP)
      .catch(() => setLocalIP("Unavailable"));
  }, []);


  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const spotlightBg = useMotionTemplate`
  radial-gradient(
    800px circle at ${mouseX}px ${mouseY}px,
    rgba(99, 102, 241, 0.08),
    transparent 80%
  )
`;

  if (serverAllowed === true) {
    return <>{children}</>;
  };


  if (serverAllowed === null) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center text-slate-400 text-sm">
        Verifying network access…
      </div>
    );
  }
  return (


    <div className="fixed inset-0 z-[9999] bg-[#020617] font-sans text-slate-200 selection:bg-indigo-500/30 overflow-y-auto overflow-x-hidden">


      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">

        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onMouseMove={handleMouseMove}
          className="relative w-full max-w-4xl bg-slate-900/60 backdrop-blur-2xl rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden group"
        >
          {/* Spotlight Effect */}
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-0"
            style={{
              background: spotlightBg,
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row min-h-[400px]">

            {/* LEFT SIDE: Visuals & Branding */}
            <div className="w-full md:w-[45%] bg-slate-900/40 border-b md:border-b-0 md:border-r border-slate-800 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Subtle Grid Pattern on Left */}
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

              {/* <motion.img
                src={logo}
                alt="Logo"
                className="h-10 w-auto mb-8 relative z-10 drop-shadow-lg opacity-90"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              /> */}

              <div className="mb-6 relative z-10">
                <RadarPulse />
              </div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="relative z-10"
              >
                <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${isCampusNetwork
                      ? "text-emerald-400"
                      : "text-rose-400"
                      }`}
                  >
                    {localIP
                      ? isCampusNetwork
                        ? "Campus Network Detected"
                        : "External Network"
                      : "Detecting Network"}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT SIDE: Instructions */}
            <div className="w-full md:w-[55%] p-8 md:p-10 flex flex-col justify-center bg-gradient-to-br from-white/[0.02] to-transparent">

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-medium text-white mb-2">Security Checkpoint</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The MNMJEC ERP environment is isolated for security. Access is strictly limited to the internal campus network.
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-2">
                    {localIP
                      ? `Detected IP: ${localIP}`
                      : "Local IP unavailable"}
                  </p>
                </motion.div>

                <div className="h-px w-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />

                {/* Requirements List */}
                <motion.ul
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <li className="flex items-start gap-3 group/item">
                    <div className="mt-1 p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover/item:text-indigo-300 transition-colors">
                      <Icons.Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-slate-200">Campus Internet Only</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Connect to "MNMJEC" </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 group/item">
                    <div className="mt-1 p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover/item:text-indigo-300 transition-colors">
                      <Icons.Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-slate-200">Local IP Range</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Device must be on 192.168.6.x subnet</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 group/item">
                    <div className="mt-1 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover/item:text-rose-300 transition-colors">
                      <Icons.Ban className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-slate-200">VPNs Prohibited</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Disable 4G/5G and VPN tunnels</span>
                    </div>
                  </li>
                </motion.ul>
              </div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-end"
              >
                <div className="text-[10px] text-slate-500 font-mono">
                  ID: k-1006<br />
                  LAT: {new Date().toLocaleTimeString()}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  MNMJEC
                </div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}