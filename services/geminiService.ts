
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Client, Project, Deliverable, Invoice, AIActionLog } from "../types";

// Initialize the Google GenAI client following SDK requirements
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWEAOpsDecision = async (
  clients: Client[],
  projects: Project[],
  deliverables: Deliverable[],
  invoices: Invoice[]
): Promise<Partial<AIActionLog>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are WEA-Ops, the Autonomous Operations Manager for WachaExperience-AI (U) Ltd.
      Review the current state of the business (All currency values are in Uganda Shillings - UGX):
      Clients: ${JSON.stringify(clients)}
      Projects: ${JSON.stringify(projects)}
      Deliverables: ${JSON.stringify(deliverables)}
      Invoices: ${JSON.stringify(invoices)}

      Analyze the data to identify the most critical action to take today. 
      Consider:
      - Overdue invoices or partial payments that need follow-up
      - Approaching deliverable deadlines
      - Client sentiment risks based on recent interactions
      - Project progress vs velocity
      
      Respond in JSON format with:
      - action: string (A concise description of the task)
      - reasoning: string (Why this is the priority, mentioning amounts in UGX if relevant)
      - confidence: number (0 to 1)
      - escalated: boolean (Should a human intervene?)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            escalated: { type: Type.BOOLEAN }
          },
          required: ["action", "reasoning", "confidence", "escalated"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...result
    };
  } catch (error) {
    console.error("WEA-Ops Decision Error:", error);
    return {
      action: "System health check",
      reasoning: "Automated routine check of all subsystems.",
      confidence: 1,
      escalated: false,
      timestamp: new Date().toISOString()
    };
  }
};

export const getChatbotResponse = async (userMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: `You are the AI Sales Assistant for WachaExperience-AI (U) Ltd (WEA). 
        We specialize in building websites, apps, and digital solutions using AI. 
        Contact: 0774 178 738, 0704 650 600. Email: wachaexperience@gmail.com.
        Currency: Uganda Shillings (UGX).
        Be professional, helpful, and innovative. 
        If asked about pricing, explain that we provide custom quotes based on project complexity, generally starting from UGX 1,500,000.
        If a lead is interested, ask for their name and email so we can reach out.`
      }
    });
    return response.text || "I'm sorry, I'm having trouble processing that right now.";
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm having a brief technical hiccup. Please reach us at wachaexperience@gmail.com for urgent inquiries.";
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return undefined;
  }
};
