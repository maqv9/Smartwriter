
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SeoAnalysis, KeywordAnalysis, Citation, PlagiarismResult, PlagiarismSource, GeneratedTitles, InlineImage, InstagramCaptionResult, ResearchResult, ResearchLevel, ResearchOutputType, GrammarCheckResult, GrammarTone, MathSolverResult, InterviewFeedback, HashtagStrategyResult, TrendScanResult, ThumbnailVariant, LiteratureSynthesisResult, ResearchOutlineResult, EmailSummaryResult, MeetingSummaryResult, ProposalOutput, ProposalStyle, CoverLetterResult, CoverLetterTone, ViralHookResult, FlashcardSet, ConceptExplanationResult, ComplexityLevel, StudySubject, StudyPreferences, StudyPlanResult, QuestionSet, QuestionType, QuestionDifficulty, DecisionOption, DecisionCriterion, DecisionAnalysis, ProblemDecompositionResult, ArgumentMapResult, MultiDocAnalysisResult, DocChatMessage, FactCheckResult } from '../types';

// Helper function to call the Vercel Serverless Function
const callProxy = async (model: string, contents: any, config: any = {}) => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, contents, config }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'API Request Failed');
        }

        return await response.json();
    } catch (error) {
        console.error("Proxy Error:", error);
        throw error;
    }
};

// We still need the SDK instance for the Live API (Mock Interview) which works best client-side via WebSockets
// For this, we try to use the VITE_ prefixed env var for the browser.
const getClientSideAI = () => {
    // In Vercel/Vite, env vars start with VITE_
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY || "AIzaSyAvY-x0aZcll-3JV-YkaLltqpcny8PyHoM"; 
    return new GoogleGenAI({ apiKey });
};

export const generateArticle = async (topic: string, templatePrompt: string, tonePrompt: string, isThinkingMode: boolean, wordCount: number): Promise<string> => {
    const config: any = {
        systemInstruction: `You are SmartWriter AI, an expert SEO content creator. Your task is to write a high-quality, publish-ready article on the given topic. The article should be approximately ${wordCount} words long. The output must be in proper Markdown format.

SEO & Formatting Rules:
1.  The user's topic ("${topic}") is the main keyword.
2.  The main H1 title MUST contain the main keyword.
3.  Use the main keyword naturally within the first 100 words (the introduction).
4.  Use the main keyword or related LSI keywords in H2 subheadings.
5.  Structure the article with a clear hierarchy (one H1 for the title, multiple H2s for main sections, paragraphs, and lists where appropriate).
6.  Ensure the content is valuable, well-researched, and engaging.

TONE INSTRUCTION: ${tonePrompt}`,
    };

    if (isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await callProxy('gemini-2.5-pro', templatePrompt, config);
    return response.text;
};

const seoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        seoScore: { type: Type.INTEGER, description: "An SEO score out of 100" },
        suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 5 suggested keywords." },
        readabilityScore: { type: Type.STRING, description: "Readability score, e.g., 'Grade 9' or 'College Level'." },
        estimatedCtr: { type: Type.STRING, description: "A rating for the headline's potential CTR, e.g., 'High' or 'Average'." }
    },
    required: ["seoScore", "suggestedKeywords", "readabilityScore", "estimatedCtr"]
};

export const analyzeSeo = async (article: string): Promise<SeoAnalysis> => {
    const response = await callProxy('gemini-2.5-flash', 
        `Analyze the following article for SEO. Provide a score out of 100, suggest 5 relevant keywords, a readability score (e.g., Flesch-Kincaid grade level), and rate the headline's potential click-through rate (CTR). \n\nARTICLE:\n${article}`,
        {
            responseMimeType: "application/json",
            responseSchema: seoAnalysisSchema
        }
    );
    const json = JSON.parse(response.text);
    return json as SeoAnalysis;
};

const publishKitSchema = {
    type: Type.OBJECT,
    properties: {
        titles: {
            type: Type.OBJECT,
            properties: {
                emotional: { type: Type.STRING, description: "An emotionally resonant title." },
                clickbait: { type: Type.STRING, description: "A high-CTR, clickbait-style title." },
                seo: { type: Type.STRING, description: "A title optimized for search engines, containing the main keyword." }
            },
            required: ["emotional", "clickbait", "seo"]
        },
        metaDescription: { type: Type.STRING, description: "A concise, compelling meta description (max 160 characters)." },
        twitterCaption: { type: Type.STRING, description: "A short, engaging caption for Twitter/X (max 280 characters)." },
        linkedinSummary: { type: Type.STRING, description: "A professional summary for a LinkedIn post." },
        socialHashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 5-7 relevant hashtags for social media." }
    },
    required: ["titles", "metaDescription", "twitterCaption", "linkedinSummary", "socialHashtags"]
};

export const generatePublishKit = async (article: string, topic: string): Promise<{ titles: GeneratedTitles, metaDescription: string, twitterCaption: string, linkedinSummary: string, socialHashtags: string[] }> => {
    const response = await callProxy('gemini-2.5-flash',
        `Based on the article about "${topic}", create a complete publish kit.\n\nARTICLE:\n${article}`,
        {
            responseMimeType: "application/json",
            responseSchema: publishKitSchema
        }
    );
    const json = JSON.parse(response.text);
    return json;
};


