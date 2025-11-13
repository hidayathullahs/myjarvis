import axios from "axios";

export const sendMessageToAI = async (message) => {
  try {
    const response = await axios.post("http://localhost:5000/api/ai/chat", {
      message,
    });

    return response.data.response;
  } catch (error) {
    console.error("API Error:", error);
    return "⚠️ Server error. Please try again.";
  }
};
