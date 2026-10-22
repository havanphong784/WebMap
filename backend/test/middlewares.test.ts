import assert from 'node:assert/strict';
import test from 'node:test';
import admin from '../src/config/firebase.ts';
import { optionalVerifyToken, verifyToken } from '../src/middlewares/authMiddleware.ts';
import { errorHandler, notFoundHandler } from '../src/middlewares/errorHandler.ts';
import { normalizeApiResponse } from '../src/middlewares/normalizeResponse.ts';
import { createRateLimiter } from '../src/middlewares/rateLimit.ts';
import {
  validateLocationCreation,
  validateLocationUpdate,
} from '../src/middlewares/validateLocation.ts';
import type { AppError, AuthRequest } from '../src/types/common.ts';

interface MockResponse {
  statusCode: number;
  jsonData: unknown;
  headers: Record<string, string>;
  headersSent?: boolean;
  status(code: number): MockResponse;
  json(data: unknown): MockResponse;
  setHeader(name: string, value: string): MockResponse;
}

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    jsonData: null,
    headers: {},
    headersSent: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
};

test('notFoundHandler returns 404 with ROUTE_NOT_FOUND', () => {
  const req = { originalUrl: '/api/unknown' };
  const res = createMockResponse();

  notFoundHandler(req as never, res as never);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.jsonData, {
    success: false,
    message: 'Không tìm thấy API',
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Không tìm thấy API',
      status: 404,
      details: { path: '/api/unknown' },
    },
  });
});

test('errorHandler formats AppError and falls back to 500', () => {
  const err: AppError = new Error('Database error');
  const res = createMockResponse();
  let nextCalled = false;

  errorHandler(err, {} as never, res as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.jsonData, {
    success: false,
    message: 'Database error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database error',
      status: 500,
      details: null,
    },
  });
});

test('rateLimiter tracks requests and blocks when limit exceeded', () => {
  const limiter = createRateLimiter({ windowMs: 10_000, max: 2 });
  const req = { ip: '127.0.0.1' };

  let nextCount = 0;
  const next = () => {
    nextCount += 1;
  };

  const res1 = createMockResponse();
  limiter(req as never, res1 as never, next);
  assert.equal(nextCount, 1);
  assert.equal(res1.headers['X-RateLimit-Remaining'], '1');

  const res2 = createMockResponse();
  limiter(req as never, res2 as never, next);
  assert.equal(nextCount, 2);
  assert.equal(res2.headers['X-RateLimit-Remaining'], '0');

  const res3 = createMockResponse();
  limiter(req as never, res3 as never, next);
  assert.equal(nextCount, 2);
  assert.equal(res3.statusCode, 429);
  assert.equal(res3.headers['Retry-After'], '10');
});

