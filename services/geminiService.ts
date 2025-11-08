
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { AIAgentIdea, IdeaExpansion, CodeScaffold } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'اسم مبتكر وجذاب لمشروع وكيل الذكاء الاصطناعي.',
      },
      description: {
        type: Type.STRING,
        description: 'شرح مفصل ومقنع لفكرة المشروع، ما هي المشكلة التي يحلها وكيف يعمل.',
      },
      targetAudience: {
        type: Type.STRING,
        description: 'تحديد دقيق للشريحة المستهدفة من العملاء أو المستخدمين.',
      },
      monetization: {
        type: Type.STRING,
        description: 'استراتيجية واضحة ومحتملة لتحقيق الربح من هذا المشروع.',
      },
      imagePrompt: {
        type: Type.STRING,
        description: 'A short, concise, visually descriptive prompt in English (5-10 words) for an image generation model, based on the agent\'s name and description. Example: "AI agent analyzing viral video trends".'
      }
    },
    required: ['name', 'description', 'targetAudience', 'monetization', 'imagePrompt'],
  },
};

const generateImageForIdea = async (prompt: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A vibrant, abstract, conceptual art representing the idea of: ${prompt}` }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error(`Error generating image for prompt "${prompt}":`, error);
    return undefined; 
  }
};

/**
 * Takes an array of AI agent ideas and adds a generated image URL to each.
 * @param ideas - The array of ideas, potentially without imageUrls.
 * @returns A promise that resolves to the array of ideas with imageUrls.
 */
export const addImagesToIdeas = async (ideas: Omit<AIAgentIdea, 'imageUrl' | 'expansion' | 'audioPitchBase64' | 'codeScaffold'>[]): Promise<AIAgentIdea[]> => {
  try {
    const ideasWithImages = await Promise.all(
      ideas.map(async (idea) => {
        const imageUrl = await generateImageForIdea(idea.imagePrompt);
        return { ...idea, imageUrl };
      })
    );
    return ideasWithImages;
  } catch (error) {
     console.error("Error adding images to ideas:", error);
     // Return original ideas with undefined imageUrl if image generation fails
     return ideas.map(idea => ({...idea, imageUrl: undefined}));
  }
};

export const generateAgentIdeas = async (userInput: string): Promise<AIAgentIdea[]> => {
  const systemInstruction = `أنت خبير استراتيجي في مجال الذكاء الاصطناعي متخصص في ابتكار وتصميم وكلاء ذكاء اصطناعي مربحين. مهمتك هي تحليل المدخلات وتوليد 4 أفكار مشاريع مبتكرة وقابلة للتطبيق تجاريًا. يجب أن تكون كل فكرة فريدة من نوعها وتقدم حلاً قيماً.`;
  
  const userPrompt = `بناءً على هذا المدخل: "${userInput}"، قم بتوليد أفكار لمشاريع وكلاء ذكاء اصطناعي.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    const jsonText = response.text.trim();
    const ideasWithoutImages = JSON.parse(jsonText) as Omit<AIAgentIdea, 'imageUrl' | 'audioPitchBase64' | 'codeScaffold'>[];

    const ideasWithImages = await addImagesToIdeas(ideasWithoutImages);

    return ideasWithImages;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate ideas from Gemini API.");
  }
};

const expansionSchema = {
  type: Type.OBJECT,
  properties: {
    mvpFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'قائمة قصيرة من 3-5 ميزات أساسية للنسخة الأولى من المنتج (MVP).',
    },
    techStack: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'قائمة مقترحة بالحزمة التقنية (لغات برمجة، أطر عمل، أدوات رئيسية).',
    },
    potentialChallenges: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'قائمة بأهم 3 تحديات محتملة (تقنية أو تجارية) قد تواجه المشروع.',
    },
  },
  required: ['mvpFeatures', 'techStack', 'potentialChallenges'],
};

