
import React, { useState, useCallback } from 'react';
import { generateResearchOutline } from '../services/geminiService';
import { Spinner } from './Spinner';
import { OutlinerIcon, DownloadIcon } from './icons';
import type { ResearchOutlineResult } from '../types';

interface ResearchPaperOutlinerViewProps {
    onBack: () => void;
}

const FIELDS = [
    'Psychology', 'Computer Science', 'Business & Management', 
    'Education', 'Engineering', 'Health Sciences', 
    'Sociology', 'Economics', 'History', 'Other'
];

const DEPTHS = ['Short (1-Page)', 'Standard (Detailed)', 'Full (Section-by-Section)'];

export const ResearchPaperOutlinerView: React.FC<ResearchPaperOutlinerViewProps> = ({ onBack }) => {
    const [question, setQuestion] = useState('');
    const [field, setField] = useState(FIELDS[0]);
    const [depth, setDepth] = useState(DEPTHS[1]);
    const [result, setResult] = useState<ResearchOutlineResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!question.trim()) {
            alert('Please enter a research question.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await generateResearchOutline(question, field, depth);
            setResult(data);
        } catch (error) {
            console.error("Outline generation failed:", error);
            alert("Failed to generate outline. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [question, field, depth]);

    const handleExport = () => {
        if (!result) return;
        let content = `# ${result.paperTitle}\n\n`;
        content += `## Abstract\n${result.abstract}\n\n`;
        
        content += `## Outline\n`;
        result.sections.forEach(sec => {
            content += `### ${sec.title}\n`;
            sec.points.forEach(p => content += `- ${p}\n`);
            content += '\n';
        });

        content += `## Methodology Options\n`;
        result.methodologyOptions.forEach(m => {
            content += `### ${m.name}\n${m.description}\n**Sample:** ${m.samplePlan}\n**Analysis:** ${m.analysisPlan}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'research_outline.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-green-50">
            {isLoading && <Spinner message="Structuring your research paper..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-green-700 hover:text-green-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <OutlinerIcon className="h-7 w-7 text-green-600" />
                        Research Paper Outliner
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-200 text-green-800 font-semibold rounded-lg hover:bg-green-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-green-200 rounded-xl p-5 h-full overflow-y-auto shadow-sm">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Research Question</label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. How does remote work impact employee retention in tech startups?"
                            className="w-full h-32 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition resize-none"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Field of Study</label>
                        <select 
                            value={field} 
                            onChange={(e) => setField(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                        >
                            {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Outline Depth</label>
                        <div className="flex flex-col gap-2">
                            {DEPTHS.map(d => (
                                <button 
                                    key={d} 
                                    onClick={() => setDepth(d)}
                                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all border text-left flex items-center justify-between ${depth === d ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-green-500 hover:bg-green-50'}`}
                                >
                                    {d}
                                    {depth === d && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !question.trim()}
                        className="w-full py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Generate Outline
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-green-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <OutlinerIcon className="h-16 w-16 mb-4 text-green-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Ready to Structure Your Paper?</h3>
                            <p className="mt-2 max-w-md">Enter your research question to get a publication-ready skeleton, methodology plans, and a timeline.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-6 lg:p-10 space-y-10">
                            {/* Header */}
                            <div className="border-b border-gray-100 pb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{result.paperTitle}</h1>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h3 className="text-xs font-bold text-green-600 uppercase mb-2 tracking-wide">Abstract Draft</h3>
                                    <p className="text-gray-700 leading-relaxed text-sm italic">{result.abstract}</p>
                                </div>
                            </div>

                            {/* Section Skeleton */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="bg-gray-800 text-white w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                                    Paper Skeleton
                                </h2>
                                <div className="space-y-4">
                                    {result.sections.map((sec, idx) => (
                                        <div key={idx} className="group">
                                            <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-green-600 transition-colors">{sec.title}</h3>
                                            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2 border-l-2 border-gray-200 pl-4 py-1 group-hover:border-green-200 transition-colors">
                                                {sec.points.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Method Options */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                                    Methodology Pathways
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.methodologyOptions.map((opt, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                                            <h4 className="font-bold text-blue-700 mb-2">{opt.name}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{opt.description}</p>
                                            <div className="text-xs space-y-2">
                                                <div className="bg-blue-50 p-2 rounded text-blue-800">
                                                    <strong>Sample:</strong> {opt.samplePlan}
                                                </div>
                                                <div className="bg-purple-50 p-2 rounded text-purple-800">
                                                    <strong>Analysis:</strong> {opt.analysisPlan}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="bg-purple-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs">3</span>
                                    Project Timeline
                                </h2>
                                <div className="relative border-l-2 border-purple-200 ml-3 space-y-6 pb-2">
                                    {result.timeline.map((phase, idx) => (
                                        <div key={idx} className="ml-6 relative">
                                            <span className="absolute -left-[31px] top-0 bg-purple-100 border-4 border-white w-4 h-4 rounded-full"></span>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-bold text-gray-800">{phase.phase}</h4>
                                                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{phase.duration}</span>
                                            </div>
                                            <ul className="text-sm text-gray-600 list-disc list-inside">
                                                {phase.tasks.map((t, i) => <li key={i}>{t}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Readings */}
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 mb-3">Suggested Readings / Keywords</h2>
                                <div className="flex flex-wrap gap-2">
                                    {result.suggestedReadings.map((reading, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200">
                                            {reading}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
