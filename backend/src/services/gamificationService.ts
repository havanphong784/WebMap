import pool from '../config/db.js';
import type {
  GamificationAchievementRow,
  GamificationDailyTaskRow,
  TierConfig,
  UserGamificationState,
  XPAction,
} from '../types/database.js';
import { sendToUser } from './sseService.js';

export type {
  GamificationAchievementRow,
  GamificationDailyTaskRow,
  TierConfig,
  UserGamificationState,
  XPAction,
};

export const XP_CONFIG: Record<XPAction, number> = {
  PHOTO: 10,
  REVIEW: 5,
  LONG_REVIEW: 20,
  LIKE_RECEIVED: 1,
  LIKE_GIVEN: 2,
  COMMENT: 3,
  LOCATION_CREATED: 30,
};

export const TIERS: TierConfig[] = [
  { name: 'Wanderer', minLevel: 1, color: 'Gray' },
  { name: 'Explorer', minLevel: 10, color: 'Cyan' },
  { name: 'Pathfinder', minLevel: 25, color: 'Purple' },
  { name: 'Vanguard', minLevel: 50, color: 'Sunset' },
  { name: 'Legend', minLevel: 75, color: 'Gold' },
  { name: 'Master of Aether', minLevel: 100, color: 'Gradient' },
];

export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
};

export const calculateTier = (level: number): string => {
  if (level >= 100) return 'Master of Aether';
  if (level >= 75) return 'Legend';
  if (level >= 50) return 'Vanguard';
  if (level >= 25) return 'Pathfinder';
  if (level >= 10) return 'Explorer';
  return 'Wanderer';
};

export const addXP = async (
  userId: string,
  action: XPAction | string,
): Promise<UserGamificationState | undefined> => {
  const xpToAdd = (XP_CONFIG as Record<string, number>)[action] || 0;
  if (xpToAdd === 0) return;

  try {
    const result = await pool.query<UserGamificationState>(
      `UPDATE users
       SET xp         = xp + $1,
           level      = floor(sqrt((xp + $1) / 100)) + 1,
           tier       = CASE
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 100 THEN 'Master of Aether'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 75 THEN 'Legend'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 50 THEN 'Vanguard'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 25 THEN 'Pathfinder'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 10 THEN 'Explorer'
                            ELSE 'Wanderer'
               END,
           updated_at = CURRENT_TIMESTAMP
       WHERE firebase_uid = $2 RETURNING xp, level, tier`,
      [xpToAdd, userId],
    );

    if (result.rows.length > 0) {
      await updateAchievementProgress(userId, action);
      await updateDailyTaskProgress(userId, action);

      return { ...result.rows[0], added: xpToAdd };
    }
  } catch (error) {
    console.error('Error adding XP:', error);
  }
};

export const updateAchievementProgress = async (
  userId: string,
  action: XPAction | string,
): Promise<void> => {
  const actionToType: Record<string, string> = {
    LOCATION_CREATED: 'location_count',
    PHOTO: 'photo_count',
    COMMENT: 'comment_count',
    LIKE_GIVEN: 'like_given_count',
    LIKE_RECEIVED: 'like_received_count',
    LONG_REVIEW: 'long_review_count',
  };

  const reqType = actionToType[action];
  if (!reqType) return;

  try {
    const achievements = await pool.query<GamificationAchievementRow>(
      `SELECT a.*, COALESCE(ua.progress, 0) as current_progress
       FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.requirement_type = $2
         AND (ua.is_unlocked = FALSE OR ua.is_unlocked IS NULL)`,
      [userId, reqType],
    );

    for (const achievement of achievements.rows) {
      const newProgress = Number(achievement.current_progress) + 1;
      const isUnlocked = newProgress >= achievement.requirement_value;

      await pool.query(
        `INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at, is_seen)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, achievement_id)
         DO
        UPDATE SET
            progress = EXCLUDED.progress,
            is_unlocked = EXCLUDED.is_unlocked,
            unlocked_at = CASE WHEN EXCLUDED.is_unlocked AND user_achievements.is_unlocked = FALSE THEN CURRENT_TIMESTAMP ELSE user_achievements.unlocked_at
        END,
            is_seen = CASE WHEN EXCLUDED.is_unlocked AND user_achievements.is_unlocked = FALSE THEN FALSE ELSE user_achievements.is_seen
        END`,
        [
          userId,
          achievement.id,
          newProgress,
          isUnlocked,
          isUnlocked ? new Date() : null,
          !isUnlocked,
        ],
      );

      if (isUnlocked) {
        await addAchievementXP(userId, achievement.xp_reward, achievement.title_vi);
        // Push realtime "unread badge" tới user
        try {
          sendToUser(userId, 'achievement_unlocked', {
            id: achievement.id,
            key_name: achievement.key_name,
            title: achievement.title_vi,
            xp_reward: achievement.xp_reward,
          });
        } catch {
          /* non-critical */
        }
      }
    }
  } catch (err) {
    console.error('Error updating achievement progress:', err);
  }
};

