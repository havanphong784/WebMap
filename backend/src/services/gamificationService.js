import pool from "../config/db.js";

const XP_CONFIG = {
  PHOTO: 5,
  REVIEW: 10,
  LIKE_RECEIVED: 1,
  COMMENT: 2
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
      return {...result.rows[0], added: xpToAdd};
    }
  } catch (error) {
    console.error("Error adding XP:", error);
  }
};
