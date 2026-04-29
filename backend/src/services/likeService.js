import pool from "../config/db.js";

export const toggleLike = async ({ userId, locationId }) => {
  const check = await pool.query(
    "SELECT * FROM likes WHERE user_id = $1 AND location_id = $2",
    [userId, locationId]
  );

  if (check.rows.length > 0) {
    await pool.query(
      "DELETE FROM likes WHERE user_id = $1 AND location_id = $2",
      [userId, locationId]
    );
    return { action: "unliked" };
  }

  await pool.query(
    "INSERT INTO likes (user_id, location_id) VALUES ($1, $2)",
    [userId, locationId]
  );
  return { action: "liked" };
};

