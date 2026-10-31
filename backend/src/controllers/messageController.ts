import {
  listConversation,
  listMessageThreads,
  markConversationRead,
  sendDirectMessage,
} from "../services/messageService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";
import type {AsyncRequestHandler} from "../types/http.js";

export const getThreads: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const data = await listMessageThreads({userId});
    sendSuccess(res, {data});
  } catch (error: any) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};

export const getConversation: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {peerId} = req.params;
    if (!peerId) {
      return sendError(res, {status: 400, code: "PEER_REQUIRED", message: "Peer id is required"});
    }

    const data = await listConversation({
      userId,
      peerId,
      limit: req.query.limit as string | undefined,
    });
    await markConversationRead({userId, peerId});
    sendSuccess(res, {data});
  } catch (error: any) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};

export const createMessage: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {peerId} = req.params;
    if (!peerId) {
      return sendError(res, {status: 400, code: "PEER_REQUIRED", message: "Peer id is required"});
    }

    if (peerId === userId) {
      return sendError(res, {status: 400, code: "SELF_MESSAGE", message: "Cannot send message to yourself"});
    }

    const data = await sendDirectMessage({
      senderId: userId,
      recipientId: peerId,
      content: req.body?.content,
    });
    sendSuccess(res, {status: 201, data});
  } catch (error: any) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};

export const readConversation: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {peerId} = req.params;
    if (!peerId) {
      return sendError(res, {status: 400, code: "PEER_REQUIRED", message: "Peer id is required"});
    }

    await markConversationRead({userId, peerId});
    sendSuccess(res);
  } catch (error: any) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};
