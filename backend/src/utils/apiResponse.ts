import type { Response } from 'express';

export interface SendSuccessOptions<T = unknown> {
  status?: number;
  data?: T;
  message?: string;
  meta?: unknown;
  [key: string]: unknown;
}

export interface SendErrorOptions {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
}

export interface SuccessPayload<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  meta?: unknown;
  [key: string]: unknown;
}

export interface ErrorDetails {
  code: string;
  message: string;
  status: number;
  details: unknown;
}

export interface ErrorPayload {
  success: false;
  message: string;
  error: ErrorDetails;
}

export const sendSuccess = <T = unknown>(
  res: Response,
  { status = 200, data, message, meta, ...rest }: SendSuccessOptions<T> = {},
): Response => {
  const payload: SuccessPayload<T> = { success: true };
  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  if (meta !== undefined) payload.meta = meta;

  return res.status(status).json({ ...payload, ...rest });
};

export const sendError = (
  res: Response,
  { status = 500, code, message = 'Lỗi Server', details = null }: SendErrorOptions = {},
): Response => {
  const normalizedCode = code || (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');

  const payload: ErrorPayload = {
    success: false,
    message,
    error: {
      code: normalizedCode,
      message,
      status,
      details,
    },
  };

  return res.status(status).json(payload);
};
