
import React from 'react';

export const Spinner: React.FC<{ message?: string }> = ({ message }) => {
    return (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-l-indigo-500 animate-spin"></div>
            </div>
            {message && <p className="text-gray-700 text-lg mt-4 font-semibold tracking-wider animate-pulse">{message}</p>}
        </div>
    );
};
