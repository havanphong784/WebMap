import { getUserAchievements, getUserDailyTasks } from "../services/achievementService.js";
import { getUnreadGamificationCount, markAllAsSeen } from "../services/gamificationService.js";

export const getAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const achievements = await getUserAchievements(userId);
        const tasks = await getUserDailyTasks(userId);
        
        res.status(200).json({
            success: true,
            data: {
                achievements,
                dailyTasks: tasks
            }
        });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await getUnreadGamificationCount(userId);
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

export const markSeen = async (req, res) => {
    try {
        const { userId } = req.params;
        await markAllAsSeen(userId);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};
