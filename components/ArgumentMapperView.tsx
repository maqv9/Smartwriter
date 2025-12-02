
import React, { useState, useCallback } from 'react';
import { mapArgument } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ArgumentIcon, DownloadIcon } from './icons';
import type { ArgumentMapResult, ArgumentNode } from '../types';

interface ArgumentMapperViewProps {
    onBack: () => void;
}

const TreeNode: React.FC<{ node: ArgumentNode }> = ({ node }) => {
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Claim': return 'bg-slate-800 text-white border-slate-900';
            case 'Premise': return 'bg-white text-slate-800 border-slate-300 shadow-sm';
            case 'Evidence': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'Assumption': return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'Counterpoint': return 'bg-red-50 text-red-800 border-red-200';
            default: return 'bg-white';
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`p-4 rounded-xl border-2 max-w-xs text-center relative z-10 transition-all hover:scale-105 ${getTypeColor(node.type)}`}>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-1">{node.type}</div>
                <div className="text-sm font-medium leading-snug">{node.text}</div>
            </div>
            
            {node.children && node.children.length > 0 && (
                <div className="relative flex flex-col items-center mt-6">
                    {/* Vertical Line from Parent */}
                    <div className="w-0.5 h-6 bg-slate-300 absolute -top-6"></div>
                    
                    {/* Horizontal Connector Bar (only if multiple children) */}
                    {node.children.length > 1 && (
                        <div className="h-0.5 bg-slate-300 absolute top-0 w-full" style={{ width: `calc(100% - ${100 / node.children.length}%)` }}></div>
                    )}

                    <div className="flex gap-8 items-start pt-6 relative">
                        {node.children.map((child, idx) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Vertical Line to Child */}
                                <div className="w-0.5 h-6 bg-slate-300 absolute -top-6"></div>
                                <TreeNode node={child} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalysisCard: React.FC<{ title: string; children: React.ReactNode; color: string }> = ({ title, children, color }) => (
    <div className={`bg-white rounded-xl border p-5 ${color}`}>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4">{title}</h3>
        {children}
    </div>
);

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
            <span>{label}</span>
            <span>{score}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
                className={`h-2 rounded-full transition-all duration-1000 ${score > 80 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                style={{ width: `${score}%` }}
            ></div>
        </div>
    </div>
);

export const ArgumentMapperView: React.FC<ArgumentMapperViewProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<ArgumentMapResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'map' | 'analysis'>('map');

    const handleMap = useCallback(async () => {
        if (!inputText.trim()) {
            alert('Please paste your argument text.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await mapArgument(inputText);
            setResult(data);
        } catch (error) {
            console.error("Mapping failed:", error);
            alert("Failed to analyze argument. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [inputText]);

    const handleExport = () => {
        if (!result) return;
        const text = `Argument Map: ${result.tree.text}\n\nAnalysis:\nClarity: ${result.analysis.clarityScore}\nLogic: ${result.analysis.logicScore}\n\nSimplified: ${result.analysis.simplifiedVersion}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'argument_analysis.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-slate-50">
            {isLoading && <Spinner message="Tracing logic & detecting fallacies..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ArgumentIcon className="h-7 w-7 text-slate-600" />
                        Argument Mapper
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-slate-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Input Argument</label>
                        <p className="text-xs text-gray-500 mb-3">Paste an opinion, debate transcript, essay excerpt, or social media post.</p>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste text here..."
                            className="w-full h-64 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-slate-500 focus:outline-none transition resize-none text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleMap} 
                        disabled={isLoading || !inputText.trim()}
                        className="w-full mt-auto py-3 bg-slate-800 text-white font-bold text-lg rounded-xl hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Visualize Logic
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-slate-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <ArgumentIcon className="h-16 w-16 mb-4 text-slate-200" />
                            <h3 className="text-xl font-semibold text-gray-500">See the Structure</h3>
                            <p className="mt-2 max-w-md">We'll break down the logic into a visual map and check for any fallacies.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 bg-gray-50/50">
                                <button 
                                    onClick={() => setActiveTab('map')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'map' ? 'border-slate-800 text-slate-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Visual Map
                                </button>
                                <button 
                                    onClick={() => setActiveTab('analysis')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-slate-800 text-slate-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Analysis & Scores
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 bg-slate-50/50">
                                {activeTab === 'map' ? (
                                    <div className="min-w-full overflow-x-auto pb-8">
                                        <div className="flex justify-center min-w-max p-4">
                                            <TreeNode node={result.tree} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-3xl mx-auto">
                                        {/* Scores */}
                                        <AnalysisCard title="Strength Checker" color="border-slate-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                <ScoreBar label="Clarity" score={result.analysis.clarityScore} />
                                                <ScoreBar label="Logic" score={result.analysis.logicScore} />
                                                <ScoreBar label="Evidence" score={result.analysis.evidenceScore} />
                                                <ScoreBar label="Persuasiveness" score={result.analysis.persuasivenessScore} />
                                            </div>
                                        </AnalysisCard>

                                        {/* Simplification */}
                                        <AnalysisCard title="Simplified Version" color="border-blue-200">
                                            <p className="text-gray-700 italic">"{result.analysis.simplifiedVersion}"</p>
                                        </AnalysisCard>

                                        {/* Fallacies */}
                                        <AnalysisCard title="Fallacy Detector" color="border-red-200">
                                            {result.analysis.fallacies.length === 0 ? (
                                                <p className="text-green-600 font-medium">No major fallacies detected. Good job!</p>
                                            ) : (
                                                <ul className="space-y-4">
                                                    {result.analysis.fallacies.map((f, i) => (
                                                        <li key={i} className="bg-red-50 p-3 rounded-lg border border-red-100">
                                                            <div className="font-bold text-red-800 mb-1">{f.name}</div>
                                                            <p className="text-sm text-red-700 mb-2">{f.description}</p>
                                                            <p className="text-xs text-red-500 italic bg-white p-1 rounded inline-block">"Found in: {f.location}"</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </AnalysisCard>

                                        {/* Counter Arguments */}
                                        <AnalysisCard title="Counter-Arguments Generator" color="border-amber-200">
                                            <div className="space-y-4">
                                                {result.analysis.counterArguments.map((ca, i) => (
                                                    <div key={i} className="border-l-4 border-amber-400 pl-4 py-1">
                                                        <p className="text-sm font-bold text-gray-800 mb-1">Opponent says:</p>
                                                        <p className="text-sm text-gray-600 mb-2">"{ca.point}"</p>
                                                        <p className="text-sm font-bold text-emerald-700 mb-1">You respond:</p>
                                                        <p className="text-sm text-gray-600">{ca.rebuttal}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </AnalysisCard>

                                        {/* Suggestions */}
                                        <AnalysisCard title="Improvements" color="border-green-200">
                                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                                {result.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </AnalysisCard>
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
