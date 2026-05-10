import {sendError} from "../utils/apiResponse.js";

export const notFoundHandler = (req, res) => {
  sendError(res, {
    status: 404,
    code: "ROUTE_NOT_FOUND",
    message: "Không tìm thấy API",
    details: {path: req.originalUrl},
  });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Unhandled error:", err);

  sendError(res, {
    status: err.status || err.statusCode || 500,
    code: err.code,
    message: err.message || "Lỗi Server",
  });
};
