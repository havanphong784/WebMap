import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../src/config/db.js';
import * as gamification from '../src/services/gamificationService.js';

test('gamificationService calculates level, tier thresholds, and processes xp awards', async (t) => {
  assert.equal(gamification.calculateLevel(0), 1);
  assert.equal(gamification.calculateLevel(99), 1);
  assert.equal(gamification.calculateLevel(100), 2);
  assert.equal(gamification.calculateLevel(400), 3);
  assert.equal(gamification.calculateLevel(900), 4);
  assert.equal(gamification.calculateLevel(10000), 11);

  assert.equal(gamification.calculateTier(1), 'Wanderer');
  assert.equal(gamification.calculateTier(9), 'Wanderer');
  assert.equal(gamification.calculateTier(10), 'Explorer');
  assert.equal(gamification.calculateTier(24), 'Explorer');
  assert.equal(gamification.calculateTier(25), 'Pathfinder');
  assert.equal(gamification.calculateTier(49), 'Pathfinder');
  assert.equal(gamification.calculateTier(50), 'Vanguard');
  assert.equal(gamification.calculateTier(74), 'Vanguard');
  assert.equal(gamification.calculateTier(75), 'Legend');
  assert.equal(gamification.calculateTier(99), 'Legend');
  assert.equal(gamification.calculateTier(100), 'Master of Aether');
  assert.equal(gamification.calculateTier(120), 'Master of Aether');

  assert.equal(gamification.TIERS.length, 6);
  assert.equal(gamification.XP_CONFIG.PHOTO, 10);
  assert.equal(gamification.XP_CONFIG.LOCATION_CREATED, 30);

  // addXP ignores zero/unknown actions
  assert.equal(await gamification.addXP('u1', 'UNKNOWN_ACTION'), undefined);

  const orig = pool.query;
  const queries: { sql: string; vals: unknown[] }[] = [];
  t.after(() => {
    pool.query = orig;
  });

  pool.query = (async (sql: string, vals: unknown[] = []) => {
    queries.push({ sql, vals });
    if (sql.includes('UPDATE users') && sql.includes('RETURNING xp, level, tier')) {
      return { rows: [{ xp: 110, level: 2, tier: 'Wanderer' }] };
    }
    if (sql.includes('SELECT a.*, COALESCE(ua.progress, 0) as current_progress')) {
      return {
        rows: [
          {
            id: 1,
            key_name: 'photographer_1',
            title_vi: 'Nhiếp ảnh gia',
            requirement_type: 'photo_count',
            requirement_value: 1,
            xp_reward: 50,
            current_progress: 0,
          },
        ],
      };
    }
    if (sql.includes('SELECT dt.*, COALESCE(udt.progress, 0) as current_progress')) {
      return {
        rows: [
          {
            id: 2,
            key_name: 'daily_photo',
            title_vi: 'Chụp ảnh hôm nay',
            requirement_type: 'photo_count',
            requirement_value: 1,
            xp_reward: 20,
            current_progress: 0,
            is_completed: false,
          },
        ],
      };
    }
    if (sql.includes('SELECT COUNT(*) FROM user_achievements')) {
      return { rows: [{ count: '3' }] };
    }
    if (sql.includes('SELECT COUNT(*) FROM user_daily_tasks')) {
      return { rows: [{ count: '2' }] };
    }
    return { rows: [] };
  }) as never;

  const xpRes = await gamification.addXP('user_xp_1', 'PHOTO');
  assert.deepEqual(xpRes, { xp: 110, level: 2, tier: 'Wanderer', added: 10 });

  const unreadCount = await gamification.getUnreadGamificationCount('user_xp_1');
  assert.equal(unreadCount, 5);

  const marked = await gamification.markAllAsSeen('user_xp_1');
  assert.equal(marked, true);
});

test('gamificationService handles edge cases, unmapped actions, and database error fallbacks', async (t) => {
  // calculateLevel handles negative and boundary numbers
  assert.equal(gamification.calculateLevel(-100), 1);
  assert.equal(gamification.calculateLevel(-1), 1);
  assert.equal(gamification.calculateLevel(399), 2);
  assert.equal(gamification.calculateLevel(899), 3);
  assert.equal(gamification.calculateLevel(9999), 10);

  // calculateTier handles out-of-range low and high levels
  assert.equal(gamification.calculateTier(0), 'Wanderer');
  assert.equal(gamification.calculateTier(-5), 'Wanderer');
  assert.equal(gamification.calculateTier(500), 'Master of Aether');

  // Verify all XP_CONFIG actions
  assert.equal(gamification.XP_CONFIG.REVIEW, 5);
  assert.equal(gamification.XP_CONFIG.LONG_REVIEW, 20);
  assert.equal(gamification.XP_CONFIG.LIKE_RECEIVED, 1);
  assert.equal(gamification.XP_CONFIG.LIKE_GIVEN, 2);
  assert.equal(gamification.XP_CONFIG.COMMENT, 3);

  // addAchievementXP with 0 or falsy does not query DB
  const orig = pool.query;
  const queries: string[] = [];
  t.after(() => {
    pool.query = orig;
  });

  pool.query = (async (sql: string) => {
    queries.push(sql);
    return { rows: [] };
  }) as never;

  await gamification.addAchievementXP('u_zero', 0, 'Zero XP test');
  assert.equal(queries.length, 0);

  // updateAchievementProgress and updateDailyTaskProgress ignore unmapped actions
  await gamification.updateAchievementProgress('u_unmapped', 'UNKNOWN');
  await gamification.updateDailyTaskProgress('u_unmapped', 'UNKNOWN');
  assert.equal(queries.length, 0);

  // addXP returns undefined when user not found in update
  const notFoundRes = await gamification.addXP('user_not_found', 'PHOTO');
  assert.equal(notFoundRes, undefined);

  // getUnreadGamificationCount handles DB query error gracefully
  pool.query = (async () => {
    throw new Error('DB connection lost');
  }) as never;

  const unreadFallback = await gamification.getUnreadGamificationCount('u_err');
  assert.equal(unreadFallback, 0);

  // markAllAsSeen handles DB query error gracefully
  const markRes = await gamification.markAllAsSeen('u_err');
  assert.equal(markRes, false);
});