export const generateImagePrompt = async (article: string): Promise<string> => {
    const response = await callProxy('gemini-2.5-flash',
        `Create a short, descriptive prompt for a visually stunning hero image that represents this article. The prompt should be a single sentence. Article: ${article.substring(0, 1000)}`
    );
    return response.text;
};

export const generateInlineImagePrompts = async (article: string): Promise<string[]> => {
    const response = await callProxy('gemini-2.5-flash',
        `Based on the following article, generate 2 distinct, simple prompts for inline illustrations. Each prompt should correspond to a different main section of the article and be visually simple (e.g., 'a minimalist icon of a growing plant'). Return a JSON array of strings.\n\nARTICLE:\n${article.substring(0, 2000)}`,
        {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["prompts"]
            }
        }
    );
    const json = JSON.parse(response.text);
    return json.prompts;
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        // Image generation via proxy
        const imageResponse = await callProxy('gemini-2.5-flash-image', 
            { parts: [{ text: prompt }] },
            { responseModalities: ["IMAGE"] }
        );

        for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    } catch (error) {
        console.error("Image generation failed:", error);
    }
    return 'https://placehold.co/1280x720/E0E7FF/6366F1/png?text=Image+Generation+Failed'; // Fallback
};


export const humanizeText = async (article: string, isThinkingMode: boolean): Promise<string> => {
    const config: any = {
        systemInstruction: `You are an expert editor. Rewrite the following text to make it sound more human and less like an AI. Use varied sentence structures, incorporate subtle rhetorical devices, and adopt a more natural, slightly informal cadence. The goal is to create content that would easily pass AI detection tools while retaining the core message.`,
    };

    if (isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }
    
    const response = await callProxy('gemini-2.5-pro', article, config);
    return response.text;
};

export const factCheckWithSources = async (article: string): Promise<{ updatedArticle: string, citations: Citation[] }> => {
    const response = await callProxy('gemini-2.5-flash',
        `Please review the following article. Identify any claims that could be strengthened with a factual citation. If you find opportunities, rewrite the relevant sentences to include a statistic or fact, then provide the source. If the article is fine, say so.\n\nARTICLE:\n${article}`,
        { tools: [{ googleSearch: {} }] }
    );
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations: Citation[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled Source'
        }))
        .filter((citation: Citation) => citation.uri);

    return { updatedArticle: response.text, citations };
};

export const checkPlagiarism = async (article: string): Promise<PlagiarismResult> => {
    const response = await callProxy('gemini-2.5-flash',
        `Analyze the following article for plagiarism. Use Google Search to find existing content with significant overlap.\n- If no matching content is found, confirm that the text appears to be unique.\n- If potential matches are found, provide a summary and list the sources.\n\nARTICLE:\n${article}`,
        { tools: [{ googleSearch: {} }] }
    );

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: PlagiarismSource[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled Source'
        }))
        .filter((source: PlagiarismSource) => source.uri);

    return { summary: response.text, sources };
};

const keywordAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        competition: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        searchVolume: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        cpc: { type: Type.STRING, description: "An estimated Cost Per Click, e.g., '$2.50'" }
    },
    required: ["competition", "searchVolume", "cpc"]
};

export const analyzeKeyword = async (keyword: string): Promise<KeywordAnalysis> => {
    const response = await callProxy('gemini-2.5-flash',
        `As an expert SEO analyst, evaluate the keyword "${keyword}". Provide an estimated keyword competition, search volume, and CPC value. The competition and search volume should be one of 'Low', 'Medium', or 'High'.`,
        {
            responseMimeType: "application/json",
            responseSchema: keywordAnalysisSchema
        }
    );
    const json = JSON.parse(response.text);
    return json as KeywordAnalysis;
};

export const summarizeText = async (
    text: string,
    length: string,
    tone: string,
    highlight: boolean,
    bullets: boolean
): Promise<string> => {
    let instructions = `
        You are an expert summarizer. Your task is to condense the following text based on these instructions:
        1.  **Summary Length:** Create a ${length.toLowerCase()} summary.
        2.  **Tone:** Write in a ${tone.toLowerCase()} tone.
    `;

    if (highlight) {
        instructions += `\n3. **Highlighting:** Emphasize the most important key points by making them bold using Markdown (**key point**).`;
    }

    if (bullets) {
        instructions += `\n4. **Bulleted List:** After the main summary, provide a separate bulleted list of the most important takeaways using markdown asterisks (*).`;
    }

    const response = await callProxy('gemini-2.5-flash', `${instructions}\n\n--- TEXT TO SUMMARIZE ---\n\n${text}`);
    return response.text;
};

export const generateInstagramCaptions = async (
    description: string,
    niche: string,
    style: string,
    useEmojis: boolean,
    callToAction: string,
    image?: { mimeType: string; data: string }
): Promise<InstagramCaptionResult> => {
    let prompt = `You are a world-class social media manager specializing in Instagram. Your task is to generate compelling captions for a post.

**Post Details:**
- **Description:** ${description}
- **Niche:** ${niche}
- **Desired Style:** ${style}

**Instructions:**
1.  Generate 3 distinct caption variations based on the provided details.
2.  ${useEmojis ? "Incorporate relevant and trending emojis naturally within each caption." : "Do not use emojis."}
3.  ${callToAction !== 'None' ? `Include a clear call-to-action at the end of each caption. The desired action is: "${callToAction}".` : "Do not include a specific call-to-action unless it flows naturally."}
4.  Generate a list of 10-15 smart, relevant hashtags. Include a mix of popular and niche-specific hashtags.
5.  If an image is provided, analyze it to deeply understand the context, mood, and objects, and tailor the captions and hashtags accordingly.
`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            captions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 3 unique Instagram caption strings."
            },
            hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 10-15 relevant hashtag strings, without the '#' symbol."
            }
        },
        required: ["captions", "hashtags"]
    };

    const parts: any[] = [];
    if (image) {
        parts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        });
    }
    parts.push({ text: prompt });

    const response = await callProxy('gemini-2.5-flash', 
        { parts },
        {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    );

    const json = JSON.parse(response.text);
    return json as InstagramCaptionResult;
};

