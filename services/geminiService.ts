
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SeoAnalysis, KeywordAnalysis, Citation, PlagiarismResult, PlagiarismSource, GeneratedTitles, InlineImage, InstagramCaptionResult, ResearchResult, ResearchLevel, ResearchOutputType, GrammarCheckResult, GrammarTone, MathSolverResult, InterviewFeedback, HashtagStrategyResult, TrendScanResult, ThumbnailVariant, LiteratureSynthesisResult, ResearchOutlineResult, EmailSummaryResult, MeetingSummaryResult, ProposalOutput, ProposalStyle, CoverLetterResult, CoverLetterTone, ViralHookResult, FlashcardSet, ConceptExplanationResult, ComplexityLevel, StudySubject, StudyPreferences, StudyPlanResult, QuestionSet, QuestionType, QuestionDifficulty, DecisionOption, DecisionCriterion, DecisionAnalysis, ProblemDecompositionResult, ArgumentMapResult, MultiDocAnalysisResult, DocChatMessage, FactCheckResult } from '../types';

// Added fallback key as requested
const FALLBACK_KEY = "AIzaSyAvY-x0aZcll-3JV-YkaLltqpcny8PyHoM";

const getGenAI = () => {
    const apiKey = process.env.API_KEY || FALLBACK_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateArticle = async (topic: string, templatePrompt: string, tonePrompt: string, isThinkingMode: boolean, wordCount: number): Promise<string> => {
    const ai = getGenAI();
    
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: templatePrompt,
        config: config
    });
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
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following article for SEO. Provide a score out of 100, suggest 5 relevant keywords, a readability score (e.g., Flesch-Kincaid grade level), and rate the headline's potential click-through rate (CTR). \n\nARTICLE:\n${article}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: seoAnalysisSchema
        }
    });
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
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the article about "${topic}", create a complete publish kit.
        \n\nARTICLE:\n${article}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: publishKitSchema
        }
    });
    const json = JSON.parse(response.text);
    return json;
};


export const generateImagePrompt = async (article: string): Promise<string> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a short, descriptive prompt for a visually stunning hero image that represents this article. The prompt should be a single sentence. Article: ${article.substring(0, 1000)}`,
    });
    return response.text;
};

export const generateInlineImagePrompts = async (article: string): Promise<string[]> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following article, generate 2 distinct, simple prompts for inline illustrations. Each prompt should correspond to a different main section of the article and be visually simple (e.g., 'a minimalist icon of a growing plant'). Return a JSON array of strings.
        \n\nARTICLE:\n${article.substring(0, 2000)}`,
        config: {
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
    });
    const json = JSON.parse(response.text);
    return json.prompts;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getGenAI();
    try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });

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
    const ai = getGenAI();
    const config: any = {
        systemInstruction: `You are an expert editor. Rewrite the following text to make it sound more human and less like an AI. Use varied sentence structures, incorporate subtle rhetorical devices, and adopt a more natural, slightly informal cadence. The goal is to create content that would easily pass AI detection tools while retaining the core message.`,
    };

    if (isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: article,
        config: config
    });
    return response.text;
};

export const factCheckWithSources = async (article: string): Promise<{ updatedArticle: string, citations: Citation[] }> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please review the following article. Identify any claims that could be strengthened with a factual citation. If you find opportunities, rewrite the relevant sentences to include a statistic or fact, then provide the source. If the article is fine, say so.
        \n\nARTICLE:\n${article}`,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
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
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following article for plagiarism. Use Google Search to find existing content with significant overlap.
        - If no matching content is found, confirm that the text appears to be unique.
        - If potential matches are found, provide a summary and list the sources.
        \n\nARTICLE:\n${article}`,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

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
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `As an expert SEO analyst, evaluate the keyword "${keyword}". Provide an estimated keyword competition, search volume, and CPC value. The competition and search volume should be one of 'Low', 'Medium', or 'High'.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: keywordAnalysisSchema
        }
    });
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
    const ai = getGenAI();

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${instructions}\n\n--- TEXT TO SUMMARIZE ---\n\n${text}`,
    });

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
    const ai = getGenAI();

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const json = JSON.parse(response.text);
    return json as InstagramCaptionResult;
};

