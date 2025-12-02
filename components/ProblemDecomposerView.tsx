
import React, { useState, useCallback } from 'react';
import { decomposeProblem } from '../services/geminiService';
import { Spinner } from './Spinner';
import { DecomposerIcon, DownloadIcon } from './icons';
import type { ProblemDecompositionResult, SubProblem } from '../types';

interface ProblemDecomposerViewProps {
    onBack: () => void;
}

const LEVELS = ['Beginner', 'Moderate', 'Expert'];

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
    const colors = {
        High: 'bg-red-100 text-red-700 border-red-200',
        Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Low: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${colors[priority as keyof typeof colors] || colors.Low}`}>
            {priority}
        </span>
    );
};

const SubProblemCard: React.FC<{ item: SubProblem; index: number }> = ({ item, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-cyan-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div 
                className="p-4 flex items-center justify-between cursor-pointer bg-cyan-50/50 hover:bg-cyan-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-xs border border-cyan-200">
                        {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-800">{item.title}</h4>
                </div>
                <div className="flex items-center gap-3">
                    <PriorityBadge priority={item.priority} />
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            {isOpen && (
                <div className="p-4 border-t border-cyan-100 bg-white">
                    <div className="mb-3">
                        <span className="text-xs font-bold text-cyan-600 uppercase tracking-wide block mb-1">Solution</span>
                        <p className="text-gray-700 text-sm leading-relaxed">{item.solution}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Example</span>
                        <p className="text-gray-600 text-sm italic">"{item.practicalExample}"</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ProblemDecomposerView: React.FC<ProblemDecomposerViewProps> = ({ onBack }) => {
    const [problem, setProblem] = useState('');
    const [level, setLevel] = useState(LEVELS[1]);
    const [result, setResult] = useState<ProblemDecompositionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'breakdown' | 'plan' | 'visual'>('breakdown');

    const handleDecompose = useCallback(async () => {
        if (!problem.trim()) {
            alert('Please enter a problem to decompose.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const data = await decomposeProblem(problem, level);
            setResult(data);
        } catch (error) {
            console.error("Decomposition failed:", error);
            alert("Failed to decompose the problem. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [problem, level]);

    const handleExport = () => {
        if (!result) return;
        let content = `# Problem Breakdown: ${problem}\n\n`;
        content += `## Root Causes\n${result.rootCauses.map(rc => `- ${rc}`).join('\n')}\n\n`;
        content += `## Sub-Problems\n${result.subProblems.map(sp => `### ${sp.title} (${sp.priority})\n${sp.solution}\n*Ex: ${sp.practicalExample}*`).join('\n\n')}\n\n`;
        content += `## Action Plan\n${result.actionPlan.map(step => `${step.stepNumber}. ${step.action} - ${step.explanation}`).join('\n')}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'problem_breakdown.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-cyan-50">
            {isLoading && <Spinner message="Breaking down complex problem..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-cyan-700 hover:text-cyan-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DecomposerIcon className="h-7 w-7 text-cyan-600" />
                        Problem Decomposer
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-cyan-200 text-cyan-800 font-semibold rounded-lg hover:bg-cyan-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-cyan-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">What's the problem?</label>
                        <textarea
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder="e.g. My team is missing deadlines, or I can't decide between two career paths."
                            className="w-full h-40 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition resize-none text-sm"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Complexity Level</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {LEVELS.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLevel(l)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${level === l ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleDecompose} 
                        disabled={isLoading || !problem.trim()}
                        className="w-full mt-auto py-3 bg-cyan-600 text-white font-bold text-lg rounded-xl hover:bg-cyan-700 disabled:bg-cyan-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Decompose
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-cyan-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <DecomposerIcon className="h-16 w-16 mb-4 text-cyan-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Divide & Conquer</h3>
                            <p className="mt-2 max-w-md">Enter any complex issue to get a structured breakdown, root causes, and a step-by-step plan.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 bg-gray-50/50">
                                <button 
                                    onClick={() => setActiveTab('breakdown')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'breakdown' ? 'border-cyan-500 text-cyan-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Breakdown
                                </button>
                                <button 
                                    onClick={() => setActiveTab('plan')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'plan' ? 'border-cyan-500 text-cyan-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Action Plan
                                </button>
                                <button 
                                    onClick={() => setActiveTab('visual')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'visual' ? 'border-cyan-500 text-cyan-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Visual Map
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
                                {activeTab === 'breakdown' && (
                                    <div className="space-y-6">
                                        {/* Root Causes */}
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                                            <h3 className="text-sm font-bold text-red-800 uppercase mb-3 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                Root Causes
                                            </h3>
                                            <ul className="space-y-2">
                                                {result.rootCauses.map((cause, i) => (
                                                    <li key={i} className="flex items-start text-red-900 text-sm">
                                                        <span className="mr-2">•</span> {cause}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Sub Problems */}
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-4">Sub-Problems & Solutions</h3>
                                            <div className="space-y-3">
                                                {result.subProblems.map((sub, i) => (
                                                    <SubProblemCard key={i} item={sub} index={i} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'plan' && (
                                    <div className="space-y-8">
                                        {/* Step by Step */}
                                        <div className="relative border-l-2 border-cyan-200 ml-3 space-y-8 pb-2">
                                            {result.actionPlan.map((step, i) => (
                                                <div key={i} className="ml-8 relative">
                                                    <div className="absolute -left-[43px] top-0 w-8 h-8 bg-cyan-500 rounded-full text-white flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">
                                                        {step.stepNumber}
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                        <h4 className="font-bold text-gray-800 mb-1">{step.action}</h4>
                                                        <p className="text-sm text-gray-600">{step.explanation}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Contingencies */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                                            <h3 className="text-sm font-bold text-yellow-800 uppercase mb-3">"If-Then" Contingencies</h3>
                                            <div className="grid gap-3">
                                                {result.contingencies.map((c, i) => (
                                                    <div key={i} className="bg-white border border-yellow-100 rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <span className="font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">IF</span>
                                                        <span className="text-gray-700">{c.ifCondition}</span>
                                                        <span className="hidden sm:inline text-gray-400">→</span>
                                                        <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">THEN</span>
                                                        <span className="text-gray-700">{c.thenAction}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'visual' && (
                                    <div className="bg-slate-900 text-green-400 font-mono text-sm p-6 rounded-xl overflow-x-auto border border-slate-800 shadow-inner h-full">
                                        <pre className="whitespace-pre">{result.visualStructure}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
