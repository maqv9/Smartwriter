
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { EditorPanel } from './components/EditorPanel';
import { Spinner } from './components/Spinner';
import type { Tone, Blueprint, GenerationResult, InlineImage, Tool } from './types';
import { generateArticle, analyzeSeo, generatePublishKit, generateImagePrompt, generateInlineImagePrompts, generateImage, humanizeText, factCheckWithSources, checkPlagiarism, analyzeKeyword as analyzeKeywordApi } from './services/geminiService';
import { MOODS, BLUEPRINTS, TOOLS } from './constants';
import { Sidebar } from './components/Sidebar';
import { ToolCard } from './components/ToolCard';
import { SummarizeTextView } from './components/SummarizeTextView';
import { ResearchGeneratorView } from './components/ResearchGeneratorView';
import { GrammarCheckerView } from './components/GrammarCheckerView';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { LoginView } from './components/LoginView';
import { MockInterviewView } from './components/MockInterviewView';
import { MathSolverView } from './components/MathSolverView';
import { ResearchPaperOutlinerView } from './components/ResearchPaperOutlinerView';
import { EmailThreadSummarizerView } from './components/EmailThreadSummarizerView';
import { ThumbnailMakerView } from './components/ThumbnailMakerView';
import { HashtagOptimizerView } from './components/HashtagOptimizerView';
import { InstagramCaptionsView } from './components/InstagramCaptionsView';
import { MeetingNotesConverterView } from './components/MeetingNotesConverterView';
import { ProposalGeneratorView } from './components/ProposalGeneratorView';
import { CoverLetterView } from './components/CoverLetterView';
import { ViralHookGeneratorView } from './components/ViralHookGeneratorView';
import { FlashcardGeneratorView } from './components/FlashcardGeneratorView';
import { ConceptExplainerView } from './components/ConceptExplainerView';
import { StudyScheduleView } from './components/StudyScheduleView';
import { PracticeQuestionGeneratorView } from './components/PracticeQuestionGeneratorView';
import { ProblemDecomposerView } from './components/ProblemDecomposerView';
import { MultiDocumentView } from './components/MultiDocumentView';
import { FactCheckerView } from './components/FactCheckerView';

// Custom hook for persisting state to localStorage
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

