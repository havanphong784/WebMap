const buckets = new Map();

const getClientKey = (req) => req.user?.uid || req.ip || "anonymous";

export const createRateLimiter = ({
  windowMs = 60_000,
  max = 20,
  code = "RATE_LIMITED",
  message = "Bạn đang gửi quá nhanh. Vui lòng thử lại sau ít phút.",
} = {}) => (req, res, next) => {
  const now = Date.now();
  const key = getClientKey(req);
  const bucket = buckets.get(key) || {count: 0, resetAt: now + windowMs};

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
  res.setHeader("X-RateLimit-Reset", String(bucket.resetAt));

  if (bucket.count > max) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message,
      error: {
        code,
        message,
        status: 429,
        details: {retryAfterSeconds},
      },
    });
  }

  return next();
};