export const generateResearchContent = async (
    topic: string,
    level: ResearchLevel,
    outputType: ResearchOutputType,
    addCitations: boolean
): Promise<ResearchResult> => {
    let instructions = `You are an expert academic research assistant. Your task is to generate content for the topic "${topic}" at a ${level} level.
The user wants you to generate: "${outputType}".
Adopt a formal, academic tone.
${addCitations ? "If relevant, use Google Search to find and include citations for any factual claims." : ""}`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            outputType: { type: Type.STRING, enum: ['Research Questions', 'Research Objectives', 'Problem Statement', 'Hypothesis', 'Mini-Proposal'] },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            problemStatement: { type: Type.STRING },
            hypothesis: { type: Type.STRING },
            miniProposal: {
                type: Type.OBJECT,
                properties: {
                    introduction: { type: Type.STRING },
                    aimAndObjectives: { type: Type.STRING },
                    scope: { type: Type.STRING },
                },
            }
        },
        required: ["outputType"]
    };
    
    const config: any = {
        responseMimeType: "application/json",
        responseSchema: schema
    };

    if (addCitations) {
        config.tools = [{ googleSearch: {} }];
    }

    const response = await callProxy('gemini-2.5-flash', instructions, config);

    const json = JSON.parse(response.text);
    const result: ResearchResult = json;

    if (addCitations) {
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const citations: Citation[] = groundingChunks
            .map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || 'Untitled Source'
            }))
            .filter((citation: Citation) => citation.uri);
        result.citations = citations;
    }

    return result;
};

export const checkGrammarAndRewrite = async (
    text: string,
    tone: GrammarTone
): Promise<GrammarCheckResult> => {
    let systemInstruction = `You are an expert English editor named "Correcto". Your task is to meticulously correct the user's text.
- Fix all grammar, spelling, and punctuation errors.
- Improve sentence structure, clarity, and flow.
- Make the writing sound natural and professional.`;

    let userInstruction = '';
    if (tone === 'Default') {
        userInstruction = `Correct the following text but preserve its original tone:\n\n---\n\n${text}`;
    } else {
        userInstruction = `Correct the following text and rewrite it in a ${tone.toLowerCase()} tone:\n\n---\n\n${text}`;
    }
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            correctedText: {
                type: Type.STRING,
                description: "The fully corrected and rewritten version of the text."
            },
            readabilityScore: {
                type: Type.STRING,
                description: "The readability score of the corrected text, e.g., 'High School' or 'College'."
            },
            summaryOfChanges: {
                type: Type.STRING,
                description: "A brief, one-sentence summary of the main changes made (e.g., 'Corrected grammar and adjusted to a more formal tone.')."
            }
        },
        required: ["correctedText", "readabilityScore", "summaryOfChanges"]
    };

    const response = await callProxy('gemini-2.5-flash', userInstruction, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });
    
    const json = JSON.parse(response.text);
    return json as GrammarCheckResult;
};

