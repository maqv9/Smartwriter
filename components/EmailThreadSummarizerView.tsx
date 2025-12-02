
import React, { useState, useCallback } from 'react';
import { summarizeEmailThread } from '../services/geminiService';
import { Spinner } from './Spinner';
import { EmailIcon, DownloadIcon } from './icons';
import type { EmailSummaryResult } from '../types';

interface EmailThreadSummarizerViewProps {
    onBack: () => void;
}

export const EmailThreadSummarizerView: React.FC<EmailThreadSummarizerViewProps> = ({ onBack }) => {
    const [emailText, setEmailText] = useState('');
    const [gdprMode, setGdprMode] = useState(false);
    const [result, setResult] = useState<EmailSummaryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSummarize = useCallback(async () => {
        if (!emailText.trim()) {
            alert('Please paste an email thread.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await summarizeEmailThread(emailText, gdprMode);
            setResult(data);
        } catch (error) {
            console.error("Email summarization failed:", error);
            alert("Failed to summarize email thread. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [emailText, gdprMode]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'Positive': return 'bg-green-100 text-green-800 border-green-200';
            case 'Negative': return 'bg-red-100 text-red-800 border-red-200';
            case 'Frustrated': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Confused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'High': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">High</span>;
            case 'Medium': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 uppercase">Medium</span>;
            default: return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">Low</span>;
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-sky-50">
            {isLoading && <Spinner message="Analyzing email thread..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-sky-700 hover:text-sky-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <EmailIcon className="h-7 w-7 text-sky-600" />
                        Email Thread Summarizer
                    </h1>
                </div>
                 {result && (
                    <button onClick={() => handleCopy(result.draftReply)} className="flex items-center gap-2 px-4 py-2 bg-sky-200 text-sky-800 font-semibold rounded-lg hover:bg-sky-300 transition">
                        Copy Reply
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-sky-200 rounded-xl p-5 h-full flex flex-col shadow-sm">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Paste Email Thread</label>
                        <textarea
                            value={emailText}
                            onChange={(e) => setEmailText(e.target.value)}
                            placeholder="Paste the full email conversation here..."
                            className="w-full h-96 lg:h-[30rem] bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-sky-500 focus:outline-none transition resize-none"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={gdprMode} onChange={(e) => setGdprMode(e.target.checked)} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${gdprMode ? 'bg-sky-500' : 'bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${gdprMode ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-700">GDPR Safe Mode</span>
                        </label>
                    </div>

                    <button 
                        onClick={handleSummarize} 
                        disabled={isLoading || !emailText.trim()}
                        className="w-full mt-auto py-3 bg-sky-600 text-white font-bold text-lg rounded-xl hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Summarize Thread
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-sky-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <EmailIcon className="h-16 w-16 mb-4 text-sky-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Tired of Long Threads?</h3>
                            <p className="mt-2 max-w-md">Paste your emails to instantly get action items, decisions, and a draft reply.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-6 lg:p-8 space-y-8">
                            {/* Header Stats */}
                            <div className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b border-gray-100">
                                <div className={`px-4 py-2 rounded-full border text-sm font-bold ${getSentimentColor(result.sentiment)}`}>
                                    Sentiment: {result.sentiment}
                                </div>
                                <div className="text-sm text-gray-500">
                                    <span className="font-bold text-gray-700">Involved:</span> {result.keyPeople.join(', ')}
                                </div>
                            </div>

                            {/* Summary */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-3">Executive Summary</h2>
                                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {result.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Action Items */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        Action Items
                                        <span className="bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full">{result.actionItems.length}</span>
                                    </h2>
                                    <div className="space-y-3">
                                        {result.actionItems.length === 0 ? <p className="text-gray-400 italic">No action items detected.</p> : 
                                            result.actionItems.map((item, idx) => (
                                                <div key={idx} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm hover:border-sky-300 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-gray-800 text-sm">{item.assignee}</span>
                                                        {getPriorityBadge(item.priority)}
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-2">{item.task}</p>
                                                    {item.deadline && item.deadline !== 'None' && (
                                                        <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                                            Due: {item.deadline}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* Decisions */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        Key Decisions
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{result.decisions.length}</span>
                                    </h2>
                                    <div className="space-y-3">
                                         {result.decisions.length === 0 ? <p className="text-gray-400 italic">No major decisions detected.</p> : 
                                            result.decisions.map((decision, idx) => (
                                                <div key={idx} className="bg-green-50 border border-green-100 p-3 rounded-lg">
                                                    <p className="font-bold text-gray-800 text-sm mb-1">{decision.decision}</p>
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>By: {decision.madeBy}</span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Conversation Timeline</h2>
                                <div className="border-l-2 border-gray-200 ml-3 space-y-6">
                                    {result.timeline.map((event, idx) => (
                                        <div key={idx} className="ml-6 relative">
                                            <span className="absolute -left-[31px] top-1 bg-white border-4 border-gray-300 w-4 h-4 rounded-full"></span>
                                            <div className="font-bold text-gray-800 text-sm">{event.sender}</div>
                                            <p className="text-sm text-gray-600 italic">"{event.snippet}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Draft Reply */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Draft Reply</h2>
                                    <button onClick={() => handleCopy(result.draftReply)} className="text-sm text-sky-600 font-bold hover:underline">Copy Text</button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={result.draftReply} 
                                    className="w-full h-48 bg-white border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};