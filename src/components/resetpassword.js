import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../constants/API';
import { X } from 'lucide-react';

export default function ResetPassword() {

    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
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
                setTimeout(() => navigate('/login'), 3000);
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
                    Reset Password
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
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-sky-500"
                            placeholder="Enter new password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-sky-500"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-md font-medium text-white ${loading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