export const generateInterviewFeedback = async (
    transcript: string,
    jobRole: string,
    jobDescription: string,
    cvText: string | null
): Promise<InterviewFeedback> => {
    const systemInstruction = `You are an expert career coach and interview analyst named 'HireVise AI'. Your task is to provide a detailed, highly constructive feedback report on a mock interview transcript.

**Analysis Context:**
- **Job Role:** ${jobRole}
- **Job Description:** ${jobDescription || 'Not provided.'}
- **Candidate's CV:** ${cvText || 'Not provided.'}

**Core Analysis Criteria:**
Analyze the candidate's answers based on the following pillars:
- **Clarity:** Was the communication clear and concise?
- **Confidence:** Did the candidate sound confident and knowledgeable?
- **Structure:** Were answers well-structured? For behavioral questions, was the STAR (Situation, Task, Action, Result) method used effectively?
- **Relevance:** Were the answers directly relevant to the questions and the job role?
- **Tone:** Was the tone professional, confident, and friendly?

**Feedback Report Instructions (JSON Output):**
1.  **overallScore:** Provide an overall score out of 100 based on the analysis criteria.
2.  **scoreRationale:** Briefly explain the key factors that led to the score.
3.  **strengths:** Identify 2-3 of the candidate's most significant strengths.
4.  **areasForImprovement:** Identify the 2-3 most critical areas needing improvement.
5.  **suggestedImprovements:** Provide specific, actionable suggestions. For at least one behavioral question where the answer was weak, provide an "Ideal Sample Answer" that demonstrates the STAR method perfectly. Frame this within the 'suggestion' field.
6.  **repeatedMistakes:** List any repeated mistakes observed.

Respond ONLY with the requested JSON object.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            overallScore: { type: Type.NUMBER },
            scoreRationale: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedImprovements: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING },
                        suggestion: { type: Type.STRING }
                    },
                    required: ["area", "suggestion"]
                }
            },
            repeatedMistakes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["overallScore", "scoreRationale", "strengths", "areasForImprovement", "suggestedImprovements", "repeatedMistakes"]
    };

    const response = await callProxy('gemini-2.5-pro', `INTERVIEW TRANSCRIPT:\n\n${transcript}`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });
    
    const json = JSON.parse(response.text);
    return json as InterviewFeedback;
};


export const solveMathProblem = async (
    problem: string,
    level: string,
    type: string,
    image?: { mimeType: string; data: string }
): Promise<MathSolverResult> => {
    const systemInstruction = `You are a world-class math tutor named "Math-GPT". Your task is to solve the given math problem step-by-step. Provide a final, clear solution, a detailed breakdown of the steps with explanations, and a LaTeX representation of the full solution. If the problem involves graphing, provide a clear suggestion for what to plot. Respond ONLY with the requested JSON format.`;

    let userInstruction = `
        **Math Problem Details:**
        - **Problem:** ${problem}
        - **Academic Level:** ${level}
        - **Problem Type:** ${type}

        Please solve this problem.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            solution: { type: Type.STRING },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        step: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["step", "explanation"]
                }
            },
            latex: { type: Type.STRING },
            graphSuggestion: { type: Type.STRING }
        },
        required: ["solution", "steps", "latex"]
    };

    const parts: any[] = [];
    if (image) {
        parts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        });
        if (!problem) {
            userInstruction = `
                **Math Problem Details:**
                - **Problem:** Transcribe and solve the math problem from the attached image.
                - **Academic Level:** ${level}
                - **Problem Type:** ${type}

                Please solve this problem.
            `;
        }
    }
    parts.push({ text: userInstruction });

    const response = await callProxy('gemini-2.5-flash', { parts }, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    const json = JSON.parse(response.text);
    return json as MathSolverResult;
};

const hashtagStrategySchema = {
    type: Type.OBJECT,
    properties: {
        hashtags: {
            type: Type.OBJECT,
            properties: {
                lowCompetition: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tag: { type: Type.STRING }, trendScore: { type: Type.NUMBER }, difficultyScore: { type: Type.NUMBER }, reachPotential: { type: Type.STRING }, postVolume: { type: Type.STRING } }, required: ["tag", "trendScore", "difficultyScore", "reachPotential", "postVolume"] } },
                mediumCompetition: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tag: { type: Type.STRING }, trendScore: { type: Type.NUMBER }, difficultyScore: { type: Type.NUMBER }, reachPotential: { type: Type.STRING }, postVolume: { type: Type.STRING } }, required: ["tag", "trendScore", "difficultyScore", "reachPotential", "postVolume"] } },
                highCompetition: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tag: { type: Type.STRING }, trendScore: { type: Type.NUMBER }, difficultyScore: { type: Type.NUMBER }, reachPotential: { type: Type.STRING }, postVolume: { type: Type.STRING } }, required: ["tag", "trendScore", "difficultyScore", "reachPotential", "postVolume"] } }
            },
            required: ["lowCompetition", "mediumCompetition", "highCompetition"]
        },
        seoKeywords: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, searchVolume: { type: Type.STRING }, relevanceScore: { type: Type.NUMBER }, trendStatus: { type: Type.STRING } }, required: ["keyword", "searchVolume", "relevanceScore", "trendStatus"] } },
        locationTags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["hashtags", "seoKeywords", "locationTags"]
};

export const generateHashtagStrategy = async (
    description: string,
    niche: string,
    platform: string,
    location: string | null
): Promise<HashtagStrategyResult> => {
    const systemInstruction = `You are a world-class social media and SEO expert named "TagMaster AI". Your task is to generate a comprehensive hashtag, SEO keyword, and location tag strategy based on user input. Provide trend scores, difficulty, and other key metrics.`;
    
    let userInstruction = `Generate a strategy for the following post:
- **Platform:** ${platform}
- **Niche:** ${niche}
- **Post Description:** ${description}
`;
    if (location) {
        userInstruction += `- **Location:** ${location}`;
    }

    const response = await callProxy('gemini-2.5-flash', userInstruction, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: hashtagStrategySchema
    });
    
    const json = JSON.parse(response.text);
    return json as HashtagStrategyResult;
};

export const scanTrends = async (
    niche: string,
    platform: string,
    timeframe: string,
    count: number
): Promise<TrendScanResult> => {
    const systemInstruction = `You are a trend hunter. Your goal is to identify the top ${count} trending topics for a specific niche on a specific platform.
    You MUST use Google Search to find real-time data about what is trending RIGHT NOW.
    Do not hallucinate trends. Base them on the search results.
    IMPORTANT: You must output ONLY valid JSON. Do not wrap the JSON in Markdown code blocks.`;

    const response = await callProxy('gemini-2.5-flash', 
        `Find the top ${count} trending topics, questions, or viral themes for the "${niche}" niche on ${platform} from the past ${timeframe}.
        For each trend, explain why it's trending and suggest 3 content ideas.
        
        Return the output as a valid JSON object matching this structure:
        {
          "trends": [
            {
              "topic": "string",
              "viralityScore": number (0-100),
              "volumeLabel": "string",
              "reason": "string",
              "contentIdeas": ["string", "string", "string"]
            }
          ]
        }`,
        {
            systemInstruction,
            tools: [{ googleSearch: {} }]
        }
    );

    const cleanJson = (text: string) => {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            return text.substring(start, end + 1);
        }
        return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    };

    let json;
    try {
        json = JSON.parse(cleanJson(response.text));
    } catch (e) {
        console.error("Failed to parse JSON from Trend Scanner", response.text);
        throw new Error("Failed to parse trend data. The model did not return valid JSON.");
    }

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Source'
        }))
        .filter((c: Citation) => c.uri) || [];

    return { ...json, citations };
};

