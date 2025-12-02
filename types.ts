
// FIX: Import React to resolve 'Cannot find namespace 'React'' error.
import type * as React from 'react';

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    textColor: string;
}

export interface Tone {
    name: string;
    description: string;
    prompt: string;
}

export interface Blueprint {
    name: string;
    description: string;
    icon: string;
    prompt: (topic: string) => string;
}

export interface SeoAnalysis {
    seoScore: number;
    suggestedKeywords: string[];
    readabilityScore: string;
    estimatedCtr: string;
}

export interface KeywordAnalysis {
    competition: 'Low' | 'Medium' | 'High';
    searchVolume: 'Low' | 'Medium' | 'High';
    cpc: string;
}

export interface Citation {
    uri: string;
    title: string;
}

export interface PlagiarismSource {
    uri: string;
    title: string;
}

export interface PlagiarismResult {
    summary: string;
    sources: PlagiarismSource[];
}

export interface GeneratedTitles {
    emotional: string;
    clickbait: string;
    seo: string;
}

export interface InlineImage {
    url: string;
    prompt: string;
}

export interface GenerationResult {
    article: string;
    seoAnalysis: SeoAnalysis | null;
    titles: GeneratedTitles | null;
    metaDescription: string;
    imageUrl: string; // Hero Image
    imagePrompt: string;
    twitterCaption: string;
    linkedinSummary: string;
    socialHashtags: string[];
    inlineImages: InlineImage[];
    citations: Citation[];
    plagiarismResult: PlagiarismResult | null;
}

export interface InstagramCaptionResult {
  captions: string[];
  hashtags: string[];
}

export type ResearchLevel = 'School' | 'College' | 'University' | 'Professional';
export type ResearchOutputType = 'Research Questions' | 'Research Objectives' | 'Problem Statement' | 'Hypothesis' | 'Mini-Proposal';

export interface MiniProposal {
    introduction: string;
    aimAndObjectives: string;
    scope: string;
}

export interface ResearchResult {
    outputType: ResearchOutputType;
    questions?: string[];
    objectives?: string[];
    problemStatement?: string;
    hypothesis?: string;
    miniProposal?: MiniProposal;
    citations?: Citation[];
}

export type GrammarTone = 'Default' | 'Formal' | 'Casual' | 'Academic' | 'Friendly' | 'Creative';

export interface GrammarCheckResult {
    correctedText: string;
    readabilityScore: string;
    summaryOfChanges: string;
}

export interface InterviewTranscriptEntry {
    speaker: 'Interviewer' | 'You';
    text: string;
    isFinal: boolean;
}

export interface InterviewFeedback {
    overallScore: number;
    scoreRationale: string;
    strengths: string[];
    areasForImprovement: string[];
    suggestedImprovements: {
        area: string;
        suggestion: string;
    }[];
    repeatedMistakes: string[];
}

export interface MathStep {
    step: string;
    explanation: string;
}

export interface MathSolverResult {
    solution: string;
    steps: MathStep[];
    latex: string;
    graphSuggestion?: string;
}

export interface Hashtag {
    tag: string;
    trendScore: number;
    difficultyScore: number;
    reachPotential: string;
    postVolume: string;
}

export interface SeoKeyword {
    keyword: string;
    searchVolume: string; // 'High', 'Medium', 'Low'
    relevanceScore: number; // 1-100
    trendStatus: 'Rising' | 'Stable' | 'Declining';
}

export interface HashtagStrategyResult {
    hashtags: {
        lowCompetition: Hashtag[];
        mediumCompetition: Hashtag[];
        highCompetition: Hashtag[];
    };
    seoKeywords: SeoKeyword[];
    locationTags: string[];
}

export interface ThumbnailVariant {
    imageUrl: string;
    predictedCtr: number;
    colorScore: number;
    textVisibility: number;
    emotionImpact: number;
    rank: number;
}

export interface TrendItem {
    topic: string;
    viralityScore: number; // 0-100
    volumeLabel: string; // e.g. "Breaking", "High", "Steady"
    reason: string; // Why it's trending
    contentIdeas: string[]; // 3 ideas
}

