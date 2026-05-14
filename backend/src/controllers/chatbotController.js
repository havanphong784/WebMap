import * as chatbotService from "../services/chatbotService.js";
import {
  ensureChatSession,
  listChatMessages,
  listChatSessions,
  logAiUsage,
  saveChatFeedback,
  saveChatMessage,
} from "../services/chatbotPersistenceService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const chat = async (req, res) => {
  try {
    const {message, context, sessionId} = req.body;
    const userId = req.user?.uid;

    if (!message) {
      return sendError(res, {status: 400, code: "CHAT_MESSAGE_REQUIRED", message: "Message is required"});
    }

    const session = await ensureChatSession({
      sessionId,
      userId,
      title: message.slice(0, 80),
    });
    const history = await listChatMessages({userId, sessionId: session.id, limit: 20});

    const userMessage = await saveChatMessage({
      sessionId: session.id,
      userId,
      role: "user",
      content: message,
      metadata: {
        contextSummary: {
          locationCount: context?.locations?.length || 0,
          hasWeather: Boolean(context?.weather),
          hasUserLocation: Array.isArray(context?.userLocation),
        },
      },
    });

    const aiResult = await chatbotService.generateChatbotResponse(message, {
      ...context,
      history: history.map(item => ({
        role: item.role,
        content: item.content,
      })),
    });

    // Log AI usage
    await logAiUsage({
      userId,
      sessionId: session.id,
      provider: "google",
      model: aiResult.model,
      requestType: "chat",
      usageMetadata: aiResult.usageMetadata,
      durationMs: aiResult.durationMs,
      status: aiResult.status,
      errorMessage: aiResult.errorMessage || null,
    }).catch(err => console.error("logAiUsage error:", err));

    if (aiResult.status === "error" || !aiResult.text) {
      return sendError(res, {
        status: 502,
        code: "AI_GENERATION_FAILED",
        message: "Không thể kết nối với trí tuệ nhân tạo của EVE. Thử lại sau nhé!",
      });
    }

    const assistantMessage = await saveChatMessage({
      sessionId: session.id,
      userId,
      role: "assistant",
      content: aiResult.text,
      metadata: {source: "gemini", model: aiResult.model},
    });

    sendSuccess(res, {
      data: {
        sessionId: session.id,
        response: aiResult.text,
        userMessage,
        assistantMessage,
      },
    });
  } catch (error) {
    sendError(res, {status: 500, message: error.message});
  }
};

export const sessions = async (req, res) => {
  try {
    const data = await listChatSessions({userId: req.user.uid, limit: req.query.limit});
    sendSuccess(res, {data});
  } catch (error) {
    sendError(res, {status: 500, message: error.message});
  }
};

export const messages = async (req, res) => {
  try {
    const data = await listChatMessages({
      userId: req.user.uid,
      sessionId: req.params.sessionId,
      limit: req.query.limit,
    });
    sendSuccess(res, {data});
  } catch (error) {
    sendError(res, {status: 500, message: error.message});
  }
};

export const feedback = async (req, res) => {
  try {
    const data = await saveChatFeedback({
      userId: req.user.uid,
      sessionId: req.body.sessionId,
      assistantMessageId: req.body.assistantMessageId,
      rating: req.body.rating,
      reason: req.body.reason,
      comment: req.body.comment,
      metadata: req.body.metadata,
    });
    sendSuccess(res, {data});
  } catch (error) {
    sendError(res, {status: 500, message: error.message});
  }
};