export const generateThumbnailVariants = async (headline: string, description: string): Promise<ThumbnailVariant[]> => {
    // Step 1: Generate prompts
    const promptResponse = await callProxy('gemini-2.5-flash',
        `Generate 2 distinct, high-quality prompt descriptions for YouTube thumbnails based on the headline: "${headline}" and topic: "${description}". 
        The prompts should describe the visual elements, colors, and text overlay placement.
        Also return 2 mock analysis objects with predictedCTR, colorScore, etc.
        
        Return JSON format:
        {
            "variants": [
                {
                    "prompt": "string",
                    "analysis": { "predictedCtr": number, "colorScore": number, "textVisibility": number, "emotionImpact": number }
                }
            ]
        }`,
        {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    variants: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING },
                                analysis: { type: Type.OBJECT, properties: { predictedCtr: { type: Type.NUMBER }, colorScore: { type: Type.NUMBER }, textVisibility: { type: Type.NUMBER }, emotionImpact: { type: Type.NUMBER } }, required: ["predictedCtr", "colorScore", "textVisibility", "emotionImpact"] }
                            },
                            required: ["prompt", "analysis"]
                        }
                    }
                },
                required: ["variants"]
            }
        }
    );
    
    const promptJson = JSON.parse(promptResponse.text);
    const variants: ThumbnailVariant[] = [];
    
    // Step 2: Generate Images via Proxy
    for (let i = 0; i < promptJson.variants.length; i++) {
        const item = promptJson.variants[i];
        const fullPrompt = `Youtube thumbnail: ${item.prompt}. The image MUST include the text "${headline}" clearly visible. High quality, 4k, vibrant colors.`;
        const imageUrl = await generateImage(fullPrompt);
        variants.push({
            imageUrl,
            predictedCtr: item.analysis.predictedCtr,
            colorScore: item.analysis.colorScore,
            textVisibility: item.analysis.textVisibility,
            emotionImpact: item.analysis.emotionImpact,
            rank: i + 1
        });
    }
    
    return variants;
};

export const analyzeVideoForClips = async (videoFile: File, platform: string): Promise<any> => {
    // Note: Video analysis still needs to be client-side due to Vercel Serverless Function payload limits (4.5MB).
    // Large files cannot be proxied through the basic Vercel proxy.
    const ai = getClientSideAI();
    
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(videoFile);
    });
    const base64 = await base64EncodedDataPromise;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: videoFile.type, data: base64 } },
                { text: `Analyze this video and identify 3 viral clips suitable for ${platform}. 
                    For each clip, provide a hook title, a reasoning for why it's viral, and a "Virality Score" (0-100).
                    Also suggest a caption.
                    Return JSON.` 
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    clips: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                reason: { type: Type.STRING },
                                viralityScore: { type: Type.NUMBER },
                                caption: { type: Type.STRING }
                            },
                             required: ["title", "reason", "viralityScore", "caption"]
                        }
                    }
                },
                required: ["clips"]
            }
        }
    });

    const json = JSON.parse(response.text);
    return json.clips;
};

export const synthesizeLiterature = async (
    files: File[]
): Promise<LiteratureSynthesisResult> => {
    // For large files/PDFs, we also stay client side for now to avoid proxy limits
    const ai = getClientSideAI();
    
    const fileParts = await Promise.all(files.map(async (file) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        return {
            inlineData: {
                mimeType: file.type,
                data: base64
            }
        };
    }));

    const systemInstruction = `You are an academic researcher expert in synthesizing literature reviews. 
    Analyze the provided PDF documents. 
    Extract key findings, methodologies, and connections between papers.
    Identify research gaps and consensus.
    Generate a structured JSON response containing the synthesis text sections, a matrix of evidence, and nodes/links for a citation graph.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            synthesis: {
                type: Type.OBJECT,
                properties: {
                    background: { type: Type.STRING },
                    methodologyOverview: { type: Type.STRING },
                    keyFindings: { type: Type.STRING },
                    researchGaps: { type: Type.STRING },
                    conclusion: { type: Type.STRING }
                },
                required: ["background", "methodologyOverview", "keyFindings", "researchGaps", "conclusion"]
            },
            matrix: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        study: { type: Type.STRING },
                        year: { type: Type.STRING },
                        method: { type: Type.STRING },
                        sampleSize: { type: Type.STRING },
                        keyFinding: { type: Type.STRING },
                        limitations: { type: Type.STRING }
                    },
                    required: ["study", "year", "method", "sampleSize", "keyFinding", "limitations"]
                }
            },
            graph: {
                type: Type.OBJECT,
                properties: {
                    nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING }, val: { type: Type.NUMBER } }, required: ["id", "label", "type", "val"] } },
                    links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, target: { type: Type.STRING } }, required: ["source", "target"] } }
                },
                required: ["nodes", "links"]
            },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["synthesis", "matrix", "graph", "topics"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                ...fileParts,
                { text: "Perform a literature synthesis on these documents." }
            ]
        },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as LiteratureSynthesisResult;
};

export const generateResearchOutline = async (
    question: string,
    field: string,
    depth: string
): Promise<ResearchOutlineResult> => {
    const systemInstruction = `You are a distinguished academic research mentor. Your task is to create a ${depth} research paper outline for a user. Field: ${field}.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            paperTitle: { type: Type.STRING },
            abstract: { type: Type.STRING },
            sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "points"] } },
            methodologyOptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, samplePlan: { type: Type.STRING }, analysisPlan: { type: Type.STRING } }, required: ["name", "description", "samplePlan", "analysisPlan"] } },
            timeline: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { phase: { type: Type.STRING }, duration: { type: Type.STRING }, tasks: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["phase", "duration", "tasks"] } },
            suggestedReadings: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["paperTitle", "abstract", "sections", "methodologyOptions", "timeline", "suggestedReadings"]
    };

    const response = await callProxy('gemini-2.5-pro', `Create a research outline for the question: "${question}"`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as ResearchOutlineResult;
};

