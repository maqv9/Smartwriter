
import React from 'react';
import { LogoIcon } from './icons';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active }) => (
    <a href="#" className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-1 ${
        active 
        ? 'bg-white/60 text-indigo-700 shadow-sm backdrop-blur-sm border border-white/50' 
        : 'text-gray-600 hover:bg-white/40 hover:text-gray-900 hover:shadow-sm'
    }`}>
        <div className={`${active ? 'text-indigo-600' : 'text-gray-500'}`}>
            {icon}
        </div>
        <span className="ml-3">{label}</span>
    </a>
);

export const Sidebar: React.FC = () => {
    return (
        <aside className="sidebar glass-panel m-3 rounded-2xl flex flex-col shadow-xl border-r-0">
            <div className="flex items-center gap-3 px-6 py-6 mb-2">
                <div className="p-2 bg-indigo-600/10 rounded-lg">
                    <LogoIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">SmartWriter</h1>
            </div>

            <nav className="flex-grow px-4 space-y-1 overflow-y-auto">
                <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} label="Dashboard" active />
                <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>} label="Documents" />
                
                <div className="pt-6 pb-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Creation</div>
                 <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L7.86 6.74H4.22c-1.63 0-2.34 2.02-1.09 3.03l2.94 2.3-1.1 3.59c-.48 1.54 1.29 2.76 2.65 1.94L12 15.33l3.22 2.26c1.36.82 3.13-.4 2.65-1.94l-1.1-3.59 2.94-2.3c1.25-1.01.54-3.03-1.09-3.03h-3.64L11.49 3.17z" clipRule="evenodd" /></svg>} label="AI Writer" />
                <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.545 2.964.5.5 0 00.91.405A3.987 3.987 0 0110 13.5a3.987 3.987 0 013.635 2.869.5.5 0 00.91-.405A5 5 0 0012 11z" clipRule="evenodd" /></svg>} label="AI Tutors" />
                <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>} label="Assistants" />

                <div className="pt-6 pb-3 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Audio & Video</div>
                <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-2.293 2.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 9.414V13h-1.5a.5.5 0 010-1H13v-1.414l-1.293-1.293a1 1 0 00-1.414 0L9 10.586V13H5.5z" /><path d="M9 13H5.5a1.5 1.5 0 000 3h3.5a1.5 1.5 0 000-3z" /></svg>} label="Transcription" />
                <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H4a1 1 0 000 2h1v1a1 1 0 002 0V6h1a1 1 0 000-2H7V3a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v1h-1a1 1 0 100 2h1v1a1 1 0 102 0V6h1a1 1 0 100-2h-1V3a1 1 0 00-1-1zM6 8a1 1 0 00-1 1v1H4a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2H7v-1a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1a1 1 0 00-1-1z" /></svg>} label="Voiceover" />
            </nav>

            <div className="p-4 mt-auto">
                <div className="p-5 bg-gradient-to-br from-white/40 to-white/10 rounded-2xl border border-white/50 backdrop-blur-sm shadow-sm">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Credits</span>
                        <span className="text-indigo-600">PRO</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-3">
                        <span>Words Used</span>
                        <span>9,959 / 10k</span>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-1.5 mb-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full shadow-sm" style={{width: '99.59%'}}></div>
                    </div>
                    
                    <button className="w-full bg-gray-900 text-white font-medium rounded-xl px-4 py-2.5 text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20">
                        Upgrade Plan
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <a href="#" className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                        Help & Support
                    </a>
                </div>
            </div>
        </aside>
    );
};
