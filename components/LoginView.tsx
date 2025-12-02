import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { LogoIcon } from './icons';
import { Spinner } from './Spinner';

export const LoginView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (action: 'signIn' | 'signUp') => {
        setIsLoading(true);
        setError(null);
        try {
            await setPersistence(auth, browserLocalPersistence);
            if (action === 'signUp') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // onAuthStateChanged in App.tsx will handle the state change
        } catch (err: any) {
            // More user-friendly error messages
            if (err.code === 'auth/email-already-in-use') {
                 setError('This email is already in use. Try logging in.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters long.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                 setError('Invalid credentials. Please check your email and password.');
            }
            else {
                 setError('An error occurred. Please try again.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            {isLoading && <Spinner />}
            <div className="max-w-md w-full mx-auto">
                <div className="flex justify-center mb-6">
                     <LogoIcon className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome to SmartWriter</h1>
                <p className="text-center text-gray-500 mb-8">Sign in or create an account to continue</p>
                <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                    <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signIn'); }}>
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
                        </div>

                         <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300 transition-all">
                                Sign In
                            </button>
                             <button type="button" onClick={() => handleAuthAction('signUp')} disabled={isLoading} className="w-full py-2.5 bg-white text-indigo-500 font-semibold border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:bg-gray-100 transition-all">
                                Sign Up
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};