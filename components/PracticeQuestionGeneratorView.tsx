
import React, { useState, useRef, useCallback } from 'react';
import { generatePracticeQuestions } from '../services/geminiService';
import { Spinner } from './Spinner';
import { QuizIcon, DownloadIcon } from './icons';
import type { QuestionSet, QuestionType, QuestionDifficulty, PracticeQuestion } from '../types';

interface PracticeQuestionGeneratorViewProps {
    onBack: () => void;
}

const QUESTION_TYPES: QuestionType[] = ['MCQ', 'Short Answer', 'True/False', 'Fill-in-the-blank', 'Mixed'];
const DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

const QuestionCard: React.FC<{ 
    question: PracticeQuestion; 
    index: number; 
    practiceMode: boolean; 
    userAnswer: string; 
    onAnswer: (val: string) => void;
    showSolution: boolean;
}> = ({ question, index, practiceMode, userAnswer, onAnswer, showSolution }) => {
    
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);

    const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    
    // For manual grading of short answers, we just show green if they typed something and let them compare
    const isAnswered = userAnswer.trim().length > 0;

    return (
        <div className="bg-white border border-teal-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded uppercase tracking-wide">
                    Question {index + 1} • {question.type}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">{question.topicTag}</span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-4">{question.question}</h3>

            <div className="mb-4">
                {question.type === 'MCQ' && question.options ? (
                    <div className="space-y-2">
                        {question.options.map((opt, idx) => {
                            let optionClass = "w-full text-left p-3 rounded-lg border transition-all text-sm font-medium ";
                            
                            if (practiceMode && showSolution) {
                                // Review Mode
                                if (opt === question.correctAnswer) optionClass += "bg-green-100 border-green-400 text-green-800 ";
                                else if (opt === userAnswer && opt !== question.correctAnswer) optionClass += "bg-red-100 border-red-400 text-red-800 ";
                                else optionClass += "bg-gray-50 border-gray-200 text-gray-500 opacity-60 ";
                            } else {
                                // Input Mode
                                if (userAnswer === opt) optionClass += "bg-teal-600 border-teal-600 text-white shadow-md ";
                                else optionClass += "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 ";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !showSolution && onAnswer(opt)}
                                    className={optionClass}
                                    disabled={showSolution}
                                >
                                    <span className="mr-2 opacity-70">{String.fromCharCode(65 + idx)}.</span> {opt}
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <textarea
                            value={userAnswer}
                            onChange={(e) => onAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className={`w-full p-3 border rounded-lg focus:outline-none transition-colors resize-none h-24 ${
                                showSolution 
                                    ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                                    : 'border-gray-300 focus:border-teal-500'
                            }`}
                            disabled={showSolution}
                        />
                        {showSolution && (
                            <div className="text-sm p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                <span className="font-bold block mb-1">Correct Answer:</span>
                                {question.correctAnswer}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions / Feedback */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                {showSolution ? (
                    <button 
                        onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                        className="text-sm font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                    >
                        {isExplanationOpen ? 'Hide' : 'Show'} "Teach Me" Explanation
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExplanationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                ) : (
                    <span className="text-xs text-gray-400 italic">Submit to see explanation</span>
                )}
            </div>

            {isExplanationOpen && showSolution && (
                <div className="mt-3 p-4 bg-teal-50 rounded-lg border border-teal-100 text-sm text-gray-700 animate-fadeIn">
                    <div className="flex items-start gap-2">
                        <span className="text-xl">🎓</span>
                        <div>
                            <span className="font-bold block text-teal-800 mb-1">Teacher's Note:</span>
                            {question.explanation}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const PracticeQuestionGeneratorView: React.FC<PracticeQuestionGeneratorViewProps> = ({ onBack }) => {
    // Input State
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState<QuestionType>('Mixed');
    const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Medium');
    const [count, setCount] = useState(5);

    // App State
    const [result, setResult] = useState<QuestionSet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [practiceMode, setPracticeMode] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [showSolutions, setShowSolutions] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!inputText.trim() && !file) {
            alert('Please provide text or upload a file.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        setUserAnswers({});
        setShowSolutions(false);
        setPracticeMode(false);
        
        try {
            const data = await generatePracticeQuestions(inputText, file, type, difficulty, count);
            setResult(data);
        } catch (error) {
            console.error("Quiz generation failed:", error);
            alert("Failed to generate questions. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [inputText, file, type, difficulty, count]);

    const handleAnswer = (questionId: string, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const calculateScore = () => {
        if (!result) return 0;
        let correct = 0;
        result.questions.forEach(q => {
            if (userAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
                correct++;
            }
        });
        return Math.round((correct / result.questions.length) * 100);
    };

    const handleExport = () => {
        if (!result) return;
        let content = `# ${result.title}\n\n`;
        result.questions.forEach((q, i) => {
            content += `${i + 1}. ${q.question}\n`;
            if (q.type === 'MCQ' && q.options) {
                q.options.forEach((opt, idx) => content += `   ${String.fromCharCode(65 + idx)}. ${opt}\n`);
            }
            content += `\n   Answer: ${q.correctAnswer}\n   Explanation: ${q.explanation}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'practice_questions.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-teal-50">
            {isLoading && <Spinner message={`Creating ${difficulty} ${type} questions...`} />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <QuizIcon className="h-7 w-7 text-teal-600" />
                        Practice Question Generator
                    </h1>
                </div>
                 {result && (
                    <div className="flex gap-2">
                        <button onClick={() => setPracticeMode(!practiceMode)} className={`px-4 py-2 rounded-lg font-semibold transition ${practiceMode ? 'bg-white text-teal-700 border border-teal-300' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
                            {practiceMode ? 'View List' : 'Start Practice'}
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-teal-200 text-teal-800 font-semibold rounded-lg hover:bg-teal-300 transition">
                            <DownloadIcon className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-teal-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Source Material</label>
                        <div 
                            className="w-full p-4 border-2 border-dashed border-teal-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-teal-50 transition mb-3"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md,.docx" />
                            <span className="text-xs font-bold uppercase tracking-wide text-teal-600">{file ? file.name : 'Upload Textbook / Notes'}</span>
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Or paste text content here..."
                            className="w-full h-32 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition resize-none text-sm"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Configuration</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Question Type</label>
                                <select value={type} onChange={e => setType(e.target.value as QuestionType)} className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                    {QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value as QuestionDifficulty)} className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 flex justify-between">
                                <span>Question Count</span>
                                <span className="font-bold text-teal-600">{count}</span>
                            </label>
                            <input type="range" min="3" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full accent-teal-600" />
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || (!inputText && !file)}
                        className="w-full mt-auto py-3 bg-teal-600 text-white font-bold text-lg rounded-xl hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Generate Questions
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-teal-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden relative">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <QuizIcon className="h-16 w-16 mb-4 text-teal-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Test Your Knowledge</h3>
                            <p className="mt-2 max-w-md">Generate custom practice exams from your notes instantly.</p>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col h-full overflow-hidden">
                            {/* Score Header (Only visible in Practice Mode with Solutions Shown) */}
                            {showSolutions && practiceMode && (
                                <div className="bg-teal-600 text-white p-4 flex justify-between items-center shadow-md z-10">
                                    <div className="font-bold text-lg">Results</div>
                                    <div className="text-2xl font-bold">{calculateScore()}% Score</div>
                                </div>
                            )}

                            <div className="flex-grow overflow-y-auto p-6 lg:p-8 space-y-6 bg-gray-50">
                                {practiceMode ? (
                                    <>
                                        {result.questions.map((q, idx) => (
                                            <QuestionCard 
                                                key={q.id} 
                                                question={q} 
                                                index={idx} 
                                                practiceMode={true} 
                                                userAnswer={userAnswers[q.id] || ''}
                                                onAnswer={(ans) => handleAnswer(q.id, ans)}
                                                showSolution={showSolutions}
                                            />
                                        ))}
                                        
                                        {!showSolutions ? (
                                            <button 
                                                onClick={() => setShowSolutions(true)} 
                                                className="w-full py-4 bg-teal-600 text-white font-bold text-lg rounded-xl hover:bg-teal-700 shadow-lg transition-transform active:scale-95"
                                            >
                                                Submit & Check Answers
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleGenerate} 
                                                className="w-full py-4 bg-white border-2 border-teal-600 text-teal-700 font-bold text-lg rounded-xl hover:bg-teal-50 shadow-lg"
                                            >
                                                Regenerate New Questions
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    // List View (Review Mode)
                                    <div className="prose max-w-none">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{result.title}</h2>
                                        <ol className="list-decimal pl-5 space-y-8">
                                            {result.questions.map((q) => (
                                                <li key={q.id} className="pl-2">
                                                    <p className="font-semibold text-gray-800 text-lg mb-2">{q.question}</p>
                                                    
                                                    {q.type === 'MCQ' && (
                                                        <ul className="list-[upper-alpha] pl-5 space-y-1 mb-3 text-gray-600">
                                                            {q.options?.map((opt, i) => <li key={i}>{opt}</li>)}
                                                        </ul>
                                                    )}
                                                    
                                                    <div className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded-r text-sm">
                                                        <p className="font-bold text-teal-800">Answer: {q.correctAnswer}</p>
                                                        <p className="text-gray-600 mt-1 italic">"{q.explanation}"</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
