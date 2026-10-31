import assert from 'node:assert/strict';
import test from 'node:test';
import type {Response} from 'express';
import pool from '../src/config/db.js';
import * as chatbotController from '../src/controllers/chatbotController.js';
import router from '../src/routes/chatbotRoutes.js';
import * as persistence from '../src/services/chatbotPersistenceService.js';
import * as chatbotService from '../src/services/chatbotService.js';
import type {AuthenticatedRequest} from '../src/types/http.js';

test('chatbotPersistenceService CRUD and query operations', async (t) => {
  assert.equal(typeof persistence.createSessionId(), 'string');
  assert.equal(persistence.createSessionId().length, 36);

  const orig = pool.query;
  const origConnect = pool.connect;
  const queries: { sql: string; vals: unknown[] }[] = [];

  t.after(() => {
    pool.query = orig;
    pool.connect = origConnect;
  });

  pool.query = (async (sql: string, vals: unknown[] = []) => {
    queries.push({ sql, vals });
    if (sql.includes('INSERT INTO chat_sessions')) {
      return { rows: [{ id: vals[0], user_id: vals[1], title: vals[2] }] };
    }
    if (sql.includes('INSERT INTO chat_messages')) {
      return {
        rows: [
          {
            id: 1,
            session_id: vals[0],
            user_id: vals[1],
            role: vals[2],
            content: vals[3],
            metadata: vals[4],
          },
        ],
      };
    }
    if (sql.includes('INSERT INTO chatbot_feedback')) {
      return {
        rows: [
          {
            id: 1,
            user_id: vals[0],
            session_id: vals[1],
            assistant_message_id: vals[2],
            rating: vals[3],
            reason: vals[4],
            comment: vals[5],
          },
        ],
      };
    }
    if (sql.includes('FROM saved_trips t') && sql.includes('GROUP BY t.id')) {
      return { rows: [{ id: 'trip1', title: 'Trip 1', stops: [] }] };
    }
    if (sql.includes('FROM chat_sessions s')) {
      return { rows: [{ id: 's1', title: 'Session 1', message_count: 2 }] };
    }
    if (sql.includes('FROM chat_messages m')) {
      return { rows: [{ id: 1, session_id: vals[1], content: 'hello' }] };
    }
    if (sql.includes('INSERT INTO ai_usage_logs')) {
      return { rows: [] };
    }
    if (sql.includes('signals') && sql.includes('tag')) {
      return { rows: [{ tag: 'cafe', weight: 3 }] };
    }
    if (sql.includes('signals') && sql.includes('category')) {
      return { rows: [{ category: 'Food', weight: 4 }] };
    }
    if (sql.includes('FROM saved_trips t') && sql.includes('ORDER BY t.created_at DESC')) {
      return { rows: [{ id: 't1', title: 'Trip A' }] };
    }
    if (sql.includes("role = 'user'")) {
      return { rows: [{ content: 'Find cafe near me' }] };
    }
    if (sql.includes('WITH usage AS')) {
      return { rows: [{ experiment_variant: 'default', model: 'gemini-2.0-flash', request_count: 5 }] };
    }
    return { rows: [] };
  }) as never;

  const session = await persistence.ensureChatSession({
    userId: 'u1',
    sessionId: 'session_123',
    title: 'Custom Title',
  });
  assert.equal(session.id, 'session_123');
  assert.equal(session.title, 'Custom Title');

  const defaultSession = await persistence.ensureChatSession({ userId: 'u2' });
  assert.equal(defaultSession.title, 'EVE Chat');

  const message = await persistence.saveChatMessage({
    sessionId: 's1',
    userId: 'u1',
    role: 'user',
    content: 'Hello',
    metadata: { key: 'val' },
  });
  assert.equal(message.role, 'user');
  assert.equal(message.content, 'Hello');

  const fbPositive = await persistence.saveChatFeedback({
    userId: 'u1',
    sessionId: 's1',
    assistantMessageId: 10,
    rating: 5,
    reason: 'good',
  });
  assert.equal(fbPositive.rating, 1);

  const fbNegative = await persistence.saveChatFeedback({
    userId: 'u1',
    assistantMessageId: 11,
    rating: -1,
  });
  assert.equal(fbNegative.rating, -1);

  // Empty locations should return null
  const emptyTrip = await persistence.saveTrip({ userId: 'u1', locations: [] });
  assert.equal(emptyTrip, null);

  // Transactional saveTrip
  pool.connect = (async () => ({
    query: async (sql: string) => {
      if (sql.includes('INSERT INTO saved_trips')) {
        return { rows: [{ id: 'new_trip', user_id: 'u1', title: 'Trip' }] };
      }
      return { rows: [] };
    },
    release: () => {},
  })) as never;

  const savedTrip = await persistence.saveTrip({
    userId: 'u1',
    sessionId: 's1',
    title: 'My Trip',
    locations: [{ id: 'loc1', name: 'Coffee Shop' }],
  });
  assert.equal(savedTrip?.title, 'Trip');
  assert.equal(savedTrip?.stops.length, 1);
  assert.equal(savedTrip?.stops[0].stop_order, 1);

  await persistence.logAiUsage({
    userId: 'u1',
    sessionId: 's1',
    model: 'gemini-2.0-flash',
    status: 'success',
  });

  const trips = await persistence.listSavedTrips({ userId: 'u1', limit: 5 });
  assert.equal(trips.length, 1);

  const sessions = await persistence.listChatSessions({ userId: 'u1', limit: 10 });
  assert.equal(sessions.length, 1);

  const messages = await persistence.listChatMessages({ userId: 'u1', sessionId: 's1' });
  assert.equal(messages.length, 1);

  const profile = await persistence.getUserChatbotProfile({ userId: 'u1' });
  assert.deepEqual(profile.preferredTags, [{ tag: 'cafe', weight: 3 }]);
  assert.deepEqual(profile.recentMessages, ['Find cafe near me']);

  const metrics = await persistence.getChatbotExperimentMetrics({ days: 7 });
  assert.equal(metrics.days, 7);
  assert.equal(metrics.variants.length, 1);
});

