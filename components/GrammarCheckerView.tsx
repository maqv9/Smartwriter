
import React, { useState, useCallback } from 'react';
import { checkGrammarAndRewrite } from '../services/geminiService';
import { Spinner } from './Spinner';
import { GrammarIcon } from './icons';
import type { GrammarCheckResult, GrammarTone } from '../types';

interface GrammarCheckerViewProps {
    onBack: () => void;
}

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <GrammarIcon className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">Your Corrected Text Will Appear Here</h3>
        <p className="mt-2">Paste your text, choose a tone, and click "Check Grammar".</p>
    </div>
);

const TONES: GrammarTone[] = ['Default', 'Formal', 'Casual', 'Academic', 'Friendly', 'Creative'];

export const GrammarCheckerView: React.FC<GrammarCheckerViewProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [selectedTone, setSelectedTone] = useState<GrammarTone>(TONES[0]);
    
    const [result, setResult] = useState<GrammarCheckResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

    const handleCheck = useCallback(async () => {
        if (!inputText.trim()) {
            alert('Please enter some text to check.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const apiResult = await checkGrammarAndRewrite(inputText, selectedTone);
            setResult(apiResult);
        } catch (error) {
            console.error("Error checking grammar:", error);
            alert("Failed to check grammar. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [inputText, selectedTone]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Text copied to clipboard!');
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Checking..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full flex flex-col">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-red-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w.3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>
                    
                    <div className="flex-grow flex flex-col">
                        <h3 className="text-lg font-semibold text-red-600 mb-3">Your Text</h3>
                        <div className="relative flex-grow">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste or type text here..."
                                className="w-full h-full absolute top-0 left-0 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition resize-none"
                                disabled={isLoading}
                            />
                        </div>
                        <p className="text-right text-sm text-gray-500 mt-2">{wordCount} words</p>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-red-600 mb-3">Tone Fixer (Optional)</h3>
                         <div className="flex flex-wrap gap-2">
                            {TONES.map(tone => (
                                <button key={tone} onClick={() => setSelectedTone(tone)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${selectedTone === tone ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-red-500 hover:bg-red-50'}`}>{tone}</button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleCheck} disabled={isLoading || !inputText.trim()} className="w-full mt-6 py-3 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Check Grammar
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    {!result ? <OutputPlaceholder /> : (
                        <div className="flex-grow flex flex-col overflow-y-auto">
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Results</h2>
                                <p className="text-sm text-gray-500 mt-1">{result.summaryOfChanges} (Readability: {result.readabilityScore})</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-gray-600">Original</h3>
                                        <button onClick={() => handleCopy(inputText)} className="text-xs font-medium text-gray-500 hover:text-gray-800">Copy</button>
                                    </div>
                                    <div className="text-sm text-gray-700 overflow-y-auto flex-grow whitespace-pre-wrap">{inputText}</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                         <h3 className="font-semibold text-green-800">Corrected</h3>
                                        <button onClick={() => handleCopy(result.correctedText)} className="text-xs font-medium text-green-700 hover:text-green-900">Copy</button>
                                    </div>
                                    <div className="text-sm text-green-900 overflow-y-auto flex-grow whitespace-pre-wrap">{result.correctedText}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