export const generateResearchContent = async (
    topic: string,
    level: ResearchLevel,
    outputType: ResearchOutputType,
    addCitations: boolean
): Promise<ResearchResult> => {
    const ai = getGenAI();

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: instructions,
        config: config
    });

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
    const ai = getGenAI();

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userInstruction,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
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
    const ai = getGenAI();

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
5.  **suggestedImprovements:** Provide specific, actionable suggestions. For at least one behavioral question where the answer was weak, provide an "Ideal Sample Answer" that demonstrates the STAR method perfectly. Frame this within the 'suggestion' field. For example: { area: "Answer Structure (STAR Method)", suggestion: "Your answer to 'Tell me about a conflict' could be stronger. Try using the STAR method. An ideal answer might be: [Provide full sample answer here]." }.
6.  **repeatedMistakes:** List any repeated mistakes observed, such as using filler words (e.g., 'um', 'ah', 'like'), rambling, weak closing statements, or not directly answering questions.

Respond ONLY with the requested JSON object.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            overallScore: {
                type: Type.NUMBER,
                description: "An overall performance score from 0 to 100."
            },
            scoreRationale: {
                type: Type.STRING,
                description: "A brief, one or two-sentence explanation for the score provided."
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 2-3 key strengths the candidate demonstrated."
            },
            areasForImprovement: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 2-3 primary areas where the candidate can improve."
            },
            suggestedImprovements: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING, description: "The area of improvement (e.g., 'STAR Method')." },
                        suggestion: { type: Type.STRING, description: "A concrete suggestion for improvement, which may include a full sample answer." }
                    },
                    required: ["area", "suggestion"]
                },
                description: "An array of specific, actionable suggestions."
            },
            repeatedMistakes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of observed repeated mistakes (e.g., 'Used filler words like um/ah frequently')."
            }
        },
        required: ["overallScore", "scoreRationale", "strengths", "areasForImprovement", "suggestedImprovements", "repeatedMistakes"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `INTERVIEW TRANSCRIPT:\n\n${transcript}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
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
    const ai = getGenAI();

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
            solution: {
                type: Type.STRING,
                description: "The final, concise answer to the math problem."
            },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        step: { type: Type.STRING, description: "A single mathematical step in the solution process." },
                        explanation: { type: Type.STRING, description: "A clear, simple explanation of what was done in this step and why." }
                    },
                    required: ["step", "explanation"]
                },
                description: "An array of objects, each representing a step in the solution."
            },
            latex: {
                type: Type.STRING,
                description: "The full solution, including steps, formatted in LaTeX."
            },
            graphSuggestion: {
                type: Type.STRING,
                description: "If applicable, a suggestion for graphing, e.g., 'Plot the function y = x^2 + 3x - 4'. Otherwise, this can be null or an empty string."
            }
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const json = JSON.parse(response.text);
    return json as MathSolverResult;
};

const hashtagItemSchema = {
    type: Type.OBJECT,
    properties: {
        tag: { type: Type.STRING },
        trendScore: { type: Type.NUMBER, description: "Score 1-100 on current trendiness." },
        difficultyScore: { type: Type.NUMBER, description: "Score 1-100 on how hard it is to rank." },
        reachPotential: { type: Type.STRING, description: "e.g., '1k-5k'" },
        postVolume: { type: Type.STRING, description: "e.g., 'Under 10k'" },
    },
    required: ["tag", "trendScore", "difficultyScore", "reachPotential", "postVolume"]
};

const hashtagStrategySchema = {
    type: Type.OBJECT,
    properties: {
        hashtags: {
            type: Type.OBJECT,
            properties: {
                lowCompetition: {
                    type: Type.ARRAY,
                    description: "Array of 5-10 low competition hashtags for guaranteed reach.",
                    items: hashtagItemSchema
                },
                mediumCompetition: {
                    type: Type.ARRAY,
                    description: "Array of 5-10 medium competition hashtags for balanced growth.",
                    items: hashtagItemSchema
                },
                highCompetition: {
                    type: Type.ARRAY,
                    description: "Array of 5-10 high competition hashtags for a chance to go viral.",
                    items: hashtagItemSchema
                }
            },
            required: ["lowCompetition", "mediumCompetition", "highCompetition"]
        },
        seoKeywords: {
            type: Type.ARRAY,
            description: "List of 10 SEO keywords optimized for platform search.",
            items: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    searchVolume: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    relevanceScore: { type: Type.NUMBER, description: "Score 1-100 on relevance to the post." },
                    trendStatus: { type: Type.STRING, enum: ['Rising', 'Stable', 'Declining'] },
                },
                required: ["keyword", "searchVolume", "relevanceScore", "trendStatus"]
            }
        },
        locationTags: {
            type: Type.ARRAY,
            description: "List of 3-5 suggested location tags if a location was provided.",
            items: { type: Type.STRING }
        }
    },
    required: ["hashtags", "seoKeywords", "locationTags"]
};

export const generateHashtagStrategy = async (
    description: string,
    niche: string,
    platform: string,
    location: string | null
): Promise<HashtagStrategyResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are a world-class social media and SEO expert named "TagMaster AI". Your task is to generate a comprehensive hashtag, SEO keyword, and location tag strategy based on user input. Provide trend scores, difficulty, and other key metrics as specified in the JSON schema.`;
    
    let userInstruction = `Generate a strategy for the following post:
- **Platform:** ${platform}
- **Niche:** ${niche}
- **Post Description:** ${description}
`;
    if (location) {
        userInstruction += `- **Location:** ${location}`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userInstruction,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: hashtagStrategySchema
        }
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
    const ai = getGenAI();

    const systemInstruction = `You are a trend hunter. Your goal is to identify the top ${count} trending topics for a specific niche on a specific platform.
    You MUST use Google Search to find real-time data about what is trending RIGHT NOW.
    Do not hallucinate trends. Base them on the search results.
    IMPORTANT: You must output ONLY valid JSON. Do not wrap the JSON in Markdown code blocks.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find the top ${count} trending topics, questions, or viral themes for the "${niche}" niche on ${platform} from the past ${timeframe}.
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
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
        }
    });

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
    const ai = getGenAI();
    
    // Step 1: Generate prompts for images
    const promptResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 2 distinct, high-quality prompt descriptions for YouTube thumbnails based on the headline: "${headline}" and topic: "${description}". 
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
        config: {
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
                                analysis: {
                                    type: Type.OBJECT,
                                    properties: {
                                        predictedCtr: { type: Type.NUMBER },
                                        colorScore: { type: Type.NUMBER },
                                        textVisibility: { type: Type.NUMBER },
                                        emotionImpact: { type: Type.NUMBER }
                                    },
                                    required: ["predictedCtr", "colorScore", "textVisibility", "emotionImpact"]
                                }
                            },
                            required: ["prompt", "analysis"]
                        }
                    }
                },
                required: ["variants"]
            }
        }
    });
    
    const promptJson = JSON.parse(promptResponse.text);
    const variants: ThumbnailVariant[] = [];
    
    // Step 2: Generate Images for each prompt
    for (let i = 0; i < promptJson.variants.length; i++) {
        const item = promptJson.variants[i];
        // Enhance prompt to ensure text rendering
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
    const ai = getGenAI();
    
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
                {
                    inlineData: {
                        mimeType: videoFile.type,
                        data: base64
                    }
                },
                {
                    text: `Analyze this video and identify 3 viral clips suitable for ${platform}. 
                    For each clip, provide a hook title, a reasoning for why it's viral, and a "Virality Score" (0-100).
                    Also suggest a caption.
                    
                    Return JSON:
                    {
                        "clips": [
                            { "title": "string", "reason": "string", "viralityScore": number, "caption": "string" }
                        ]
                    }`
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
    const ai = getGenAI();
    
    // Prepare all files as inlineData
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
                        study: { type: Type.STRING, description: "Author (Year)" },
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
                    nodes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                label: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['paper', 'topic'] },
                                val: { type: Type.NUMBER }
                            },
                            required: ["id", "label", "type", "val"]
                        }
                    },
                    links: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                source: { type: Type.STRING },
                                target: { type: Type.STRING }
                            },
                            required: ["source", "target"]
                        }
                    }
                },
                required: ["nodes", "links"]
            },
            topics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        required: ["synthesis", "matrix", "graph", "topics"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using Pro for better context handling of multiple PDFs
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
    const ai = getGenAI();

    const systemInstruction = `You are a distinguished academic research mentor. 
    Your task is to create a ${depth} research paper outline for a user.
    Field: ${field}.
    
    You must provide:
    1. A structured skeleton (Title, Abstract, Sections).
    2. Concrete methodology options (Quant, Qual, or Mixed) with specific analysis plans and sampling suggestions.
    3. A realistic project timeline with milestones.
    4. Suggested key readings (placeholders or real seminal works).`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            paperTitle: { type: Type.STRING },
            abstract: { type: Type.STRING, description: "A draft abstract or summary of the intended paper." },
            sections: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        points: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "points"]
                }
            },
            methodologyOptions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        samplePlan: { type: Type.STRING },
                        analysisPlan: { type: Type.STRING }
                    },
                    required: ["name", "description", "samplePlan", "analysisPlan"]
                }
            },
            timeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        phase: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["phase", "duration", "tasks"]
                }
            },
            suggestedReadings: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["paperTitle", "abstract", "sections", "methodologyOptions", "timeline", "suggestedReadings"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Create a research outline for the question: "${question}"`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as ResearchOutlineResult;
};

