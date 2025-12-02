
import React, { useState, useCallback, useRef } from 'react';
import { solveMathProblem } from '../services/geminiService';
import { Spinner } from './Spinner';
import { MathIcon } from './icons';
import type { MathSolverResult } from '../types';

interface MathSolverViewProps {
    onBack: () => void;
}

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold mr-3">{step}</span>
            {title}
        </h3>
        <div className="pl-9">{children}</div>
    </div>
);

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <MathIcon className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">Your Solution Will Appear Here</h3>
        <p className="mt-2">Enter a math problem to get started.</p>
    </div>
);

const StepAccordion: React.FC<{ steps: MathSolverResult['steps'] }> = ({ steps }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="space-y-2">
            {steps.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex justify-between items-center p-3 text-left font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                    >
                        <span>Step {index + 1}: {item.step}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {openIndex === index && (
                        <div className="p-3 border-t border-gray-200 bg-white">
                            <p className="text-sm text-gray-600">{item.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


const LEVELS = ['Basic', 'High School', 'University'];
const TYPES = ['Arithmetic', 'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Word Problems'];

export const MathSolverView: React.FC<MathSolverViewProps> = ({ onBack }) => {
    const [problem, setProblem] = useState('');
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [level, setLevel] = useState(LEVELS[1]);
    const [type, setType] = useState(TYPES[1]);
    
    const [result, setResult] = useState<MathSolverResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const handleSolve = useCallback(async () => {
        if (!problem.trim() && !image) {
            alert('Please enter a problem or upload an image.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            let imagePart;
            if (image) {
                const generativePart = await fileToGenerativePart(image.file);
                imagePart = { mimeType: generativePart.inlineData.mimeType, data: generativePart.inlineData.data };
            }
            const apiResult = await solveMathProblem(problem, level, type, imagePart);
            setResult(apiResult);
        } catch (error) {
            console.error("Error solving problem:", error);
            alert("Failed to solve problem. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [problem, image, level, type]);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        alert(`${type} copied to clipboard!`);
    };
    
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Solving..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-blue-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Enter Problem" step={1}>
                        <textarea
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder="e.g., Solve for x: 2x + 5 = 15"
                            className="w-full h-24 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                         <div 
                            className="mt-3 w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            {image ? (
                                <img src={image.preview} alt="Problem preview" className="h-full w-full object-contain rounded-md p-1" />
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <p className="text-xs mt-1">Upload Image</p>
                                </>
                            )}
                        </div>
                    </Section>

                    <Section title="Problem Details" step={2}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                <div className="flex flex-wrap gap-2">
                                    {LEVELS.map(l => (
                                        <button key={l} onClick={() => setLevel(l)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${level === l ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {TYPES.map(t => (
                                        <button key={t} onClick={() => setType(t)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${type === t ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    <button onClick={handleSolve} disabled={isLoading || (!problem.trim() && !image)} className="w-full mt-4 py-3 bg-blue-500 text-white font-bold text-lg rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Solve
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    {result ? (
                        <div className="flex-grow overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Solution</h2>
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="font-semibold text-green-800 mb-1">Final Answer</h3>
                                <p className="text-lg font-bold text-green-900">{result.solution}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-2">Step-by-step Walkthrough</h3>
                                <StepAccordion steps={result.steps} />
                            </div>

                            {result.graphSuggestion && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-2">Graph Visualization</h3>
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                        <p><strong>Suggestion:</strong> {result.graphSuggestion}</p>
                                    </div>
                                </div>
                            )}

                             <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-2">LaTeX Format</h3>
                                <div className="p-3 bg-gray-800 text-white rounded-lg font-mono text-sm overflow-x-auto relative">
                                    <code>{result.latex}</code>
                                    <button onClick={() => handleCopy(result.latex, 'LaTeX')} className="absolute top-2 right-2 text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-2 rounded">Copy</button>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <OutputPlaceholder />
                    )}
                </div>
            </div>
        </div>
    );
};
