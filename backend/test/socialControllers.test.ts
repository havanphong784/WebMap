import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../src/config/db.ts';
import * as authController from '../src/controllers/authController.ts';
import * as commentController from '../src/controllers/commentController.ts';
import * as likeController from '../src/controllers/likeController.ts';
import * as followController from '../src/controllers/followController.ts';
import * as messageController from '../src/controllers/messageController.ts';
import * as notificationController from '../src/controllers/notificationController.ts';
import authRoutes from '../src/routes/authRoutes.ts';
import commentRoutes from '../src/routes/commentRoutes.ts';
import likeRoutes from '../src/routes/likeRoutes.ts';
import followRoutes from '../src/routes/followRoutes.ts';
import messageRoutes from '../src/routes/messageRoutes.ts';
import notificationRoutes from '../src/routes/notificationRoutes.ts';
import sseRoutes from '../src/routes/sseRoutes.ts';
import type { AuthenticatedRequest } from '../src/types/http.ts';

const createMockRes = () => {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.jsonData = data; return this; },
    send(data?: any) { this.jsonData = data; return this; },
  };
  return res;
};

const createMockReq = (overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
} as unknown as AuthenticatedRequest);

test('authController handles auth, profile, and heartbeat', async (t) => {
  const origQuery = pool.query;
  t.after(() => { pool.query = origQuery; });

  const resUnauth = createMockRes();
  await authController.login(createMockReq(), resUnauth, () => {});
  assert.equal(resUnauth.statusCode, 401);

  pool.query = (async () => ({ rows: [{ firebase_uid: 'u1', email: 'e', name: 'n' }] })) as never;
  const resAuth = createMockRes();
  await authController.login(createMockReq({ user: { uid: 'u1' } as any }), resAuth, () => {});
  assert.equal(resAuth.statusCode, 200);

  const resProf = createMockRes();
  await authController.getProfile(createMockReq({ params: { uid: 'u1' } }), resProf, () => {});
  assert.equal(resProf.statusCode, 200);

  const resHb = createMockRes();
  await authController.heartbeat(createMockReq({ user: { uid: 'u1' } as any }), resHb, () => {});
  assert.equal(resHb.statusCode, 200);
});

test('comment and like controllers handle valid and invalid inputs', async (t) => {
  const origQuery = pool.query;
  t.after(() => { pool.query = origQuery; });

  pool.query = (async () => ({ rows: [{ id: 1, content: 'c' }] })) as never;
  const resCmt = createMockRes();
  await commentController.getComments(createMockReq({ params: { id: '1' } }), resCmt, () => {});
  assert.equal(resCmt.statusCode, 200);

  const resPostUnauth = createMockRes();
  await commentController.postComment(createMockReq(), resPostUnauth, () => {});
  assert.equal(resPostUnauth.statusCode, 401);

  const resPostOk = createMockRes();
  await commentController.postComment(createMockReq({ user: { uid: 'u1' } as any, params: { id: '1' }, body: { content: 'hello' } }), resPostOk, () => {});
  assert.equal(resPostOk.statusCode, 200);

  const resLikeUnauth = createMockRes();
  await likeController.toggleLocationLike(createMockReq(), resLikeUnauth, () => {});
  assert.equal(resLikeUnauth.statusCode, 401);

  pool.query = (async () => ({ rows: [] })) as never;
  const resLikeOk = createMockRes();
  await likeController.toggleLocationLike(createMockReq({ user: { uid: 'u1' } as any, params: { id: '1' } }), resLikeOk, () => {});
  assert.equal(resLikeOk.statusCode, 200);
});

test('followController handles toggle, lists, and status', async (t) => {
  const origQuery = pool.query;
  t.after(() => { pool.query = origQuery; });
  pool.query = (async () => ({ rows: [] })) as never;

  const resFollowUnauth = createMockRes();
  await followController.toggleFollow(createMockReq(), resFollowUnauth, () => {});
  assert.equal(resFollowUnauth.statusCode, 401);

  const resFollow = createMockRes();
  await followController.toggleFollow(createMockReq({ user: { uid: 'u1' } as any, body: { followed_id: 'u2' } }), resFollow, () => {});
  assert.equal(resFollow.statusCode, 200);

  const resFollowers = createMockRes();
  await followController.getFollowers(createMockReq({ params: { userId: 'u1' } }), resFollowers, () => {});
  assert.equal(resFollowers.statusCode, 200);

  const resFriends403 = createMockRes();
  await followController.getFriends(createMockReq({ user: { uid: 'u1' } as any, params: { userId: 'u2' } }), resFriends403, () => {});
  assert.equal(resFriends403.statusCode, 403);
});

test('message and notification controllers handle operations and guards', async (t) => {
  const origQuery = pool.query;
  t.after(() => { pool.query = origQuery; });
  pool.query = (async () => ({ rows: [] })) as never;

  const resMsgUnauth = createMockRes();
  await messageController.getThreads(createMockReq(), resMsgUnauth, () => {});
  assert.equal(resMsgUnauth.statusCode, 401);

  const resMsgOk = createMockRes();
  await messageController.getThreads(createMockReq({ user: { uid: 'u1' } as any }), resMsgOk, () => {});
  assert.equal(resMsgOk.statusCode, 200);

  const resSelfMsg = createMockRes();
  await messageController.createMessage(createMockReq({ user: { uid: 'u1' } as any, params: { peerId: 'u1' } }), resSelfMsg, () => {});
  assert.equal(resSelfMsg.statusCode, 400);

  const resNotif403 = createMockRes();
  await notificationController.getMyNotifications(createMockReq({ user: { uid: 'u1' } as any, params: { uid: 'u2' } }), resNotif403, () => {});
  assert.equal(resNotif403.statusCode, 403);

  const resNotifOk = createMockRes();
  await notificationController.getMyNotifications(createMockReq({ user: { uid: 'u1' } as any, params: { uid: 'u1' } }), resNotifOk, () => {});
  assert.equal(resNotifOk.statusCode, 200);
});

test('social and sse routes export valid Express routers', () => {
  const routes = [authRoutes, commentRoutes, likeRoutes, followRoutes, messageRoutes, notificationRoutes, sseRoutes];
  for (const r of routes) {
    assert.equal(typeof r, 'function');
  }
});
