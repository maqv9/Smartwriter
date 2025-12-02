
import React, { useState, useRef, useCallback } from 'react';
import { generateCoverLetter } from '../services/geminiService';
import { Spinner } from './Spinner';
import { CoverLetterIcon, DownloadIcon } from './icons';
import type { CoverLetterResult, CoverLetterTone } from '../types';

interface CoverLetterViewProps {
    onBack: () => void;
}

const TONES: CoverLetterTone[] = ['Professional', 'Casual', 'Confident', 'Friendly'];

export const CoverLetterView: React.FC<CoverLetterViewProps> = ({ onBack }) => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [tone, setTone] = useState<CoverLetterTone>(TONES[0]);
    const [result, setResult] = useState<CoverLetterResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Simple text extraction for .txt and .md. For PDF/Docx in a real app, use a server-side parser or pdf.js
        if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const text = await file.text();
            setResumeText(text);
        } else {
            alert('For this demo, please upload a .txt or .md file, or paste your resume text manually.');
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!resumeText || !jobDescription) {
            alert('Please provide both your resume content and the job description.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await generateCoverLetter(resumeText, jobDescription, tone);
            setResult(data);
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate cover letter. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [resumeText, jobDescription, tone]);

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result.coverLetter);
            alert('Cover letter copied to clipboard!');
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-teal-50">
            {isLoading && <Spinner message="Analyzing job description & tailoring your letter..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CoverLetterIcon className="h-7 w-7 text-teal-600" />
                        Cover Letter Customizer
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-teal-200 text-teal-800 font-semibold rounded-lg hover:bg-teal-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Copy Text
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-teal-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto">
                    
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Your Resume</label>
                        <div 
                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition mb-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleResumeUpload} className="hidden" accept=".txt,.md" />
                            <span className="text-xs font-bold uppercase tracking-wide">Upload .TXT / .MD</span>
                        </div>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Or paste your resume text here..."
                            className="w-full h-32 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition resize-none text-xs"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Job Description</label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here..."
                            className="w-full h-40 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition resize-none text-xs"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">3. Tone</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TONES.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all border ${tone === t ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-teal-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !resumeText || !jobDescription}
                        className="w-full mt-auto py-3 bg-teal-600 text-white font-bold text-lg rounded-xl hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Generate Letter
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-teal-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <CoverLetterIcon className="h-16 w-16 mb-4 text-teal-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Perfect Match Generator</h3>
                            <p className="mt-2 max-w-md">We'll analyze the job description keywords and write a letter that proves you're the best fit.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-8 lg:p-12 bg-white flex flex-col">
                            {/* Analytics Header */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg text-center">
                                    <h4 className="text-xs font-bold text-teal-600 uppercase mb-1">Match Score</h4>
                                    <div className="text-3xl font-bold text-teal-800">{result.matchScore}%</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg col-span-2">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">ATS Keywords Used</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.keywordsUsed.map(k => (
                                            <span key={k} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-medium text-blue-700">{k}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Letter Body */}
                            <div className="flex-grow">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Generated Cover Letter</h2>
                                <div className="prose prose-teal max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-serif text-lg">
                                    {result.coverLetter}
                                </div>
                            </div>
                            
                             {/* Footer Analytics */}
                            {result.missingSkills.length > 0 && (
                                <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-lg">
                                    <h4 className="text-xs font-bold text-orange-600 uppercase mb-2">Missing Skills (Consider adding to resume if applicable)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missingSkills.map(k => (
                                            <span key={k} className="px-2 py-1 bg-white border border-orange-200 rounded text-xs font-medium text-orange-700">{k}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
