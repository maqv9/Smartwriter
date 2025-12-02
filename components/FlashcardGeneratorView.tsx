
import React, { useState, useRef, useCallback } from 'react';
import { generateFlashcards } from '../services/geminiService';
import { Spinner } from './Spinner';
import { FlashcardIcon, DownloadIcon } from './icons';
import type { FlashcardSet, Flashcard } from '../types';

interface FlashcardGeneratorViewProps {
    onBack: () => void;
}

const CardPreview: React.FC<{ card: Flashcard, isFlipped: boolean, onFlip: () => void }> = ({ card, isFlipped, onFlip }) => (
    <div 
        onClick={onFlip}
        className={`w-full max-w-lg aspect-[5/3] perspective-1000 cursor-pointer mx-auto`}
        style={{ perspective: '1000px' }}
    >
        <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-white border-2 border-yellow-300 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8" style={{ backfaceVisibility: 'hidden' }}>
                <span className="absolute top-4 right-4 text-xs font-bold text-yellow-600 uppercase bg-yellow-100 px-2 py-1 rounded">{card.topic}</span>
                <h3 className="text-2xl font-bold text-gray-800">{card.front}</h3>
                <p className="mt-4 text-sm text-gray-400">Click to flip</p>
            </div>
            {/* Back */}
            <div className="absolute w-full h-full backface-hidden bg-yellow-50 border-2 border-yellow-300 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <p className="text-lg text-gray-800 leading-relaxed">{card.back}</p>
                <div className="absolute bottom-4 flex gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${card.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : card.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {card.difficulty}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

export const FlashcardGeneratorView: React.FC<FlashcardGeneratorViewProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [difficulty, setDifficulty] = useState('Medium');
    const [cardCount, setCardCount] = useState(10);
    
    const [result, setResult] = useState<FlashcardSet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [studyMode, setStudyMode] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

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
        try {
            const data = await generateFlashcards(inputText, file, difficulty, cardCount);
            setResult(data);
            setStudyMode(false); // Reset to list view on new generation
        } catch (error) {
            console.error("Flashcard generation failed:", error);
            alert("Failed to generate flashcards. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [inputText, file, difficulty, cardCount]);

    const handleDownloadCSV = () => {
        if (!result) return;
        const headers = ['Front,Back,Tags'];
        const rows = result.cards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}","${c.topic}"`);
        const csvContent = [headers, ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.title.replace(/\s+/g, '_')}_flashcards.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleNextCard = () => {
        if (result && currentCardIndex < result.cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150); // Small delay for visual reset
        }
    };

    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-yellow-50">
            {isLoading && <Spinner message="Analyzing content & generating flashcards..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-yellow-700 hover:text-yellow-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FlashcardIcon className="h-7 w-7 text-yellow-600" />
                        Flashcard Generator
                    </h1>
                </div>
                 {result && (
                    <div className="flex gap-2">
                        <button onClick={() => setStudyMode(!studyMode)} className={`px-4 py-2 rounded-lg font-semibold transition ${studyMode ? 'bg-white text-yellow-700 border border-yellow-300' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}>
                            {studyMode ? 'Exit Study Mode' : 'Start Studying'}
                        </button>
                        <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-yellow-200 text-yellow-800 font-semibold rounded-lg hover:bg-yellow-300 transition">
                            <DownloadIcon className="h-4 w-4" />
                            CSV / Anki
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel (Hidden in Study Mode for cleaner focus) */}
                <div className={`w-full lg:w-1/3 flex-shrink-0 bg-white border border-yellow-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto transition-all ${studyMode ? 'hidden lg:flex' : ''}`}>
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Source Content</label>
                        <div 
                            className="w-full p-4 border-2 border-dashed border-yellow-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-yellow-50 transition mb-3"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md,.docx" />
                            <span className="text-xs font-bold uppercase tracking-wide text-yellow-600">{file ? file.name : 'Upload PDF / Doc'}</span>
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Or paste your notes here..."
                            className="w-full h-32 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition resize-none text-sm"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Settings</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-yellow-500">
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Card Count</label>
                                <input type="number" min="5" max="30" value={cardCount} onChange={e => setCardCount(parseInt(e.target.value))} className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-yellow-500" />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || (!inputText && !file)}
                        className="w-full mt-auto py-3 bg-yellow-500 text-white font-bold text-lg rounded-xl hover:bg-yellow-600 disabled:bg-yellow-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Generate Cards
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-yellow-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden relative">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <FlashcardIcon className="h-16 w-16 mb-4 text-yellow-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Turn Notes into Knowledge</h3>
                            <p className="mt-2 max-w-md">Upload your study material to auto-generate spaced repetition flashcards.</p>
                        </div>
                    ) : studyMode ? (
                        <div className="flex-grow flex flex-col items-center justify-center p-8 bg-yellow-50">
                            <div className="w-full flex justify-between items-center max-w-lg mb-4 text-gray-500 text-sm font-bold">
                                <span>Card {currentCardIndex + 1} of {result.cards.length}</span>
                                <span>{result.title}</span>
                            </div>
                            
                            <CardPreview 
                                card={result.cards[currentCardIndex]} 
                                isFlipped={isFlipped} 
                                onFlip={() => setIsFlipped(!isFlipped)} 
                            />

                            <div className="flex gap-4 mt-8">
                                <button onClick={handlePrevCard} disabled={currentCardIndex === 0} className="p-3 rounded-full bg-white border border-gray-200 shadow hover:bg-gray-50 disabled:opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-full hover:bg-yellow-600 shadow-lg transition-transform active:scale-95">
                                    Flip Card
                                </button>
                                <button onClick={handleNextCard} disabled={currentCardIndex === result.cards.length - 1} className="p-3 rounded-full bg-white border border-gray-200 shadow hover:bg-gray-50 disabled:opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-6 lg:p-8 bg-white">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{result.title}</h2>
                                <p className="text-gray-600 text-sm italic">{result.summary}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {result.cards.map((card, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 hover:shadow-sm transition bg-gray-50">
                                        <div className="flex-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">Question</span>
                                            <p className="text-gray-800 font-medium">{card.front}</p>
                                        </div>
                                        <div className="hidden md:block w-px bg-gray-200"></div>
                                        <div className="flex-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">Answer</span>
                                            <p className="text-gray-600">{card.back}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
