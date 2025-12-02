
import React, { useState, useCallback } from 'react';
import { summarizeText } from '../services/geminiService';
import { Spinner } from './Spinner';

interface SummarizeTextViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-sky-600 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white font-bold mr-3">{step}</span>
            {title}
        </h3>
        <div className="pl-9">{children}</div>
    </div>
);

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
             <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-600">Your Summary Will Appear Here</h3>
        <p className="mt-2">Paste your text, choose your options, and click "Summarize".</p>
    </div>
);

type SummaryLength = 'Short (1-2 lines)' | 'Medium (1 paragraph)' | 'Detailed (2-3 paragraphs)';
const SUMMARY_LENGTHS: SummaryLength[] = ['Short (1-2 lines)', 'Medium (1 paragraph)', 'Detailed (2-3 paragraphs)'];

type Tone = 'Neutral' | 'Academic' | 'Simple' | 'Professional';
const TONES: Tone[] = ['Neutral', 'Academic', 'Simple', 'Professional'];

export const SummarizeTextView: React.FC<SummarizeTextViewProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [summaryLength, setSummaryLength] = useState<SummaryLength>(SUMMARY_LENGTHS[1]);
    const [tone, setTone] = useState<Tone>(TONES[0]);
    const [highlightPoints, setHighlightPoints] = useState(false);
    const [bulletSummary, setBulletSummary] = useState(false);
    
    const [summaryResult, setSummaryResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const wordCount = inputText.split(/\s+/).filter(Boolean).length;

    const handleSummarize = useCallback(async () => {
        if (!inputText.trim()) {
            alert('Please enter some text to summarize.');
            return;
        }
        setIsLoading(true);
        setSummaryResult('');
        try {
            const result = await summarizeText(inputText, summaryLength, tone, highlightPoints, bulletSummary);
            setSummaryResult(result);
        } catch (error) {
            console.error("Error summarizing text:", error);
            alert("Failed to summarize text. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [inputText, summaryLength, tone, highlightPoints, bulletSummary]);

    const handleCopy = () => {
        // Create a temporary element to hold the plain text version
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryResult.replace(/<br \/>/g, '\n').replace(/<strong>(.*?)<\/strong>/g, '$1');
        const textToCopy = tempDiv.textContent || tempDiv.innerText || '';
        
        navigator.clipboard.writeText(textToCopy);
        alert('Summary copied to clipboard!');
    };

    const handleDownload = () => {
         // Create a temporary element to hold the plain text version
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryResult.replace(/<br \/>/g, '\n').replace(/<strong>(.*?)<\/strong>/g, '$1');
        const textToDownload = tempDiv.textContent || tempDiv.innerText || '';

        const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'summary.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formattedSummary = summaryResult
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="bg-sky-100 text-sky-800 px-1 rounded-md">$1</strong>')
        .replace(/\* (.*?)(<br \/>|$)/g, '<li class="ml-4 list-disc">$1</li>');


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Summarizing..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-sky-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Paste Your Text" step={1}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste or type any text you want to summarize..."
                            className="w-full h-48 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-700 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                        <p className="text-right text-sm text-gray-500 mt-1">{wordCount} words</p>
                    </Section>

                    <Section title="Customize Summary" step={2}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Summary Length</label>
                                <div className="flex flex-wrap gap-2">
                                    {SUMMARY_LENGTHS.map(len => (
                                        <button key={len} onClick={() => setSummaryLength(len)} disabled={isLoading} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all border ${summaryLength === len ? 'bg-sky-500 border-sky-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-sky-500 hover:bg-sky-50'}`}>{len}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                                <div className="flex flex-wrap gap-2">
                                    {TONES.map(t => (
                                        <button key={t} onClick={() => setTone(t)} disabled={isLoading} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all border ${tone === t ? 'bg-sky-500 border-sky-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-sky-500 hover:bg-sky-50'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Additional Features" step={3}>
                         <div className="space-y-3">
                            <label htmlFor="highlight-toggle" className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-gray-700">Highlight key points</span>
                                <div className="relative">
                                    <input id="highlight-toggle" type="checkbox" className="sr-only" checked={highlightPoints} onChange={(e) => setHighlightPoints(e.target.checked)} disabled={isLoading} />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${highlightPoints ? 'bg-sky-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${highlightPoints ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                             <label htmlFor="bullet-toggle" className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-gray-700">Show bullet summary</span>
                                <div className="relative">
                                    <input id="bullet-toggle" type="checkbox" className="sr-only" checked={bulletSummary} onChange={(e) => setBulletSummary(e.target.checked)} disabled={isLoading} />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${bulletSummary ? 'bg-sky-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${bulletSummary ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </Section>

                    <button onClick={handleSummarize} disabled={isLoading || !inputText.trim()} className="w-full mt-4 py-3 bg-sky-500 text-white font-bold text-lg rounded-lg hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Summarize
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    {summaryResult ? (
                        <div className="flex-grow overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Summary</h2>
                            <div className="prose-light max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: formattedSummary }} />
                        </div>
                    ) : (
                        <OutputPlaceholder />
                    )}
                    {summaryResult && (
                         <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                            <button onClick={handleCopy} className="flex-grow px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition">Copy Summary</button>
                            <button onClick={handleDownload} className="flex-grow px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition">Download as .txt</button>
                             <button onClick={handleSummarize} disabled={isLoading} className="flex-grow px-4 py-2 bg-sky-500 text-white font-semibold rounded-md hover:bg-sky-600 disabled:bg-sky-300 transition">Rewrite</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
