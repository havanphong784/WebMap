import type { NextFunction, Request, Response } from 'express';

interface NormalizedErrorDetails {
  status: number;
  code: string;
  message: string;
  details: unknown;
}

interface RawErrorBody {
  success?: boolean;
  message?: string;
  detail?: unknown;
  details?: unknown;
  error?:
    | {
        code?: string;
        message?: string;
        status?: number;
        details?: unknown;
      }
    | string;
  [key: string]: unknown;
}

export const normalizeApiResponse = (_req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = (body?: unknown): Response => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const errorBody = body as RawErrorBody;
      if (errorBody.success === false || (res.statusCode >= 400 && errorBody.error)) {
        const errorObj = typeof errorBody.error === 'object' ? errorBody.error : undefined;
        const message =
          errorObj?.message ||
          errorBody.message ||
          (typeof errorBody.error === 'string' ? errorBody.error : 'Lỗi Server');
        const status = res.statusCode >= 400 ? res.statusCode : 500;

        const normalizedError: NormalizedErrorDetails = {
          status,
          code: errorObj?.code || (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
          message,
          details: errorObj?.details || errorBody.detail || errorBody.details || null,
        };

        return originalJson({
          ...errorBody,
          success: false,
          message,
          error: normalizedError,
        });
      }
    }

    return originalJson(body);
  };

  next();
};
