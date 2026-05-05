import pool from "../config/db.js";

const XP_CONFIG = {
  PHOTO: 15,
  REVIEW: 10,
  LONG_REVIEW: 40,
  LIKE_RECEIVED: 5,
  LIKE_GIVEN: 5,
  COMMENT: 10,
  LOCATION_CREATED: 50
};

const TIERS = [
  {name: "Scout", minLevel: 1, color: "Silver"},
  {name: "Explorer", minLevel: 10, color: "Cyan"},
  {name: "Pathfinder", minLevel: 25, color: "Purple"},
  {name: "Master of Aether", minLevel: 50, color: "Gradient"}
];

export const calculateLevel = (xp) => {
  // Level = floor(sqrt(xp / 10)) + 1
  // 0 XP   Lvl 1
  // 10 XP     Lvl 2
  // 40 XP   Lvl 3
  // 90 XP    Lvl 4
  return Math.floor(Math.sqrt(xp / 10)) + 1;
};

export const addXP = async (userId, action) => {
  const xpToAdd = XP_CONFIG[action] || 0;
  if (xpToAdd === 0) return;

  try {
    const result = await pool.query(
      `UPDATE users
       SET xp         = xp + $1,
           level      = floor(sqrt((xp + $1) / 10)) + 1,
           tier       = CASE
                            WHEN floor(sqrt((xp + $1) / 10)) + 1 >= 50 THEN 'Master of Aether'
                            WHEN floor(sqrt((xp + $1) / 10)) + 1 >= 25 THEN 'Pathfinder'
                            WHEN floor(sqrt((xp + $1) / 10)) + 1 >= 10 THEN 'Explorer'
                            ELSE 'Scout'
               END,
           updated_at = CURRENT_TIMESTAMP
       WHERE firebase_uid = $2 RETURNING xp, level, tier`,
      [xpToAdd, userId]
    );

    if (result.rows.length > 0) {
      await updateAchievementProgress(userId, action);
      await updateDailyTaskProgress(userId, action);

      return {...result.rows[0], added: xpToAdd};
    }
  } catch (error) {
    console.error("Error adding XP:", error);
  }
};

export const updateAchievementProgress = async (userId, action) => {
  const actionToType = {
    'LOCATION_CREATED': 'location_count',
    'PHOTO': 'photo_count',
    'COMMENT': 'comment_count',
    'LIKE_GIVEN': 'like_given_count',
    'LIKE_RECEIVED': 'like_received_count',
    'LONG_REVIEW': 'long_review_count'
  };

  const reqType = actionToType[action];
  if (!reqType) return;

  try {
    const achievements = await pool.query(
      `SELECT a.*, COALESCE(ua.progress, 0) as current_progress
       FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.requirement_type = $2
         AND (ua.is_unlocked = FALSE OR ua.is_unlocked IS NULL)`,
      [userId, reqType]
    );

    for (const achievement of achievements.rows) {
      const newProgress = achievement.current_progress + 1;
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
        [userId, achievement.id, newProgress, isUnlocked, isUnlocked ? new Date() : null, isUnlocked ? false : true]
      );

      if (isUnlocked) {
        await addAchievementXP(userId, achievement.xp_reward, achievement.title_vi);
      }
    }
  } catch (err) {
    console.error("Error updating achievement progress:", err);
  }
};

/**
 * Updates progress for daily tasks
 */
export const updateDailyTaskProgress = async (userId, action) => {
  const actionToType = {
    'PHOTO': 'photo_count',
    'COMMENT': 'comment_count',
    'LIKE_GIVEN': 'like_given_count',
    'LONG_REVIEW': 'long_review_count'
  };

  const reqType = actionToType[action];
  if (!reqType) return;

  try {
    const tasks = await pool.query(
      `SELECT dt.*, COALESCE(udt.progress, 0) as current_progress, udt.is_completed
       FROM daily_tasks dt
                LEFT JOIN user_daily_tasks udt
                          ON dt.id = udt.task_id AND udt.user_id = $1 AND udt.task_date = CURRENT_DATE
       WHERE dt.requirement_type = $2`,
      [userId, reqType]
    );

    for (const task of tasks.rows) {
      if (task.is_completed) continue;

      const newProgress = task.current_progress + 1;
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
        [userId, task.id, newProgress, isCompleted, isCompleted ? new Date() : null, isCompleted ? false : true]
      );

      if (isCompleted) {
        await addAchievementXP(userId, task.xp_reward, `Hoàn thành nhiệm vụ: ${task.title_vi}`);
      }
    }
  } catch (err) {
    console.error("Error updating daily task progress:", err);
  }
};

/**
 * Helper to add XP for achievements/tasks (bypass recursive checks)
 */
const addAchievementXP = async (userId, xpToAdd, reason) => {
  if (!xpToAdd) return;
  try {
    await pool.query(
      `UPDATE users
       SET xp         = xp + $1,
           level      = floor(sqrt((xp + $1) / 10)) + 1,
           tier       = CASE
                            WHEN floor(sqrt((xp + $1) / 10)) + 1 >= 50 THEN 'Master of Aether'
                            WHEN floor(sqrt((xp + $1) / 10)) + 1 >= 25 THEN 'Pathfinder'
                            WHEN floor(sqrt((xp + $1) / 10)) + 1 >= 10 THEN 'Explorer'
                            ELSE 'Scout'
               END,
           updated_at = CURRENT_TIMESTAMP
       WHERE firebase_uid = $2`,
      [xpToAdd, userId]
    );
    console.log(`User ${userId} awarded ${xpToAdd} XP for ${reason}`);
  } catch (error) {
    console.error("Error adding achievement XP:", error);
  }
};

/**
 * Get unread achievements/tasks count
 */
export const getUnreadGamificationCount = async (userId) => {
  try {
    const achCount = await pool.query(
      "SELECT COUNT(*) FROM user_achievements WHERE user_id = $1 AND is_unlocked = TRUE AND is_seen = FALSE",
      [userId]
    );
    const taskCount = await pool.query(
      "SELECT COUNT(*) FROM user_daily_tasks WHERE user_id = $1 AND is_completed = TRUE AND is_seen = FALSE",
      [userId]
    );
    return parseInt(achCount.rows[0].count) + parseInt(taskCount.rows[0].count);
  } catch (err) {
    console.error("Error getting unread count:", err);
    return 0;
  }
};

/**
 * Mark all as seen
 */
export const markAllAsSeen = async (userId) => {
  try {
    await pool.query("UPDATE user_achievements SET is_seen = TRUE WHERE user_id = $1", [userId]);
    await pool.query("UPDATE user_daily_tasks SET is_seen = TRUE WHERE user_id = $1", [userId]);
    return true;
  } catch (err) {
    console.error("Error marking as seen:", err);
    return false;
  }
};
