import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../src/config/db.ts';
import * as ach from '../src/services/achievementService.ts';
import * as auth from '../src/services/authService.ts';
import * as cmt from '../src/services/commentService.ts';
import * as fol from '../src/services/followService.ts';
import * as like from '../src/services/likeService.ts';
import * as msg from '../src/services/messageService.ts';
import * as notif from '../src/services/notificationService.ts';
import * as sse from '../src/services/sseService.ts';

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

test('sseService handles connections, broadcasting, and error drops', () => {
  const writes1: string[] = [];
  const writes2: string[] = [];
  const client1 = { write: (chunk: string) => void writes1.push(chunk) };
  const client2 = { write: (chunk: string) => void writes2.push(chunk) };
  const brokenClient = { write: () => { throw new Error('disconnected'); } };

  sse.addConnection('user_a', client1 as never);
  sse.addConnection('user_b', client2 as never);
  assert.equal(sse.isUserOnline('user_a'), true);
  assert.equal(sse.isUserOnline('user_b'), true);
  assert.equal(sse.isUserOnline('user_offline'), false);

  sse.sendToUser('user_a', 'test_event', { foo: 'bar' });
  assert.equal(writes1.length, 1);
  assert.match(writes1[0], /event: test_event\ndata: \{"foo":"bar"\}\n\n/);
  assert.equal(writes2.length, 0);

  sse.broadcast('global_event', { ok: true });
  assert.equal(writes1.length, 2);
  assert.equal(writes2.length, 1);
  assert.match(writes2[0], /event: global_event\ndata: \{"ok":true\}\n\n/);

  sse.addConnection('user_c', brokenClient as never);
  assert.equal(sse.isUserOnline('user_c'), true);
  sse.sendToUser('user_c', 'fail_event', {});
  assert.equal(sse.isUserOnline('user_c'), false);

  sse.removeConnection('user_a', client1 as never);
  assert.equal(sse.isUserOnline('user_a'), false);
  sse.removeConnection('user_b', client2 as never);
  assert.equal(sse.isUserOnline('user_b'), false);

  // Multi-connection per user and idempotent disconnect
  const clientA2Writes: string[] = [];
  const clientA2 = { write: (chunk: string) => void clientA2Writes.push(chunk) };
  sse.addConnection('user_multi', client1 as never);
  sse.addConnection('user_multi', clientA2 as never);
  sse.sendToUser('user_multi', 'sync', { tab: 2 });
  assert.equal(clientA2Writes.length, 1);
  sse.removeConnection('user_multi', client1 as never);
  assert.equal(sse.isUserOnline('user_multi'), true);
  sse.removeConnection('user_multi', clientA2 as never);
  assert.equal(sse.isUserOnline('user_multi'), false);
  sse.removeConnection('user_multi', clientA2 as never);
  sse.resetConnectionsForTesting();
});

test('messageService validates friends, bounds, and delegates queries', async (t) => {
  const orig = pool.query;
  const queries: { sql: string; vals: unknown[] }[] = [];
  t.after(() => {
    pool.query = orig;
  });

  pool.query = (async (sql: string, vals: unknown[] = []) => {
    queries.push({ sql, vals });
    if (sql.includes('SELECT 1\n     FROM follows')) {
      const isFriend =
        (vals[0] === 'friend1' && vals[1] === 'friend2') ||
        (vals[0] === 'sender' && vals[1] === 'recipient');
      return { rowCount: isFriend ? 1 : 0, rows: isFriend ? [{ '?column?': 1 }] : [] };
    }
    if (sql.includes('INSERT INTO direct_messages')) {
      return {
        rowCount: 1,
        rows: [{ id: 10, sender_id: vals[0], recipient_id: vals[1], content: vals[2], is_read: false, created_at: new Date() }],
      };
    }
    if (sql.includes('WITH scoped_messages')) {
      return {
        rowCount: 1,
        rows: [{
          peer_id: 'friend2', id: 1, sender_id: 'friend1', recipient_id: 'friend2',
          content: 'latest message', is_read: false, created_at: new Date(), unread_count: 2,
          peer_name: 'Friend 2', peer_email: 'f2@example.com', peer_avatar_url: null,
          peer_last_seen_at: null, peer_current_lat: null, peer_current_lng: null,
        }],
      };
    }
    if (sql.includes('JOIN users sender ON sender.firebase_uid = dm.sender_id')) {
      return {
        rowCount: 1,
        rows: [{
          id: 1, sender_id: vals[0], recipient_id: vals[1], content: 'hi',
          is_read: true, created_at: new Date(), sender_name: 'Friend', sender_avatar_url: null,
        }],
      };
    }
    return { rowCount: 0, rows: [] };
  }) as never;

  await assert.rejects(
    () => msg.ensureFriends({ userId: 'stranger1', peerId: 'stranger2' }),
    (err: { status?: number; code?: string }) =>
      err.status === 403 && err.code === 'CHAT_FRIEND_REQUIRED',
  );

  await assert.rejects(
    () => msg.sendDirectMessage({ senderId: 'sender', recipientId: 'recipient', content: '   ' }),
    (err: { status?: number; code?: string }) =>
      err.status === 400 && err.code === 'MESSAGE_CONTENT_REQUIRED',
  );

  await assert.rejects(
    () =>
      msg.sendDirectMessage({
        senderId: 'sender',
        recipientId: 'recipient',
        content: 'x'.repeat(2001),
      }),
    (err: { status?: number; code?: string }) =>
      err.status === 400 && err.code === 'MESSAGE_TOO_LONG',
  );

  const sent = await msg.sendDirectMessage({
    senderId: 'sender',
    recipientId: 'recipient',
    content: '  Hello   there!  ',
  });
  assert.equal(sent.content, 'Hello there!');
  assert.equal(sent.id, 10);

  const convo = await msg.listConversation({ userId: 'friend1', peerId: 'friend2', limit: 300 });
  assert.equal(convo.length, 1);
  const convoCall = queries.find((q) => q.sql.includes('FROM direct_messages'));
  assert.equal(convoCall?.vals[2], 150);

  await msg.listConversation({ userId: 'friend1', peerId: 'friend2', limit: -5 });
  const minLimitCall = queries[queries.length - 1];
  assert.equal(minLimitCall?.vals[2], 1);

  await msg.listConversation({ userId: 'friend1', peerId: 'friend2', limit: 'invalid' });
  const defaultLimitCall = queries[queries.length - 1];
  assert.equal(defaultLimitCall?.vals[2], 80);

  await assert.rejects(
    () => msg.sendDirectMessage({ senderId: 'sender', recipientId: 'recipient', content: null as never }),
    (err: { status?: number; code?: string }) => err.status === 400 && err.code === 'MESSAGE_CONTENT_REQUIRED',
  );

  const threads = await msg.listMessageThreads({ userId: 'friend1' });
  assert.equal(threads.length, 1);
  assert.equal(threads[0].peer_id, 'friend2');

  await msg.markConversationRead({ userId: 'friend1', peerId: 'friend2' });
  const updateCall = queries.find((q) => q.sql.includes('UPDATE direct_messages'));
  assert.deepEqual(updateCall?.vals, ['friend2', 'friend1']);
});