export const summarizeEmailThread = async (
    emailContent: string,
    gdprMode: boolean
): Promise<EmailSummaryResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are an executive assistant specializing in email management.
    Your task is to summarize the provided email thread into a structured, actionable report.
    
    CRITICAL: ${gdprMode ? "GDPR Mode is ON. You MUST redact any personal identifiers like names, email addresses, and phone numbers in your output. Use placeholders like [Name], [Email]." : "GDPR Mode is OFF."}
    
    1. **Summary:** Condense the conversation into a clear paragraph.
    2. **Action Items:** Extract specific tasks, who they are assigned to, their priority, and deadlines (if any).
    3. **Decisions:** Highlight key decisions made during the thread.
    4. **Sentiment:** Detect the overall tone (Positive, Neutral, Negative, Frustrated, Confused).
    5. **Timeline:** Reconstruct a brief chronological timeline of the conversation.
    6. **Draft Reply:** Write a professional and context-aware draft response.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            actionItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        task: { type: Type.STRING },
                        assignee: { type: Type.STRING },
                        deadline: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
                    },
                    required: ["task", "assignee", "deadline", "priority"]
                }
            },
            decisions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        decision: { type: Type.STRING },
                        madeBy: { type: Type.STRING },
                        context: { type: Type.STRING }
                    },
                    required: ["decision", "madeBy", "context"]
                }
            },
            sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative', 'Frustrated', 'Confused'] },
            keyPeople: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sender: { type: Type.STRING },
                        snippet: { type: Type.STRING }
                    },
                    required: ["sender", "snippet"]
                }
            },
            draftReply: { type: Type.STRING }
        },
        required: ["summary", "actionItems", "decisions", "sentiment", "keyPeople", "timeline", "draftReply"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: emailContent,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as EmailSummaryResult;
};