export interface TrendScanResult {
    trends: TrendItem[];
    citations?: Citation[];
}

export interface EvidenceMatrixItem {
    study: string;
    year: string;
    method: string;
    sampleSize: string;
    keyFinding: string;
    limitations: string;
}

export interface GraphNode {
    id: string;
    label: string; // Paper title or Author
    type: 'paper' | 'topic';
    val: number; // Importance/Size
}

export interface GraphLink {
    source: string;
    target: string;
}

export interface LiteratureSynthesisResult {
    synthesis: {
        background: string;
        methodologyOverview: string;
        keyFindings: string;
        researchGaps: string;
        conclusion: string;
    };
    matrix: EvidenceMatrixItem[];
    graph: {
        nodes: GraphNode[];
        links: GraphLink[];
    };
    topics: string[];
}

export interface OutlineSection {
    title: string;
    points: string[];
}

export interface MethodOption {
    name: string; // e.g., "Quantitative Survey"
    description: string;
    samplePlan: string; // "N=300 students"
    analysisPlan: string; // "Linear Regression"
}

export interface TimelinePhase {
    phase: string;
    duration: string;
    tasks: string[];
}

export interface ResearchOutlineResult {
    paperTitle: string;
    abstract: string;
    sections: OutlineSection[];
    methodologyOptions: MethodOption[];
    timeline: TimelinePhase[];
    suggestedReadings: string[]; // List of 3-5 seminal papers/keywords
}

export interface EmailActionItem {
    task: string;
    assignee: string;
    deadline: string; // Can be "None" or "ASAP"
    priority: 'High' | 'Medium' | 'Low';
}

export interface EmailDecision {
    decision: string;
    madeBy: string;
    context: string;
    timestamp?: string;
}

export interface EmailTimelineEvent {
    sender: string;
    snippet: string;
}

export interface EmailSummaryResult {
    summary: string;
    actionItems: EmailActionItem[];
    decisions: EmailDecision[];
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Frustrated' | 'Confused';
    keyPeople: string[];
    timeline: EmailTimelineEvent[];
    draftReply: string;
}

export interface MeetingActionItem {
    task: string;
    assignee: string;
    deadline: string;
    priority: 'High' | 'Medium' | 'Low';
}

export interface MeetingSummaryResult {
    summary: string;
    keyDecisions: string[];
    actionItems: MeetingActionItem[];
    agendaOutcomes: string[];
}

export type ProposalStyle = 'Corporate / Formal' | 'Friendly / Casual' | 'Technical / Engineering' | 'Creative / Marketing';

export interface ProposalOutput {
    title: string;
    executiveSummary: string;
    projectOverview: string;
    scopeOfWork: string[];
    deliverables: string[];
    timeline: { phase: string; duration: string }[];
    pricing: { item: string; cost: string }[];
    termsAndConditions: string[];
    whyChooseUs: string;
}

export type CoverLetterTone = 'Professional' | 'Casual' | 'Confident' | 'Friendly';

export interface CoverLetterResult {
    coverLetter: string;
    matchedSkills: string[];
    keywordsUsed: string[];
    missingSkills: string[];
    matchScore: number; // 0-100
}

// Viral Hook Generator Types
export type HookType = 'Fear-based' | 'Curiosity-based' | 'Shock' | 'Story' | 'Contrarian' | 'Did You Know';

export interface ViralHook {
    text: string;
    type: HookType;
    score: number; // Predicted virality 0-100
    explanation: string;
}

export interface TrendInsight {
    topic: string;
    growthStatus: 'Exploding' | 'Rising' | 'Stable';
    engagementSpike: string; // e.g. "+200% this week"
    competitorPattern: string;
    bestPostingTime: string;
}

export interface ViralHookResult {
    hooks: ViralHook[];
    trendAnalysis: {
        insights: TrendInsight[];
        risingKeywords: string[];
    };
    citations?: Citation[];
}

