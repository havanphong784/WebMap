import * as followService from "../services/followService.js";
import {createNotification} from "../services/notificationService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";
import type {AsyncRequestHandler} from "../types/http.js";

export const toggleFollow: AsyncRequestHandler = async (req, res) => {
  try {
    const followerId = req.user?.uid;
    if (!followerId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {followed_id: followedId} = req.body || {};
    if (!followedId) {
      return sendError(res, {status: 400, code: "FOLLOW_INVALID", message: "Thiếu followed_id"});
    }

    const result = await followService.toggleFollow(followerId, followedId);

    if (result.followed) {
      await createNotification({
        recipientId: followedId,
        senderId: followerId,
        type: "FOLLOW",
        message: "đã bắt đầu theo dõi bạn.",
        locationId: null,
      });
    }

    sendSuccess(res, {data: result});
  } catch (error: unknown) {
    console.error("Lỗi toggle follow:", error);
    const message = error instanceof Error ? error.message : "Lỗi Server";
    sendError(res, {status: 500, message});
  }
};

export const getFollowers: AsyncRequestHandler = async (req, res) => {
  try {
    const data = await followService.getFollowers(req.params.userId);
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy followers:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getFollowing: AsyncRequestHandler = async (req, res) => {
  try {
    const data = await followService.getFollowing(req.params.userId);
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy following:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getFriends: AsyncRequestHandler = async (req, res) => {
  try {
    const requesterId = req.user?.uid;
    const {userId} = req.params;
    if (!requesterId || requesterId !== userId) {
      return sendError(res, {
        status: 403,
        code: "FRIENDS_FORBIDDEN",
        message: "Không thể xem danh sách bạn của người khác",
      });
    }
    const data = await followService.getFriends(userId);
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy friends:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const checkFollowStatus: AsyncRequestHandler = async (req, res) => {
  try {
    const followerId = req.user?.uid;
    const followedId = req.query.followedId as string | undefined;
    if (!followedId) {
      return sendError(res, {status: 400, code: "FOLLOW_INVALID", message: "Thiếu followedId"});
    }
    const isFollowing = await followService.checkIsFollowing(followerId, followedId);
    sendSuccess(res, {data: {isFollowing}});
  } catch (error) {
    console.error("Lỗi kiểm tra follow:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