export const convertMeetingNotes = async (
    notes: string,
    meetingType: string
): Promise<MeetingSummaryResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are a highly efficient project manager and meeting secretary.
    Your task is to transform raw, messy meeting notes into a clean, structured action plan.
    Meeting Type: ${meetingType}.
    
    1. Extract a concise executive summary.
    2. Identify key decisions made.
    3. Extract actionable tasks. Infer assignees and deadlines if context allows. Assign priority based on urgency.
    4. List agenda outcomes.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        task: { type: Type.STRING },
                        assignee: { type: Type.STRING },
                        deadline: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
                    },
                    required: ["task", "assignee", "deadline", "priority"]
                }
            },
            agendaOutcomes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "keyDecisions", "actionItems", "agendaOutcomes"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Raw Meeting Notes:\n${notes}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
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
    const ai = getGenAI();

    const systemInstruction = `You are a professional business proposal writer. Your goal is to create a winning proposal based on the client's needs.
    Style: ${style}.
    
    Construct a complete proposal with:
    1. Executive Summary: Hook the client and summarize the value.
    2. Project Overview: Restate their problem and your solution.
    3. Scope of Work: Detailed list of what is included.
    4. Deliverables: Tangible items they receive.
    5. Timeline: Phased approach.
    6. Pricing: A breakdown based on the budget hint (or reasonable estimates if vague).
    7. Terms: Standard professional terms.
    8. Why Choose Us: A closing value pitch.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A catchy, professional title for the proposal document." },
            executiveSummary: { type: Type.STRING },
            projectOverview: { type: Type.STRING },
            scopeOfWork: { type: Type.ARRAY, items: { type: Type.STRING } },
            deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        phase: { type: Type.STRING },
                        duration: { type: Type.STRING }
                    },
                    required: ["phase", "duration"]
                }
            },
            pricing: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING },
                        cost: { type: Type.STRING }
                    },
                    required: ["item", "cost"]
                }
            },
            termsAndConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            whyChooseUs: { type: Type.STRING }
        },
        required: ["title", "executiveSummary", "projectOverview", "scopeOfWork", "deliverables", "timeline", "pricing", "termsAndConditions", "whyChooseUs"]
    };

    const userPrompt = `
    Client Name: ${clientName}
    Project Type: ${projectType}
    Goals/Requirements: ${goals}
    Budget Hint: ${budget}
    Timeline Hint: ${timeline}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as ProposalOutput;
};