export const expandAgentIdea = async (idea: AIAgentIdea): Promise<IdeaExpansion> => {
  const systemInstruction = `أنت مدير منتجات وخبير تقني أول في مجال الذكاء الاصطناعي. مهمتك هي تحليل فكرة مشروع وتحويلها إلى خطة عمل أولية.`;
  const userPrompt = `
    حلل فكرة مشروع وكيل الذكاء الاصطناعي التالية:
    - الاسم: "${idea.name}"
    - الوصف: "${idea.description}"

    وقم بتوفير التفاصيل التالية:
    1.  أهم الميزات للنسخة الأولى (MVP).
    2.  الحزمة التقنية المقترحة.
    3.  أبرز التحديات المحتملة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: expansionSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as IdeaExpansion;

  } catch (error) {
    console.error(`Error expanding idea "${idea.name}":`, error);
    throw new Error("Failed to expand idea from Gemini API.");
  }
};

export const generateAudioPitch = async (idea: AIAgentIdea): Promise<string | undefined> => {
  // FIX: The original prompt was an instruction to generate a pitch, which is incorrect for a TTS model as it would read the instruction aloud.
  // This new prompt provides the actual pitch content to be spoken.
  const pitchPrompt = `Say cheerfully and persuasively: Presenting "${idea.name}"! It's a groundbreaking AI agent that ${idea.description}. We're targeting ${idea.targetAudience}, with a clear monetization strategy through ${idea.monetization}. We believe this is a visionary concept with huge potential!`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: pitchPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // A professional and engaging voice
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
    
  } catch(error) {
    console.error(`Error generating audio pitch for "${idea.name}":`, error);
    throw new Error("Failed to generate audio pitch from Gemini API.");
  }
};


const codeScaffoldSchema = {
    type: Type.OBJECT,
    properties: {
        files: {
            type: Type.ARRAY,
            description: 'An array of objects, where each object represents a code file.',
            items: {
                type: Type.OBJECT,
                properties: {
                    fileName: {
                        type: Type.STRING,
                        description: 'The name of the file (e.g., "main.py", "agent.py").',
                    },
                    code: {
                        type: Type.STRING,
                        description: 'The full source code content for the file.',
                    },
                },
                required: ['fileName', 'code'],
            },
        },
    },
    required: ['files'],
};

export const generateCodeScaffold = async (idea: AIAgentIdea): Promise<CodeScaffold[]> => {
    if (!idea.expansion) {
        throw new Error("Idea must be expanded before generating code scaffold.");
    }

    const systemInstruction = `You are an expert software engineer specializing in AI projects using Python. Your task is to generate a foundational Python project structure based on the provided project plan. Create a few essential files (e.g., main.py, agent.py, utils.py) with boilerplate code, function definitions based on the MVP features, and clear, helpful comments to guide the developer. The code should be simple, clean, and ready for development.`;

    const userPrompt = `
    Based on the following AI Agent project plan, please generate the initial code scaffold.

    - Project Name: "${idea.name}"
    - Description: "${idea.description}"
    - Core MVP Features:
      ${idea.expansion.mvpFeatures.map(f => `- ${f}`).join('\n      ')}
    - Suggested Tech Stack:
      ${idea.expansion.techStack.map(t => `- ${t}`).join('\n      ')}

    Generate the Python code for the necessary files.
  `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: codeScaffoldSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { files: CodeScaffold[] };
        return result.files;

    } catch (error) {
        console.error(`Error generating code scaffold for "${idea.name}":`, error);
        throw new Error("Failed to generate code scaffold from Gemini API.");
    }
};

export const createChatWithContext = (idea: AIAgentIdea): Chat => {
    let context = `You are an expert AI project strategist and software architect, acting as a collaborative partner. Your goal is to help the user refine and iterate on their existing AI Agent project idea. You are now in a conversation about the following project:

--- PROJECT CONTEXT ---
Project Name: ${idea.name}
Description: ${idea.description}
Target Audience: ${idea.targetAudience}
Monetization Strategy: ${idea.monetization}
`;

    if (idea.expansion) {
        context += `
## Project Plan
### MVP Features
${idea.expansion.mvpFeatures.map(f => `- ${f}`).join('\n')}

### Tech Stack
${idea.expansion.techStack.map(t => `- ${t}`).join('\n')}

### Potential Challenges
${idea.expansion.potentialChallenges.map(c => `- ${c}`).join('\n')}
`;
    }

    if (idea.codeScaffold && idea.codeScaffold.length > 0) {
        context += `
## Code Scaffold
${idea.codeScaffold.map(file => `### \`${file.fileName}\`\n\`\`\`python\n${file.code}\n\`\`\``).join('\n\n')}
`;
    }

    context += `
--- END CONTEXT ---

Engage in a helpful conversation. Answer the user's questions, provide suggestions, and help them modify any part of the project plan. Be ready to suggest alternative names, modify features, discuss the tech stack, or even rewrite code snippets. Start the conversation by introducing yourself briefly and confirming you understand the project context. Keep your responses concise and helpful.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: context,
        },
    });

    return chat;
};
