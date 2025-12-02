
import React, { useState, useEffect, useMemo } from 'react';
import type { GenerationResult, PlagiarismResult, GeneratedTitles, InlineImage } from '../types';

interface EditorPanelProps {
    result: GenerationResult | null;
    topic: string;
    onHumanize: () => void;
    onFactCheck: () => void;
    onPlagiarismCheck: () => void;
    onRegenerateImage: (prompt: string) => void;
    onRegenerateInlineImage: (index: number, prompt: string) => void;
    isLoading: boolean;
    isFocusMode: boolean;
    setIsFocusMode: (value: boolean) => void;
}

const Placeholder: React.FC = () => (
    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
        <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/40 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-700">Ready to Create</h3>
        <p className="mt-3 text-gray-500 max-w-xs mx-auto">Configure your parameters on the left and watch the AI craft your content here.</p>
    </div>
);

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const TypewriterArticle: React.FC<{ text: string, topic: string }> = ({ text, topic }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    const words = useMemo(() => text.split(/(\s+)/), [text]);

    useEffect(() => {
        setDisplayedText('');
        setIsFinished(false);
        let wordIndex = 0;

        const intervalId = setInterval(() => {
            if (wordIndex < words.length) {
                setDisplayedText(prev => prev + words[wordIndex]);
                wordIndex++;
            } else {
                clearInterval(intervalId);
                setIsFinished(true);
            }
        }, 10); // Typing speed

        return () => clearInterval(intervalId);
    }, [words]);

    const highlightedHtml = useMemo(() => {
        if (!displayedText) return '';
        const escapedTopic = topic ? escapeRegExp(topic) : '';
        const regex = escapedTopic ? new RegExp(`(${escapedTopic})`, 'gi') : null;
        
        let html = displayedText
            .replace(/\n/g, '<br />')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
        if (regex) {
            html = html.replace(regex, `<strong class="bg-yellow-200/50 text-yellow-900 px-1 rounded box-decoration-clone">$1</strong>`);
        }

        return html;
    }, [displayedText, topic]);

    return (
        <div 
            className="prose-light max-w-none prose-h1:text-3xl prose-h1:font-bold prose-h1:text-gray-900 prose-h2:text-xl prose-h2:font-semibold prose-h2:text-indigo-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-indigo-600 hover:prose-a:text-indigo-500 bg-white/50 backdrop-blur-sm p-8 rounded-xl border border-white/60 shadow-sm" 
        >
          <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          {!isFinished && <span className="typewriter-cursor"></span>}
        </div>
    );
};

const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
};

export const EditorPanel: React.FC<EditorPanelProps> = ({ result, topic, onHumanize, onFactCheck, onPlagiarismCheck, onRegenerateImage, onRegenerateInlineImage, isLoading, isFocusMode, setIsFocusMode }) => {
    
    const handleExportPDF = () => {
        if (!result) return;
        let articleHtml = result.article.split('\n\n').map(p => {
            if (p.startsWith('# ')) return `<h1>${p.substring(2)}</h1>`;
            if (p.startsWith('## ')) return `<h2>${p.substring(3)}</h2>`;
            if (p.startsWith('### ')) return `<h3>${p.substring(4)}</h3>`;
            if (p.split('\n').every(line => line.startsWith('* ') || line.startsWith('- '))) {
                const listItems = p.split('\n').map(item => `<li>${item.substring(2)}</li>`).join('');
                return `<ul>${listItems}</ul>`;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
          }).join('');
        articleHtml = articleHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>${result.titles?.seo || 'Article Export'}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:40px auto;padding:20px;}h1,h2,h3{color:#111;line-height:1.2;margin-top:1.5em;border-bottom:1px solid #eee;padding-bottom:0.3em;}p,ul{margin-bottom:1em;}ul{padding-left:20px;}strong{font-weight:600;}</style></head><body>${articleHtml}<script>window.onload=function(){window.print();window.close();}</script></body></html>`);
            printWindow.document.close();
        }
    };

    if (!result) {
        return (
            <div className="glass-panel rounded-2xl p-6 h-full">
                <Placeholder />
            </div>
        );
    }
    
    return (
        <div className="glass-panel rounded-2xl h-full overflow-y-auto p-6 md:p-8 relative">
             <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/50 hover:bg-white hover:shadow-md transition-all text-gray-600"
                title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
             >
                 {isFocusMode ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 102 0V5a1 1 0 10-2 0v2zm1 10a1 1 0 100-2 1 1 0 000 2zM5 9a1 1 0 102 0V7a1 1 0 10-2 0v2zm1 5a1 1 0 100-2 1 1 0 000 2zm7-5a1 1 0 102 0V7a1 1 0 10-2 0v2zm1 5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                  }
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                            Generated Content
                        </h2>
                         <TypewriterArticle text={result.article} topic={topic} />
                    </div>
                     
                     {result.citations.length > 0 && (
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                            <h3 className="text-lg font-bold text-gray-700 mb-3">Sources</h3>
                            <ul className="space-y-2">
                                {result.citations.map((cite, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="mt-1 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></span>
                                        <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:text-indigo-900 hover:underline truncate">{cite.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Tools Sidebar */}
                <div className="space-y-6">
                     <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm sticky top-0">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Actions</h3>
                        <div className="space-y-3">
                            <button onClick={onHumanize} disabled={isLoading} className="w-full text-left flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 transition-all shadow-sm group">
                                <span className="text-xl group-hover:scale-110 transition-transform">✨</span> Humanize
                            </button>
                             <button onClick={onPlagiarismCheck} disabled={isLoading} className="w-full text-left flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 transition-all shadow-sm group">
                                <span className="text-xl group-hover:scale-110 transition-transform">🛡️</span> Scan Plagiarism
                            </button>
                             <button onClick={() => handleCopy(result.article, 'Article')} className="w-full text-left flex items-center gap-3 px-4 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 group">
                                <span className="text-xl group-hover:scale-110 transition-transform">📋</span> Copy Text
                            </button>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-gray-200/60">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Export As</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleCopy(result.article, 'Markdown')} className="flex items-center justify-center px-3 py-2 bg-white/50 border border-white/60 text-gray-600 font-medium rounded-lg hover:bg-white hover:shadow-sm transition text-xs">Markdown</button>
                                <button onClick={handleExportPDF} className="flex items-center justify-center px-3 py-2 bg-white/50 border border-white/60 text-gray-600 font-medium rounded-lg hover:bg-white hover:shadow-sm transition text-xs">PDF Document</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