export const generateCoverLetter = async (
    resumeText: string,
    jobDescription: string,
    tone: CoverLetterTone
): Promise<CoverLetterResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are an expert career consultant and professional resume writer.
    Your task is to write a highly tailored, compelling cover letter that bridges the candidate's experience with the job requirements.
    Tone: ${tone}.
    
    1. Analyze the Resume to identify key skills and achievements.
    2. Analyze the Job Description to identify required keywords and core competencies.
    3. Write a cover letter that:
       - Has a strong hook in the introduction.
       - Directly addresses the company's needs using evidence from the resume.
       - Naturally integrates ATS keywords.
       - Ends with a confident call to action.
    
    Also return analysis metadata: matched skills, keywords used, and missing skills.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            coverLetter: { type: Type.STRING },
            matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchScore: { type: Type.INTEGER, description: "A score from 0-100 indicating how well the candidate matches the job." }
        },
        required: ["coverLetter", "matchedSkills", "keywordsUsed", "missingSkills", "matchScore"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Resume Content:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as CoverLetterResult;
};

export const generateViralHooksAndTrends = async (
    niche: string,
    platform: string
): Promise<ViralHookResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are a viral content strategist and trend analyst.
    Your task is twofold:
    1. Analyze current trends for the given niche on the specified platform using Google Search.
    2. Generate high-conversion viral hooks based on these trends and proven psychological triggers (Fear, Curiosity, Shock, Story, Contrarian).

    IMPORTANT: Use Google Search to find REAL-TIME trends.
    CRITICAL: Your output MUST be a valid JSON object. Do not include any markdown formatting, explanations, or conversational text outside the JSON object.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Niche: ${niche}
        Platform: ${platform}
        
        Task 1: Search for what is currently trending in this niche. Look for rising topics, viral formats, and competitor strategies.
        Task 2: Based on these insights, generate 12 viral hooks (2 for each type: Fear, Curiosity, Shock, Story, Contrarian, Did You Know).
        Task 3: Provide a structured trend analysis report.

        Return ONLY a valid JSON object. Do not use Markdown code blocks. The JSON must match this structure:
        {
            "hooks": [
                { "text": "string", "type": "Fear-based", "score": number, "explanation": "string" }
            ],
            "trendAnalysis": {
                "insights": [
                    { "topic": "string", "growthStatus": "Exploding", "engagementSpike": "string", "competitorPattern": "string", "bestPostingTime": "string" }
                ],
                "risingKeywords": ["string"]
            }
        }`,
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
        }
    });

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
        console.error("JSON Parse Error", response.text);
        throw new Error("Failed to parse viral hooks. The model did not return valid JSON.");
    }
    
    // Extract citations
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
    const ai = getGenAI();

    const systemInstruction = `You are an expert study coach. Your task is to analyze the provided text or document and create a set of high-quality, spaced-repetition-friendly flashcards.
    
    Guidelines:
    1. Create ${count} flashcards.
    2. Difficulty Level: ${difficulty}.
    3. Each card must have a concise 'Front' (Question/Term) and a clear 'Back' (Answer/Definition).
    4. Group cards by sub-topic if possible.
    5. Also provide a very brief 2-sentence summary of the entire content.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A suitable title for this flashcard deck." },
            summary: { type: Type.STRING, description: "A concise summary of the analyzed content." },
            cards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING },
                        back: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
                    },
                    required: ["front", "back", "topic", "difficulty"]
                }
            }
        },
        required: ["title", "summary", "cards"]
    };

    const parts: any[] = [];
    if (file) {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        parts.push({
            inlineData: {
                mimeType: file.type,
                data: base64
            }
        });
    }
    
    parts.push({ text: content ? `Content to convert:\n${content}` : 'Generate flashcards from the attached file.' });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Flash is good for this high-volume task
        contents: { parts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as FlashcardSet;
};

export const explainConcept = async (
    topic: string,
    level: ComplexityLevel
): Promise<ConceptExplanationResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are a master educator capable of explaining any concept at any complexity level.
    
    Your task is to explain the user's topic at the following level: "${level}".
    
    Complexity Guidelines:
    - ELI5: Explain like I'm 5. Simple words, fun analogies, no jargon.
    - Basic: General overview, school-level explanation.
    - Intermediate: Undergraduate level, key technical terms introduced.
    - Advanced: Professional/Master's level, deeper mechanics and nuance.
    - PhD: Research level, highly technical, theoretical depth, potential citations.

    Output Format (JSON):
    1. explanation: The core explanation text (Markdown allowed).
    2. analogy: A creative metaphor or analogy to help understanding.
    3. realLifeExample: A concrete example of this concept in the real world.
    4. visualDescription: A text-based representation of a diagram or flowchart (e.g., Step A -> Step B -> Step C) that describes the process visually.
    `;

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Explain this concept: "${topic}"`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as ConceptExplanationResult;
};

