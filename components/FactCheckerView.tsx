
import React, { useState, useCallback } from 'react';
import { verifyClaim } from '../services/geminiService';
import { Spinner } from './Spinner';
import { FactCheckIcon, DownloadIcon } from './icons';
import type { FactCheckResult, VerdictType } from '../types';

interface FactCheckerViewProps {
    onBack: () => void;
}

const VerdictBadge: React.FC<{ verdict: VerdictType }> = ({ verdict }) => {
    let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
    let icon = '❓';

    switch (verdict) {
        case 'True':
            colorClass = 'bg-green-100 text-green-800 border-green-200';
            icon = '✅';
            break;
        case 'False':
            colorClass = 'bg-red-100 text-red-800 border-red-200';
            icon = '❌';
            break;
        case 'Partially True':
            colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            icon = '⚠️';
            break;
        case 'Misleading':
            colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
            icon = '🛑';
            break;
        case 'Unverified':
            colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
            icon = '🤷';
            break;
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold uppercase tracking-wide ${colorClass}`}>
            <span className="text-xl">{icon}</span>
            <span>{verdict}</span>
        </div>
    );
};

export const FactCheckerView: React.FC<FactCheckerViewProps> = ({ onBack }) => {
    const [claim, setClaim] = useState('');
    const [result, setResult] = useState<FactCheckResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'conflicts' | 'simplified'>('details');

    const handleVerify = useCallback(async () => {
        if (!claim.trim()) {
            alert('Please enter a claim to verify.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const data = await verifyClaim(claim);
            setResult(data);
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to verify claim. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [claim]);

    const handleExport = () => {
        if (!result) return;
        const text = `Fact Check Report\n\nClaim: ${claim}\nVerdict: ${result.verdict}\nConfidence: ${result.confidenceScore}%\n\nExplanation:\n${result.explanation}\n\nSources:\n${result.sources.map(s => `- ${s.title}: ${s.uri}`).join('\n')}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fact_check_report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-emerald-50/30">
            {isLoading && <Spinner message="Searching verified sources & analyzing truth..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FactCheckIcon className="h-7 w-7 text-emerald-600" />
                        Fact-Checker
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-200 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export Report
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-emerald-100 rounded-xl p-5 h-full flex flex-col shadow-sm">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Claim to Verify</label>
                        <p className="text-xs text-gray-500 mb-3">Enter a statement, rumor, or news headline.</p>
                        <textarea
                            value={claim}
                            onChange={(e) => setClaim(e.target.value)}
                            placeholder="e.g. Sugar causes cancer, or Elon Musk founded Tesla..."
                            className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition resize-none text-lg"
                        />
                    </div>

                    <button 
                        onClick={handleVerify} 
                        disabled={isLoading || !claim.trim()}
                        className="w-full mt-auto py-3 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Check Facts
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-emerald-100 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <FactCheckIcon className="h-16 w-16 mb-4 text-emerald-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Truth Detector</h3>
                            <p className="mt-2 max-w-md">We use Google Search grounding to validate claims against credible sources instantly.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Header Result */}
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <VerdictBadge verdict={result.verdict} />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-500 uppercase">Confidence Score</span>
                                        <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${result.confidenceScore > 80 ? 'bg-green-500' : result.confidenceScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                style={{ width: `${result.confidenceScore}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{result.confidenceScore}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                <button 
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Detailed Analysis
                                </button>
                                <button 
                                    onClick={() => setActiveTab('conflicts')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'conflicts' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Bias & Conflicts
                                </button>
                                <button 
                                    onClick={() => setActiveTab('simplified')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'simplified' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    TL;DR
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-white">
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-2">Explanation</h3>
                                            <p className="text-gray-700 leading-relaxed text-lg">{result.explanation}</p>
                                        </div>
                                        
                                        {result.sources.length > 0 && (
                                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                                                    Credible Sources
                                                </h3>
                                                <ul className="space-y-3">
                                                    {result.sources.map((source, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            <a 
                                                                href={source.uri} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium block truncate"
                                                            >
                                                                {source.title}
                                                            </a>
                                                            <span className="text-xs text-gray-400">{new URL(source.uri).hostname}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'conflicts' && (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-orange-50 border border-orange-100 rounded-xl">
                                            <h3 className="text-orange-800 font-bold mb-2 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                Conflicts & Disagreements
                                            </h3>
                                            <p className="text-orange-900 leading-relaxed">{result.conflicts || "No major conflicts found."}</p>
                                        </div>
                                        
                                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl">
                                            <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                Bias Check
                                            </h3>
                                            <p className="text-blue-900 leading-relaxed">{result.biasAnalysis || "No significant bias detected in the phrasing."}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'simplified' && (
                                    <div className="h-full flex flex-col justify-center">
                                        <div className="bg-gray-100 p-8 rounded-2xl border-2 border-gray-200 text-center">
                                            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">10-Second Summary</h3>
                                            <p className="text-2xl font-medium text-gray-800 leading-relaxed">
                                                "{result.simplifiedSummary}"
                                            </p>
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
