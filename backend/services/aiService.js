/**
 * backend/services/aiService.js
 * Google Gemini minimal wrapper
 */
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY not set in .env");
}

const genAI = new GoogleGenerativeAI({ apiKey });

/**
 * generateAIResponse(message, options)
 * message: string or object describing the prompt
 */
export const generateAIResponse = async (message, options = {}) => {
  try {
    // adjust the model name if you have a different plan (e.g. "gemini-pro", "gemini-1")
    const model = genAI.getModel({ model: options.model || "gemini-pro" });

    // For simple text generation — adapt depending on SDK version
    const response = await model.generate({
      // the SDK may accept a `prompt`/`content` object — this is a simple example
      input: Array.isArray(message) ? message : [{ text: message }],
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 512,
    });

    // Attempt to extract text depending on returned shape
    // Many Gemini SDK responses use response.outputText or response.candidates[0].output
    if (response?.outputText) return response.outputText;
    if (response?.candidates && response.candidates[0]?.output) {
      return response.candidates[0].output;
    }

    // Fallback to JSON string of the raw response
    return JSON.stringify(response);
  } catch (error) {
    console.error("AI Service Error:", error?.message ?? error);
    throw new Error("Failed to generate AI response");
  }
};
