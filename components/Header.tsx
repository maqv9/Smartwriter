
import React from 'react';
import { User } from 'firebase/auth';

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

interface HeaderProps {
    user: User | null;
    onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
    return (
        <header className="px-8 py-5 flex items-center justify-between relative z-20">
            {/* Search Bar */}
            <div className="relative w-full max-w-lg group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    placeholder="Search anything..."
                    className="glass-input w-full rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-500 transition-all duration-300 shadow-sm"
                />
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <kbd className="inline-flex items-center px-2 py-1 text-xs font-sans font-medium text-gray-500 bg-white/60 border border-gray-300/50 rounded-md shadow-sm">
                        ⌘ K
                    </kbd>
                </div>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center gap-6">
                 <button className="relative p-2.5 rounded-xl text-gray-600 hover:bg-white/40 hover:text-indigo-600 transition-colors border border-transparent hover:border-white/40">
                    <BellIcon />
                     <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>

                <div className="flex items-center pl-4 border-l border-gray-300/50">
                    <div className="flex items-center gap-3 cursor-pointer group relative p-1 rounded-full hover:bg-white/30 transition pr-3">
                        <div className="relative">
                            <img
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user?.email || 'Felix'}`}
                                alt="User Avatar"
                                className="h-10 w-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm"
                            />
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="font-bold text-sm text-gray-800 leading-none mb-1">Carla Sanford</p>
                            <p className="text-xs font-medium text-gray-500">Pro Member</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        
                        <div className="absolute top-full right-0 mt-2 w-48 glass-panel rounded-xl py-1 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 pointer-events-none group-hover:pointer-events-auto shadow-xl">
                            <div className="px-4 py-2 border-b border-gray-200/50">
                                <p className="text-xs text-gray-500">Signed in as</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={onSignOut}
                                className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/50 flex items-center gap-2 transition-colors"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                </svg>
                               Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