export const generateStudyPlan = async (
    subjects: StudySubject[],
    preferences: StudyPreferences
): Promise<StudyPlanResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are an expert Study Coach and Time Management Specialist.
    Your task is to create a detailed, balanced, and effective study plan for a student.
    
    Constraints:
    - Plan from ${preferences.startDate} to ${preferences.endDate}.
    - Daily Study Limit: ${preferences.dailyHours} hours.
    - Focus Mode: ${preferences.focus}.
    - Subjects: ${subjects.map(s => `${s.name} (Difficulty: ${s.difficulty}, Topics: ${s.topics})`).join('; ')}.
    
    Algorithm Rules:
    1. Prioritize 'Hard' subjects earlier in the schedule or give them more time blocks.
    2. Break down topics into manageable chunks (30-90 min tasks).
    3. Ensure variety - don't schedule the same subject for 4 hours straight if possible.
    4. Include specific tasks like "Review Chapter 1", "Practice Questions", "Mock Test".
    5. Respect the start and end dates.
    
    Output strictly as JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            schedule: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING, description: "YYYY-MM-DD" },
                        dayName: { type: Type.STRING },
                        totalStudyTime: { type: Type.NUMBER, description: "Total hours for this day" },
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    subject: { type: Type.STRING },
                                    topic: { type: Type.STRING },
                                    durationMinutes: { type: Type.NUMBER },
                                    description: { type: Type.STRING },
                                    isCompleted: { type: Type.BOOLEAN }
                                },
                                required: ["subject", "topic", "durationMinutes", "description"]
                            }
                        }
                    },
                    required: ["date", "dayName", "totalStudyTime", "tasks"]
                }
            },
            overview: {
                type: Type.OBJECT,
                properties: {
                    totalDays: { type: Type.NUMBER },
                    totalHours: { type: Type.NUMBER },
                    focusSubject: { type: Type.STRING }
                },
                required: ["totalDays", "totalHours", "focusSubject"]
            }
        },
        required: ["schedule", "overview"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Generate a study plan based on the provided subjects and constraints.`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
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
    const ai = getGenAI();

    const systemInstruction = `You are a strict and precise exam creator. Your job is to generate practice questions from study material.
    
    Requirements:
    1. Generate exactly ${count} questions.
    2. Question Type: ${type}.
    3. Difficulty Level: ${difficulty}.
    4. Provide the correct answer and a detailed "Teach Me" explanation for every question.
    5. Categorize each question with a 'topicTag' (e.g., "Chapter 1", "Definitions", "Formulas").
    
    If Type is "Mixed", generate a variety of formats (MCQ, Short Answer, True/False).
    If Type is "MCQ", you MUST provide 4 distinct options array.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A name for this question set." },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['MCQ', 'Short Answer', 'True/False', 'Fill-in-the-blank'] },
                        question: { type: Type.STRING },
                        options: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Array of options for MCQ only. Empty or null for others."
                        },
                        correctAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct." },
                        topicTag: { type: Type.STRING }
                    },
                    required: ["id", "type", "question", "correctAnswer", "explanation", "topicTag"]
                }
            }
        },
        required: ["title", "questions"]
    };

    const parts: any[] = [];
    if (file) {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64 = await base64EncodedDataPromise;
        parts.push({
            inlineData: {
                mimeType: file.type,
                data: base64
            }
        });
    }
    
    const prompt = content 
        ? `Generate questions from this text:\n\n${content}` 
        : 'Generate questions from the attached document.';
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as QuestionSet;
};

