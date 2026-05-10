import * as chatbotService from "../services/chatbotService.js";

export const chat = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await chatbotService.generateChatbotResponse(message, context);
    res.status(200).json({ success: true, data: { response } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