export const summarizeEmailThread = async (
    emailContent: string,
    gdprMode: boolean
): Promise<EmailSummaryResult> => {
    const systemInstruction = `You are an executive assistant specializing in email management.
    CRITICAL: ${gdprMode ? "GDPR Mode is ON. Redact personal info." : "GDPR Mode is OFF."}
    Summarize the thread.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            actionItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, assignee: { type: Type.STRING }, deadline: { type: Type.STRING }, priority: { type: Type.STRING } }, required: ["task", "assignee", "deadline", "priority"] } },
            decisions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { decision: { type: Type.STRING }, madeBy: { type: Type.STRING }, context: { type: Type.STRING } }, required: ["decision", "madeBy", "context"] } },
            sentiment: { type: Type.STRING },
            keyPeople: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { sender: { type: Type.STRING }, snippet: { type: Type.STRING } }, required: ["sender", "snippet"] } },
            draftReply: { type: Type.STRING }
        },
        required: ["summary", "actionItems", "decisions", "sentiment", "keyPeople", "timeline", "draftReply"]
    };

    const response = await callProxy('gemini-2.5-pro', emailContent, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as EmailSummaryResult;
};

export const convertMeetingNotes = async (
    notes: string,
    meetingType: string
): Promise<MeetingSummaryResult> => {
    const systemInstruction = `You are a highly efficient project manager. Transform notes into an action plan. Meeting Type: ${meetingType}.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, assignee: { type: Type.STRING }, deadline: { type: Type.STRING }, priority: { type: Type.STRING } }, required: ["task", "assignee", "deadline", "priority"] } },
            agendaOutcomes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "keyDecisions", "actionItems", "agendaOutcomes"]
    };

    const response = await callProxy('gemini-2.5-flash', `Raw Meeting Notes:\n${notes}`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as MeetingSummaryResult;
};

export const generateProposal = async (
    clientName: string,
    projectType: string,
    goals: string,
    budget: string,
    timeline: string,
    style: ProposalStyle
): Promise<ProposalOutput> => {
    const systemInstruction = `You are a professional business proposal writer. Style: ${style}.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            projectOverview: { type: Type.STRING },
            scopeOfWork: { type: Type.ARRAY, items: { type: Type.STRING } },
            deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { phase: { type: Type.STRING }, duration: { type: Type.STRING } }, required: ["phase", "duration"] } },
            pricing: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, cost: { type: Type.STRING } }, required: ["item", "cost"] } },
            termsAndConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            whyChooseUs: { type: Type.STRING }
        },
        required: ["title", "executiveSummary", "projectOverview", "scopeOfWork", "deliverables", "timeline", "pricing", "termsAndConditions", "whyChooseUs"]
    };

    const userPrompt = `Client: ${clientName}. Type: ${projectType}. Goals: ${goals}. Budget: ${budget}. Timeline: ${timeline}.`;

    const response = await callProxy('gemini-2.5-pro', userPrompt, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as ProposalOutput;
};

export const generateCoverLetter = async (
    resumeText: string,
    jobDescription: string,
    tone: CoverLetterTone
): Promise<CoverLetterResult> => {
    const systemInstruction = `You are an expert career consultant. Write a tailored cover letter. Tone: ${tone}.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            coverLetter: { type: Type.STRING },
            matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchScore: { type: Type.INTEGER }
        },
        required: ["coverLetter", "matchedSkills", "keywordsUsed", "missingSkills", "matchScore"]
    };

    const response = await callProxy('gemini-2.5-pro', `Resume Content:\n${resumeText}\n\nJob Description:\n${jobDescription}`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as CoverLetterResult;
};

export const generateViralHooksAndTrends = async (
    niche: string,
    platform: string
): Promise<ViralHookResult> => {
    const systemInstruction = `You are a viral content strategist.
    IMPORTANT: Output ONLY valid JSON.`;

    const response = await callProxy('gemini-2.5-flash', 
        `Niche: ${niche}\nPlatform: ${platform}\nGenerate viral hooks and trend analysis.
        Return JSON: { "hooks": [{ "text": "string", "type": "string", "score": number, "explanation": "string" }], "trendAnalysis": { "insights": [{ "topic": "string", "growthStatus": "string", "engagementSpike": "string", "competitorPattern": "string", "bestPostingTime": "string" }], "risingKeywords": ["string"] } }`,
        {
            systemInstruction,
            tools: [{ googleSearch: {} }]
        }
    );

    const cleanJson = (text: string) => {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) return text.substring(start, end + 1);
        return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    };

    let json;
    try {
        json = JSON.parse(cleanJson(response.text));
    } catch (e) {
        throw new Error("Failed to parse viral hooks.");
    }
    
    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Source'
        }))
        .filter((c: Citation) => c.uri) || [];

    return { ...json, citations };
};

