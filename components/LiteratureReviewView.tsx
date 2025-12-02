import React, { useState, useRef, useCallback } from 'react';
import { synthesizeLiterature } from '../services/geminiService';
import { Spinner } from './Spinner';
import { LiteratureIcon, GraphIcon, DownloadIcon } from './icons';
import type { LiteratureSynthesisResult, GraphNode, GraphLink } from '../types';

interface LiteratureReviewViewProps {
    onBack: () => void;
}

// Simple Graph Component using SVG
const SimpleNetworkGraph: React.FC<{ nodes: GraphNode[], links: GraphLink[] }> = ({ nodes, links }) => {
    // Basic force simulation mockup or just random positioning for visual demo
    // In a real app, use d3-force or react-force-graph
    
    // Assign fixed positions based on index for stability in this demo
    const width = 600;
    const height = 400;
    
    const positionedNodes = nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = node.type === 'topic' ? 50 : 150 + Math.random() * 50;
        return {
            ...node,
            x: width/2 + Math.cos(angle) * radius,
            y: height/2 + Math.sin(angle) * radius,
            color: node.type === 'topic' ? '#F472B6' : '#60A5FA' // Pink for topics, Blue for papers
        };
    });

    const getCoords = (id: string) => positionedNodes.find(n => n.id === id);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-50 border border-slate-200 rounded-lg">
            {links.map((link, i) => {
                const source = getCoords(link.source);
                const target = getCoords(link.target);
                if (!source || !target) return null;
                return (
                    <line 
                        key={i}
                        x1={source.x} y1={source.y}
                        x2={target.x} y2={target.y}
                        stroke="#CBD5E1"
                        strokeWidth="1"
                    />
                );
            })}
            {positionedNodes.map((node) => (
                <g key={node.id}>
                    <circle 
                        cx={node.x} cy={node.y} 
                        r={node.val * 3 + 5} 
                        fill={node.color} 
                        stroke="#fff" 
                        strokeWidth="2"
                        className="transition-all duration-300 hover:scale-110 cursor-pointer"
                    >
                        <title>{node.label}</title>
                    </circle>
                    <text 
                        x={node.x} y={node.y + node.val * 3 + 15} 
                        textAnchor="middle" 
                        fontSize="10" 
                        className="fill-slate-600 font-medium pointer-events-none"
                    >
                        {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
                    </text>
                </g>
            ))}
        </svg>
    );
};

const FileUploadArea: React.FC<{ onFilesSelected: (files: File[]) => void }> = ({ onFilesSelected }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            const pdfs = Array.from(e.dataTransfer.files).filter((f: File) => f.type === 'application/pdf');
            if (pdfs.length > 0) onFilesSelected(pdfs);
            else alert("Please upload PDF files only.");
        }
    };

    return (
        <div 
            className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-slate-400 bg-slate-100' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                multiple 
                accept="application/pdf" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => {
                    if (e.target.files) onFilesSelected(Array.from(e.target.files));
                }}
            />
            <LiteratureIcon className="h-10 w-10 text-slate-400 mb-2" />
            <h3 className="text-lg font-semibold text-slate-700">Drag & Drop Research Papers</h3>
            <p className="text-sm text-slate-500 mt-1">or click to browse (PDF only)</p>
            <p className="text-xs text-slate-400 mt-2">Max 5 files for this demo</p>
        </div>
    );
};

