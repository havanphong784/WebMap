export const normalizeApiResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      (body.success === false || (res.statusCode >= 400 && body.error))
    ) {
      const message = body.error?.message || body.message || body.error || "Lỗi Server";
      const status = res.statusCode >= 400 ? res.statusCode : 500;

      return originalJson({
        ...body,
        success: false,
        message,
        error: typeof body.error === "object"
          ? {
            status,
            code: body.error.code || (status >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR"),
            message,
            details: body.error.details || body.detail || body.details || null,
          }
          : {
            status,
            code: status >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
            message,
            details: body.detail || body.details || null,
          },
      });
    }

    return originalJson(body);
  };

  next();
};