export const generateFlashcards = async (
    content: string,
    file: File | null,
    difficulty: string,
    count: number
): Promise<FlashcardSet> => {
    // If file is present, use client-side logic to avoid proxy limits
    if (file) {
        const ai = getClientSideAI();
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { mimeType: file.type, data: base64 } }, { text: 'Generate flashcards' }] },
            config: {
                systemInstruction: `Create ${count} flashcards. Difficulty: ${difficulty}. Output JSON.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, cards: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING }, topic: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ["front", "back", "topic", "difficulty"] } } },
                    required: ["title", "summary", "cards"]
                }
            }
        });
        return JSON.parse(response.text);
    }

    const systemInstruction = `You are an expert study coach. Create ${count} flashcards. Difficulty: ${difficulty}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            cards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { front: { type: Type.STRING }, back: { type: Type.STRING }, topic: { type: Type.STRING }, difficulty: { type: Type.STRING } },
                    required: ["front", "back", "topic", "difficulty"]
                }
            }
        },
        required: ["title", "summary", "cards"]
    };

    const response = await callProxy('gemini-2.5-flash', `Content:\n${content}`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as FlashcardSet;
};

export const explainConcept = async (
    topic: string,
    level: ComplexityLevel
): Promise<ConceptExplanationResult> => {
    const systemInstruction = `You are a master educator. Explain the topic at "${level}" level.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            explanation: { type: Type.STRING },
            analogy: { type: Type.STRING },
            realLifeExample: { type: Type.STRING },
            visualDescription: { type: Type.STRING }
        },
        required: ["explanation", "analogy", "realLifeExample", "visualDescription"]
    };

    const response = await callProxy('gemini-2.5-pro', `Explain: "${topic}"`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as ConceptExplanationResult;
};

export const generateStudyPlan = async (
    subjects: StudySubject[],
    preferences: StudyPreferences
): Promise<StudyPlanResult> => {
    const systemInstruction = `You are an expert Study Coach. Create a study plan.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, dayName: { type: Type.STRING }, totalStudyTime: { type: Type.NUMBER }, tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, topic: { type: Type.STRING }, durationMinutes: { type: Type.NUMBER }, description: { type: Type.STRING }, isCompleted: { type: Type.BOOLEAN } }, required: ["subject", "topic", "durationMinutes", "description"] } } }, required: ["date", "dayName", "totalStudyTime", "tasks"] } },
            overview: { type: Type.OBJECT, properties: { totalDays: { type: Type.NUMBER }, totalHours: { type: Type.NUMBER }, focusSubject: { type: Type.STRING } }, required: ["totalDays", "totalHours", "focusSubject"] }
        },
        required: ["schedule", "overview"]
    };

    const response = await callProxy('gemini-2.5-pro', `Generate plan for ${preferences.focus} focus.`, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as StudyPlanResult;
};

export const generatePracticeQuestions = async (
    content: string,
    file: File | null,
    type: QuestionType,
    difficulty: QuestionDifficulty,
    count: number
): Promise<QuestionSet> => {
    if (file) {
        const ai = getClientSideAI();
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { mimeType: file.type, data: base64 } }, { text: 'Generate questions' }] },
            config: {
                systemInstruction: `Generate ${count} ${type} questions. Difficulty: ${difficulty}. Output JSON.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, type: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING }, topicTag: { type: Type.STRING } }, required: ["id", "type", "question", "correctAnswer", "explanation", "topicTag"] } } },
                    required: ["title", "questions"]
                }
            }
        });
        return JSON.parse(response.text);
    }

    const systemInstruction = `You are a strict exam creator. Generate ${count} ${type} questions. Difficulty: ${difficulty}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { id: { type: Type.STRING }, type: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING }, topicTag: { type: Type.STRING } },
                    required: ["id", "type", "question", "correctAnswer", "explanation", "topicTag"]
                }
            }
        },
        required: ["title", "questions"]
    };

    const response = await callProxy('gemini-2.5-flash', content, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as QuestionSet;
};

export const generateDecisionScores = async (
    options: DecisionOption[],
    criteria: DecisionCriterion[]
): Promise<Record<string, Record<string, number>>> => {
    const systemInstruction = `You are a neutral decision analyst. Score options 0-10 based on criteria. Output JSON.`;
    const optionsText = options.map(o => `Option ID: ${o.id}\nName: ${o.name}\nDescription: ${o.description}`).join('\n\n');
    const criteriaText = criteria.map(c => `Criterion ID: ${c.id}\nName: ${c.name}`).join('\n\n');

    const response = await callProxy('gemini-2.5-flash', `Evaluate:\n${optionsText}\n\nCriteria:\n${criteriaText}`, {
        systemInstruction,
        responseMimeType: "application/json"
    });

    return JSON.parse(response.text);
};

