
import React, { useState, useCallback } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ScheduleIcon, DownloadIcon } from './icons';
import type { StudySubject, StudyPreferences, StudyPlanResult, StudyTask } from '../types';

interface StudyScheduleViewProps {
    onBack: () => void;
}

const DIFFICULTIES: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
const FOCUS_MODES: ('Balanced' | 'Exam Cram' | 'Deep Learning')[] = ['Balanced', 'Exam Cram', 'Deep Learning'];

export const StudyScheduleView: React.FC<StudyScheduleViewProps> = ({ onBack }) => {
    // Inputs
    const [subjects, setSubjects] = useState<StudySubject[]>([
        { id: '1', name: '', topics: '', difficulty: 'Medium' }
    ]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [dailyHours, setDailyHours] = useState(4);
    const [focus, setFocus] = useState<'Balanced' | 'Exam Cram' | 'Deep Learning'>('Balanced');

    // State
    const [result, setResult] = useState<StudyPlanResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState(0);

    const addSubject = () => {
        setSubjects([...subjects, { id: Math.random().toString(), name: '', topics: '', difficulty: 'Medium' }]);
    };

    const updateSubject = (id: string, field: keyof StudySubject, value: string) => {
        setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSubject = (id: string) => {
        if (subjects.length > 1) {
            setSubjects(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleGenerate = useCallback(async () => {
        const validSubjects = subjects.filter(s => s.name.trim() !== '');
        if (validSubjects.length === 0) {
            alert('Please add at least one subject.');
            return;
        }
        setIsLoading(true);
        try {
            const preferences: StudyPreferences = {
                startDate,
                endDate,
                dailyHours,
                focus
            };
            const plan = await generateStudyPlan(validSubjects, preferences);
            setResult(plan);
            setActiveDayIndex(0);
        } catch (error) {
            console.error("Plan generation failed:", error);
            alert("Failed to generate study plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [subjects, startDate, endDate, dailyHours, focus]);

    const toggleTaskCompletion = (dayIndex: number, taskIndex: number) => {
        if (!result) return;
        const newSchedule = [...result.schedule];
        const task = newSchedule[dayIndex].tasks[taskIndex];
        task.isCompleted = !task.isCompleted; // Toggle logic would normally sync to backend
        
        // For UI feedback only since we don't have persistent backend for task state in this demo
        // In a real app, setSchedule(newSchedule)
        const element = document.getElementById(`task-${dayIndex}-${taskIndex}`);
        if(element) element.classList.toggle('line-through');
        if(element) element.classList.toggle('text-gray-400');
    };

    const handleDownload = () => {
        if (!result) return;
        const text = result.schedule.map(day => {
            return `### ${day.date} (${day.dayName}) - ${day.totalStudyTime} hrs\n` + 
                   day.tasks.map(t => `- [ ] ${t.subject}: ${t.description} (${t.durationMinutes}m)`).join('\n')
        }).join('\n\n');
        
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study_plan.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-indigo-50/50">
            {isLoading && <Spinner message="Optimizing your study schedule..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ScheduleIcon className="h-7 w-7 text-indigo-600" />
                        Study Schedule Optimizer
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-200 text-indigo-800 font-semibold rounded-lg hover:bg-indigo-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export Plan
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-indigo-200 rounded-xl p-5 h-full flex flex-col shadow-sm overflow-y-auto">
                    <div className="space-y-6">
                        {/* Dates & Hours */}
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-800 uppercase mb-3">Timeline & Availability</h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">End Date (Exam)</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Daily Study Hours</span>
                                    <span className="font-bold text-indigo-600">{dailyHours} hrs</span>
                                </label>
                                <input type="range" min="1" max="12" step="0.5" value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} className="w-full accent-indigo-600" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Focus Mode</label>
                                <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
                                    {FOCUS_MODES.map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setFocus(m)}
                                            className={`flex-1 py-1.5 text-xs font-medium transition ${focus === m ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Subjects */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase">Subjects</h3>
                                <button onClick={addSubject} className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded">
                                    + Add Subject
                                </button>
                            </div>
                            <div className="space-y-3">
                                {subjects.map((subject, index) => (
                                    <div key={subject.id} className="p-3 border border-gray-200 rounded-lg relative group bg-gray-50 hover:bg-white hover:shadow-sm transition">
                                        <button onClick={() => removeSubject(subject.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                        <div className="mb-2">
                                            <input 
                                                type="text" 
                                                placeholder="Subject Name (e.g. Physics)" 
                                                value={subject.name}
                                                onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none text-sm font-semibold pb-1"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <input 
                                                type="text" 
                                                placeholder="Topics/Chapters (comma separated)" 
                                                value={subject.topics}
                                                onChange={(e) => updateSubject(subject.id, 'topics', e.target.value)}
                                                className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none text-xs pb-1"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">Difficulty:</span>
                                            <select 
                                                value={subject.difficulty}
                                                onChange={(e) => updateSubject(subject.id, 'difficulty', e.target.value as any)}
                                                className="bg-white border border-gray-200 text-xs rounded px-1 py-0.5"
                                            >
                                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 transition-all shadow-lg transform hover:scale-[1.02]"
                    >
                        Generate Schedule
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-indigo-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <ScheduleIcon className="h-16 w-16 mb-4 text-indigo-200" />
                            <h3 className="text-xl font-semibold text-gray-500">No Plan Yet</h3>
                            <p className="mt-2 max-w-md">Enter your syllabus and constraints to generate a smart study plan.</p>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col md:flex-row overflow-hidden">
                            {/* Calendar List (Left sidebar of output) */}
                            <div className="w-full md:w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
                                {result.schedule.map((day, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setActiveDayIndex(idx)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${activeDayIndex === idx ? 'bg-white border-l-4 border-l-indigo-500 shadow-sm' : 'hover:bg-gray-100 text-gray-500'}`}
                                    >
                                        <div className="text-xs font-bold uppercase tracking-wide mb-1">{day.dayName}</div>
                                        <div className="text-sm font-semibold text-gray-800">{new Date(day.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                                        <div className="text-xs text-gray-400 mt-1">{day.totalStudyTime}h planned</div>
                                    </div>
                                ))}
                            </div>

                            {/* Daily Details (Right main area of output) */}
                            <div className="flex-grow p-6 md:p-8 overflow-y-auto">
                                <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800 mb-1">{result.schedule[activeDayIndex].dayName}</h2>
                                        <p className="text-gray-500">{new Date(result.schedule[activeDayIndex].date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-indigo-600">{result.schedule[activeDayIndex].totalStudyTime}h</div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Study Goal</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {result.schedule[activeDayIndex].tasks.map((task, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="pt-1">
                                                <input 
                                                    type="checkbox" 
                                                    onChange={() => toggleTaskCompletion(activeDayIndex, idx)}
                                                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 id={`task-${activeDayIndex}-${idx}`} className="font-bold text-gray-800 text-lg transition-colors">{task.subject}</h4>
                                                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-bold">{task.durationMinutes}m</span>
                                                </div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">{task.topic}</p>
                                                <p className="text-sm text-gray-500 italic">{task.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {result.schedule[activeDayIndex].tasks.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 italic">
                                            Rest Day! No study tasks scheduled.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
