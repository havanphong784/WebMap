export const sendSuccess = (res, {status = 200, data, message, meta, ...rest} = {}) => {
  const payload = {success: true};
  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  if (meta !== undefined) payload.meta = meta;

  return res.status(status).json({...payload, ...rest});
};

export const sendError = (
  res,
  {
    status = 500,
    code,
    message = "Lỗi Server",
    details = null,
  } = {}
) => {
  const normalizedCode = code || (status >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");

  return res.status(status).json({
    success: false,
    message,
    error: {
      code: normalizedCode,
      message,
      status,
      details,
    },
  });
};
