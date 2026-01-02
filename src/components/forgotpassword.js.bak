import React, { useState } from 'react';
import { BASE_URL } from '../constants/API';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong');
      } else {
        setMessage('If your email exists, a reset link has been sent!');
      }
    } catch (err) {
      console.error(err);
      setError('Server unreachable. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-80 relative">
        <button
          onClick={() => navigate('/login')}
          className="absolute top-3 right-3 text-slate-600 dark:text-slate-300 hover:text-slate-900"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 text-center">
          Forgot Password
        </h2>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 p-2 rounded-md">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-3 text-sm text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400 p-2 rounded-md">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-sky-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-medium text-white ${
              loading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-sky-600 hover:underline dark:text-sky-400"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
