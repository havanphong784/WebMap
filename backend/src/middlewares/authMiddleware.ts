import type { NextFunction, Response } from 'express';
import admin from '../config/firebase.js';
import type { AuthRequest } from '../types/common.js';
import { sendError } from '../utils/apiResponse.js';

const extractBearerToken = (req: AuthRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1] || null;
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extractBearerToken(req);
  if (!token) {
    sendError(res, {
      status: 401,
      code: 'AUTH_TOKEN_MISSING',
      message: 'Thiếu token xác thực',
    });
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (_error) {
    sendError(res, {
      status: 401,
      code: 'AUTH_TOKEN_INVALID',
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

// Cho phép request không có token (anonymous) đi qua, nhưng nếu có token hợp lệ
// thì gắn req.user để controller có thể lấy uid (ví dụ tính is_liked).
export const optionalVerifyToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    req.user = await admin.auth().verifyIdToken(token);
  } catch {
    // Bỏ qua token sai - coi như anonymous, không trả 401 ở route công khai
  }
  next();
};