// Flashcard Generator Types
export interface Flashcard {
    front: string;
    back: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface FlashcardSet {
    title: string;
    summary: string;
    cards: Flashcard[];
}

// Concept Explainer Types
export type ComplexityLevel = 'ELI5' | 'Basic' | 'Intermediate' | 'Advanced' | 'PhD';

export interface ConceptExplanationResult {
    explanation: string;
    analogy: string;
    realLifeExample: string;
    visualDescription: string; // Text-based flowchart
}

// Study Schedule Optimizer Types
export interface StudySubject {
    name: string;
    topics: string; // Comma separated
    difficulty: 'Easy' | 'Medium' | 'Hard';
    id: string;
}

export interface StudyPreferences {
    startDate: string;
    endDate: string;
    dailyHours: number;
    breakDay?: string;
    focus: 'Balanced' | 'Exam Cram' | 'Deep Learning';
}

export interface StudyTask {
    subject: string;
    topic: string;
    durationMinutes: number;
    description: string;
    isCompleted: boolean;
}

export interface StudyDay {
    date: string;
    dayName: string;
    tasks: StudyTask[];
    totalStudyTime: number;
}

export interface StudyPlanResult {
    schedule: StudyDay[];
    overview: {
        totalDays: number;
        totalHours: number;
        focusSubject: string;
    };
}

// Practice Question Generator Types
export type QuestionType = 'MCQ' | 'Short Answer' | 'True/False' | 'Fill-in-the-blank' | 'Mixed';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface PracticeQuestion {
    id: string;
    type: QuestionType;
    question: string;
    options?: string[]; // Only for MCQ
    correctAnswer: string;
    explanation: string; // For "Teach Me" feature
    topicTag: string;
}

export interface QuestionSet {
    title: string;
    questions: PracticeQuestion[];
}

// Decision Matrix Types
export interface DecisionOption {
    id: string;
    name: string;
    description: string;
    scores: Record<string, number>; // criterionId -> score (0-10)
}

export interface DecisionCriterion {
    id: string;
    name: string;
    weight: number; // 1-5 importance scale
}

export interface DecisionAnalysis {
    winner: string;
    explanation: string;
    keyFactors: string[];
    tradeoffs: string;
    whatIf: string;
}

// Problem Decomposer Types
export interface SubProblem {
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    solution: string;
    practicalExample: string;
}

export interface ActionStep {
    stepNumber: number;
    action: string;
    explanation: string;
}

export interface Contingency {
    ifCondition: string;
    thenAction: string;
}

export interface ProblemDecompositionResult {
    rootCauses: string[];
    subProblems: SubProblem[];
    actionPlan: ActionStep[];
    contingencies: Contingency[];
    visualStructure: string; // Markdown tree or descriptive structure
}

// Argument Mapper Types
export interface ArgumentNode {
    id: string;
    text: string;
    type: 'Claim' | 'Premise' | 'Evidence' | 'Assumption' | 'Counterpoint';
    children?: ArgumentNode[];
}

export interface Fallacy {
    name: string;
    description: string;
    location: string; // Quote or part of text
}

export interface ArgumentAnalysis {
    clarityScore: number;
    logicScore: number;
    evidenceScore: number;
    persuasivenessScore: number;
    fallacies: Fallacy[];
    suggestions: string[];
    counterArguments: { point: string; rebuttal: string }[];
    simplifiedVersion: string;
}

export interface ArgumentMapResult {
    tree: ArgumentNode;
    analysis: ArgumentAnalysis;
}

// Multi-Document Intelligence Types
export interface MultiDocAnalysisResult {
    combinedSummary: string;
    topics: { name: string; description: string; sourceFiles: string[] }[];
    commonThemes: string[];
    conflicts: string[];
}

export interface DocChatMessage {
    role: 'user' | 'model';
    text: string;
    sources?: string[]; // Filenames cited
}

// Fact Checker Types
export type VerdictType = 'True' | 'False' | 'Partially True' | 'Misleading' | 'Unverified';

export interface FactCheckResult {
    verdict: VerdictType;
    confidenceScore: number; // 0-100
    explanation: string;
    sources: Citation[];
    conflicts: string; // Explanation of any conflicts in sources
    simplifiedSummary: string;
    biasAnalysis: string; // Detection of bias in the claim
}
