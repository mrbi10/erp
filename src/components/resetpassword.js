import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../constants/API';
import { X, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/resetpassword/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to reset password');
      } else {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Server unreachable. Try again later.');
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
        
        {/* Close Button */}
        <button
          onClick={() => navigate('/login')}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
          <Lock size={22} />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter your new password below to secure your account.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 p-3 rounded-xl flex items-start gap-2 animate-shake">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 text-sm text-green-600 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 p-3 rounded-xl flex items-start gap-2 animate-fadeIn">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* New Password */}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                  w-full px-4 py-2.5 rounded-xl
                  border border-slate-300 dark:border-slate-700
                  bg-white/70 dark:bg-slate-800/40
                  focus:ring-2 focus:ring-sky-500 outline-none transition-all
                "
                required
              />
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-slate-300 dark:border-slate-700
                bg-white/70 dark:bg-slate-800/40
                focus:ring-2 focus:ring-sky-500 outline-none transition-all
              "
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-sky-600 to-blue-700
              hover:from-sky-500 hover:to-blue-600
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-sky-500/20 transition active:scale-95
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Updating...</span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline transition"
          >
            Back to Login
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.95) translateY(10px);} 
                             to { opacity: 1; transform: scale(1) translateY(0);} }
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