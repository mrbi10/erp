import React, { useState } from "react";
import { BASE_URL } from "../constants/API";
import { X, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const DOMAIN = "@mnmjec.ac.in";

  const [username, setUsername] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // -------------------------------
  // Username Handler (same logic as login)
  // -------------------------------
  const handleUsernameChange = (e) => {
    setUsername(e.target.value.trim());
  };

  // -------------------------------
  // Form Submit
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const finalEmail = username.includes("@")
      ? username
      : `${username}${DOMAIN}`;

    try {
      const res = await fetch(`${BASE_URL}/forgotpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setMessage("If this email exists, a reset link has been sent.");
      }
    } catch (err) {
      setError("Server unreachable. Try again later.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fadeIn z-50">

      <div
        className="
          w-[90%] max-w-sm p-8 rounded-3xl relative 
          bg-white/80 dark:bg-slate-900/70 
          border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.15)]
          animate-scaleIn
        "
      >
        {/* Close Button */}
        <button
          onClick={() => navigate("/login")}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg mx-auto mb-3">
          <Mail size={22} />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white tracking-tight mb-1">
          Forgot Password
        </h2>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
          Enter your username or college email.
        </p>

        {/* Errors */}
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 p-2 rounded-md animate-shake">
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="mb-3 text-sm text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400 p-2 rounded-md animate-fadeIn">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username Input */}
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
              Username / College Mail ID
            </label>

            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-slate-300 dark:border-slate-700
                bg-white/70 dark:bg-slate-800/40
                focus:ring-2 focus:ring-sky-500
                outline-none transition-all
              "
              placeholder="Enter your username or email"
              required
            />

            {warning && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {warning}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-sky-600 to-blue-700
              hover:from-sky-500 hover:to-blue-600
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-sky-200/30 transition active:scale-95
            "
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-5">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-sky-600 hover:underline dark:text-sky-400 transition"
          >
            Back to Login
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.95) translateY(10px);} 
                             to {opacity:1; transform:scale(1) translateY(0);} }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        .animate-fadeIn { animation: fadeIn .25s ease-out; }
        .animate-scaleIn { animation: scaleIn .35s ease-out; }
        .animate-shake { animation: shake .25s ease-out; }
      `}</style>
    </div>
  );
}
