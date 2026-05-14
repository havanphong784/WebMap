import admin from "../config/firebase.js";
import {sendError} from "../utils/apiResponse.js";

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

export const verifyToken = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return sendError(res, {
      status: 401,
      code: "AUTH_TOKEN_MISSING",
      message: "Thiếu token xác thực",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return sendError(res, {
      status: 401,
      code: "AUTH_TOKEN_INVALID",
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

// Cho phép request không có token (anonymous) đi qua, nhưng nếu có token hợp lệ
// thì gắn req.user để controller có thể lấy uid (ví dụ tính is_liked).
export const optionalVerifyToken = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    req.user = await admin.auth().verifyIdToken(token);
  } catch {
    // Bỏ qua token sai - coi như anonymous, không trả 401 ở route công khai
  }
  next();
};
