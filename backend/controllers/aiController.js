/**
 * backend/controllers/aiController.js
 */
import { generateAIResponse } from "../services/aiService.js";

export const aiChat = async (req, res) => {
  try {
    const { message, options } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const aiResponse = await generateAIResponse(message, options || {});
    return res.status(200).json({ success: true, response: aiResponse });
  } catch (error) {
    console.error("AI Controller Error:", error?.message ?? error);
    return res.status(500).json({ error: "AI failed to respond" });
  }
};
