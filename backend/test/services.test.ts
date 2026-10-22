import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../src/config/db.ts';
import * as ach from '../src/services/achievementService.ts';
import * as auth from '../src/services/authService.ts';
import * as cmt from '../src/services/commentService.ts';
import * as fol from '../src/services/followService.ts';
import * as like from '../src/services/likeService.ts';
import * as notif from '../src/services/notificationService.ts';

test('services validation and query delegation', async (t) => {
  await assert.rejects(() => fol.toggleFollow('u1', 'u1'), /Cannot follow yourself/);
  assert.equal(await fol.checkIsFollowing('', 'u2'), false);
  await assert.rejects(
    () => like.toggleLike({ userId: '', locationId: 1 }),
    /Thiếu user hoặc location/,
  );
  await assert.rejects(
    () => cmt.createComment({ locationId: '', userId: 'u1', content: 'x' }),
    /Thiếu thông tin/,
  );
  await assert.rejects(
    () => cmt.createComment({ locationId: 1, userId: 'u1', content: ' ' }),
    /không được để trống/,
  );
  assert.equal(
    await notif.createNotification({ recipientId: '1', senderId: '1', type: 'T', message: 'm' }),
    null,
  );

  const orig = pool.query;
  const calls: unknown[][] = [];
  t.after(() => {
    pool.query = orig;
  });
  pool.query = (async (_q: string, vals: unknown[] = []) => {
    calls.push(vals);
    return { rows: [{ id: 1 }] };
  }) as never;

  await ach.getUserAchievements('u1');
  await ach.getUserDailyTasks('u1');
  await auth.upsertUser({ uid: 'u1', email: 'e', name: 'n', picture: 'p' });
  await auth.getUserProfile('u1');
  await auth.listActiveUsers(5);
  await auth.updateLastSeen('u1', { lat: 10, lng: 20 });
  await cmt.listComments(10);
  await fol.getFollowers('u1');
  await fol.getFollowing('u1');
  await fol.getFriends('u1');
  await notif.getNotificationsByUserId('u1');
  await notif.markAsRead(99, 'u1');
  await notif.markAllAsRead('u1');

  assert.equal(calls.length, 13);
  assert.deepEqual(calls[2], ['u1', 'e', 'n', 'p']);
});

test('services edge cases and query flows', async (t) => {
  const orig = pool.query;
  const queries: { sql: string; vals: unknown[] }[] = [];
  t.after(() => {
    pool.query = orig;
  });

  pool.query = (async (sql: string, vals: unknown[] = []) => {
    queries.push({ sql, vals });
    if (sql.includes('SELECT * FROM follows WHERE')) {
      if (vals[0] === 'follower_exists') {
        return { rows: [{ id: 1, follower_id: 'follower_exists', followed_id: 'u2' }] };
      }
      return { rows: [] };
    }
    if (sql.includes('SELECT 1 FROM follows WHERE')) {
      return { rows: vals[0] === 'is_following' ? [{ 1: 1 }] : [] };
    }
    if (sql.includes('SELECT * FROM likes WHERE')) {
      if (vals[0] === 'user_liked') {
        return { rows: [{ id: 10, user_id: 'user_liked', location_id: 1 }] };
      }
      return { rows: [] };
    }
    if (sql.includes('SELECT user_id FROM locations WHERE')) {
      return { rows: [{ user_id: 'location_owner' }] };
    }
    if (sql.includes('INSERT INTO comments')) {
      return {
        rows: [
          {
            id: 101,
            user_id: vals[0],
            location_id: vals[1],
            content: vals[2],
            created_at: new Date(),
          },
        ],
      };
    }
    if (sql.includes('INSERT INTO notifications')) {
      return {
        rows: [
          {
            id: 201,
            recipient_id: vals[0],
            sender_id: vals[1],
            type: vals[2],
            message: vals[3],
            location_id: vals[4],
            is_read: false,
            created_at: new Date(),
          },
        ],
      };
    }
    return { rows: [] };
  }) as never;

  const unfollowRes = await fol.toggleFollow('follower_exists', 'u2');
  assert.deepEqual(unfollowRes, { followed: false });

  const followRes = await fol.toggleFollow('follower_new', 'u2');
  assert.deepEqual(followRes, { followed: true });

  assert.equal(await fol.checkIsFollowing('is_following', 'u2'), true);
  assert.equal(await fol.checkIsFollowing('not_following', 'u2'), false);

  const unlikedRes = await like.toggleLike({ userId: 'user_liked', locationId: 1 });
  assert.deepEqual(unlikedRes, { action: 'unliked' });

  const likedRes = await like.toggleLike({ userId: 'user_new', locationId: 1 });
  assert.deepEqual(likedRes, { action: 'liked' });

  queries.length = 0;
  await auth.updateLastSeen('u_bound', { lat: 95, lng: 20 });
  assert.match(queries[0].sql, /SET last_seen_at = NOW\(\)/);
  assert.equal(queries[0].sql.includes('current_lat'), false);
  assert.deepEqual(queries[0].vals, ['u_bound']);

  const comment = await cmt.createComment({
    locationId: 1,
    userId: 'commenter',
    content: '  Hello world  ',
  });
  assert.equal(comment?.content, 'Hello world');

  const notifRes = await notif.createNotification({
    recipientId: 'r1',
    senderId: 's1',
    type: 'LIKE',
    message: 'liked your place',
    locationId: 5,
  });
  assert.equal(notifRes?.id, 201);
});