export const generateDecisionScores = async (
    options: DecisionOption[],
    criteria: DecisionCriterion[]
): Promise<Record<string, Record<string, number>>> => {
    const ai = getGenAI();

    const systemInstruction = `You are a neutral decision analyst expert.
    Your task is to objectively evaluate options against specific criteria.
    
    You will receive a list of Options (names + descriptions) and a list of Criteria (names).
    For each Option-Criterion pair, assign a score from 0 to 10 based on the description provided.
    
    Guidelines:
    - 0 = Extremely Poor / Does not meet criteria at all.
    - 5 = Average / Acceptable.
    - 10 = Perfect / Excellent.
    - Be strict and fair. Use the 'description' field heavily to justify the score implicitly.
    
    Output a JSON object where keys are Option IDs, and values are objects mapping Criterion IDs to scores.
    Example: { "opt1": { "crit1": 8, "crit2": 4 }, "opt2": ... }`;

    const optionsText = options.map(o => `Option ID: ${o.id}\nName: ${o.name}\nDescription: ${o.description}`).join('\n\n');
    const criteriaText = criteria.map(c => `Criterion ID: ${c.id}\nName: ${c.name}`).join('\n\n');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Evaluate these options:\n${optionsText}\n\nAgainst these criteria:\n${criteriaText}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json"
        }
    });

    return JSON.parse(response.text);
};

export const analyzeDecisionMatrix = async (
    options: DecisionOption[],
    criteria: DecisionCriterion[]
): Promise<DecisionAnalysis> => {
    const ai = getGenAI();

    const systemInstruction = `You are a strategic decision consultant.
    Your task is to analyze a completed Decision Matrix and provide a final recommendation.
    
    You will receive the full matrix data: Options, Criteria (with weights), and the final Scores.
    
    Generate a report that includes:
    1. The Winner.
    2. A clear explanation of WHY it won (citing scores and weights).
    3. Key Factors that drove the decision.
    4. Trade-offs (what did the winner sacrifice compared to others?).
    5. A "What-if" scenario (e.g., "If Price was the most important factor, Option B would have won.").`;

    const matrixData = JSON.stringify({ options, criteria }, null, 2);

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze this decision matrix:\n${matrixData}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as DecisionAnalysis;
};

export const decomposeProblem = async (
    problem: string,
    difficulty: string
): Promise<ProblemDecompositionResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are an expert problem solver and systems thinker.
    Your task is to break down a complex user problem into manageable parts.
    
    Target Level: ${difficulty}.
    
    You must provide:
    1. Root Causes: Why is this happening?
    2. Sub-Problems: The big problem split into smaller, prioritized tasks.
    3. Action Plan: A step-by-step guide to solving it.
    4. Contingencies: "If this happens, then do that" logic.
    5. Visual Structure: A textual representation of the problem tree (e.g., Markdown list structure).
    
    Output strictly as JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            subProblems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                        solution: { type: Type.STRING },
                        practicalExample: { type: Type.STRING }
                    },
                    required: ["title", "priority", "solution", "practicalExample"]
                }
            },
            actionPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        stepNumber: { type: Type.NUMBER },
                        action: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["stepNumber", "action", "explanation"]
                }
            },
            contingencies: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        ifCondition: { type: Type.STRING },
                        thenAction: { type: Type.STRING }
                    },
                    required: ["ifCondition", "thenAction"]
                }
            },
            visualStructure: { type: Type.STRING }
        },
        required: ["rootCauses", "subProblems", "actionPlan", "contingencies", "visualStructure"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Decompose this problem: "${problem}"`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as ProblemDecompositionResult;
};

export const mapArgument = async (argumentText: string): Promise<ArgumentMapResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are a Logic and Reasoning Analyst.
    Your task is to analyze the user's argument text and break it down into a structured map.
    
    1. Structure: Identify the Main Claim. Identify supporting Premises. For each premise, identify specific Evidence or Assumptions.
    2. Analysis: Detect logical fallacies. Score the argument on clarity, logic, and evidence.
    3. Suggestions: How to strengthen the argument.
    4. Counter-Arguments: What would an opponent say and how to rebut it.
    5. Simplification: Rewrite the core argument in simple terms.
    
    Output strictly as JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            tree: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Claim', 'Premise', 'Evidence', 'Assumption', 'Counterpoint'] },
                    children: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['Premise', 'Evidence', 'Assumption', 'Counterpoint'] },
                                children: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING },
                                            text: { type: Type.STRING },
                                            type: { type: Type.STRING, enum: ['Evidence', 'Assumption', 'Counterpoint'] }
                                        },
                                        required: ["id", "text", "type"]
                                    }
                                }
                            },
                            required: ["id", "text", "type"]
                        }
                    }
                },
                required: ["id", "text", "type"]
            },
            analysis: {
                type: Type.OBJECT,
                properties: {
                    clarityScore: { type: Type.NUMBER },
                    logicScore: { type: Type.NUMBER },
                    evidenceScore: { type: Type.NUMBER },
                    persuasivenessScore: { type: Type.NUMBER },
                    fallacies: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                location: { type: Type.STRING }
                            },
                            required: ["name", "description", "location"]
                        }
                    },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    counterArguments: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                point: { type: Type.STRING },
                                rebuttal: { type: Type.STRING }
                            },
                            required: ["point", "rebuttal"]
                        }
                    },
                    simplifiedVersion: { type: Type.STRING }
                },
                required: ["clarityScore", "logicScore", "evidenceScore", "persuasivenessScore", "fallacies", "suggestions", "counterArguments", "simplifiedVersion"]
            }
        },
        required: ["tree", "analysis"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze and map this argument:\n\n${argumentText}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as ArgumentMapResult;
};

export const analyzeMultiDocuments = async (files: File[]): Promise<MultiDocAnalysisResult> => {
    const ai = getGenAI();
    
    // Prepare all files as inlineData
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

    const systemInstruction = `You are a Multi-Document Intelligence system.
    You have access to a set of documents.
    Your goal is to understand them collectively and provide a unified analysis.
    
    1. Combined Summary: Write a cohesive summary that integrates key information from ALL documents.
    2. Topics: Extract main topics. For each topic, list which files it appears in.
    3. Common Themes: What ideas appear across multiple documents?
    4. Conflicts: Are there any contradictions or conflicting information between the documents?
    
    Output strictly as JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            combinedSummary: { type: Type.STRING },
            topics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        sourceFiles: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "description", "sourceFiles"]
                }
            },
            commonThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflicts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["combinedSummary", "topics", "commonThemes", "conflicts"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                ...fileParts,
                { text: `Analyze these ${files.length} documents. Filenames: ${files.map(f => f.name).join(', ')}` }
            ]
        },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text) as MultiDocAnalysisResult;
};

