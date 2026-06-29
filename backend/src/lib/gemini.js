import { GoogleGenerativeAI } from "@google/generative-ai";

let client = null;

export function getModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  const modelName = process.env.ORACLE_MODEL || "gemini-1.5-flash";
  return client.getGenerativeModel({ model: modelName });
}
