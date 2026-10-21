import assert from 'node:assert/strict';
import test from 'node:test';
import { sendError, sendSuccess } from '../src/utils/apiResponse.ts';

interface MockResponse {
  statusCode: number;
  jsonData: unknown;
  status(code: number): MockResponse;
  json(data: unknown): MockResponse;
}

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

test('sendSuccess sends 200 and success payload by default', () => {
  const res = createMockResponse();
  sendSuccess(res as never, { data: { id: 1 }, message: 'OK' });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonData, {
    success: true,
    message: 'OK',
    data: { id: 1 },
  });
});

test('sendError defaults to 500 and INTERNAL_SERVER_ERROR', () => {
  const res = createMockResponse();
  sendError(res as never);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.jsonData, {
    success: false,
    message: 'Lỗi Server',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi Server',
      status: 500,
      details: null,
    },
  });
});

test('sendError supports custom status, code, and details', () => {
  const res = createMockResponse();
  sendError(res as never, {
    status: 400,
    code: 'CUSTOM_BAD_REQUEST',
    message: 'Sai tham số',
    details: { field: 'lat' },
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.jsonData, {
    success: false,
    message: 'Sai tham số',
    error: {
      code: 'CUSTOM_BAD_REQUEST',
      message: 'Sai tham số',
      status: 400,
      details: { field: 'lat' },
    },
  });
});