test('validateLocationCreation accepts valid payload and calls next()', () => {
  const req = {
    body: {
      name: 'Hồ Gươm',
      address: 'Hoàn Kiếm, Hà Nội',
      lat: 21.0285,
      lng: 105.8542,
      category: 'attraction',
      rating: 5,
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  validateLocationCreation(req as never, res as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('validateLocationCreation rejects invalid coordinates', () => {
  const req = {
    body: {
      name: 'Invalid Point',
      address: 'Somewhere',
      lat: 100, // Invalid latitude > 90
      lng: 105,
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  validateLocationCreation(req as never, res as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test('validateLocationUpdate validates optional fields when provided', () => {
  const validReq = {
    body: {
      rating: 4,
    },
  };
  const validRes = createMockResponse();
  let validNextCalled = false;
  validateLocationUpdate(validReq as never, validRes as never, () => {
    validNextCalled = true;
  });
  assert.equal(validNextCalled, true);

  const invalidReq = {
    body: {
      rating: 10, // Invalid rating > 5
    },
  };
  const invalidRes = createMockResponse();
  let invalidNextCalled = false;
  validateLocationUpdate(invalidReq as never, invalidRes as never, () => {
    invalidNextCalled = true;
  });
  assert.equal(invalidNextCalled, false);
  assert.equal(invalidRes.statusCode, 400);
});

test('normalizeApiResponse normalizes error responses >= 400', () => {
  const req = {};
  const res = createMockResponse();
  let nextCalled = false;

  normalizeApiResponse(req as never, res as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);

  res.status(403);
  res.json({ error: 'Forbidden access' });

  assert.deepEqual(res.jsonData, {
    success: false,
    message: 'Forbidden access',
    error: {
      code: 'REQUEST_ERROR',
      message: 'Forbidden access',
      status: 403,
      details: null,
    },
  });
});

test('verifyToken returns 401 when Authorization header is missing or malformed', async () => {
  const missingHeaderReq = { headers: {} } as unknown as AuthRequest;
  const res1 = createMockResponse();
  let next1 = false;
  await verifyToken(missingHeaderReq, res1 as never, () => {
    next1 = true;
  });
  assert.equal(next1, false);
  assert.equal(res1.statusCode, 401);
  assert.deepEqual(res1.jsonData, {
    success: false,
    message: 'Thiếu token xác thực',
    error: {
      code: 'AUTH_TOKEN_MISSING',
      message: 'Thiếu token xác thực',
      status: 401,
      details: null,
    },
  });

  const badSchemeReq = {
    headers: { authorization: 'Basic 12345' },
  } as unknown as AuthRequest;
  const res2 = createMockResponse();
  let next2 = false;
  await verifyToken(badSchemeReq, res2 as never, () => {
    next2 = true;
  });
  assert.equal(next2, false);
  assert.equal(res2.statusCode, 401);
  assert.equal((res2.jsonData as { error?: { code?: string } })?.error?.code, 'AUTH_TOKEN_MISSING');
});

test('verifyToken validates token and attaches user or returns 401 on failure', async (t) => {
  t.after(() => {
    Reflect.deleteProperty(admin, 'auth');
  });

  Object.defineProperty(admin, 'auth', {
    value: () => ({
      verifyIdToken: async (token: string) => {
        if (token === 'valid-token') {
          return { uid: 'user-abc', email: 'user@example.com' } as never;
        }
        throw new Error('Token expired');
      },
    }),
    configurable: true,
    writable: true,
  });

  const validReq = {
    headers: { authorization: 'Bearer valid-token' },
  } as unknown as AuthRequest;
  const validRes = createMockResponse();
  let validNext = false;
  await verifyToken(validReq, validRes as never, () => {
    validNext = true;
  });
  assert.equal(validNext, true);
  assert.deepEqual(validReq.user, {
    uid: 'user-abc',
    email: 'user@example.com',
  });

  const invalidReq = {
    headers: { authorization: 'Bearer invalid-token' },
  } as unknown as AuthRequest;
  const invalidRes = createMockResponse();
  let invalidNext = false;
  await verifyToken(invalidReq, invalidRes as never, () => {
    invalidNext = true;
  });
  assert.equal(invalidNext, false);
  assert.equal(invalidRes.statusCode, 401);
  assert.equal(
    (invalidRes.jsonData as { error?: { code?: string } })?.error?.code,
    'AUTH_TOKEN_INVALID',
  );
});

test('optionalVerifyToken allows anonymous or attaches user when token valid', async (t) => {
  t.after(() => {
    Reflect.deleteProperty(admin, 'auth');
  });

  Object.defineProperty(admin, 'auth', {
    value: () => ({
      verifyIdToken: async (token: string) => {
        if (token === 'valid-token') {
          return { uid: 'user-xyz' } as never;
        }
        throw new Error('Invalid token');
      },
    }),
    configurable: true,
    writable: true,
  });

  const noTokenReq = { headers: {} } as unknown as AuthRequest;
  let nextCalled1 = false;
  await optionalVerifyToken(noTokenReq, createMockResponse() as never, () => {
    nextCalled1 = true;
  });
  assert.equal(nextCalled1, true);
  assert.equal(noTokenReq.user, undefined);

  const validReq = {
    headers: { authorization: 'Bearer valid-token' },
  } as unknown as AuthRequest;
  let nextCalled2 = false;
  await optionalVerifyToken(validReq, createMockResponse() as never, () => {
    nextCalled2 = true;
  });
  assert.equal(nextCalled2, true);
  assert.deepEqual(validReq.user, { uid: 'user-xyz' });

  const invalidReq = {
    headers: { authorization: 'Bearer bad-token' },
  } as unknown as AuthRequest;
  let nextCalled3 = false;
  await optionalVerifyToken(invalidReq, createMockResponse() as never, () => {
    nextCalled3 = true;
  });
  assert.equal(nextCalled3, true);
  assert.equal(invalidReq.user, undefined);
});
