
import { Client, Project, Deliverable, Invoice, AIActionLog } from "../types";
import { api } from "./apiClient";

export const getWEAOpsDecision = async (
  _clients: Client[],
  _projects: Project[],
  _deliverables: Deliverable[],
  _invoices: Invoice[]
): Promise<Partial<AIActionLog>> => {
  try {
    return await api.aiDecision();
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
    const response = await api.aiChat(userMessage);
    return response.text || "I'm sorry, I'm having trouble processing that right now.";
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm having a brief technical hiccup. Please reach us at wachaexperience@gmail.com for urgent inquiries.";
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await api.aiSpeech(text);
    return response.audio;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return undefined;
  }
};