export const analyzeDecisionMatrix = async (
    options: DecisionOption[],
    criteria: DecisionCriterion[]
): Promise<DecisionAnalysis> => {
    const systemInstruction = `You are a strategic decision consultant. Analyze matrix.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            winner: { type: Type.STRING },
            explanation: { type: Type.STRING },
            keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            tradeoffs: { type: Type.STRING },
            whatIf: { type: Type.STRING }
        },
        required: ["winner", "explanation", "keyFactors", "tradeoffs", "whatIf"]
    };

    const response = await callProxy('gemini-2.5-pro', JSON.stringify({ options, criteria }), {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as DecisionAnalysis;
};

export const decomposeProblem = async (
    problem: string,
    difficulty: string
): Promise<ProblemDecompositionResult> => {
    const systemInstruction = `Decompose complex problem. Level: ${difficulty}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            subProblems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, priority: { type: Type.STRING }, solution: { type: Type.STRING }, practicalExample: { type: Type.STRING } }, required: ["title", "priority", "solution", "practicalExample"] } },
            actionPlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { stepNumber: { type: Type.NUMBER }, action: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["stepNumber", "action", "explanation"] } },
            contingencies: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ifCondition: { type: Type.STRING }, thenAction: { type: Type.STRING } }, required: ["ifCondition", "thenAction"] } },
            visualStructure: { type: Type.STRING }
        },
        required: ["rootCauses", "subProblems", "actionPlan", "contingencies", "visualStructure"]
    };

    const response = await callProxy('gemini-2.5-pro', problem, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as ProblemDecompositionResult;
};

export const mapArgument = async (argumentText: string): Promise<ArgumentMapResult> => {
    const systemInstruction = `Analyze and map argument structure.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            tree: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING }, type: { type: Type.STRING }, children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING }, type: { type: Type.STRING } } } } }, required: ["id", "text", "type"] },
            analysis: { type: Type.OBJECT, properties: { clarityScore: { type: Type.NUMBER }, logicScore: { type: Type.NUMBER }, evidenceScore: { type: Type.NUMBER }, persuasivenessScore: { type: Type.NUMBER }, fallacies: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, location: { type: Type.STRING } }, required: ["name", "description", "location"] } }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }, counterArguments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, rebuttal: { type: Type.STRING } }, required: ["point", "rebuttal"] } }, simplifiedVersion: { type: Type.STRING } }, required: ["clarityScore", "logicScore", "evidenceScore", "persuasivenessScore", "fallacies", "suggestions", "counterArguments", "simplifiedVersion"] }
        },
        required: ["tree", "analysis"]
    };

    const response = await callProxy('gemini-2.5-pro', argumentText, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    });

    return JSON.parse(response.text) as ArgumentMapResult;
};

export const analyzeMultiDocuments = async (files: File[]): Promise<MultiDocAnalysisResult> => {
    // Client-side for file handling
    const ai = getClientSideAI();
    const fileParts = await Promise.all(files.map(async (file) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        return { inlineData: { mimeType: file.type, data: base64 } };
    }));

    const systemInstruction = `You are a Multi-Document Intelligence system. Analyze collectively. Output JSON.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            combinedSummary: { type: Type.STRING },
            topics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, sourceFiles: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "description", "sourceFiles"] } },
            commonThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflicts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["combinedSummary", "topics", "commonThemes", "conflicts"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [...fileParts, { text: `Analyze these ${files.length} documents.` }] },
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema }
    });

    return JSON.parse(response.text) as MultiDocAnalysisResult;
};

export const chatWithMultiDocs = async (
    files: File[], 
    messageHistory: DocChatMessage[], 
    newMessage: string
): Promise<DocChatMessage> => {
    // Client-side for chat context maintenance with large files
    const ai = getClientSideAI();
    const fileParts = await Promise.all(files.map(async (file) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        return { inlineData: { mimeType: file.type, data: base64 } };
    }));

    const systemInstruction = `You are a document assistant. Answer based ONLY on the attached files. Cite filenames.`;
    const chat = ai.chats.create({ model: 'gemini-2.5-pro', config: { systemInstruction } });

    // History reconstruction
    const history = [
        { role: 'user', parts: [...fileParts, { text: "Context loaded." }] },
        { role: 'model', parts: [{ text: "Ready." }] },
        ...messageHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }))
    ];

    const contextParts = [
        ...fileParts,
        { text: `Chat History:\n${messageHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}` },
        { text: `User Question: ${newMessage}` }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: contextParts },
        config: { systemInstruction }
    });

    return { role: 'model', text: response.text || "I couldn't generate a response." };
};

export const verifyClaim = async (claim: string): Promise<FactCheckResult> => {
    const systemInstruction = `You are a Fact-Checker. Verify claim using Google Search. Output JSON.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            verdict: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            conflicts: { type: Type.STRING },
            simplifiedSummary: { type: Type.STRING },
            biasAnalysis: { type: Type.STRING }
        },
        required: ["verdict", "confidenceScore", "explanation", "conflicts", "simplifiedSummary", "biasAnalysis"]
    };

    const response = await callProxy('gemini-2.5-flash', `Verify: "${claim}"`, {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema
    });

    const cleanJson = (text: string) => {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) return text.substring(start, end + 1);
        return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    };

    let json;
    try {
        json = JSON.parse(cleanJson(response.text));
    } catch (e) {
        throw new Error("Failed to verify claim.");
    }

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Source'
        }))
        .filter((c: Citation) => c.uri) || [];

    return { ...json, sources: citations };
};
