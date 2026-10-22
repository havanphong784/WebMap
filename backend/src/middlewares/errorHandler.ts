import type { NextFunction, Request, Response } from 'express';
import type { AppError } from '../types/common.js';
import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, {
    status: 404,
    code: 'ROUTE_NOT_FOUND',
    message: 'Không tìm thấy API',
    details: { path: req.originalUrl },
  });
};

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  console.error('Unhandled error:', err);

  sendError(res, {
    status: err.status || err.statusCode || 500,
    code: err.code,
    message: err.message || 'Lỗi Server',
  });
};
