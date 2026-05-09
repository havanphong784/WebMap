import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateAethoResponse = async (userMessage, context = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Bạn là Aether Buddy, một trợ lý du lịch vui tính, nhiệt tình và thông minh trên ứng dụng bản đồ Aether.
      
      PHONG CÁCH TRÒ CHUYỆN:
      - Thân thiện, sử dụng emoji phù hợp.
      - Ngôn ngữ trẻ trung nhưng vẫn lịch sự.
      - Luôn sẵn sàng gợi ý địa điểm dựa trên ngữ cảnh.
      
      NGỮ CẢNH HIỆN TẠI:
      - Thời tiết: ${context.weather || 'Không xác định'}
      - Vị trí: ${context.location || 'Không xác định'}
      - Thời gian: ${new Date().toLocaleString('vi-VN')}
      
      NHIỆM VỤ:
      1. Nếu người dùng hỏi về địa điểm, hãy gợi ý các loại hình phù hợp với thời tiết.
         - Nếu mưa: Gợi ý quán cafe, bảo tàng, trung tâm thương mại.
         - Nếu nắng: Gợi ý công viên, di tích ngoài trời, rooftop.
      2. Nếu người dùng muốn lên lịch trình, hãy tạo một danh sách các điểm đến hợp lý theo thứ tự thời gian.
      3. Luôn giữ tinh thần là một "người bạn đồng hành" vui tính.

      Hãy trả lời tin nhắn sau của người dùng:
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Hix, mình đang hơi chóng mặt một chút. Bạn hỏi lại sau được không? 💫";
  }
};
