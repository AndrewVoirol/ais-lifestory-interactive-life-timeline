import { GoogleGenAI, Type, Modality } from "@google/genai";

export const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
};

export const INTERVIEW_SYSTEM_PROMPT = `You are a warm, empathetic biographer. Your goal is to interview the user about their life to build a chronological timeline of significant events.
Ask one question at a time. Start by introducing yourself and asking about their earliest memory or where they were born.
As the user describes events, you should acknowledge them warmly and ask follow-up questions to get more detail (title, year/approximate age, and a 2-3 sentence description).

CRITICAL: When you identify a clear life event, you must output a special JSON block at the end of your message in this format:
[EVENT_DETECTED: {"title": "Event Title", "description": "2-3 sentence description", "date": "Year or Age"}]

If the user corrects a date or details for a PREVIOUSLY recorded event, output:
[EVENT_UPDATED: {"originalTitle": "Title of event to update", "date": "New Date", "description": "New Description (optional)"}]

Keep the conversation natural. Don't just list events, tell a story together.`;

export const analyzeImage = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: "Describe this photo in the context of a life memory. What might be the story behind it? Provide a title and a short description for a life timeline." },
          { inlineData: { data: base64Data, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestedDate: { type: Type.STRING }
        },
        required: ["title", "description"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};
