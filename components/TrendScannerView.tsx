
import React, { useState, useCallback } from 'react';
import { scanTrends } from '../services/geminiService';
import { Spinner } from './Spinner';
import { TrendIcon } from './icons';
import type { TrendScanResult, TrendItem } from '../types';

interface TrendScannerViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-rose-600 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white font-bold mr-3">{step}</span>
            {title}
        </h3>
        <div className="pl-9">{children}</div>
    </div>
);

const TrendCard: React.FC<{ trend: TrendItem }> = ({ trend }) => {
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Content idea copied!');
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{trend.topic}</h3>
                    <span className="inline-block bg-rose-100 text-rose-800 text-xs px-2 py-1 rounded-full font-semibold mt-1">{trend.volumeLabel} Volume</span>
                </div>
                <div className="text-center">
                    <div className={`text-xl font-bold ${trend.viralityScore > 80 ? 'text-green-500' : 'text-yellow-500'}`}>{trend.viralityScore}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Virality</div>
                </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 border-l-4 border-rose-200 pl-3 italic">"{trend.reason}"</p>
            
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Content Angles</h4>
                <ul className="space-y-2">
                    {trend.contentIdeas.map((idea, idx) => (
                        <li key={idx} className="flex items-start text-sm group cursor-pointer" onClick={() => handleCopy(idea)}>
                            <span className="text-rose-500 mr-2">•</span>
                            <span className="text-gray-700 group-hover:text-rose-600 transition-colors">{idea}</span>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <TrendIcon className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">No Trends Scanned Yet</h3>
        <p className="mt-2">Select your niche and platform to discover what's viral.</p>
    </div>
);

const PLATFORMS = ['YouTube', 'TikTok', 'Twitter (X)', 'LinkedIn', 'Instagram', 'Google Search'];
const TIMEFRAMES = ['Past 24 Hours', 'Past 7 Days', 'Past 30 Days'];

export const TrendScannerView: React.FC<TrendScannerViewProps> = ({ onBack }) => {
    const [niche, setNiche] = useState('');
    const [platform, setPlatform] = useState(PLATFORMS[0]);
    const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
    const [resultCount, setResultCount] = useState(5);
    const [minScore, setMinScore] = useState(0);
    
    const [result, setResult] = useState<TrendScanResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleScan = useCallback(async () => {
        if (!niche.trim()) {
            alert('Please enter a niche or industry.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const apiResult = await scanTrends(niche, platform, timeframe, resultCount);
            setResult(apiResult);
        } catch (error) {
            console.error("Error scanning trends:", error);
            alert("Failed to scan trends. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [niche, platform, timeframe, resultCount]);

    const filteredTrends = result?.trends.filter(t => t.viralityScore >= minScore) || [];

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Scanning the web for trends..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-rose-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Target Niche" step={1}>
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="e.g. Artificial Intelligence, Keto Diet, Streetwear"
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                    </Section>

                    <Section title="Platform & Time" step={2}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(p => (
                                        <button key={p} onClick={() => setPlatform(p)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${platform === p ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-rose-500 hover:bg-rose-50'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                                <select value={timeframe} onChange={e => setTimeframe(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-rose-500 focus:outline-none transition">
                                    {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Scan Settings" step={3}>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    <span>Number of Trends</span>
                                    <span className="font-bold text-rose-600">{resultCount}</span>
                                </label>
                                <input type="range" min="3" max="10" value={resultCount} onChange={e => setResultCount(Number(e.target.value))} className="w-full accent-rose-500"/>
                            </div>
                            
                            {result && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                        <span>Min Virality Score</span>
                                        <span className="font-bold text-rose-600">{minScore}</span>
                                    </label>
                                    <input type="range" min="0" max="100" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-rose-500"/>
                                </div>
                            )}
                        </div>
                    </Section>

                    <button onClick={handleScan} disabled={isLoading || !niche.trim()} className="w-full mt-4 py-3 bg-rose-500 text-white font-bold text-lg rounded-lg hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Scan Trends
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-2/3 lg:w-3/4 bg-gray-50 border border-gray-200 rounded-lg p-6 h-full flex flex-col overflow-y-auto">
                    {result ? (
                        <div className="flex-grow">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Trend Report</h2>
                                    <p className="text-gray-500">Top trends for <span className="font-semibold text-rose-600">{niche}</span> on {platform}</p>
                                </div>
                                <div className="text-right text-sm text-gray-400">
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                            
                            {filteredTrends.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No trends match your filter criteria. Try lowering the minimum score.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredTrends.map((trend, idx) => (
                                        <TrendCard key={idx} trend={trend} />
                                    ))}
                                </div>
                            )}
                            
                            {result.citations && result.citations.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Sources</h3>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                                        {result.citations.map((cite, index) => (
                                            <li key={index}>
                                                <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="hover:text-rose-600 hover:underline">{cite.title}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <OutputPlaceholder />
                    )}
                </div>
            </div>
        </div>
    );
};
