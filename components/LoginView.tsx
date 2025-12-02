
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogoIcon } from './icons';
import { Spinner } from './Spinner';

export const LoginView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Redirects back to the current domain (localhost or vercel app) after login
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Failed to login with Google.');
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (type: 'signIn' | 'signUp') => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            if (type === 'signUp') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            {isLoading && <Spinner message="Authenticating..." />}
            <div className="max-w-md w-full mx-auto">
                <div className="flex justify-center mb-6">
                     <LogoIcon className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome to SmartWriter</h1>
                <p className="text-center text-gray-500 mb-8">Sign in or create an account to continue</p>
                <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                    {/* Google Login Button */}
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth('signIn'); }}>
                        <div className="space-y-6">
                             <div>
                                <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                    required
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password"  className="text-sm font-medium text-gray-700 block mb-2">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                             {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
                             {message && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">{message}</p>}
                        </div>

                         <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300 transition-all">
                                Sign In
                            </button>
                             <button type="button" onClick={() => handleEmailAuth('signUp')} disabled={isLoading} className="w-full py-2.5 bg-white text-indigo-500 font-semibold border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:bg-gray-100 transition-all">
                                Sign Up
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
