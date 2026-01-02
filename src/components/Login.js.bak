import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BASE_URL } from '../constants/API';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export default function Login({ onClose, onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [captcha, setCaptcha] = useState({ id: '', image: '' });
  const [captchaInput, setCaptchaInput] = useState('');

  const navigate = useNavigate();

  // Load captcha on mount
  const loadCaptcha = async () => {
    try {
      const res = await fetch(`${BASE_URL}/captcha`);
      const data = await res.json();
      setCaptcha(data);
    } catch (err) {
      console.error("Captcha load error:", err);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!captchaInput.trim()) {
      setError("Please enter captcha");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          captchaId: captcha.id,
          captchaText: captchaInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        loadCaptcha(); // refresh captcha on failure
        setCaptchaInput("");
        return;
      }

      localStorage.setItem('token', data.token);

      const decoded = jwtDecode(data.token);
      localStorage.setItem('user', JSON.stringify(decoded));

      onLoginSuccess(decoded);
      navigate('/erp');

    } catch (err) {
      console.error(err);
      setError('Server unreachable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-80 relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-600 dark:text-slate-300 hover:text-slate-900"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 text-center">
          Sign In
        </h2>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 p-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* --- Captcha --- */}
          <div className="flex items-center justify-between">
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
            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-sky-500"
            required
          />

          {/* --- Submit Button --- */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-medium text-white ${
              loading
                ? 'bg-sky-400 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
