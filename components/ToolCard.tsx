
import React from 'react';
import type { Tool } from '../types';

interface ToolCardProps {
    tool: Tool;
    onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
    return (
        <div 
            className="glass-card p-6 rounded-2xl flex flex-col cursor-pointer group relative overflow-hidden"
            onClick={onClick}
        >
            {/* Background Gradient Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-white/60 transition-transform group-hover:scale-110 duration-300"
                    style={{ backgroundColor: `${tool.color}80` }} // Adding transparency to the color
                >
                    <div style={{ color: tool.textColor }}>
                        <tool.icon className="w-7 h-7" />
                    </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white shadow-sm backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-5 relative z-10">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{tool.name}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{tool.description}</p>
            </div>
        </div>
    );
};
