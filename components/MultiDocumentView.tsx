
import React, { useState, useRef, useCallback } from 'react';
import { analyzeMultiDocuments, chatWithMultiDocs } from '../services/geminiService';
import { Spinner } from './Spinner';
import { MultiDocIcon, DownloadIcon } from './icons';
import type { MultiDocAnalysisResult, DocChatMessage } from '../types';

interface MultiDocumentViewProps {
    onBack: () => void;
}

const FileCard: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => (
    <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase">
                {file.name.split('.').pop()}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
        </div>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
);

const ChatMessage: React.FC<{ message: DocChatMessage }> = ({ message }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] rounded-2xl p-4 ${
            message.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
        }`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
            {message.role === 'model' && (
                <div className="flex justify-end mt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">AI Assistant</span>
                </div>
            )}
        </div>
    </div>
);

export const MultiDocumentView: React.FC<MultiDocumentViewProps> = ({ onBack }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [analysis, setAnalysis] = useState<MultiDocAnalysisResult | null>(null);
    const [chatHistory, setChatHistory] = useState<DocChatMessage[]>([]);
    const [currentQuery, setCurrentQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChatting, setIsChatting] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'insights' | 'chat'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (files.length + newFiles.length > 5) {
                alert("Please limit to 5 files for this demo.");
                return;
            }
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (files.length === 0) return;
        setIsLoading(true);
        try {
            const result = await analyzeMultiDocuments(files);
            setAnalysis(result);
            setActiveTab('insights');
        } catch (error) {
            console.error(error);
            alert("Analysis failed. Try fewer or smaller files.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!currentQuery.trim() || files.length === 0) return;
        
        const userMsg: DocChatMessage = { role: 'user', text: currentQuery };
        setChatHistory(prev => [...prev, userMsg]);
        setCurrentQuery('');
        setIsChatting(true);
        
        try {
            const response = await chatWithMultiDocs(files, chatHistory, userMsg.text);
            setChatHistory(prev => [...prev, response]);
        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error processing your request." }]);
        } finally {
            setIsChatting(false);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-blue-50/50">
            {isLoading && <Spinner message="Reading and analyzing multiple documents..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <MultiDocIcon className="h-7 w-7 text-blue-600" />
                        Multi-Document Intelligence
                    </h1>
                </div>
                <div className="w-8"></div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-blue-100 flex">
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Files ({files.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('insights')}
                        disabled={!analysis}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'insights' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}
                    >
                        Insights
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        disabled={files.length === 0}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}
                    >
                        Chat
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-hidden bg-white rounded-2xl border border-blue-200 shadow-sm flex flex-col relative">
                
                {/* UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div 
                            className="w-full max-w-xl h-64 border-2 border-dashed border-blue-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors mb-8"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                multiple 
                                ref={fileInputRef} 
                                onChange={handleFilesSelected} 
                                className="hidden" 
                                accept=".pdf,.docx,.txt,.md"
                            />
                            <MultiDocIcon className="h-16 w-16 text-blue-200 mb-4" />
                            <h3 className="text-xl font-bold text-gray-700">Drop your files here</h3>
                            <p className="text-gray-500 mt-2">Support for PDF, DOCX, TXT (Max 5 files)</p>
                        </div>

                        {files.length > 0 && (
                            <div className="w-full max-w-2xl mb-8">
                                <h4 className="text-left font-bold text-gray-700 mb-3 ml-1">Uploaded Files</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {files.map((f, i) => (
                                        <FileCard key={i} file={f} onRemove={() => removeFile(i)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={handleAnalyze} 
                                disabled={files.length === 0}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg transform hover:scale-105"
                            >
                                Analyze All Docs
                            </button>
                            {files.length > 0 && (
                                <button 
                                    onClick={() => setActiveTab('chat')}
                                    className="px-8 py-3 bg-white border border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition"
                                >
                                    Skip to Chat
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* INSIGHTS TAB */}
                {activeTab === 'insights' && analysis && (
                    <div className="flex-grow overflow-y-auto p-8">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h2 className="text-2xl font-bold text-blue-900 mb-4">Combined Executive Summary</h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis.combinedSummary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="text-xl">🔑</span> Key Themes
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.commonThemes.map((theme, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                                                {theme}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="text-xl">⚠️</span> Conflicts / Gaps
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                        {analysis.conflicts.length > 0 
                                            ? analysis.conflicts.map((c, i) => <li key={i}>{c}</li>) 
                                            : <li className="text-gray-400 italic">No major conflicts detected.</li>
                                        }
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Topic Breakdown</h3>
                                <div className="space-y-4">
                                    {analysis.topics.map((topic, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gray-50/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-blue-800 text-lg">{topic.name}</h4>
                                                <div className="flex -space-x-2">
                                                    {topic.sourceFiles.map((f, fi) => (
                                                        <div key={fi} className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-800" title={f}>
                                                            {f.charAt(0)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3">{topic.description}</p>
                                            <div className="text-xs text-gray-400">Found in: {topic.sourceFiles.join(', ')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50">
                            {chatHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                    <MultiDocIcon className="h-12 w-12 mb-2" />
                                    <p>Ask questions across all {files.length} documents.</p>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => { setCurrentQuery("Compare the main arguments"); handleSendMessage(); }} className="px-3 py-1 bg-white border rounded text-xs hover:bg-gray-100">Compare arguments</button>
                                        <button onClick={() => { setCurrentQuery("Summarize the key findings"); handleSendMessage(); }} className="px-3 py-1 bg-white border rounded text-xs hover:bg-gray-100">Key findings</button>
                                    </div>
                                </div>
                            ) : (
                                chatHistory.map((msg, i) => <ChatMessage key={i} message={msg} />)
                            )}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="relative max-w-4xl mx-auto">
                                <input
                                    type="text"
                                    value={currentQuery}
                                    onChange={(e) => setCurrentQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask about your documents..."
                                    className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-blue-300 rounded-xl px-4 py-3 pr-12 outline-none transition shadow-inner"
                                    disabled={isChatting}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!currentQuery.trim() || isChatting}
                                    className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
