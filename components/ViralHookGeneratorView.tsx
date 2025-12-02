
import React, { useState, useCallback } from 'react';
import { generateViralHooksAndTrends } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ViralIcon, DownloadIcon } from './icons';
import type { ViralHookResult, ViralHook, TrendInsight } from '../types';

interface ViralHookGeneratorViewProps {
    onBack: () => void;
}

const PLATFORMS = ['TikTok', 'YouTube Shorts', 'Instagram Reels', 'Twitter/X', 'LinkedIn'];

const HookCard: React.FC<{ hook: ViralHook }> = ({ hook }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(hook.text);
        alert('Hook copied!');
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${hook.type === 'Fear-based' ? 'bg-red-100 text-red-700' : hook.type === 'Curiosity-based' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {hook.type}
                </span>
                <span className="text-xs font-bold text-green-600">Score: {hook.score}</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mb-2">{hook.text}</p>
            <p className="text-sm text-gray-500 italic mb-4">Why: {hook.explanation}</p>
            <button onClick={handleCopy} className="w-full py-2 bg-gray-50 text-gray-600 font-semibold rounded-md hover:bg-gray-100 text-sm transition-colors">
                Copy Hook
            </button>
        </div>
    );
};

const TrendRow: React.FC<{ insight: TrendInsight }> = ({ insight }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
        <div className="flex-1">
            <h4 className="font-bold text-gray-800">{insight.topic}</h4>
            <p className="text-xs text-gray-500">{insight.competitorPattern}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-bold ${insight.growthStatus === 'Exploding' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {insight.growthStatus}
            </span>
            <span className="text-gray-600 font-medium">{insight.engagementSpike}</span>
            <span className="text-gray-400 text-xs hidden sm:block">{insight.bestPostingTime}</span>
        </div>
    </div>
);

export const ViralHookGeneratorView: React.FC<ViralHookGeneratorViewProps> = ({ onBack }) => {
    const [niche, setNiche] = useState('');
    const [platform, setPlatform] = useState(PLATFORMS[0]);
    const [result, setResult] = useState<ViralHookResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'hooks' | 'trends'>('hooks');

    const handleGenerate = useCallback(async () => {
        if (!niche.trim()) {
            alert('Please enter a niche.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await generateViralHooksAndTrends(niche, platform);
            setResult(data);
        } catch (error) {
            console.error("Failed to generate hooks:", error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [niche, platform]);

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-fuchsia-50">
            {isLoading && <Spinner message="Scanning trends & crafting viral hooks..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-fuchsia-700 hover:text-fuchsia-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ViralIcon className="h-7 w-7 text-fuchsia-600" />
                        Viral Hook & Trend Analyzer
                    </h1>
                </div>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-fuchsia-200 rounded-xl p-5 h-full flex flex-col shadow-sm">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Target Niche</label>
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="e.g. Personal Finance, Keto Diet, Coding"
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Platform</label>
                        <select 
                            value={platform} 
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition"
                        >
                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    
                    <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100 text-sm text-fuchsia-800 mb-6">
                        <h4 className="font-bold mb-1">What you'll get:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Real-time trend analysis</li>
                            <li>10+ viral hooks tailored to you</li>
                            <li>Posting time recommendations</li>
                        </ul>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !niche.trim()}
                        className="w-full mt-auto py-3 bg-fuchsia-600 text-white font-bold text-lg rounded-xl hover:bg-fuchsia-700 disabled:bg-fuchsia-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Generate Strategy
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-fuchsia-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <ViralIcon className="h-16 w-16 mb-4 text-fuchsia-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Go Viral Faster</h3>
                            <p className="mt-2 max-w-md">We analyze what's working right now and generate hooks that stop the scroll.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                <button 
                                    onClick={() => setActiveTab('hooks')}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'hooks' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Viral Hooks ({result.hooks.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab('trends')}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'trends' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Trend Analysis
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
                                {activeTab === 'hooks' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.hooks.map((hook, idx) => (
                                            <HookCard key={idx} hook={hook} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Top Rising Topics</div>
                                            {result.trendAnalysis.insights.map((insight, idx) => (
                                                <TrendRow key={idx} insight={insight} />
                                            ))}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <h4 className="font-bold text-gray-700 mb-3">Rising Keywords</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.trendAnalysis.risingKeywords.map(kw => (
                                                        <span key={kw} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded border border-blue-100">{kw}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {result.citations && result.citations.length > 0 && (
                                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-700 mb-3">Data Sources</h4>
                                                    <ul className="text-xs text-gray-500 space-y-1">
                                                        {result.citations.map((cite, idx) => (
                                                            <li key={idx}>
                                                                <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="hover:text-fuchsia-600 hover:underline truncate block">
                                                                    {cite.title}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
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
