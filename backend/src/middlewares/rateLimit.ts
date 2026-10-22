import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../types/common.js';

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  code?: string;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const getClientKey = (req: AuthRequest): string => req.user?.uid || req.ip || 'anonymous';

export const createRateLimiter =
  ({
    windowMs = 60_000,
    max = 20,
    code = 'RATE_LIMITED',
    message = 'Bạn đang gửi quá nhanh. Vui lòng thử lại sau ít phút.',
  }: RateLimiterOptions = {}) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = getClientKey(req);
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(bucket.resetAt));

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        message,
        error: {
          code,
          message,
          status: 429,
          details: { retryAfterSeconds },
        },
      });
      return;
    }

    next();
  };
