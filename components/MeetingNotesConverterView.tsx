
import React, { useState, useCallback } from 'react';
import { convertMeetingNotes } from '../services/geminiService';
import { Spinner } from './Spinner';
import { MeetingIcon, DownloadIcon } from './icons';
import type { MeetingSummaryResult } from '../types';

interface MeetingNotesConverterViewProps {
    onBack: () => void;
}

const MEETING_TYPES = ['General / Unspecified', 'Client Meeting', 'Team Stand-up', 'Sprint Planning', 'Project Update', 'Strategy Session'];

export const MeetingNotesConverterView: React.FC<MeetingNotesConverterViewProps> = ({ onBack }) => {
    const [notes, setNotes] = useState('');
    const [meetingType, setMeetingType] = useState(MEETING_TYPES[0]);
    const [result, setResult] = useState<MeetingSummaryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConvert = useCallback(async () => {
        if (!notes.trim()) {
            alert('Please enter meeting notes.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await convertMeetingNotes(notes, meetingType);
            setResult(data);
        } catch (error) {
            console.error("Conversion failed:", error);
            alert("Failed to convert notes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [notes, meetingType]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };
    
    const handleDownload = () => {
        if (!result) return;
        const text = `Meeting Summary: ${result.summary}\n\nKey Decisions:\n${result.keyDecisions.map(d => `- ${d}`).join('\n')}\n\nAction Items:\n${result.actionItems.map(a => `[${a.priority}] ${a.task} (@${a.assignee}) - Due: ${a.deadline}`).join('\n')}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meeting_notes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'High': return <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-bold uppercase">High</span>;
            case 'Medium': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold uppercase">Medium</span>;
            case 'Low': return <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold uppercase">Low</span>;
            default: return null;
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-orange-50">
            {isLoading && <Spinner message="Organizing notes & extracting tasks..." />}
            
            <div className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-orange-700 hover:text-orange-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tools
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <MeetingIcon className="h-7 w-7 text-orange-600" />
                        Notes to Action Items
                    </h1>
                </div>
                 {result && (
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-orange-200 text-orange-800 font-semibold rounded-lg hover:bg-orange-300 transition">
                        <DownloadIcon className="h-4 w-4" />
                        Export
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-white border border-orange-200 rounded-xl p-5 h-full flex flex-col shadow-sm">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Meeting Type</label>
                        <select 
                            value={meetingType} 
                            onChange={(e) => setMeetingType(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition mb-4"
                        >
                            {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <label className="block text-sm font-bold text-gray-700 mb-2">Raw Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Paste your messy notes here..."
                            className="w-full h-96 lg:h-[26rem] bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition resize-none"
                        />
                    </div>

                    <button 
                        onClick={handleConvert} 
                        disabled={isLoading || !notes.trim()}
                        className="w-full mt-auto py-3 bg-orange-600 text-white font-bold text-lg rounded-xl hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                    >
                        Convert to Action Plan
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-2/3 bg-white border border-orange-200 rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <MeetingIcon className="h-16 w-16 mb-4 text-orange-200" />
                            <h3 className="text-xl font-semibold text-gray-500">Transform Chaos into Clarity</h3>
                            <p className="mt-2 max-w-md">Paste your rough notes to get a summary, key decisions, and a prioritized task list.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-6 lg:p-8 space-y-8">
                            {/* Summary & Decisions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Executive Summary</h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">{result.summary}</p>
                                </div>
                                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Key Decisions</h3>
                                    <ul className="space-y-2">
                                        {result.keyDecisions.map((decision, i) => (
                                            <li key={i} className="flex items-start text-sm text-gray-800">
                                                <svg className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                {decision}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Action Items */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Action Items</h2>
                                    <button onClick={() => handleCopy(result.actionItems.map(a => `- [ ] ${a.task} (@${a.assignee})`).join('\n'))} className="text-sm font-bold text-orange-600 hover:text-orange-800">Copy Checklist</button>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Task</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {result.actionItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getPriorityBadge(item.priority)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                        {item.task}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {item.assignee}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.deadline}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Outcomes */}
                             {result.agendaOutcomes.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Agenda Outcomes</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm text-gray-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            {result.agendaOutcomes.map((outcome, i) => (
                                                <li key={i}>{outcome}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
