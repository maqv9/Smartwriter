
import type { Tone, Blueprint, Tool } from './types';
import * as Icons from './components/icons';

export const TOOLS: Tool[] = [
    {
        id: 'fact-checker',
        name: "Fact-Checker with Source Attribution",
        description: "Verify claims instantly with credible sources, confidence scores, and bias detection.",
        icon: Icons.FactCheckIcon,
        color: '#D1FAE5', // emerald-100
        textColor: '#059669' // emerald-600
    },
    {
        id: 'multi-document-intelligence',
        name: "Multi-Document Intelligence",
        description: "Upload multiple files to chat, summarize, and find cross-document insights.",
        icon: Icons.MultiDocIcon,
        color: '#DBEAFE', // blue-100
        textColor: '#2563EB' // blue-600
    },
    {
        id: 'problem-decomposer',
        name: "Problem Decomposer",
        description: "Break down complex struggles into manageable steps, root causes, and solutions.",
        icon: Icons.DecomposerIcon,
        color: '#CFFAFE', // cyan-100
        textColor: '#0891B2' // cyan-600
    },
    {
        id: 'study-schedule-optimizer',
        name: "Study Schedule Optimizer",
        description: "Input syllabus and deadlines to get a personalized, balanced study plan.",
        icon: Icons.ScheduleIcon,
        color: '#E0E7FF', // indigo-100
        textColor: '#4338CA' // indigo-700
    },
    {
        id: 'practice-question-generator',
        name: "Practice Question Generator",
        description: "Turn text/notes into practice questions with solutions and study mode.",
        icon: Icons.QuizIcon,
        color: '#CCFBF1', // teal-100
        textColor: '#0F766E' // teal-700
    },
    {
        id: 'concept-explainer',
        name: "Concept Explainer (ELI5 to PhD)",
        description: "Understand any topic at any level, from 5-year-old to Expert.",
        icon: Icons.ConceptIcon,
        color: '#DCFCE7', // green-100
        textColor: '#15803D' // green-700
    },
    {
        id: 'flashcard-generator',
        name: "Flashcard Generator",
        description: "Turn text or PDFs into exam-ready spaced repetition flashcards.",
        icon: Icons.FlashcardIcon,
        color: '#FDE68A', // yellow-200
        textColor: '#D97706' // yellow-600
    },
    {
        id: 'viral-hook-generator',
        name: "Viral Hook & Trend Analyzer",
        description: "Generate viral hooks and analyze global trends in your niche.",
        icon: Icons.ViralIcon,
        color: '#F5D0FE', // fuchsia-100
        textColor: '#D946EF' // fuchsia-600
    },
    {
        id: 'proposal-generator',
        name: "Proposal Generator",
        description: "Generate professional business proposals instantly.",
        icon: Icons.ProposalIcon,
        color: '#EEF2FF', // indigo-50
        textColor: '#4F46E5' // indigo-600
    },
    {
        id: 'cover-letter-customizer',
        name: "Cover Letter Customizer",
        description: "Tailor your cover letter to any job description instantly.",
        icon: Icons.CoverLetterIcon,
        color: '#F0FDFA', // teal-50
        textColor: '#0D9488' // teal-600
    },
    {
        id: 'meeting-notes-converter',
        name: "Meeting Notes to Action Items",
        description: "Transform messy meeting notes into structured action plans.",
        icon: Icons.MeetingIcon,
        color: '#FFF7ED', // orange-50
        textColor: '#EA580C' // orange-600
    },
    {
        id: 'email-summarizer',
        name: "Email Thread Summarizer",
        description: "Condense messy threads into summaries, action items, and decisions.",
        icon: Icons.EmailIcon,
        color: '#F0F9FF', // sky-50
        textColor: '#0284C7' // sky-600
    },
    {
        id: 'summarize-text',
        name: "Summarize Text",
        description: "Effortlessly condense large text into shorter summaries.",
        icon: Icons.SummarizeIcon,
        color: '#E0F2FE', // sky-100
        textColor: '#0EA5E9' // sky-500
    },
    {
        id: 'research-paper-outliner',
        name: "Research Paper Outliner",
        description: "Generate structured paper outlines with methodology plans.",
        icon: Icons.OutlinerIcon,
        color: '#DCFCE7', // green-100
        textColor: '#16A34A' // green-600
    },
    {
        id: 'article-generator',
        name: "Article Generator",
        description: "Instantly create unique articles on any topic.",
        icon: Icons.ArticleIcon,
        color: '#E0E7FF', // indigo-100
        textColor: '#6366F1' // indigo-500
    },
    {
        id: 'research-generator',
        name: "Research Generator",
        description: "Create research questions to highlight your aim and objectives.",
        icon: Icons.ResearchIcon,
        color: '#E9D5FF', // purple-100
        textColor: '#A855F7' // purple-500
    },
    {
        id: 'math-problem-solver',
        name: "Math Problem Solver",
        description: "Solve complex math questions with ease.",
        icon: Icons.MathIcon,
        color: '#DBEAFE', // blue-100
        textColor: '#3B82F6' // blue-500
    },
    {
        id: 'grammar-checker',
        name: "Grammar Checker",
        description: "Correct grammar in your texts. Explaining what is wrong.",
        icon: Icons.GrammarIcon,
        color: '#FEE2E2', // red-100
        textColor: '#EF4444' // red-500
    },
     {
        id: 'mock-interview',
        name: "Mock Interview",
        description: "Prepare for your interview with mock interview questions.",
        icon: Icons.InterviewIcon,
        color: '#CCFBF1', // teal-100
        textColor: '#14B8A6' // teal-500
    },
    {
        id: 'project-methodology',
        name: "Project Methodology",
        description: "Let AI compile a project methodology for your project.",
        icon: Icons.MethodologyIcon,
        color: '#FEF9C3', // yellow-100
        textColor: '#EAB308' // yellow-500
    },
    {
        id: 'statement-of-purpose',
        name: "Statement of Purpose",
        description: "Craft a compelling narrative for your academic journey.",
        icon: Icons.StatementIcon,
        color: '#E0F2FE', // lightBlue-100
        textColor: '#0EA5E9' // lightBlue-500
    }
];

