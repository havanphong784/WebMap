import * as followService from "../services/followService.js";
import { createNotification } from "../services/notificationService.js";

export const toggleFollow = async (req, res) => {
  try {
    const { follower_id, followed_id } = req.body;
    if (!follower_id || !followed_id) {
      return res.status(400).json({ success: false, message: "Thiếu ID" });
    }
    const result = await followService.toggleFollow(follower_id, followed_id);
    
    if (result.followed) {
      await createNotification({
        recipientId: followed_id,
        senderId: follower_id,
        type: "FOLLOW",
        message: "đã bắt đầu theo dõi bạn.",
        locationId: null
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi toggle follow:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await followService.getFollowers(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy followers:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await followService.getFollowing(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy following:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await followService.getFriends(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy friends:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const checkFollowStatus = async (req, res) => {
  try {
    const { followerId, followedId } = req.query;
    const isFollowing = await followService.checkIsFollowing(followerId, followedId);
    res.status(200).json({ success: true, data: { isFollowing } });
  } catch (error) {
    console.error("Lỗi kiểm tra follow:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};
