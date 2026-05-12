import {
  listConversation,
  listMessageThreads,
  markConversationRead,
  sendDirectMessage,
} from "../services/messageService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const getThreads = async (req, res) => {
  try {
    const data = await listMessageThreads({userId: req.user.uid});
    sendSuccess(res, {data});
  } catch (error) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};

export const getConversation = async (req, res) => {
  try {
    const peerId = req.params.peerId;
    if (!peerId) {
      return sendError(res, {status: 400, code: "PEER_REQUIRED", message: "Peer id is required"});
    }

    const data = await listConversation({
      userId: req.user.uid,
      peerId,
      limit: req.query.limit,
    });
    await markConversationRead({userId: req.user.uid, peerId});
    sendSuccess(res, {data});
  } catch (error) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};

export const createMessage = async (req, res) => {
  try {
    const peerId = req.params.peerId;
    if (!peerId) {
      return sendError(res, {status: 400, code: "PEER_REQUIRED", message: "Peer id is required"});
    }

    if (peerId === req.user.uid) {
      return sendError(res, {status: 400, code: "SELF_MESSAGE", message: "Cannot send message to yourself"});
    }

    const data = await sendDirectMessage({
      senderId: req.user.uid,
      recipientId: peerId,
      content: req.body?.content,
    });
    sendSuccess(res, {status: 201, data});
  } catch (error) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};

export const readConversation = async (req, res) => {
  try {
    const peerId = req.params.peerId;
    if (!peerId) {
      return sendError(res, {status: 400, code: "PEER_REQUIRED", message: "Peer id is required"});
    }

    await markConversationRead({userId: req.user.uid, peerId});
    sendSuccess(res);
  } catch (error) {
    sendError(res, {status: error.status || 500, code: error.code, message: error.message});
  }
};
