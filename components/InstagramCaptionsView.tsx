
import React, { useState, useCallback, useRef } from 'react';
import { generateInstagramCaptions } from '../services/geminiService';
import { Spinner } from './Spinner';
import type { InstagramCaptionResult } from '../types';

interface InstagramCaptionsViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-pink-600 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500 text-white font-bold mr-3">{step}</span>
            {title}
        </h3>
        <div className="pl-9">{children}</div>
    </div>
);

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <rect width="20" height="20" x="2" y="2" strokeWidth="1" rx="5" ry="5"></rect>
            <path strokeWidth="1" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"></path>
        </svg>
        <h3 className="text-xl font-semibold text-gray-600">Your Captions Will Appear Here</h3>
        <p className="mt-2">Fill out your post details and let AI do the magic.</p>
    </div>
);

const NICHES = ['Fashion', 'Fitness', 'Travel', 'Business', 'Tech', 'Gaming', 'Quotes', 'Food', 'Personal Brand'];
const STYLES = ['Short & Aesthetic', 'Story-telling', 'Viral Hook', 'Sales/Marketing', 'Emotional & Relatable', 'SEO Optimized'];
const CTAS = ['None', 'Save this post', 'Link in bio!', 'DM for details', 'Follow for more', 'Comment below', 'Tag a friend'];

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

export const InstagramCaptionsView: React.FC<InstagramCaptionsViewProps> = ({ onBack }) => {
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [description, setDescription] = useState('');
    const [niche, setNiche] = useState(NICHES[0]);
    const [style, setStyle] = useState(STYLES[0]);
    const [useEmojis, setUseEmojis] = useState(true);
    const [callToAction, setCallToAction] = useState(CTAS[0]);
    
    const [result, setResult] = useState<InstagramCaptionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            alert('Please describe your post.');
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
            const apiResult = await generateInstagramCaptions(description, niche, style, useEmojis, callToAction, imagePart);
            setResult(apiResult);
        } catch (error) {
            console.error("Error generating captions:", error);
            alert("Failed to generate captions. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [description, niche, style, useEmojis, callToAction, image]);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        alert(`${type} copied to clipboard!`);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Generating captions..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-pink-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Post Details" step={1}>
                        <div 
                            className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                             <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            {image ? (
                                <img src={image.preview} alt="Post preview" className="h-full w-full object-cover rounded-md" />
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p className="text-sm mt-1">Upload Image (Optional)</p>
                                </>
                            )}
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your post in 1-2 lines..."
                            className="w-full mt-3 h-24 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-700 focus:ring-2 focus:ring-pink-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                         <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Niche</label>
                            <select value={niche} onChange={e => setNiche(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-pink-500 focus:outline-none transition">
                                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </Section>

                    <Section title="Style & Add-ons" step={2}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Caption Style</label>
                                <div className="flex flex-wrap gap-2">
                                    {STYLES.map(s => (
                                        <button key={s} onClick={() => setStyle(s)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${style === s ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-pink-500 hover:bg-pink-50'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Call-to-Action</label>
                                <select value={callToAction} onChange={e => setCallToAction(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-pink-500 focus:outline-none transition">
                                    {CTAS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <label htmlFor="emoji-toggle" className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-gray-700">Emoji Enhancer</span>
                                <div className="relative">
                                    <input id="emoji-toggle" type="checkbox" className="sr-only" checked={useEmojis} onChange={(e) => setUseEmojis(e.target.checked)} disabled={isLoading} />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${useEmojis ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useEmojis ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </Section>

                    <button onClick={handleGenerate} disabled={isLoading || !description.trim()} className="w-full mt-4 py-3 bg-pink-500 text-white font-bold text-lg rounded-lg hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Generate Captions
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    {result ? (
                        <div className="flex-grow overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Generated Captions ✨</h2>
                            <div className="space-y-6">
                                {result.captions.map((caption, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-gray-700 whitespace-pre-wrap">{caption}</p>
                                        <div className="mt-3 text-right">
                                            <button onClick={() => handleCopy(caption, 'Caption')} className="text-sm font-semibold text-pink-600 hover:text-pink-800">Copy Caption</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Smart Hashtags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.hashtags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-pink-100 text-pink-700 text-sm rounded-md">#{tag}</span>
                                    ))}
                                </div>
                                <div className="mt-4 text-right">
                                    <button onClick={() => handleCopy(result.hashtags.map(t => `#${t}`).join(' '), 'Hashtags')} className="text-sm font-semibold text-pink-600 hover:text-pink-800">Copy Hashtags</button>
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
