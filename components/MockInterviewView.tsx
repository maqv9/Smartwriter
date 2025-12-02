
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Spinner } from './Spinner';
import type { InterviewTranscriptEntry, InterviewFeedback } from '../types';
import { generateInterviewFeedback } from '../services/geminiService';
import { InterviewIcon } from './icons';

// Define LiveSession type as it is not exported by the SDK
type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

// Audio Encoding/Decoding helpers (from Gemini docs)
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const INTERVIEW_TYPES = ['HR / Behavioral', 'Technical', 'Coding', 'Marketing', 'Sales', 'Customer Support', 'Custom Role'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Realistic'];

interface MockInterviewViewProps {
    onBack: () => void;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
};

export const MockInterviewView: React.FC<MockInterviewViewProps> = ({ onBack }) => {
    const cvInputRef = useRef<HTMLInputElement>(null); // Moved to top level
    
    const [interviewType, setInterviewType] = useState(INTERVIEW_TYPES[0]);
    const [customJobRole, setCustomJobRole] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
    const [cvFile, setCvFile] = useState<File | null>(null);
    
    const [session, setSession] = useState<LiveSession | null>(null);
    const [transcript, setTranscript] = useState<InterviewTranscriptEntry[]>([]);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'interviewing' | 'generating_report' | 'report_ready'>('idle');
    const [interviewStatus, setInterviewStatus] = useState<'listening' | 'speaking' | 'processing' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [textInput, setTextInput] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const statusRef = useRef(status);
    const timerIntervalRef = useRef<number | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    const cleanupAudio = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
        }
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        mediaStreamRef.current = null;
    }, []);

    const handleGenerateFeedback = useCallback(async () => {
        setStatus('generating_report');
        const fullTranscript = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
        const role = interviewType === 'Custom Role' ? customJobRole : interviewType;
        
        let cvText: string | null = null;
        if (cvFile) {
            try {
                cvText = await cvFile.text();
            } catch (e) {
                console.error("Could not read CV file:", e);
                setError("Could not read CV file. Please use a plain text format (.txt, .md).");
            }
        }

        try {
            const feedbackResult = await generateInterviewFeedback(fullTranscript, role, jobDescription, cvText);
            setFeedback(feedbackResult);
        } catch (e: any) {
            console.error("Error generating feedback:", e);
            setError(`Sorry, we couldn't generate your feedback report. ${e.message}`);
        } finally {
            setStatus('report_ready');
        }
    }, [transcript, interviewType, customJobRole, jobDescription, cvFile]);

    const endInterview = useCallback(() => {
        if (session) {
            session.close();
            setSession(null);
            sessionPromiseRef.current = null;
        }
        cleanupAudio();
        handleGenerateFeedback();
    }, [session, cleanupAudio, handleGenerateFeedback]);

    useEffect(() => {
        return () => {
            if(session) session.close();
            cleanupAudio();
        };
    }, [session, cleanupAudio]);

    const handleStartInterview = useCallback(async () => {
        if (interviewType === 'Custom Role' && !customJobRole.trim()) {
            alert('Please enter a custom job role.');
            return;
        }
        
        setStatus('connecting');
        setError(null);
        setTranscript([]);
        setFeedback(null);
        setIsMicEnabled(false);

        setTimeElapsed(0);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = window.setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        let cvText: string | null = null;
        if (cvFile) {
            try {
                cvText = await cvFile.text();
            } catch (e) {
                console.error("Could not read CV file:", e);
                setError("Could not read CV file. Please use a plain text file (.txt, .md).");
                setStatus('idle');
                return;
            }
        }
        
        const role = interviewType === 'Custom Role' ? customJobRole : interviewType;

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API key not found");

            // Attempt to get microphone, but don't fail if denied
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setIsMicEnabled(true);
                } else {
                    console.warn("MediaDevices not supported, proceeding in text-only mode.");
                }
            } catch (permError: any) {
                console.warn("Microphone permission denied or error, proceeding in text-only mode.", permError);
                // We proceed without setting isMicEnabled to true
            }

            const ai = new GoogleGenAI({ apiKey });

            if (isMicEnabled || !inputAudioContextRef.current) {
                 inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            // Resume audio contexts if suspended (browser policy)
            if (inputAudioContextRef.current?.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const systemInstruction = `You are an expert interviewer hiring for the role of a "${role}". 
            Your goal is to conduct a professional and realistic mock interview. The difficulty level is ${difficulty}.
            ${jobDescription ? `Here is the job description for context: ${jobDescription}` : ''}
            ${cvText ? `Here is the candidate's CV for context: ${cvText}` : ''}
            Start by introducing yourself briefly and then ask the first question. Ask a mix of questions relevant to the role.
            Keep your responses concise. Listen to the user's answers (audio or text) and ask relevant follow-up questions.
            After about 10-12 questions, conclude the interview professionally. Do not provide feedback during the interview itself.`;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction,
                    responseModalities: [Modality.AUDIO], // We still want audio response from model
                    inputAudioTranscription: {}, 
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
                callbacks: {
                    onopen: () => {
                        setStatus('interviewing');
                        setInterviewStatus('listening');
                        
                        // Only setup audio input if mic is enabled and stream exists
                        if (mediaStreamRef.current && inputAudioContextRef.current) {
                            try {
                                mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                    if (!sessionPromiseRef.current) return;
                                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                    const pcmBlob: Blob = {
                                        data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                        mimeType: 'audio/pcm;rate=16000',
                                    };
                                    sessionPromiseRef.current.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                                };
                                mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                            } catch (audioSetupError) {
                                console.error("Audio setup error:", audioSetupError);
                                // Fallback to text mode implicitly if audio setup fails
                            }
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'You' && !last.isFinal) return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                return [...prev, { speaker: 'You', text, isFinal: false }];
                            });
                        }
                         if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            setInterviewStatus('speaking');
                             setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'Interviewer' && !last.isFinal) return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                return [...prev, { speaker: 'Interviewer', text, isFinal: false }];
                            });
                        }
                        if(message.serverContent?.turnComplete) {
                            setTranscript(prev => prev.map(t => ({ ...t, isFinal: true })));
                            setInterviewStatus('listening');
                        }
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        // Don't kill session immediately on minor errors, but log
                    },
                    onclose: () => {
                        cleanupAudio();
                        if(statusRef.current === 'interviewing') handleGenerateFeedback();
                    },
                }
            });
            setSession(await sessionPromiseRef.current);
        } catch (err: any) {
            console.error("Failed to start interview:", err);
            setError(`${err.message}`);
            setStatus('idle');
            cleanupAudio();
        }
    }, [interviewType, customJobRole, jobDescription, difficulty, cvFile, cleanupAudio, handleGenerateFeedback, isMicEnabled]);

    const handleSendText = async () => {
        if (!textInput.trim() || !session) return;
        
        // Optimistic UI update
        setTranscript(prev => [...prev, { speaker: 'You', text: textInput, isFinal: true }]);
        
        try {
            // Send text turn to the model
            await (session as any).send({
                clientContent: {
                    turns: [{
                        parts: [{ text: textInput }],
                        role: 'user'
                    }],
                    turnComplete: true
                }
            });
            setTextInput('');
        } catch (e) {
            console.error("Failed to send text:", e);
        }
    };

    const handleCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             const allowedTypes = ['text/plain', 'text/markdown'];
            if (allowedTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                setCvFile(file);
            } else {
                alert('Please upload a plain text file (.txt, .md).');
            }
        }
    };

    const handlePrint = () => {
        const printable = document.getElementById('report-printable-area');
        if (printable) {
            const win = window.open('', '_blank');
            win?.document.write(`<html><head><title>Interview Report</title><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:sans-serif;}</style></head><body><div class="p-8">${printable.innerHTML}</div></body></html>`);
            win?.document.close();
            win?.focus();
            setTimeout(() => { win?.print(); win?.close(); }, 500);
        }
    };
    
    const resetState = () => {
        setStatus('idle');
        setTranscript([]);
        setFeedback(null);
        setError(null);
        setCustomJobRole('');
        setJobDescription('');
        setCvFile(null);
    };

    const renderSetup = () => (
        <div className="w-full max-w-lg mx-auto">
            <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold text-gray-800">Mock Interview</h1>
                 <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-teal-600">Back</button>
            </div>
            <p className="text-gray-500 mt-2 mb-8">Prepare for your next interview with an AI-powered assistant.</p>
            
            <div className="space-y-6 text-left">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                    <div className="flex flex-wrap gap-2">
                        {INTERVIEW_TYPES.map(type => (
                            <button key={type} onClick={() => setInterviewType(type)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${interviewType === type ? 'bg-teal-500 border-teal-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-teal-500 hover:bg-teal-50'}`}>{type}</button>
                        ))}
                    </div>
                </div>
                {interviewType === 'Custom Role' && (
                    <div className='space-y-4 p-4 bg-gray-50 rounded-lg border'>
                        <input type="text" value={customJobRole} onChange={e => setCustomJobRole(e.target.value)} placeholder="Custom Job Role" className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={3} placeholder="Job Description (Optional)" className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                        {DIFFICULTIES.map(d => (
                             <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${difficulty === d ? 'bg-teal-500 border-teal-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-teal-500 hover:bg-teal-50'}`}>{d}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload CV (Optional)</label>
                    <input type="file" ref={cvInputRef} onChange={handleCvChange} className="hidden" accept=".txt,.md,text/plain" id="cv-upload" />
                    <label htmlFor="cv-upload" className="w-full text-sm p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 cursor-pointer hover:border-teal-400 hover:bg-teal-50">
                        {cvFile ? cvFile.name : 'Click to upload (.txt, .md)'}
                    </label>
                </div>
            </div>

            <button onClick={handleStartInterview} disabled={status === 'connecting'} className="w-full mt-8 py-3 bg-teal-500 text-white font-bold text-lg rounded-lg hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                {status === 'connecting' ? 'Starting...' : 'Start Interview'}
            </button>
             {error && <p className="text-sm text-red-600 mt-4 text-center bg-red-50 p-2 rounded">{error}</p>}
        </div>
    );
    
    const renderInterview = () => (
        <div className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Interview for {interviewType === 'Custom Role' ? customJobRole : interviewType}</h2>
                    <div className="flex items-center gap-4">
                        {interviewStatus && <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <span className={`h-2 w-2 rounded-full ${interviewStatus === 'speaking' ? 'bg-teal-500' : 'bg-green-500'} animate-pulse`}></span>
                            <span>{interviewStatus.charAt(0).toUpperCase() + interviewStatus.slice(1)}</span>
                        </div>}
                        {!isMicEnabled && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Text Mode</span>}
                        <div className="text-sm font-mono text-gray-500">{formatTime(timeElapsed)}</div>
                    </div>
                </div>
                <button onClick={endInterview} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition">
                    End Interview & Get Report
                </button>
            </div>
            
            <div ref={chatContainerRef} className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto border border-gray-200 mb-4 scroll-smooth">
                <div className="space-y-4">
                    {transcript.map((entry, index) => (
                        <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'You' ? 'justify-end' : ''}`}>
                            {entry.speaker === 'Interviewer' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">AI</div>}
                            <div className={`max-w-md p-3 rounded-lg ${entry.speaker === 'Interviewer' ? 'bg-white border shadow-sm' : 'bg-teal-100 text-teal-900 shadow-sm'}`}>
                                <p className={`text-sm whitespace-pre-wrap ${!entry.isFinal ? 'text-gray-500 italic' : 'text-gray-800'}`}>{entry.text}</p>
                            </div>
                            {entry.speaker === 'You' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">You</div>}
                        </div>
                    ))}
                    {(interviewStatus === 'speaking' || interviewStatus === 'processing') && !transcript.some(t => t.speaker === 'Interviewer' && !t.isFinal) && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">AI</div>
                            <div className="max-w-md p-3 rounded-lg bg-white border">
                               <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                               </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input Area - Always visible or as fallback */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder={isMicEnabled ? "Type a response (optional)..." : "Type your answer here..."}
                    className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                />
                <button 
                    onClick={handleSendText}
                    disabled={!textInput.trim()}
                    className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition shadow-sm"
                >
                    Send
                </button>
            </div>
        </div>
    );
    
    const renderReport = () => (
        <div className="w-full max-w-4xl mx-auto">
            <div id="report-printable-area">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Your Interview Performance Report</h1>
                    <p className="text-gray-500 mt-1">Analysis for your {interviewType === 'Custom Role' ? customJobRole : interviewType} interview.</p>
                </div>
                
                {feedback ? (
                    <div className="space-y-6">
                        {/* Score and Rationale */}
                        <div className="p-6 bg-white rounded-lg border text-center">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overall Score</h3>
                            <p className={`text-7xl font-bold my-2 ${feedback.overallScore > 80 ? 'text-teal-500' : feedback.overallScore > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {feedback.overallScore}<span className="text-4xl text-gray-400">/100</span>
                            </p>
                            <p className="text-sm text-gray-600 max-w-xl mx-auto">{feedback.scoreRationale}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            <div className="p-6 bg-white rounded-lg border">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Key Strengths
                                </h3>
                                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                                    {feedback.strengths.map((s,i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            {/* Areas for Improvement */}
                             <div className="p-6 bg-white rounded-lg border">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    Areas for Improvement
                                </h3>
                                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                                     {feedback.areasForImprovement.map((s,i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                        {/* Actionable Suggestions */}
                        <div className="p-6 bg-white rounded-lg border">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                                Actionable Suggestions
                            </h3>
                            <div className="space-y-4">
                                {feedback.suggestedImprovements.map((item, i) => (
                                    <div key={i} className="text-sm p-3 bg-gray-50 rounded-md border">
                                        <p className="font-semibold text-gray-800">{item.area}</p>
                                        <p className="text-gray-600 whitespace-pre-wrap mt-1">{item.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Transcript & Mistakes */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white rounded-lg border">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    Repeated Mistakes
                                </h3>
                                 <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                                    {feedback.repeatedMistakes.length > 0 ? feedback.repeatedMistakes.map((s,i) => <li key={i}>{s}</li>) : <li>None detected!</li>}
                                </ul>
                            </div>
                            <div className="p-6 bg-white rounded-lg border">
                                <h3 className="font-semibold text-gray-800 mb-3">Full Transcript</h3>
                                <div className="h-40 overflow-y-auto space-y-2 text-xs p-2 bg-gray-50 rounded border">
                                    {transcript.filter(t => t.isFinal).map((entry, index) => (
                                        <p key={index}><strong className={entry.speaker === 'Interviewer' ? 'text-teal-700' : 'text-indigo-700'}>{entry.speaker}:</strong> {entry.text}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : <p className="text-center text-red-500 bg-red-50 p-4 rounded-lg">{error || "Could not load feedback report."}</p>}
            </div>
            <div className="mt-8 flex items-center justify-center gap-4">
                <button onClick={resetState} className="px-6 py-2 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition">Start New Interview</button>
                <button onClick={handlePrint} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">Download as PDF</button>
                <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-teal-600">Back to Tools</button>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-white overflow-y-auto relative">
            {status === 'generating_report' && <Spinner message="Generating feedback report..." />}
            
            {status === 'idle' || status === 'connecting' ? renderSetup() : null}
            
            {status === 'interviewing' ? renderInterview() : null}
            
            {status === 'report_ready' ? renderReport() : null}
        </div>
    );
};
