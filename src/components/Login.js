import React, { useState, useEffect } from "react";
import { Eye, EyeOff, X, Phone, Shield, User, Briefcase, GraduationCap } from "lucide-react";
import { BASE_URL } from "../constants/API";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function Login({ onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState({ id: "", image: "" });
  const [captchaInput, setCaptchaInput] = useState("");

  const navigate = useNavigate();
  const DOMAIN = "@mnmjec.ac.in";

  const userRoleIcon = () => {
    const email = username.toLowerCase();

    if (email.includes("principal")) return <Shield size={20} className="text-amber-500" />;
    if (email.includes("hod")) return <Briefcase size={20} className="text-blue-500" />;
    if (email.includes("faculty")) return <User size={20} className="text-emerald-500" />;
    if (email.includes("ca")) return <Phone size={20} className="text-purple-500" />;
    return <GraduationCap size={20} className="text-sky-500" />;
  };

  const loadCaptcha = async () => {
    try {
      const res = await fetch(`${BASE_URL}/captcha`);
      const data = await res.json();
      setCaptcha(data);
    } catch (e) {
      console.error("captcha error", e);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const finalEmail = username.includes("@")
    ? username.trim()
    : username.trim() + DOMAIN;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otpMode && !captchaInput.trim()) {
      setError("Please enter captcha");
      setLoading(false);
      return;
    }

    try {
      const payload = otpMode
        ? { email: finalEmail, otp }
        : {
            email: finalEmail,
            password,
            captchaId: captcha.id,
            captchaText: captchaInput,
          };

      const url = otpMode ? `${BASE_URL}/login-otp` : `${BASE_URL}/login`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      const decoded = jwtDecode(data.token);
      localStorage.setItem("user", JSON.stringify(decoded));

      onLoginSuccess(decoded);
      navigate("/");
    } catch (err) {
      setError(err.message);
      loadCaptcha();
      setCaptchaInput("");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!username.trim()) {
      setError("Enter username before requesting OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOtpSent(true);
      setOtpMode(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fadeIn z-50">

      <div className="
        w-[90%] max-w-sm p-8 rounded-3xl relative 
        bg-white/80 dark:bg-slate-900/70 
        border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.15)]
        animate-scaleIn
      ">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <X size={20} />
        </button>

    

        {/* Error */}
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 p-2 rounded-md animate-shake">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">
              Username / College Email
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="Enter Register No or Mail id"
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-slate-300 dark:border-slate-700
                bg-white/70 dark:bg-slate-800/40
                focus:ring-2 focus:ring-sky-500 outline-none transition-all
                autofill:bg-transparent
              "
            />
          </div>

          {/* Password (Hide for OTP mode) */}
          {!otpMode && (
            <div className="relative">
              <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">
                Password
              </label>

              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="
                w-full px-4 py-2.5 rounded-xl
                border border-slate-300 dark:border-slate-700
                bg-white/70 dark:bg-slate-800/40
                focus:ring-2 focus:ring-sky-500 outline-none transition-all
              "
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {/* Captcha (Hide for OTP mode) */}
          {!otpMode && (
            <>
              <div className="flex justify-between items-center">
                <div dangerouslySetInnerHTML={{ __html: captcha.image }} />
                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                >
                  refresh
                </button>
              </div>

              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter captcha"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </>
          )}

          {/* OTP Input */}
          {otpMode && (
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-slate-300 dark:border-slate-700
                bg-white/60 dark:bg-slate-800/40
                focus:ring-2 focus:ring-sky-500 outline-none transition
              "
            />
          )}

          {/* Forgot Password + OTP Link */}
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate("/forgotpassword")}
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              Forgot Password?
            </button>

            {!otpMode && (
              <button
                type="button"
                onClick={sendOtp}
                className="text-purple-600 dark:text-purple-400 hover:underline"
              >
                Login with OTP
              </button>
            )}
          </div>

          {/* Submit */}
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
            {loading ? "Processing…" : otpMode ? "Verify OTP" : "Sign In"}
          </button>
        </form>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px);} 
                             to { opacity: 1; transform: scale(1) translateY(0);} }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        .animate-fadeIn { animation: fadeIn .2s ease-out; }
        .animate-scaleIn { animation: scaleIn .35s ease-out; }
        .animate-shake { animation: shake .2s ease-out; }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          transition: background-color 9999s, color 9999s;
        }
      `}</style>
    </div>
  );
}
