
import React, { useState, useCallback } from 'react';
import { generateDecisionScores, analyzeDecisionMatrix } from '../services/geminiService';
import { Spinner } from './Spinner';
import { DecisionIcon, DownloadIcon } from './icons';
import type { DecisionOption, DecisionCriterion, DecisionAnalysis } from '../types';

interface DecisionMatrixViewProps {
    onBack: () => void;
}

const STEPS = ['Setup', 'Score', 'Results'];

export const DecisionMatrixView: React.FC<DecisionMatrixViewProps> = ({ onBack }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    // Data State
    const [options, setOptions] = useState<DecisionOption[]>([
        { id: 'opt1', name: '', description: '', scores: {} },
        { id: 'opt2', name: '', description: '', scores: {} }
    ]);
    const [criteria, setCriteria] = useState<DecisionCriterion[]>([
        { id: 'crit1', name: 'Price', weight: 5 },
        { id: 'crit2', name: 'Quality', weight: 4 },
        { id: 'crit3', name: 'Ease of Use', weight: 3 }
    ]);
    const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);

    // Helpers
    const addOption = () => {
        setOptions([...options, { id: Math.random().toString(36).substr(2, 9), name: '', description: '', scores: {} }]);
    };
    
    const removeOption = (id: string) => {
        if (options.length > 2) setOptions(options.filter(o => o.id !== id));
    };

    const addCriterion = () => {
        setCriteria([...criteria, { id: Math.random().toString(36).substr(2, 9), name: '', weight: 3 }]);
    };

    const removeCriterion = (id: string) => {
        if (criteria.length > 1) setCriteria(criteria.filter(c => c.id !== id));
    };

    const updateOption = (id: string, field: keyof DecisionOption, value: any) => {
        setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
    };

    const updateCriterion = (id: string, field: keyof DecisionCriterion, value: any) => {
        setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const updateScore = (optionId: string, criterionId: string, value: number) => {
        setOptions(prev => prev.map(o => {
            if (o.id === optionId) {
                return { ...o, scores: { ...o.scores, [criterionId]: Math.min(10, Math.max(0, value)) } };
            }
            return o;
        }));
    };

    // AI Actions
    const handleAutoScore = async () => {
        setIsLoading(true);
        try {
            const scoresMap = await generateDecisionScores(options, criteria);
            setOptions(prev => prev.map(o => {
                if (scoresMap[o.id]) {
                    return { ...o, scores: { ...o.scores, ...scoresMap[o.id] } };
                }
                return o;
            }));
        } catch (e) {
            console.error(e);
            alert("Failed to auto-score. Ensure options have detailed descriptions.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const result = await analyzeDecisionMatrix(options, criteria);
            setAnalysis(result);
            setCurrentStep(2);
        } catch (e) {
            console.error(e);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculations
    const calculateTotal = (option: DecisionOption) => {
        let total = 0;
        criteria.forEach(c => {
            const score = option.scores[c.id] || 0;
            total += score * c.weight;
        });
        return total;
    };

    const maxPossibleScore = criteria.reduce((acc, c) => acc + (10 * c.weight), 0);

    const sortedOptions = [...options].sort((a, b) => calculateTotal(b) - calculateTotal(a));

    const handleExport = () => {
        if (!analysis) return;
        let content = `# Decision Matrix Analysis\n\n`;
        content += `## Winner: ${analysis.winner}\n${analysis.explanation}\n\n`;
        content += `## Scores\n`;
        sortedOptions.forEach((opt, i) => {
            content += `${i+1}. ${opt.name}: ${calculateTotal(opt)}/${maxPossibleScore}\n`;
        });
        content += `\n## Details\n**Key Factors:** ${analysis.keyFactors.join(', ')}\n\n**Trade-offs:** ${analysis.tradeoffs}\n\n**What-if:** ${analysis.whatIf}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'decision_matrix.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-emerald-50">
            {isLoading && <Spinner message="Crunching numbers & analyzing tradeoffs..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DecisionIcon className="h-7 w-7 text-emerald-600" />
                        Decision Matrix Builder
                    </h1>
                </div>
                {currentStep === 2 && (
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-200 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export
                    </button>
                )}
            </div>

            {/* Stepper */}
            <div className="w-full max-w-3xl mx-auto mb-8">
                <div className="flex justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                    <div className={`absolute top-1/2 left-0 h-1 bg-emerald-500 -z-10 rounded transition-all duration-500`} style={{ width: `${(currentStep / 2) * 100}%` }}></div>
                    {STEPS.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center cursor-pointer" onClick={() => setCurrentStep(idx)}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${currentStep >= idx ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                {idx + 1}
                            </div>
                            <span className={`text-xs font-semibold mt-2 ${currentStep >= idx ? 'text-emerald-700' : 'text-gray-400'}`}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-hidden bg-white rounded-xl shadow-sm border border-emerald-100 flex flex-col">
                {currentStep === 0 && (
                    <div className="flex flex-col md:flex-row h-full overflow-hidden">
                        {/* Options Column */}
                        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">1. Define Options</h3>
                                <button onClick={addOption} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200">+ Add</button>
                            </div>
                            <div className="space-y-4">
                                {options.map((opt, idx) => (
                                    <div key={opt.id} className="p-4 border border-gray-200 rounded-lg relative group hover:shadow-sm transition">
                                        <button onClick={() => removeOption(opt.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                        <input 
                                            type="text" 
                                            placeholder={`Option ${idx + 1} Name`} 
                                            value={opt.name} 
                                            onChange={e => updateOption(opt.id, 'name', e.target.value)}
                                            className="w-full font-bold text-gray-800 border-b border-transparent focus:border-emerald-500 outline-none mb-2 placeholder-gray-400"
                                        />
                                        <textarea 
                                            placeholder="Description (for AI Scoring)" 
                                            value={opt.description}
                                            onChange={e => updateOption(opt.id, 'description', e.target.value)}
                                            className="w-full text-sm text-gray-600 bg-gray-50 p-2 rounded resize-none focus:ring-1 focus:ring-emerald-500 outline-none h-20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Criteria Column */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">2. Define Criteria</h3>
                                <button onClick={addCriterion} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200">+ Add</button>
                            </div>
                            <div className="space-y-3">
                                {criteria.map((crit) => (
                                    <div key={crit.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-sm transition">
                                        <div className="flex-grow">
                                            <input 
                                                type="text" 
                                                value={crit.name} 
                                                onChange={e => updateCriterion(crit.id, 'name', e.target.value)}
                                                className="w-full font-medium text-gray-800 outline-none placeholder-gray-400"
                                                placeholder="Criterion Name"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Weight</span>
                                            <select 
                                                value={crit.weight} 
                                                onChange={e => updateCriterion(crit.id, 'weight', Number(e.target.value))}
                                                className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded px-2 py-1 cursor-pointer"
                                            >
                                                {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </div>
                                        <button onClick={() => removeCriterion(crit.id)} className="text-gray-300 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="flex flex-col h-full overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Score Options (0-10)</h3>
                                <p className="text-sm text-gray-500">Rate each option against the criteria.</p>
                            </div>
                            <button 
                                onClick={handleAutoScore} 
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 transition"
                            >
                                ✨ AI Auto-Score
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto flex-grow rounded-xl border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-4 font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Options</th>
                                        {criteria.map(c => (
                                            <th key={c.id} className="p-4 font-semibold text-gray-600 text-center min-w-[120px]">
                                                {c.name} <br/>
                                                <span className="text-xs text-emerald-600 font-normal">Weight: {c.weight}</span>
                                            </th>
                                        ))}
                                        <th className="p-4 font-bold text-gray-800 text-center bg-emerald-50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {options.map(opt => (
                                        <tr key={opt.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-bold text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-100">{opt.name || 'Untitled'}</td>
                                            {criteria.map(c => (
                                                <td key={c.id} className="p-4 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="0" max="10" 
                                                        value={opt.scores[c.id] || ''} 
                                                        onChange={e => updateScore(opt.id, c.id, Number(e.target.value))}
                                                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:border-emerald-500 outline-none font-medium"
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-4 text-center font-bold text-emerald-700 bg-emerald-50/50 text-lg">
                                                {calculateTotal(opt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {currentStep === 2 && analysis && (
                    <div className="flex flex-col h-full overflow-y-auto p-8">
                        <div className="mb-8 text-center">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">And the winner is</h2>
                            <div className="text-4xl font-extrabold text-emerald-600 mb-4">{analysis.winner}</div>
                            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">{analysis.explanation}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">⚖️</span> Trade-offs
                                </h3>
                                <p className="text-emerald-900 text-sm leading-relaxed">{analysis.tradeoffs}</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">🔄</span> What-if Scenario
                                </h3>
                                <p className="text-blue-900 text-sm leading-relaxed">{analysis.whatIf}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-4">Rankings</h3>
                            <div className="space-y-3">
                                {sortedOptions.map((opt, i) => {
                                    const score = calculateTotal(opt);
                                    const percent = (score / maxPossibleScore) * 100;
                                    return (
                                        <div key={opt.id} className="relative">
                                            <div className="flex justify-between text-sm font-bold mb-1">
                                                <span>{i+1}. {opt.name}</span>
                                                <span>{score} / {maxPossibleScore}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-emerald-500' : 'bg-gray-400'}`} 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Nav */}
                <div className="p-4 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-xl">
                    <button 
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg disabled:opacity-50 transition"
                    >
                        Back
                    </button>
                    {currentStep < 2 ? (
                        <button 
                            onClick={() => {
                                if (currentStep === 1) handleAnalyze();
                                else setCurrentStep(currentStep + 1);
                            }}
                            disabled={isLoading}
                            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-md"
                        >
                            {currentStep === 1 ? 'Analyze Results' : 'Next Step'}
                        </button>
                    ) : (
                        <button onClick={() => setCurrentStep(0)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition">
                            Start Over
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};