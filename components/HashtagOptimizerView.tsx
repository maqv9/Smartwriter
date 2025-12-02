import React, { useState, useCallback } from 'react';
import { generateHashtagStrategy } from '../services/geminiService';
import { Spinner } from './Spinner';
import { HashtagIcon } from './icons';
import type { HashtagStrategyResult, Hashtag } from '../types';

interface HashtagOptimizerViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step: number }> = ({ title, children, step }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-bold mr-3">{step}</span>
            {title}
        </h3>
        <div className="pl-9">{children}</div>
    </div>
);

const OutputPlaceholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <HashtagIcon className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">Your Hashtag Strategy Will Appear Here</h3>
        <p className="mt-2">Describe your post to generate high-performing hashtags and keywords.</p>
    </div>
);

const NICHES = ['Fitness', 'Fashion', 'Business', 'Travel', 'Food', 'Tech', 'AI', 'Gaming', 'Photography'];
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Pinterest'];

const TagPill: React.FC<{ tag: string, onCopy: (tag: string) => void }> = ({ tag, onCopy }) => (
    <button onClick={() => onCopy(tag)} className="group flex items-center text-left text-sm bg-orange-100 text-orange-800 rounded-md px-2 py-1 hover:bg-orange-200 transition">
        <span className="font-mono">#{tag}</span>
    </button>
);

const HashtagGroup: React.FC<{ title: string; hashtags: Hashtag[]; onCopy: (tags: string) => void }> = ({ title, hashtags, onCopy }) => {
    const handleCopy = (tag: string) => {
        navigator.clipboard.writeText(`#${tag}`);
        alert(`#${tag} copied!`);
    };
    
    return (
        <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-700">{title}</h4>
                <button onClick={() => onCopy(hashtags.map(h => `#${h.tag}`).join(' '))} className="text-xs font-semibold text-orange-600 hover:text-orange-800">Copy Group</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {hashtags.map(h => <TagPill key={h.tag} tag={h.tag} onCopy={handleCopy} />)}
            </div>
        </div>
    );
};


export const HashtagOptimizerView: React.FC<HashtagOptimizerViewProps> = ({ onBack }) => {
    const [description, setDescription] = useState('');
    const [niche, setNiche] = useState(NICHES[0]);
    const [platform, setPlatform] = useState(PLATFORMS[0]);
    const [location, setLocation] = useState('');
    
    const [result, setResult] = useState<HashtagStrategyResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            alert('Please describe your post.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const apiResult = await generateHashtagStrategy(description, niche, platform, location || null);
            setResult(apiResult);
        } catch (error) {
            console.error("Error generating strategy:", error);
            alert("Failed to generate strategy. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    }, [description, niche, platform, location]);
    
    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        alert(`${type} copied to clipboard!`);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Generating strategy..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-orange-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Post Details" step={1}>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your post in 1-2 lines..."
                            className="w-full h-24 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                        <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Niche</label>
                             <select value={niche} onChange={e => setNiche(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition">
                                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </Section>

                    <Section title="Platform & Location" step={2}>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(p => (
                                        <button key={p} onClick={() => setPlatform(p)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${platform === p ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-orange-500 hover:bg-orange-50'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g., New York, NY"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </Section>
                    
                    <button onClick={handleGenerate} disabled={isLoading || !description.trim()} className="w-full mt-4 py-3 bg-orange-500 text-white font-bold text-lg rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Generate
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    {result ? (
                        <div className="flex-grow overflow-y-auto">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">Hashtag Sets</h2>
                                <div className="space-y-4">
                                    <HashtagGroup title="✅ Low Competition (Guaranteed Reach)" hashtags={result.hashtags.lowCompetition} onCopy={(tags) => handleCopy(tags, 'Low Competition Hashtags')} />
                                    <HashtagGroup title="🔥 Medium Competition (Balanced Growth)" hashtags={result.hashtags.mediumCompetition} onCopy={(tags) => handleCopy(tags, 'Medium Competition Hashtags')} />
                                    <HashtagGroup title="🚀 High Competition (Viral Potential)" hashtags={result.hashtags.highCompetition} onCopy={(tags) => handleCopy(tags, 'High Competition Hashtags')} />
                                </div>
                            </div>
                             <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">SEO Keywords</h2>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex flex-wrap gap-2">
                                        {result.seoKeywords.map(k => (
                                            <div key={k.keyword} className="text-sm bg-blue-100 text-blue-800 rounded-md px-2 py-1">{k.keyword}</div>
                                        ))}
                                    </div>
                                    <button onClick={() => handleCopy(result.seoKeywords.map(k => k.keyword).join(', '), 'SEO Keywords')} className="text-xs font-semibold text-orange-600 hover:text-orange-800 mt-3">Copy All Keywords</button>
                                </div>
                            </div>
                            {result.locationTags.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-3">Location Tags</h2>
                                    <div className="p-4 bg-gray-50 rounded-lg border">
                                         <div className="flex flex-wrap gap-2">
                                            {result.locationTags.map(l => (
                                                <div key={l} className="text-sm bg-green-100 text-green-800 rounded-md px-2 py-1">{l}</div>
                                            ))}
                                        </div>
                                         <button onClick={() => handleCopy(result.locationTags.join(', '), 'Location Tags')} className="text-xs font-semibold text-orange-600 hover:text-orange-800 mt-3">Copy All Locations</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <OutputPlaceholder />
                    )}
                </div>
            </div>
        </div>
    );
};