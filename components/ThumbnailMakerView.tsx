
import React, { useState } from 'react';
import { generateThumbnailVariants } from '../services/geminiService';
import { Spinner } from './Spinner';
import type { ThumbnailVariant } from '../types';

interface ThumbnailMakerViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; step?: number, experimental?: boolean }> = ({ title, children, step, experimental }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-cyan-600 mb-3 flex items-center">
            {step && <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500 text-white font-bold mr-3">{step}</span>}
            {title}
            {experimental && <span className="ml-2 text-xs font-bold text-white bg-cyan-500 px-2 py-0.5 rounded-full">BETA</span>}
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
        <span className="font-medium text-gray-700 text-sm">{label}</span>
        <div className="relative">
            <input id={`toggle-${label}`} type="checkbox" className="sr-only" checked={enabled} onChange={(e) => !disabled && setEnabled(e.target.checked)} disabled={disabled} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-cyan-500' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </label>
);

export const ThumbnailMakerView: React.FC<ThumbnailMakerViewProps> = ({ onBack }) => {
    const [image, setImage] = useState<File | null>(null);
    const [headline, setHeadline] = useState('');
    const [description, setDescription] = useState('');
    
    const [removeBg, setRemoveBg] = useState(false);
    const [addGlow, setAddGlow] = useState(true);
    const [brightenFace, setBrightenFace] = useState(true);
    const [mrBeastStyle, setMrBeastStyle] = useState(false);
    
    const [variants, setVariants] = useState<ThumbnailVariant[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!headline) {
             alert("Please enter a headline.");
             return;
        }
        setIsLoading(true);
        try {
            const results = await generateThumbnailVariants(headline, description || headline);
            setVariants(results);
        } catch (e) {
            console.error(e);
            alert("Failed to generate thumbnails. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {isLoading && <Spinner message="Designing 4K thumbnails..." />}
            <div className="flex-grow flex flex-col md:flex-row gap-4 h-full">
                {/* Config Panel */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 h-full overflow-y-auto">
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-500 hover:text-cyan-600 mb-4 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Tools
                    </button>

                    <Section title="Reference Image (Optional)" step={1}>
                        <div className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition relative">
                            <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} className="absolute w-full h-full opacity-0 cursor-pointer" />
                            {image ? <span className="text-xs font-semibold p-2 text-center">{image.name}</span> : 
                            ( <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-xs mt-1 font-medium">Upload Image or Frame</p>
                            </>)}
                        </div>
                    </Section>

                    <Section title="Content Details" step={2}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video Headline / Text Overlay</label>
                        <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. I Survived 24 Hours..." className="w-full mb-3 bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"/>
                        
                         <label className="block text-sm font-medium text-gray-700 mb-1">Video Topic/Context</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is the video about?" rows={2} className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"/>
                    </Section>

                    <Section title="Smart Add-Ons">
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200 relative">
                             <ComingSoonBadge />
                            <Toggle label="Remove Background" enabled={removeBg} setEnabled={setRemoveBg} />
                            <Toggle label="Add Glow/Outline" enabled={addGlow} setEnabled={setAddGlow} />
                            <Toggle label="Auto Face Brightening" enabled={brightenFace} setEnabled={setBrightenFace} />
                            <Toggle label="One-click “MrBeast Style”" enabled={mrBeastStyle} setEnabled={setMrBeastStyle} />
                        </div>
                    </Section>

                    <button onClick={handleGenerate} disabled={!headline} className="w-full mt-4 py-3 bg-cyan-500 text-white font-bold text-lg rounded-lg hover:bg-cyan-600 disabled:bg-cyan-300 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                        Generate Thumbnails
                    </button>
                </div>

                {/* Main Panel */}
                <div className="w-full md:w-2/3 lg:w-3/4 bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Thumbnail Variants</h2>
                            <p className="text-sm text-gray-500">AI has generated these A/B test options. Ranked by predicted CTR score.</p>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto mt-4 pr-2">
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {variants.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p>Enter a headline and click Generate to see results.</p>
                                </div>
                            ) : (
                                variants.map((variant) => (
                                    <div key={variant.rank} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <img src={variant.imageUrl} alt={`Variant ${variant.rank}`} className="w-full aspect-video rounded-md object-cover" />
                                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            <div className="font-semibold text-gray-700">Predicted CTR: <span className="font-bold text-cyan-600">{variant.predictedCtr}%</span></div>
                                            <div className="font-semibold text-gray-700">Emotion Impact: <span className="font-bold text-cyan-600">{variant.emotionImpact}/100</span></div>
                                            <div className="font-semibold text-gray-700">Color Score: <span className="font-bold text-cyan-600">{variant.colorScore}/100</span></div>
                                            <div className="font-semibold text-gray-700">Text Visibility: <span className="font-bold text-cyan-600">{variant.textVisibility}/100</span></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