export const LiteratureReviewView: React.FC<LiteratureReviewViewProps> = ({ onBack }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [result, setResult] = useState<LiteratureSynthesisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'synthesis' | 'matrix' | 'graph' | 'chat'>('synthesis');
    const [loadingStep, setLoadingStep] = useState('');

    const handleFilesSelected = (newFiles: File[]) => {
        if (newFiles.length + files.length > 5) {
            alert("To ensure browser stability for this demo, please limit to 5 PDFs at a time.");
            return;
        }
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSynthesize = useCallback(async () => {
        if (files.length === 0) return;
        setIsLoading(true);
        setLoadingStep("Reading documents & extracting text...");
        try {
            // In a real app with a backend, we'd handle chunking here.
            // For client-side, we trust Gemini's context window.
            setTimeout(() => setLoadingStep("Analyzing citation networks..."), 2000);
            setTimeout(() => setLoadingStep("Identifying research gaps..."), 4000);
            setTimeout(() => setLoadingStep("Drafting synthesis..."), 6000);
            
            const synthesisResult = await synthesizeLiterature(files);
            setResult(synthesisResult);
        } catch (error) {
            console.error("Synthesis failed:", error);
            alert("Failed to synthesize. Try fewer or smaller PDFs.");
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    }, [files]);

    const downloadReport = () => {
        if (!result) return;
        const text = `# Literature Synthesis\n\n## Background\n${result.synthesis.background}\n\n## Methodology Overview\n${result.synthesis.methodologyOverview}\n\n## Key Findings\n${result.synthesis.keyFindings}\n\n## Research Gaps\n${result.synthesis.researchGaps}\n\n## Conclusion\n${result.synthesis.conclusion}`;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'literature_review.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-slate-50">
            {isLoading && <Spinner message={loadingStep || "Synthesizing Literature..."} />}
            
            <div className="flex items-center justify-between mb-4">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LiteratureIcon className="h-6 w-6 text-slate-600" />
                        Literature Review Synthesizer
                    </h1>
                </div>
                {result && (
                    <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export
                    </button>
                )}
            </div>

            {!result ? (
                <div className="max-w-3xl mx-auto w-full mt-10">
                    <FileUploadArea onFilesSelected={handleFilesSelected} />
                    
                    {files.length > 0 && (
                        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-700 mb-3">Selected Papers ({files.length})</h3>
                            <ul className="space-y-2">
                                {files.map((file, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 bg-red-100 text-red-500 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold">PDF</div>
                                            <span className="text-sm text-slate-700 truncate">{file.name}</span>
                                        </div>
                                        <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={handleSynthesize}
                                    className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition shadow-lg transform hover:scale-105"
                                >
                                    Start Synthesis
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-grow flex flex-col md:flex-row gap-6 h-full overflow-hidden mt-2">
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                            {[
                                { id: 'synthesis', label: 'Synthesis', icon: <LiteratureIcon className="h-4 w-4" /> },
                                { id: 'matrix', label: 'Evidence Matrix', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
                                { id: 'graph', label: 'Citation Graph', icon: <GraphIcon className="h-4 w-4" /> },
                                { id: 'chat', label: 'Ask Corpus', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-grow overflow-y-auto">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Identified Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {result.topics.map(topic => (
                                    <span key={topic} className="px-2 py-1 bg-pink-50 text-pink-600 text-xs rounded-md border border-pink-100 font-medium">{topic}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        {activeTab === 'synthesis' && (
                            <div className="p-8 overflow-y-auto h-full prose prose-slate max-w-none">
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Literature Synthesis</h2>
                                
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-3">1. Background & Context</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{result.synthesis.background}</p>
                                    </section>
                                    
                                    <section>
                                        <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-3">2. Methodology Overview</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{result.synthesis.methodologyOverview}</p>
                                    </section>
                                    
                                    <section>
                                        <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-3">3. Key Findings & Consensus</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{result.synthesis.keyFindings}</p>
                                    </section>
                                    
                                    <section>
                                        <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-3">4. Research Gaps & Opportunities</h3>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-slate-700">
                                            <p className="whitespace-pre-line">{result.synthesis.researchGaps}</p>
                                        </div>
                                    </section>
                                    
                                    <section>
                                        <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-3">5. Conclusion</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{result.synthesis.conclusion}</p>
                                    </section>
                                </div>
                            </div>
                        )}

                        {activeTab === 'matrix' && (
                            <div className="p-6 overflow-hidden flex flex-col h-full">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4">Evidence Matrix</h2>
                                <div className="overflow-x-auto flex-grow rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-800 font-semibold uppercase text-xs">
                                            <tr>
                                                <th className="p-4 border-b">Study</th>
                                                <th className="p-4 border-b">Year</th>
                                                <th className="p-4 border-b">Method</th>
                                                <th className="p-4 border-b">Sample</th>
                                                <th className="p-4 border-b w-1/3">Key Finding</th>
                                                <th className="p-4 border-b">Limitations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {result.matrix.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition">
                                                    <td className="p-4 font-medium text-slate-900">{row.study}</td>
                                                    <td className="p-4">{row.year}</td>
                                                    <td className="p-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">{row.method}</span></td>
                                                    <td className="p-4">{row.sampleSize}</td>
                                                    <td className="p-4">{row.keyFinding}</td>
                                                    <td className="p-4 text-slate-500 italic">{row.limitations}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'graph' && (
                            <div className="p-6 h-full flex flex-col">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Citation Network & Topic Clusters</h2>
                                <p className="text-slate-500 mb-4">Visualizing connections between papers and core research themes.</p>
                                <div className="flex-grow border border-slate-200 rounded-xl bg-slate-50 overflow-hidden relative">
                                    <SimpleNetworkGraph nodes={result.graph.nodes} links={result.graph.links} />
                                    <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow border border-slate-100 text-xs">
                                        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Paper</div>
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400"></span> Topic</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'chat' && (
                            <div className="flex flex-col h-full">
                                <div className="flex-grow flex items-center justify-center bg-slate-50">
                                    <div className="text-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        <h3 className="text-lg font-semibold">Chat with your Corpus</h3>
                                        <p className="text-sm">Coming soon in the next update.</p>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-200 bg-white">
                                    <div className="relative">
                                        <input disabled type="text" placeholder="Ask a question about these papers..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-12 py-3 focus:outline-none" />
                                        <button disabled className="absolute right-2 top-2 p-1 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};