export const chatWithMultiDocs = async (
    files: File[], 
    messageHistory: DocChatMessage[], 
    newMessage: string
): Promise<DocChatMessage> => {
    const ai = getGenAI();

    // Prepare files
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

    const systemInstruction = `You are a document assistant. You have access to the attached files.
    Answer the user's question based ONLY on the content of these files.
    If the answer is found, cite the filename in your response (e.g., [File A.pdf]).
    If the answer is not in the documents, say so.
    Do not use outside knowledge unless asked to compare with general facts.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: { systemInstruction }
    });

    // We need to send files in the first turn to establish context for the session
    // Construct the history properly
    const history = [];
    
    // First message: contains all files + "Context loaded" system-like prompt
    history.push({
        role: 'user',
        parts: [
            ...fileParts,
            { text: `Here are the documents. I will ask questions about them. Filenames: ${files.map(f => f.name).join(', ')}` }
        ]
    });
    
    history.push({
        role: 'model',
        parts: [{ text: "Documents received. I am ready to answer questions based on their content." }]
    });

    // Add previous chat history
    messageHistory.forEach(msg => {
        history.push({
            role: msg.role,
            parts: [{ text: msg.text }]
        });
    });

    const contextParts = [
        ...fileParts,
        { text: `Context: You have access to these files (${files.map(f => f.name).join(', ')}).` },
        { text: `Chat History:\n${messageHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}` },
        { text: `User Question: ${newMessage}` }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: contextParts },
        config: { systemInstruction }
    });

    return {
        role: 'model',
        text: response.text || "I couldn't generate a response."
    };
};

export const verifyClaim = async (claim: string): Promise<FactCheckResult> => {
    const ai = getGenAI();

    const systemInstruction = `You are a Fact-Checker and Truth Verifier.
    Your goal is to verify the user's claim using Google Search evidence.
    
    Process:
    1. Search Google for reliable sources to verify the claim.
    2. Determine a Verdict: True, False, Partially True, Misleading, or Unverified.
    3. Assign a Confidence Score (0-100).
    4. Write a detailed Explanation referencing the evidence.
    5. Analyze Bias or Conflicts.
    6. Provide a 10-second Simplified Summary.
    
    IMPORTANT: You must output ONLY valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Verify this claim: "${claim}".
        
        Return JSON structure:
        {
            "verdict": "True" | "False" | "Partially True" | "Misleading" | "Unverified",
            "confidenceScore": number,
            "explanation": "string",
            "conflicts": "string",
            "simplifiedSummary": "string",
            "biasAnalysis": "string"
        }`,
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }]
        }
    });

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
        console.error("Fact Check JSON Error", response.text);
        throw new Error("Failed to verify claim. Response parsing error.");
    }

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Source'
        }))
        .filter((c: Citation) => c.uri) || [];

    return { ...json, sources: citations };
};
