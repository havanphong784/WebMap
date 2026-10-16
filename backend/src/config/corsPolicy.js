const parseOrigins = (value) => new Set(
  String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

export const createOriginChecker = ({frontendOrigins, capacitorOrigins, isDev}) => {
  const allowedOrigins = new Set([
    ...parseOrigins(frontendOrigins),
    ...parseOrigins(capacitorOrigins),
  ]);

  return (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isDev && allowedOrigins.size === 0) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} không được phép bởi CORS`));
  };
};
