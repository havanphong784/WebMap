import {getUserAchievements, getUserDailyTasks} from "../services/achievementService.js";
import {getUnreadGamificationCount, markAllAsSeen} from "../services/gamificationService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const getAchievements = async (req, res) => {
  try {
    const {userId} = req.params;
    const achievements = await getUserAchievements(userId);
    const tasks = await getUserDailyTasks(userId);
    sendSuccess(res, {data: {achievements, dailyTasks: tasks}});
  } catch (error) {
    console.error("Error fetching achievements:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const requesterId = req.user.uid;
    const {userId} = req.params;
    if (requesterId !== userId) {
      return sendError(res, {
        status: 403,
        code: "ACHIEVEMENT_FORBIDDEN",
        message: "Không thể xem unread count của user khác",
      });
    }
    const count = await getUnreadGamificationCount(userId);
    res.status(200).json({success: true, count});
  } catch (error) {
    console.error("Error fetching unread count:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const markSeen = async (req, res) => {
  try {
    const requesterId = req.user.uid;
    const {userId} = req.params;
    if (requesterId !== userId) {
      return sendError(res, {
        status: 403,
        code: "ACHIEVEMENT_FORBIDDEN",
        message: "Không thể đánh dấu cho user khác",
      });
    }
    await markAllAsSeen(userId);
    sendSuccess(res);
  } catch (error) {
    console.error("Error marking as seen:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
