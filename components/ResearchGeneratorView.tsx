
import React, { useState, useCallback } from 'react';
import { generateResearchContent } from '../services/geminiService';
import { Spinner } from './Spinner';
import type { ResearchResult, ResearchLevel, ResearchOutputType, Citation } from '../types';
import { ResearchIcon } from './icons';

interface ResearchGeneratorViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-600 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white font-bold mr-3">{step}</span>
            {title}
        </h3>
        <div className="pl-9">{children}</div>
    </div>
);

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <ResearchIcon className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">Your Research Starts Here</h3>
        <p className="mt-2">Enter your topic, choose your options, and let the AI assistant help you.</p>
    </div>
);

const LEVELS: ResearchLevel[] = ['School', 'College', 'University', 'Professional'];
const OUTPUT_TYPES: ResearchOutputType[] = ['Research Questions', 'Research Objectives', 'Problem Statement', 'Hypothesis', 'Mini-Proposal'];


export const ResearchGeneratorView: React.FC<ResearchGeneratorViewProps> = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState<ResearchLevel>(LEVELS[1]);
    const [outputType, setOutputType] = useState<ResearchOutputType>(OUTPUT_TYPES[0]);
    const [addCitations, setAddCitations] = useState(false);

    const [result, setResult] = useState<ResearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) {
            alert('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const apiResult = await generateResearchContent(topic, level, outputType, addCitations);
            setResult(apiResult);
        } catch (error) {
            console.error("Error generating research content:", error);
            alert("Failed to generate research content. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [topic, level, outputType, addCitations]);
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };
    
    const renderResult = () => {
        if (!result) return null;

        let contentToCopy = '';
        let contentJsx: React.ReactNode = null;

        switch (result.outputType) {
            case 'Research Questions':
                contentToCopy = result.questions?.join('\n') || '';
                contentJsx = (
                    <ol className="list-decimal list-inside space-y-2">
                        {result.questions?.map((q, i) => <li key={i}>{q}</li>)}
                    </ol>
                );
                break;
            case 'Research Objectives':
                contentToCopy = result.objectives?.join('\n') || '';
                contentJsx = (
                    <ul className="list-disc list-inside space-y-2">
                        {result.objectives?.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                );
                break;
            case 'Problem Statement':
                contentToCopy = result.problemStatement || '';
                contentJsx = <p className="whitespace-pre-wrap">{result.problemStatement}</p>;
                break;
            case 'Hypothesis':
                contentToCopy = result.hypothesis || '';
                contentJsx = <p className="whitespace-pre-wrap">{result.hypothesis}</p>;
                break;
            case 'Mini-Proposal':
                const proposal = result.miniProposal;
                if(proposal){
                    contentToCopy = `Introduction:\n${proposal.introduction}\n\nAim and Objectives:\n${proposal.aimAndObjectives}\n\nScope:\n${proposal.scope}`;
                    contentJsx = (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-purple-700">Introduction</h4>
                                <p className="mt-1 whitespace-pre-wrap">{proposal.introduction}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-purple-700">Aim and Objectives</h4>
                                <p className="mt-1 whitespace-pre-wrap">{proposal.aimAndObjectives}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-purple-700">Scope</h4>
                                <p className="mt-1 whitespace-pre-wrap">{proposal.scope}</p>
                            </div>
                        </div>
                    );
                }
                break;
        }

        return (
             <div className="flex-grow overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{result.outputType}</h2>
                    <button onClick={() => handleCopy(contentToCopy)} className="text-sm font-semibold text-purple-600 hover:text-purple-800">Copy</button>
                </div>
                <div className="prose-light max-w-none text-gray-700">{contentJsx}</div>
                 {result.citations && result.citations.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Sources</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {result.citations.map((cite, index) => (
                                <li key={index}>
                                    <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{cite.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Generating..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-purple-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Topic & Level" step={1}>
                         <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter your topic or area of study..."
                            className="w-full h-24 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                         <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Level</label>
                            <div className="flex flex-wrap gap-2">
                                {LEVELS.map(l => (
                                    <button key={l} onClick={() => setLevel(l)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${level === l ? 'bg-purple-500 border-purple-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-purple-500 hover:bg-purple-50'}`}>{l}</button>
                                ))}
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Output Type" step={2}>
                        <div className="space-y-4">
                            <div>
                                <div className="flex flex-wrap gap-2">
                                    {OUTPUT_TYPES.map(t => (
                                        <button key={t} onClick={() => setOutputType(t)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${outputType === t ? 'bg-purple-500 border-purple-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-purple-500 hover:bg-purple-50'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                             <label htmlFor="citation-toggle" className="flex items-center justify-between cursor-pointer pt-2">
                                <span className="font-medium text-gray-700">Add Citations (APA/MLA)</span>
                                <div className="relative">
                                    <input id="citation-toggle" type="checkbox" className="sr-only" checked={addCitations} onChange={(e) => setAddCitations(e.target.checked)} disabled={isLoading} />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${addCitations ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${addCitations ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </Section>

                    <button onClick={handleGenerate} disabled={isLoading || !topic.trim()} className="w-full mt-4 py-3 bg-purple-500 text-white font-bold text-lg rounded-lg hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Generate
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    {result ? renderResult() : <OutputPlaceholder />}
                </div>
            </div>
        </div>
    );
};
