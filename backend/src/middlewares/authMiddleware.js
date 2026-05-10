import admin from "../config/firebase.js";
import {sendError} from "../utils/apiResponse.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, {
      status: 401,
      code: "AUTH_TOKEN_MISSING",
      message: "Thiếu token xác thực",
    });
  }

  const token = authHeader.split(" ")[1];

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