const ArticleGeneratorView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [topic, setTopic] = usePersistentState<string>('smartwriter:topic', '');
    const [selectedTones, setSelectedTones] = usePersistentState<Tone[]>('smartwriter:tones', [MOODS[0]]);
    const [selectedBlueprint, setSelectedBlueprint] = usePersistentState<Blueprint>('smartwriter:blueprint', BLUEPRINTS[0]);
    const [wordCount, setWordCount] = usePersistentState<number>('smartwriter:wordCount', 1000);
    
    const [keyword, setKeyword] = useState<string>('');
    const [keywordAnalysis, setKeywordAnalysis] = useState<any | null>(null);
    const [isAnalyzingKeyword, setIsAnalyzingKeyword] = useState<boolean>(false);

    const [generationResult, setGenerationResult] = usePersistentState<GenerationResult | null>('smartwriter:result', null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
    const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsFocusMode(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAnalyzeKeyword = useCallback(async () => {
        if (!keyword) return;
        setIsAnalyzingKeyword(true);
        setKeywordAnalysis(null);
        try {
            const analysis = await analyzeKeywordApi(keyword);
            setKeywordAnalysis(analysis);
        } catch (error) {
            console.error("Error analyzing keyword:", error);
            alert("Failed to analyze keyword. Check the console for details.");
        } finally {
            setIsAnalyzingKeyword(false);
        }
    }, [keyword]);

    const handleToneSelection = (tone: Tone) => {
        setSelectedTones(prevTones => {
            const isSelected = prevTones.some(t => t.name === tone.name);
            if (isSelected) {
                return prevTones.length > 1 ? prevTones.filter(t => t.name !== tone.name) : prevTones;
            } else {
                if (prevTones.length < 2) return [...prevTones, tone];
            }
            return prevTones;
        });
    };

    const handleGenerate = useCallback(async () => {
        if (!topic) {
            alert("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setGenerationResult(null);
        const getCombinedTonePrompt = () => {
            if (selectedTones.length === 1) return selectedTones[0].prompt;
            return `Blend the following two tones seamlessly: 1. ${selectedTones[0].name}: ${selectedTones[0].prompt} 2. ${selectedTones[1].name}: ${selectedTones[1].prompt}`;
        };
        const combinedTonePrompt = getCombinedTonePrompt();
        try {
            setLoadingStep("1/6: Generating SEO article...");
            const article = await generateArticle(topic, selectedBlueprint.prompt(topic), combinedTonePrompt, isThinkingMode, wordCount);
            setLoadingStep("2/6: Running SmartRank Advisor...");
            const seo = await analyzeSeo(article);
            setLoadingStep("3/6: Creating Instant Publish Kit...");
            const publishKit = await generatePublishKit(article, topic);
            setLoadingStep("4/6: Designing Hero Image...");
            const heroPrompt = await generateImagePrompt(article);
            const heroUrl = await generateImage(heroPrompt);
            setLoadingStep("5/6: Illustrating content...");
            const inlinePrompts = await generateInlineImagePrompts(article);
            const inlineImages: InlineImage[] = await Promise.all(
                inlinePrompts.map(async (prompt) => ({ prompt, url: await generateImage(prompt) }))
            );
            setLoadingStep("6/6: Assembling results...");
            setGenerationResult({ 
                article,
                seoAnalysis: seo,
                titles: publishKit.titles,
                metaDescription: publishKit.metaDescription,
                twitterCaption: publishKit.twitterCaption,
                linkedinSummary: publishKit.linkedinSummary,
                socialHashtags: publishKit.socialHashtags,
                imageUrl: heroUrl,
                imagePrompt: heroPrompt,
                inlineImages,
                citations: [],
                plagiarismResult: null
            });
        } catch (error) {
            console.error("Error generating content:", error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    }, [topic, selectedTones, selectedBlueprint, isThinkingMode, wordCount]);

    const handleHumanize = async () => {
        if (!generationResult) return;
        setIsLoading(true);
        setLoadingStep("Humanizing content...");
        try {
            const humanized = await humanizeText(generationResult.article, isThinkingMode);
            setGenerationResult(prev => prev ? { ...prev, article: humanized } : null);
        } catch (error) {
            console.error("Error humanizing text:", error);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const handleFactCheck = async () => {
        if (!generationResult) return;
        setIsLoading(true);
        setLoadingStep("Fact checking with Google Search...");
        try {
            const { updatedArticle, citations } = await factCheckWithSources(generationResult.article);
            setGenerationResult(prev => prev ? { ...prev, article: updatedArticle, citations } : null);
        } catch (error) {
            console.error("Error fact checking:", error);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const handlePlagiarismCheck = async () => {
        if (!generationResult) return;
        setIsLoading(true);
        setLoadingStep("Scanning for plagiarism...");
        try {
            const result = await checkPlagiarism(generationResult.article);
            setGenerationResult(prev => prev ? { ...prev, plagiarismResult: result } : null);
        } catch (error) {
            console.error("Error checking plagiarism:", error);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };
    
    const handleRegenerateImage = async (prompt: string) => {
        if (!generationResult) return;
        setIsLoading(true);
        setLoadingStep("Regenerating Hero Image...");
        try {
            const newUrl = await generateImage(prompt);
            setGenerationResult(prev => prev ? { ...prev, imageUrl: newUrl, imagePrompt: prompt } : null);
        } catch (error) {
            console.error("Error regenerating image:", error);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const handleRegenerateInlineImage = async (index: number, prompt: string) => {
        if (!generationResult) return;
         setIsLoading(true);
        setLoadingStep("Regenerating Inline Image...");
        try {
            const newUrl = await generateImage(prompt);
             setGenerationResult(prev => {
                if (!prev) return null;
                const newInlineImages = [...prev.inlineImages];
                newInlineImages[index] = { prompt, url: newUrl };
                return { ...prev, inlineImages: newInlineImages };
            });
        } catch (error) {
            console.error("Error regenerating inline image:", error);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative p-4 gap-4">
            {isLoading && <Spinner message={loadingStep} />}
            <div className={`w-full lg:w-96 flex-shrink-0 h-full transition-all duration-300 ${isFocusMode ? '-ml-[26rem] absolute opacity-0' : ''}`}>
                <ConfigPanel
                    topic={topic}
                    setTopic={setTopic}
                    selectedTones={selectedTones}
                    onToneSelect={handleToneSelection}
                    selectedBlueprint={selectedBlueprint}
                    setSelectedBlueprint={setSelectedBlueprint}
                    wordCount={wordCount}
                    setWordCount={setWordCount}
                    onGenerate={handleGenerate}
                    keyword={keyword}
                    setKeyword={setKeyword}
                    keywordAnalysis={keywordAnalysis}
                    onAnalyzeKeyword={handleAnalyzeKeyword}
                    isAnalyzingKeyword={isAnalyzingKeyword}
                    isLoading={isLoading}
                    isThinkingMode={isThinkingMode}
                    setIsThinkingMode={setIsThinkingMode}
                    onBack={onBack}
                />
            </div>
            <div className="flex-grow h-full overflow-hidden">
                <EditorPanel 
                    result={generationResult} 
                    topic={topic}
                    onHumanize={handleHumanize}
                    onFactCheck={handleFactCheck}
                    onPlagiarismCheck={handlePlagiarismCheck}
                    onRegenerateImage={handleRegenerateImage}
                    onRegenerateInlineImage={handleRegenerateInlineImage}
                    isLoading={isLoading}
                    isFocusMode={isFocusMode}
                    setIsFocusMode={setIsFocusMode}
                />
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>({ email: 'demo@smartwriter.ai', uid: 'demo123' } as User);
    const [activeToolId, setActiveToolId] = useState<string | null>(null);

    const handleSignOut = () => {
        signOut(auth).catch(console.error);
        setUser(null);
    };

    const renderToolView = () => {
        switch (activeToolId) {
            case 'fact-checker':
                return <FactCheckerView onBack={() => setActiveToolId(null)} />;
            case 'multi-document-intelligence':
                return <MultiDocumentView onBack={() => setActiveToolId(null)} />;
            case 'problem-decomposer':
                return <ProblemDecomposerView onBack={() => setActiveToolId(null)} />;
            case 'practice-question-generator':
                return <PracticeQuestionGeneratorView onBack={() => setActiveToolId(null)} />;
            case 'study-schedule-optimizer':
                return <StudyScheduleView onBack={() => setActiveToolId(null)} />;
            case 'concept-explainer':
                return <ConceptExplainerView onBack={() => setActiveToolId(null)} />;
            case 'flashcard-generator':
                return <FlashcardGeneratorView onBack={() => setActiveToolId(null)} />;
            case 'viral-hook-generator':
                return <ViralHookGeneratorView onBack={() => setActiveToolId(null)} />;
            case 'cover-letter-customizer':
                return <CoverLetterView onBack={() => setActiveToolId(null)} />;
            case 'proposal-generator':
                return <ProposalGeneratorView onBack={() => setActiveToolId(null)} />;
            case 'meeting-notes-converter':
                return <MeetingNotesConverterView onBack={() => setActiveToolId(null)} />;
            case 'email-summarizer':
                return <EmailThreadSummarizerView onBack={() => setActiveToolId(null)} />;
            case 'research-paper-outliner':
                return <ResearchPaperOutlinerView onBack={() => setActiveToolId(null)} />;
            case 'article-generator':
                return <ArticleGeneratorView onBack={() => setActiveToolId(null)} />;
            case 'summarize-text':
                return <SummarizeTextView onBack={() => setActiveToolId(null)} />;
            case 'research-generator':
                return <ResearchGeneratorView onBack={() => setActiveToolId(null)} />;
            case 'grammar-checker':
                return <GrammarCheckerView onBack={() => setActiveToolId(null)} />;
            case 'mock-interview':
                return <MockInterviewView onBack={() => setActiveToolId(null)} />;
            case 'math-problem-solver':
                return <MathSolverView onBack={() => setActiveToolId(null)} />;
            default:
                return (
                    <div className="p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
                                <p className="text-gray-600">Select a tool to get started with your content creation.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                                {TOOLS.map(tool => (
                                    <ToolCard 
                                        key={tool.id} 
                                        tool={tool} 
                                        onClick={() => setActiveToolId(tool.id)} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="app-layout h-screen">
            {/* Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <Header user={user} onSignOut={handleSignOut} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto relative z-0">
                    {renderToolView()}
                </main>
            </div>
        </div>
    );
};

export default App;
