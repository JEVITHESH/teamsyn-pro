import { GoogleGenAI } from "@google/genai";

// Fix: Use process.env.VITE_GEMINI_API_KEY for Vite apps (process.env.API_KEY usually requires extra config in Vite)
// AND 'gemini-1.5-flash' model.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Note: The @google/genai SDK v0.1+ usage might differ slightly.
// If using the older @google/generative-ai package:
// const genAI = new GoogleGenerativeAI(apiKey);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// If using the NEW @google/genai package (which seems to be imported):
const ai = new GoogleGenAI({ apiKey });

export const getBotResponse = async (userPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        systemInstruction: "You are 'SyncBot', a helpful team collaboration assistant. Keep responses professional, concise, and friendly. Help with project ideas, scheduling summaries, or technical questions.",
        temperature: 0.7,
      },
    });

    // SDK response handling can vary. Safe check:
    const text = (response as any).response?.text() || (typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text) || "No response generated.";
    return typeof text === 'string' ? text : JSON.stringify(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The bot is currently unavailable. Please check your API configuration.";
  }
};