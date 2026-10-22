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
