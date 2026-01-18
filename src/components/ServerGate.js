import { useEffect, useState } from "react";
import { BASE_URL } from "../constants/API";
import logo from "../assests/logo2.png";

const STATUS_MESSAGES = [
  "Starting core services…",
  "Connecting to secure database…",
  "Loading academic modules…",
  "Finalizing ERP environment…",
  "Almost ready…"
];

export default function ServerGate({ children }) {
  const [ready, setReady] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    let intervalId;

    const check = () => {
      if (BASE_URL) {
        setReady(true);
        clearInterval(intervalId);
      }
    };

    check();
    intervalId = setInterval(check, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % STATUS_MESSAGES.length);
    }, 10000);

    return () => clearInterval(msgTimer);
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-900 px-4">

        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8 text-center">

          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <img
              src={logo}
              alt="MNMJEC Logo"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            MNMJEC ERP System
          </h2>

          <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 mb-6">
            Preparing your workspace.
          </p>

          {/* Spinner */}
          <div className="flex justify-center mb-5">
            <div className="h-10 w-10 rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white animate-spin" />
          </div>

          {/* Rotating message */}
          <div className="h-6 mb-3 overflow-hidden">
            <p
              key={msgIndex}
              className="text-sm text-slate-700 dark:text-slate-300 animate-fade-slide"
            >
              {STATUS_MESSAGES[msgIndex]}
            </p>
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Please keep this page open. The ERP will continue automatically once
            the server is ready. No refresh required.
          </div>

          {/* Footer */}
          <div className="mt-6 text-[11px] text-slate-400">
            © {new Date().getFullYear()} MNM Jain Engineering College
          </div>
        </div>

        {/* Animation */}
        <style>
          {`
            @keyframes fadeSlide {
              0% {
                opacity: 0;
                transform: translateY(6px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-slide {
              animation: fadeSlide 0.6s ease-out;
            }
          `}
        </style>
      </div>
    );
  }

  return children;
}