test('chatbotService response handling and fallbacks', async () => {
  chatbotService.setGeneratorForTesting(async () => ({
    text: 'Test reply',
    durationMs: 12,
    usageMetadata: {},
    model: 'gemini-2.0-flash',
    status: 'success',
  }));

  const result = await chatbotService.generateChatbotResponse('test', {
    locations: [],
    history: [],
  });
  assert.equal(result.text, 'Test reply');
  assert.equal(result.status, 'success');

  chatbotService.setGeneratorForTesting(null);
});

test('chatbotController handles validations, auth guards, and responses', async (t) => {
  const origQuery = pool.query;
  t.after(() => {
    pool.query = origQuery;
    chatbotService.setGeneratorForTesting(null);
  });

  pool.query = (async (sql: string, vals: unknown[] = []) => {
    if (sql.includes('INSERT INTO chat_sessions')) {
      return { rows: [{ id: 's100', user_id: vals[1], title: vals[2] }] };
    }
    if (sql.includes('INSERT INTO chat_messages')) {
      return { rows: [{ id: 5, session_id: vals[0], role: vals[2], content: vals[3] }] };
    }
    if (sql.includes('FROM chat_sessions s')) {
      return { rows: [{ id: 's100', title: 'Session 1' }] };
    }
    if (sql.includes('FROM chat_messages m')) {
      return { rows: [{ id: 1, content: 'msg' }] };
    }
    if (sql.includes('INSERT INTO chatbot_feedback')) {
      return { rows: [{ id: 1, rating: vals[3] }] };
    }
    return { rows: [] };
  }) as never;

  const createMockRes = () => {
    let status = 200;
    let payload: any = null;
    const res: any = {
      status: (s: number) => {
        status = s;
        return res;
      },
      json: (p: any) => {
        payload = p;
        return res;
      },
    };
    return { res: res as Response, getStatus: () => status, getPayload: () => payload };
  };

  // Missing message
  const missingMsgRes = createMockRes();
  await chatbotController.chat(
    { body: {}, user: { uid: 'u1' } } as unknown as AuthenticatedRequest,
    missingMsgRes.res,
    () => {}
  );
  assert.equal(missingMsgRes.getStatus(), 400);
  assert.equal(missingMsgRes.getPayload()?.error?.code, 'CHAT_MESSAGE_REQUIRED');

  // AI Generation failure
  chatbotService.setGeneratorForTesting(async () => ({
    text: null,
    durationMs: 10,
    usageMetadata: {},
    model: 'gemini-2.0-flash',
    status: 'error',
    errorMessage: 'Quota exceeded',
  }));

  const aiErrorRes = createMockRes();
  await chatbotController.chat(
    { body: { message: 'hello' }, user: { uid: 'u1' } } as unknown as AuthenticatedRequest,
    aiErrorRes.res,
    () => {}
  );
  assert.equal(aiErrorRes.getStatus(), 502);
  assert.equal(aiErrorRes.getPayload()?.error?.code, 'AI_GENERATION_FAILED');

  // Successful chat
  chatbotService.setGeneratorForTesting(async () => ({
    text: 'Hello from EVE!',
    durationMs: 50,
    usageMetadata: { promptTokenCount: 10 },
    model: 'gemini-2.0-flash',
    status: 'success',
  }));

  const successRes = createMockRes();
  await chatbotController.chat(
    { body: { message: 'hello' }, user: { uid: 'u1' } } as unknown as AuthenticatedRequest,
    successRes.res,
    () => {}
  );
  assert.equal(successRes.getStatus(), 200);
  assert.equal(successRes.getPayload()?.data?.response, 'Hello from EVE!');
  assert.equal(successRes.getPayload()?.data?.sessionId, 's100');

  // Sessions unauthenticated guard
  const unauthSessions = createMockRes();
  await chatbotController.sessions(
    { query: {}, user: undefined } as unknown as AuthenticatedRequest,
    unauthSessions.res,
    () => {}
  );
  assert.equal(unauthSessions.getStatus(), 401);

  // Messages unauthenticated guard
  const unauthMessages = createMockRes();
  await chatbotController.messages(
    { params: { sessionId: 's1' }, query: {}, user: undefined } as unknown as AuthenticatedRequest,
    unauthMessages.res,
    () => {}
  );
  assert.equal(unauthMessages.getStatus(), 401);

  // Feedback unauthenticated guard
  const unauthFeedback = createMockRes();
  await chatbotController.feedback(
    { body: { assistantMessageId: 1, rating: 1 }, user: undefined } as unknown as AuthenticatedRequest,
    unauthFeedback.res,
    () => {}
  );
  assert.equal(unauthFeedback.getStatus(), 401);

  // Feedback success
  const feedbackRes = createMockRes();
  await chatbotController.feedback(
    {
      body: { assistantMessageId: 1, rating: 1, comment: 'Nice' },
      user: { uid: 'u1' },
    } as unknown as AuthenticatedRequest,
    feedbackRes.res,
    () => {}
  );
  assert.equal(feedbackRes.getStatus(), 200);

  // Sessions authenticated success
  const authSessions = createMockRes();
  await chatbotController.sessions(
    { query: { limit: '10' }, user: { uid: 'u1' } } as unknown as AuthenticatedRequest,
    authSessions.res,
    () => {}
  );
  assert.equal(authSessions.getStatus(), 200);

  // Messages authenticated success
  const authMessages = createMockRes();
  await chatbotController.messages(
    { params: { sessionId: 's100' }, query: {}, user: { uid: 'u1' } } as unknown as AuthenticatedRequest,
    authMessages.res,
    () => {}
  );
  assert.equal(authMessages.getStatus(), 200);
});