export const MOODS: Tone[] = [
    {
        name: "Professional",
        description: "Clear, authoritative, and fact-based.",
        prompt: "Write in a professional, informative, and authoritative tone. Use clear language and focus on providing factual information. Avoid overly casual phrasing or emotional appeals."
    },
    {
        name: "Empathetic",
        description: "Connects with the reader on an emotional level.",
        prompt: "Write in an empathetic, warm, and human tone. Use storytelling and language that shows understanding and compassion. Connect with the reader's feelings."
    },
    {
        name: "Persuasive",
        description: "Strong, confident, and action-oriented.",
        prompt: "Write in a persuasive, bold, and confident tone. Use strong verbs and direct statements to convince the reader."
    },
    {
        name: "Storytelling",
        description: "Narrative-driven, gentle, and engaging.",
        prompt: "Write in a calm, narrative, and storytelling tone. Weave a story around the topic, using descriptive language and a gentle pace to draw the reader in."
    },
    {
        name: "Bold",
        description: "Assertive and makes a strong point.",
        prompt: "Adopt a bold, assertive, and direct writing style. Use strong statements and impactful language to make a powerful point."
    },
    {
        name: "Inspirational",
        description: "Uplifting and motivational.",
        prompt: "Write in an uplifting, motivational, and inspirational tone. Use positive language and calls to action that encourage the reader."
    },
    {
        name: "Analytical",
        description: "Objective, logical, and data-driven.",
        prompt: "Adopt a detached, objective, and analytical tone. Focus on data, logic, and evidence-based reasoning. Avoid emotional language."
    },
    {
        name: "Minimalist",
        description: "Concise, direct, and to the point.",
        prompt: "Write in a minimalist, concise, and direct style. Use short sentences, simple vocabulary, and remove all unnecessary words."
    }
];

export const BLUEPRINTS: Blueprint[] = [
    {
        name: "SEO Blog Blueprint",
        icon: "🎯",
        description: "A classic, well-structured article optimized for search engines.",
        prompt: (topic) => `Write a comprehensive, SEO-optimized blog post about "${topic}". The structure must be:
        1.  **Catchy Title**: An engaging H1 title containing the main keyword "${topic}".
        2.  **Introduction**: A hook to grab the reader's attention, introduce the topic, and include the main keyword naturally.
        3.  **Main Body**: At least 3-4 sections with clear H2 subheadings that use related keywords. Explore the topic in detail.
        4.  **Conclusion**: A summary of the key points and a concluding thought.`
    },
    {
        name: "How-To Guide",
        icon: "🛠️",
        description: "Step-by-step instructions to solve a specific problem.",
        prompt: (topic) => `Create a detailed how-to guide for "${topic}". The structure must be:
        1.  **Clear Title**: An H1 title that starts with "How to...".
        2.  **Introduction**: Briefly explain what the guide will teach and its benefits.
        3.  **Prerequisites/Materials (Optional)**: A list of things needed before starting.
        4.  **Step-by-Step Instructions**: A numbered list with clear, concise steps. Each step should be actionable. Use H2 for the main steps section.
        5.  **Conclusion**: A summary of the process and encouragement.`
    },
    {
        name: "Comparison Battle",
        icon: "⚔️",
        description: "Compares two or more items to help readers choose.",
        prompt: (topic) => `Write a comparison article about "${topic}". The structure must be:
        1.  **Comparative Title**: An H1 title like "${topic.replace(' vs ', ' vs. ')}: Which is Better?".
        2.  **Introduction**: Briefly introduce the items being compared.
        3.  **Feature-by-Feature Comparison**: Compare the items based on key criteria (e.g., Price, Features, Ease of Use). Use H2 subheadings for each criterion.
        4.  **Pros and Cons Summary**: A quick summary of pros and cons for each item.
        5.  **Conclusion**: A final recommendation on which item to choose for different types of users.`
    },
    {
        name: "In-Depth Review",
        icon: "⭐",
        description: "In-depth review of a product or service with pros and cons.",
        prompt: (topic) => `Write a thorough review of "${topic}". The structure must be:
        1.  **Engaging Title**: An H1 title like "An Honest Review of ${topic}".
        2.  **Introduction**: Introduce the product/service and your overall first impression.
        3.  **Key Features**: Detail the main features and functionalities under an H2.
        4.  **Pros and Cons**: A balanced look at the advantages and disadvantages, each with its own H3.
        5.  **Who is it for?**: Describe the ideal user for this product/service.
        6.  **Verdict/Conclusion**: Your final opinion and rating (e.g., out of 5 stars).`
    }
];
