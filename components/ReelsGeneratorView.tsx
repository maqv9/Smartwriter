
import React, { useState, useRef } from 'react';
import { analyzeVideoForClips } from '../services/geminiService';
import { Spinner } from './Spinner';

interface ReelsGeneratorViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step?: number, experimental?: boolean }> = ({ title, children, step, experimental }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-amber-600 mb-3 flex items-center">
            {step && <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold mr-3">{step}</span>}
            {title}
            {experimental && <span className="ml-2 text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">BETA</span>}
        </h3>
        <div className={step ? "pl-9" : ""}>{children}</div>
    </div>
);

const ComingSoonBadge: React.FC = () => (
    <span className="absolute top-1 right-1 text-xs font-bold text-white bg-gray-400 px-2 py-0.5 rounded-full z-10">
        Coming Soon
    </span>
);

const Toggle: React.FC<{ label: string; enabled: boolean; setEnabled: (e: boolean) => void; disabled?: boolean }> = ({ label, enabled, setEnabled, disabled }) => (
    <label htmlFor={`toggle-${label}`} className={`flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
        <span className="font-medium text-gray-700">{label}</span>
        <div className="relative">
            <input id={`toggle-${label}`} type="checkbox" className="sr-only" checked={enabled} onChange={(e) => !disabled && setEnabled(e.target.checked)} disabled={disabled} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </label>
);

export const ReelsGeneratorView: React.FC<ReelsGeneratorViewProps> = ({ onBack }) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [youtubeLink, setYoutubeLink] = useState('');
    const [platform, setPlatform] = useState('YouTube Shorts');
    const [captionStyle, setCaptionStyle] = useState('MrBeast-style');
    
    const [clips, setClips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Smart Add-on states
    const [removeSilence, setRemoveSilence] = useState(true);
    const [removeNoise, setRemoveNoise] = useState(false);
    const [autoCrop, setAutoCrop] = useState(true);
    const [addMusic, setAddMusic] = useState(false);
    const [addProgressBar, setAddProgressBar] = useState(false);
    const [autoBlur, setAutoBlur] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) {
                alert("For this demo, please upload videos smaller than 25MB.");
                return;
            }
            setVideoFile(file);
        }
    };

    const handleGenerate = async () => {
        if (!videoFile) {
            alert("Please upload a video file.");
            return;
        }
        setIsLoading(true);
        try {
            const result = await analyzeVideoForClips(videoFile, platform);
            setClips(result);
        } catch (e) {
            console.error(e);
            alert("Failed to process video. Ensure it is short (<1min) and small (<20MB) for this demo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Watching video & identifying viral moments..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-amber-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Upload Video" step={1}>
                        <div 
                            className="w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/mp4,video/quicktime,video/webm" />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <p className="text-xs mt-1 font-medium">{videoFile ? videoFile.name : 'Upload (MP4, MOV) < 20MB'}</p>
                        </div>
                    </Section>

                    <Section title="Platform Format" step={2}>
                        <div className="flex flex-wrap gap-2">
                            {['YouTube Shorts', 'Instagram Reel', 'TikTok'].map(p => (
                                <button key={p} onClick={() => setPlatform(p)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${platform === p ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-amber-500 hover:bg-amber-50'}`}>{p}</button>
                            ))}
                        </div>
                    </Section>

                    <Section title="Auto Captions" step={3}>
                        <select value={captionStyle} onChange={e => setCaptionStyle(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none transition">
                            {['MrBeast-style', 'Clean Minimal', 'TikTok Font', 'Outline + Shadow'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Section>

                    <button onClick={handleGenerate} disabled={!videoFile} className="w-full mt-4 py-3 bg-amber-500 text-white font-bold text-lg rounded-lg hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Generate Clips
                    </button>
                </div>

                {/* Main Panel */}
                <div className="w-full md:w-2/3 lg:w-3/4 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">AI Clip Suggestions</h2>
                    <p className="text-sm text-gray-500 mb-4">AI will find the best moments. Review and export the ones you love.</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-y-auto">
                        {clips.length > 0 ? (
                            clips.map((clip, index) => (
                                <div key={index} className="relative p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                                    <h3 className="text-md font-bold text-gray-800 mb-1">Clip #{index+1}: "{clip.title}"</h3>
                                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                                        <span className="text-amber-600 font-bold">Virality: {clip.viralityScore}/100</span>
                                    </div>
                                    <p className="text-sm text-gray-600 italic mb-3">"{clip.reason}"</p>
                                    <div className="aspect-video bg-black rounded-md flex items-center justify-center text-gray-400 mb-3 relative overflow-hidden group">
                                        <p className="text-white text-xs">Preview Placeholder</p>
                                        {/* In a real app, we would slice the video blob here using start/end timestamps */}
                                    </div>
                                     <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1">Suggested Caption:</p>
                                        <p className="text-sm text-gray-700 bg-white p-2 rounded border">{clip.caption}</p>
                                     </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                                <p>Upload a video to see AI-generated clips.</p>
                            </div>
                        )}

                        {clips.length > 0 && (
                            <div className="space-y-4">
                                <Section title="Smart Add-Ons" experimental>
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                        <ComingSoonBadge />
                                        <Toggle label="Remove Silence" enabled={removeSilence} setEnabled={setRemoveSilence} />
                                        <Toggle label="Remove Background Noise" enabled={removeNoise} setEnabled={setRemoveNoise} />
                                        <Toggle label="Auto Screen Crop" enabled={autoCrop} setEnabled={setAutoCrop} />
                                        <Toggle label="Music Integration" enabled={addMusic} setEnabled={setAddMusic} />
                                        <Toggle label="Add Progress Bar" enabled={addProgressBar} setEnabled={setAddProgressBar} />
                                        <Toggle label="Auto-blur Background" enabled={autoBlur} setEnabled={setAutoBlur} />
                                    </div>
                                </Section>

                                 <Section title="Export Options">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                        <ComingSoonBadge />
                                        <div className="grid grid-cols-2 gap-3">
                                            <button disabled className="w-full py-2 bg-amber-500 text-white font-semibold rounded-lg opacity-50">Export Clip</button>
                                            <button disabled className="w-full py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg opacity-50">Export All</button>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-sm font-medium text-gray-700">Resolution</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button disabled className="flex-1 py-1 text-sm bg-white border border-gray-300 rounded-md opacity-50">720p</button>
                                                <button disabled className="flex-1 py-1 text-sm bg-amber-100 border border-amber-400 rounded-md opacity-50">1080p</button>
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