test('chatbotRoutes registers endpoints with auth middleware', () => {
  assert.ok(router);
  assert.equal(typeof router, 'function');
  const routes = (router as any).stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }));

  assert.ok(routes.some((r: any) => r.path === '/chat' && r.methods.includes('post')));
  assert.ok(routes.some((r: any) => r.path === '/sessions' && r.methods.includes('get')));
  assert.ok(routes.some((r: any) => r.path === '/sessions/:sessionId/messages' && r.methods.includes('get')));
  assert.ok(routes.some((r: any) => r.path === '/feedback' && r.methods.includes('post')));
});

test('chatbotController handles database failure during chat gracefully without crashing', async (t) => {
  const origQuery = pool.query;
  t.after(() => {
    pool.query = origQuery;
    chatbotService.setGeneratorForTesting(null);
  });

  pool.query = (async () => {
    throw new Error('Database offline');
  }) as never;

  chatbotService.setGeneratorForTesting(async () => ({
    text: 'Chat fallback reply',
    durationMs: 15,
    usageMetadata: {},
    model: 'gemini-2.0-flash',
    status: 'success',
  }));

  let status = 200;
  let payload: any = null;
  const res: any = {
    status: (s: number) => {
      status = s;
      return res;
    },
    json: (p: any) => {
      payload = p;
      return res;
    },
  };

  await chatbotController.chat(
    { body: { message: 'hello without DB' }, user: { uid: 'u_nodb' } } as unknown as AuthenticatedRequest,
    res,
    () => {}
  );

  assert.equal(status, 200);
  assert.equal(payload?.data?.response, 'Chat fallback reply');
  assert.equal(payload?.data?.sessionId, null);
});
