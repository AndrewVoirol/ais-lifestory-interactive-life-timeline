import { GoogleGenAI, Type, Modality } from "@google/genai";

export const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
};

export const INTERVIEW_SYSTEM_PROMPT = `You are a warm, empathetic biographer helping document someone's life story through conversation. Your goal is to interview the user about their life to build a chronological timeline of significant events.

Ask one question at a time. Start by introducing yourself and asking about their earliest memory or where they were born.
As the user describes events, acknowledge them warmly and ask follow-up questions to get more detail (title, year/approximate age, and a 2-3 sentence description).

You are part of a COLLABORATIVE storytelling session. Multiple people may be contributing — the subject of the story AND their friends/family. When you notice different contributors offering different accounts of the same event, lean into it warmly: "Interesting — [Name] remembers it differently! Let's figure out what really happened." Treat disagreements as opportunities to enrich the story, not problems to resolve.

CRITICAL: When you identify a clear life event, you must output a special JSON block at the end of your message in this format:
[EVENT_DETECTED: {"title": "Event Title", "description": "2-3 sentence description", "date": "Year or Age"}]

If the user corrects a date or details for a PREVIOUSLY recorded event, output:
[EVENT_UPDATED: {"originalTitle": "Title of event to update", "date": "New Date", "description": "New Description (optional)"}]

Keep the conversation natural. Don't just list events, tell a story together.`;

/**
 * Create a new chat session with the biographer.
 */
export const createChat = () => {
  const ai = getAI();
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: INTERVIEW_SYSTEM_PROMPT,
    },
  });
};

/**
 * Stream a chat response token-by-token.
 * Yields partial text chunks as they arrive.
 */
export async function* streamChatResponse(
  chat: ReturnType<typeof createChat>,
  userMessage: string,
  timelineContext: string,
  conversationMode: boolean
): AsyncGenerator<string, void, unknown> {
  let messageToSend = userMessage;
  messageToSend += timelineContext;

  if (conversationMode) {
    messageToSend +=
      "\n\n[SYSTEM NOTE: Conversation Mode is ENABLED. Keep your response concise (under 3 sentences), friendly, and conversational. If extracting an event, keep the description brief. Ensure JSON format remains valid.]";
  }

  const response = await chat.sendMessageStream({ message: messageToSend });
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

/**
 * Extract detected events and updates from completed response text.
 * Returns the cleaned text (tags removed) and any extracted events/updates.
 */
export function extractEventsFromText(text: string): {
  cleanText: string;
  detectedEvents: Array<{ title: string; description: string; date: string }>;
  updatedEvents: Array<{ originalTitle?: string; id?: string; date?: string; description?: string }>;
} {
  const detectedEvents: Array<{ title: string; description: string; date: string }> = [];
  const updatedEvents: Array<{ originalTitle?: string; id?: string; date?: string; description?: string }> = [];
  
  let cleanText = text;

  // Extract new events
  const eventRegex = /\[EVENT_DETECTED:\s*({.*?})\]/g;
  let match;
  while ((match = eventRegex.exec(text)) !== null) {
    try {
      detectedEvents.push(JSON.parse(match[1]));
      cleanText = cleanText.replace(match[0], '');
    } catch (e) {
      console.error("Failed to parse event data", e);
    }
  }

  // Extract updates
  const updateRegex = /\[EVENT_UPDATED:\s*({.*?})\]/g;
  while ((match = updateRegex.exec(text)) !== null) {
    try {
      updatedEvents.push(JSON.parse(match[1]));
      cleanText = cleanText.replace(match[0], '');
    } catch (e) {
      console.error("Failed to parse update data", e);
    }
  }

  return { cleanText: cleanText.trim(), detectedEvents, updatedEvents };
}

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