export const updateDailyTaskProgress = async (
  userId: string,
  action: XPAction | string,
): Promise<void> => {
  const actionToType: Record<string, string> = {
    PHOTO: 'photo_count',
    COMMENT: 'comment_count',
    LIKE_GIVEN: 'like_given_count',
    LONG_REVIEW: 'long_review_count',
  };

  const reqType = actionToType[action];
  if (!reqType) return;

  try {
    const tasks = await pool.query<GamificationDailyTaskRow>(
      `SELECT dt.*, COALESCE(udt.progress, 0) as current_progress, udt.is_completed
       FROM daily_tasks dt
                LEFT JOIN user_daily_tasks udt
                          ON dt.id = udt.task_id AND udt.user_id = $1 AND udt.task_date = CURRENT_DATE
       WHERE dt.requirement_type = $2`,
      [userId, reqType],
    );

    for (const task of tasks.rows) {
      if (task.is_completed) continue;

      const newProgress = Number(task.current_progress) + 1;
      const isCompleted = newProgress >= task.requirement_value;

      await pool.query(
        `INSERT INTO user_daily_tasks (user_id, task_id, progress, is_completed, completed_at, task_date, is_seen)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6) ON CONFLICT (user_id, task_id, task_date)
         DO
        UPDATE SET
            progress = EXCLUDED.progress,
            is_completed = EXCLUDED.is_completed,
            completed_at = CASE WHEN EXCLUDED.is_completed AND user_daily_tasks.is_completed = FALSE THEN CURRENT_TIMESTAMP ELSE user_daily_tasks.completed_at
        END,
            is_seen = CASE WHEN EXCLUDED.is_completed AND user_daily_tasks.is_completed = FALSE THEN FALSE ELSE user_daily_tasks.is_seen
        END`,
        [userId, task.id, newProgress, isCompleted, isCompleted ? new Date() : null, !isCompleted],
      );

      if (isCompleted) {
        await addAchievementXP(userId, task.xp_reward, `Hoàn thành nhiệm vụ: ${task.title_vi}`);
        try {
          sendToUser(userId, 'daily_task_completed', {
            id: task.id,
            key_name: task.key_name,
            title: task.title_vi,
            xp_reward: task.xp_reward,
          });
        } catch {
          /* non-critical */
        }
      }
    }
  } catch (err) {
    console.error('Error updating daily task progress:', err);
  }
};

export const addAchievementXP = async (
  userId: string,
  xpToAdd: number,
  reason: string,
): Promise<void> => {
  if (!xpToAdd) return;
  try {
    await pool.query(
      `UPDATE users
       SET xp         = xp + $1,
           level      = floor(sqrt((xp + $1) / 100)) + 1,
           tier       = CASE
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 100 THEN 'Master of Aether'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 75 THEN 'Legend'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 50 THEN 'Vanguard'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 25 THEN 'Pathfinder'
                            WHEN floor(sqrt((xp + $1) / 100)) + 1 >= 10 THEN 'Explorer'
                            ELSE 'Wanderer'
               END,
           updated_at = CURRENT_TIMESTAMP
       WHERE firebase_uid = $2`,
      [xpToAdd, userId],
    );
    console.log(`User ${userId} awarded ${xpToAdd} XP for ${reason}`);
  } catch (error) {
    console.error('Error adding achievement XP:', error);
  }
};

export const getUnreadGamificationCount = async (userId: string): Promise<number> => {
  try {
    const achCount = await pool.query<{ count: string | number }>(
      'SELECT COUNT(*) FROM user_achievements WHERE user_id = $1 AND is_unlocked = TRUE AND is_seen = FALSE',
      [userId],
    );
    const taskCount = await pool.query<{ count: string | number }>(
      'SELECT COUNT(*) FROM user_daily_tasks WHERE user_id = $1 AND is_completed = TRUE AND is_seen = FALSE',
      [userId],
    );
    return (
      Number.parseInt(String(achCount.rows[0]?.count ?? 0), 10) +
      Number.parseInt(String(taskCount.rows[0]?.count ?? 0), 10)
    );
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
};

export const markAllAsSeen = async (userId: string): Promise<boolean> => {
  try {
    await pool.query('UPDATE user_achievements SET is_seen = TRUE WHERE user_id = $1', [userId]);
    await pool.query('UPDATE user_daily_tasks SET is_seen = TRUE WHERE user_id = $1', [userId]);
    return true;
  } catch (err) {
    console.error('Error marking as seen:', err);
    return false;
  }
};
