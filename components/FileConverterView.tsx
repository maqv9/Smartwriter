
import React, { useState, useCallback } from 'react';
import { FileIcon, DownloadIcon, ConverterIcon } from './icons';
import { Spinner } from './Spinner';

interface FileConverterViewProps {
    onBack: () => void;
}

interface FileItem {
    id: string;
    file: File;
    status: 'idle' | 'converting' | 'done' | 'error';
    targetFormat: string;
    progress: number;
    resultUrl?: string;
}

const SUPPORTED_FORMATS = {
    'pdf': ['docx', 'txt', 'jpg'],
    'docx': ['pdf', 'txt'],
    'txt': ['pdf', 'docx'],
    'jpg': ['pdf', 'png'],
    'jpeg': ['pdf', 'png'],
    'png': ['pdf', 'jpg'],
    'pptx': ['pdf'],
    'xlsx': ['pdf', 'csv']
};

export const FileConverterView: React.FC<FileConverterViewProps> = ({ onBack }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [batchConvert, setBatchConvert] = useState(true);
    const [compressOutput, setCompressOutput] = useState(false);
    const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles: File[]) => {
        const fileItems: FileItem[] = newFiles.map(file => {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const supported = Object.keys(SUPPORTED_FORMATS).includes(ext);
            // Default target format is the first available one
            const target = supported ? SUPPORTED_FORMATS[ext as keyof typeof SUPPORTED_FORMATS][0] : '';
            
            return {
                id: Math.random().toString(36).substring(7),
                file,
                status: supported ? 'idle' : 'error',
                targetFormat: target,
                progress: 0
            };
        });
        setFiles(prev => [...prev, ...fileItems]);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const updateTargetFormat = (id: string, format: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: format } : f));
    };

    const simulateConversion = (fileId: string) => {
        return new Promise<void>((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10 + 5;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setFiles(prev => prev.map(f => {
                        if (f.id === fileId) {
                            // Mock result URL - in a real app this would be from the backend
                            // We use the original file as a placeholder for the blob to make download click work visually
                            const url = URL.createObjectURL(f.file); 
                            return { ...f, status: 'done', progress: 100, resultUrl: url };
                        }
                        return f;
                    }));
                    resolve();
                } else {
                    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'converting', progress } : f));
                }
            }, 200);
        });
    };

    const handleConvertAll = async () => {
        setIsGlobalProcessing(true);
        const idleFiles = files.filter(f => f.status === 'idle');
        
        if (batchConvert) {
            // Process concurrently
            await Promise.all(idleFiles.map(f => simulateConversion(f.id)));
        } else {
            // Process sequentially
            for (const file of idleFiles) {
                await simulateConversion(file.id);
            }
        }
        setIsGlobalProcessing(false);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors">
                        &larr; Tools
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ConverterIcon className="h-8 w-8 text-green-600" />
                        Universal File Converter
                    </h1>
                </div>
                <button 
                    onClick={handleConvertAll} 
                    disabled={isGlobalProcessing || files.every(f => f.status === 'done' || f.status === 'error')}
                    className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-md flex items-center gap-2"
                >
                    {isGlobalProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Convert All
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                
                {/* Sidebar Settings */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-700 mb-4">Settings</h3>
                        
                        <label className="flex items-center justify-between cursor-pointer mb-4">
                            <span className="text-sm text-gray-600 font-medium">Batch Processing</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={batchConvert} onChange={e => setBatchConvert(e.target.checked)} />
                                <div className={`block w-10 h-6 rounded-full transition ${batchConvert ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${batchConvert ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>

                         <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-600 font-medium">Compress Output</span>
                             <div className="relative">
                                <input type="checkbox" className="sr-only" checked={compressOutput} onChange={e => setCompressOutput(e.target.checked)} />
                                <div className={`block w-10 h-6 rounded-full transition ${compressOutput ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${compressOutput ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                        <p className="text-xs text-gray-400 mt-2">Reduces file size but may slightly lower quality.</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 text-sm">
                        <p className="font-bold mb-1">Supported Formats:</p>
                        <p className="opacity-80">PDF, DOCX, TXT, JPG, PNG, PPTX, XLSX</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Dropzone */}
                    <div 
                        className={`p-8 border-b border-gray-200 transition-colors ${isDragging ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors relative">
                            <input 
                                type="file" 
                                multiple 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileSelect}
                            />
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Drag & Drop files here</h3>
                            <p className="text-gray-500 mt-1">or click to browse files</p>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="flex-grow overflow-y-auto p-4 bg-gray-50/50">
                        {files.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-10">
                                <p>No files uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {files.map(file => {
                                    const ext = file.file.name.split('.').pop()?.toLowerCase() || '';
                                    const options = SUPPORTED_FORMATS[ext as keyof typeof SUPPORTED_FORMATS] || [];

                                    return (
                                        <div key={file.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-500">
                                                <FileIcon className="h-6 w-6" />
                                            </div>
                                            
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-medium text-gray-800 truncate">{file.file.name}</h4>
                                                <p className="text-xs text-gray-500">{formatSize(file.file.size)}</p>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{ext}</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                    {file.status !== 'done' ? (
                                                        <select 
                                                            value={file.targetFormat}
                                                            onChange={(e) => updateTargetFormat(file.id, e.target.value)}
                                                            className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-green-500 focus:border-green-500 block p-1.5 uppercase font-bold"
                                                            disabled={file.status === 'converting'}
                                                        >
                                                            {options.length > 0 ? options.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            )) : <option value="">N/A</option>}
                                                        </select>
                                                    ) : (
                                                        <span className="text-xs font-bold text-green-600 uppercase bg-green-100 px-2 py-1 rounded">{file.targetFormat}</span>
                                                    )}
                                                </div>

                                                {file.status === 'idle' && (
                                                    <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}

                                                {file.status === 'converting' && (
                                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-green-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                                                    </div>
                                                )}

                                                {file.status === 'done' && (
                                                    <a 
                                                        href={file.resultUrl} 
                                                        download={`converted_${file.file.name.split('.')[0]}.${file.targetFormat}`}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition"
                                                    >
                                                        <DownloadIcon className="h-4 w-4" />
                                                        Download
                                                    </a>
                                                )}
                                                
                                                {file.status === 'error' && (
                                                     <span className="text-red-500 text-sm flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Not Supported
                                                     </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
