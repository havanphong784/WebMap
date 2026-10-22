import type { AchievementProgress, DailyTaskProgress } from "../types/database.js";
export type { AchievementProgress, DailyTaskProgress };
import pool from "../config/db.js";

export const getUserAchievements = async (userId: string): Promise<AchievementProgress[]> => {
    const query = `
        SELECT 
            a.*,
            COALESCE(ua.progress, 0) as current_progress,
            COALESCE(ua.is_unlocked, FALSE) as is_unlocked,
            ua.unlocked_at
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
        ORDER BY a.category, a.requirement_value ASC;
    `;
    const result = await pool.query<AchievementProgress>(query, [userId]);
    return result.rows;
};

export const getUserDailyTasks = async (userId: string): Promise<DailyTaskProgress[]> => {
    const query = `
        SELECT 
            dt.*,
            COALESCE(udt.progress, 0) as current_progress,
            COALESCE(udt.is_completed, FALSE) as is_completed,
            udt.completed_at
        FROM daily_tasks dt
        LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id AND udt.user_id = $1 AND udt.task_date = CURRENT_DATE
        ORDER BY dt.id ASC;
    `;
    const result = await pool.query<DailyTaskProgress>(query, [userId]);
    return result.rows;
};
