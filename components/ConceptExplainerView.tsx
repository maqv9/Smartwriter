
import React, { useState, useCallback } from 'react';
import { explainConcept } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ConceptIcon, DownloadIcon } from './icons';
import type { ConceptExplanationResult, ComplexityLevel } from '../types';

interface ConceptExplainerViewProps {
    onBack: () => void;
}

const LEVELS: ComplexityLevel[] = ['ELI5', 'Basic', 'Intermediate', 'Advanced', 'PhD'];

const LevelSlider: React.FC<{ value: number, onChange: (val: number) => void }> = ({ value, onChange }) => {
    return (
        <div className="w-full px-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                {LEVELS.map((level, idx) => (
                    <span key={level} className={`${idx === value ? 'text-green-600 scale-110' : ''} transition-all`}>{level}</span>
                ))}
            </div>
            <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">Child</span>
                <span className="text-xs text-gray-400">Expert</span>
            </div>
        </div>
    );
};

export const ConceptExplainerView: React.FC<ConceptExplainerViewProps> = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [levelIndex, setLevelIndex] = useState(1); // Default to Basic
    const [result, setResult] = useState<ConceptExplanationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleExplain = useCallback(async () => {
        if (!topic.trim()) {
            alert('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await explainConcept(topic, LEVELS[levelIndex]);
            setResult(data);
        } catch (error) {
            console.error("Explanation failed:", error);
            alert("Failed to explain concept. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [topic, levelIndex]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied!');
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-green-50">
            {isLoading && <Spinner message={`Explaining "${topic}" at ${LEVELS[levelIndex]} level...`} />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-green-700 hover:text-green-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ConceptIcon className="h-7 w-7 text-green-600" />
                        Concept Explainer
                    </h1>
                </div>
                <div className="w-8"></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-green-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto">
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2">I want to understand...</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Quantum Entanglement, Inflation, APIs"
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-lg text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                        />
                    </div>

                    <div className="mb-10">
                        <label className="block text-sm font-bold text-gray-700 mb-4">Complexity Level</label>
                        <LevelSlider value={levelIndex} onChange={setLevelIndex} />
                        <p className="mt-4 text-center text-sm text-green-700 font-medium bg-green-50 py-2 rounded border border-green-100">
                            Current Mode: {LEVELS[levelIndex]}
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-6">
                        <h4 className="font-bold mb-2">Includes:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Clear Explanation</li>
                            <li>Relatable Analogy</li>
                            <li>Real-World Example</li>
                            <li>Visual Flowchart</li>
                        </ul>
                    </div>

                    <button 
                        onClick={handleExplain} 
                        disabled={isLoading || !topic.trim()}
                        className="w-full mt-auto py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Explain It
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-green-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <ConceptIcon className="h-16 w-16 mb-4 text-green-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Confused? Let me clarify.</h3>
                            <p className="mt-2 max-w-md">Enter a concept and choose a level. I'll explain it so it finally makes sense.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-6 lg:p-8 bg-gray-50">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-3xl font-bold text-gray-800 capitalize">{topic}</h2>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded-full text-sm border border-green-200">{LEVELS[levelIndex]} Explanation</span>
                                </div>

                                {/* Core Explanation */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-700">The Explanation</h3>
                                        <button onClick={() => handleCopy(result.explanation)} className="text-xs text-gray-400 hover:text-green-600">Copy</button>
                                    </div>
                                    <div className="prose prose-green max-w-none text-gray-700 leading-relaxed">
                                        {result.explanation}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Analogy */}
                                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                                            <span className="text-xl">🎨</span> Analogy
                                        </h3>
                                        <p className="text-purple-900 italic leading-relaxed">"{result.analogy}"</p>
                                    </div>

                                    {/* Real World Example */}
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                                            <span className="text-xl">🌍</span> In Real Life
                                        </h3>
                                        <p className="text-blue-900 leading-relaxed">{result.realLifeExample}</p>
                                    </div>
                                </div>

                                {/* Visual Mode (Text-based Flowchart) */}
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-sm text-white">
                                    <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                                        <span className="text-xl">📊</span> Visual Map
                                    </h3>
                                    <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap overflow-x-auto p-2 bg-black rounded border border-gray-800">
                                        {result.visualDescription}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
