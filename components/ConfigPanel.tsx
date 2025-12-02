
import React from 'react';
import type { Tone, Blueprint, KeywordAnalysis } from '../types';
import { MOODS, BLUEPRINTS } from '../constants';

interface ConfigPanelProps {
    topic: string;
    setTopic: (topic: string) => void;
    selectedTones: Tone[];
    onToneSelect: (tone: Tone) => void;
    selectedBlueprint: Blueprint;
    setSelectedBlueprint: (blueprint: Blueprint) => void;
    wordCount: number;
    setWordCount: (count: number) => void;
    onGenerate: () => void;
    keyword: string;
    setKeyword: (keyword: string) => void;
    keywordAnalysis: KeywordAnalysis | null;
    onAnalyzeKeyword: () => void;
    isAnalyzingKeyword: boolean;
    isLoading: boolean;
    isThinkingMode: boolean;
    setIsThinkingMode: (value: boolean) => void;
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-8">
        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold mr-3 text-sm shadow-md shadow-indigo-200">{step}</span>
            {title}
        </h3>
        <div className="pl-10">{children}</div>
    </div>
);

const KeywordAnalysisDisplay: React.FC<{ analysis: KeywordAnalysis }> = ({ analysis }) => {
    const getPillColor = (value: 'Low' | 'Medium' | 'High') => {
        if (value === 'Low') return 'bg-green-100/80 text-green-800 border-green-200';
        if (value === 'Medium') return 'bg-yellow-100/80 text-yellow-800 border-yellow-200';
        return 'bg-rose-100/80 text-rose-800 border-rose-200';
    };

    return (
        <div className="mt-4 p-4 bg-white/60 rounded-xl space-y-3 text-sm border border-white/60 shadow-sm backdrop-blur-md">
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Competition:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPillColor(analysis.competition)}`}>{analysis.competition}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Search Volume:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPillColor(analysis.searchVolume)}`}>{analysis.searchVolume}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Est. CPC:</span>
                <span className="font-bold text-gray-800 font-mono">{analysis.cpc}</span>
            </div>
        </div>
    );
};


export const ConfigPanel: React.FC<ConfigPanelProps> = ({
    topic, setTopic, selectedTones, onToneSelect, selectedBlueprint,
    setSelectedBlueprint, wordCount, setWordCount, onGenerate, keyword, setKeyword, keywordAnalysis,
    onAnalyzeKeyword, isAnalyzingKeyword, isLoading, isThinkingMode, setIsThinkingMode, onBack
}) => {
    return (
        <div className="glass-panel rounded-2xl p-6 h-full overflow-y-auto">
            <button onClick={onBack} className="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 mb-6 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center mr-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                Back to Dashboard
            </button>

            <Section title="Keyword Intelligence" step={1}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="e.g., AI marketing tools"
                        className="glass-input w-full rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition"
                        disabled={isLoading || isAnalyzingKeyword}
                    />
                    <button
                        onClick={onAnalyzeKeyword}
                        disabled={isLoading || isAnalyzingKeyword || !keyword}
                        className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                        {isAnalyzingKeyword ? '...' : 'Analyze'}
                    </button>
                </div>
                {keywordAnalysis && <KeywordAnalysisDisplay analysis={keywordAnalysis} />}
            </Section>
            
            <Section title="Structure Blueprint" step={2}>
                <div className="grid grid-cols-2 gap-3">
                    {BLUEPRINTS.map(bp => (
                        <button 
                            key={bp.name}
                            onClick={() => setSelectedBlueprint(bp)}
                            disabled={isLoading}
                            className={`p-4 text-left rounded-xl border transition-all duration-300 ${
                                selectedBlueprint.name === bp.name 
                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-200' 
                                : 'bg-white/40 border-white/50 text-gray-600 hover:bg-white/80 hover:shadow-md'
                            }`}
                        >
                            <div className="text-2xl mb-2">{bp.icon}</div>
                            <h4 className="font-bold text-sm">{bp.name}</h4>
                        </button>
                    ))}
                </div>
            </section>

            <Section title="Context & Tone" step={3}>
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Main Topic</label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What should I write about?"
                        className="glass-input w-full h-28 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 outline-none transition resize-none"
                        disabled={isLoading}
                    />
                </div>
                 <div className="mb-6">
                    <label htmlFor="word-count-slider" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex justify-between">
                        <span>Length</span>
                        <span className="text-indigo-600">{wordCount} words</span>
                    </label>
                    <input
                        id="word-count-slider"
                        type="range"
                        min="500"
                        max="5000"
                        step="250"
                        value={wordCount}
                        onChange={(e) => setWordCount(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tone (Max 2)</label>
                    <div className="flex flex-wrap gap-2">
                        {MOODS.map(mood => {
                            const isSelected = selectedTones.some(t => t.name === mood.name);
                            const isDisabled = !isSelected && selectedTones.length >= 2;
                            return (
                                <button
                                    key={mood.name}
                                    onClick={() => onToneSelect(mood)}
                                    disabled={isLoading || isDisabled}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border
                                        ${isSelected
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
                                            : 'bg-white/40 border-white/40 text-gray-600 hover:bg-white/80'
                                        }
                                        ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {mood.name}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </Section>
            
            <div className="mt-8 flex items-stretch gap-3">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || !topic}
                    className="flex-grow py-4 bg-gray-900 text-white font-bold text-lg rounded-2xl hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-xl shadow-gray-900/20"
                >
                    Generate Article
                </button>
                 <div className="relative group flex flex-col items-center justify-center p-1">
                    <label htmlFor="thinking-mode-toggle" className="cursor-pointer">
                        <input 
                            id="thinking-mode-toggle" 
                            type="checkbox" 
                            className="sr-only" 
                            checked={isThinkingMode}
                            onChange={(e) => setIsThinkingMode(e.target.checked)}
                            disabled={isLoading}
                        />
                        <div className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isThinkingMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                            <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${isThinkingMode ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                    <span className="text-[10px] text-gray-500 mt-1 font-bold uppercase">Pro Mode</span>
                </div>
            </div>
        </div>
    );
};
