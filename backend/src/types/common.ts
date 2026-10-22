import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  code?: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  userId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}
