export interface CorsPolicyOptions {
  frontendOrigins?: string | null;
  capacitorOrigins?: string | null;
  isDev?: boolean;
}

export type CorsOriginCallback = (err: Error | null, origin?: boolean) => void;
export type CorsOriginChecker = (origin: string | undefined, callback: CorsOriginCallback) => void;

const parseOrigins = (value?: string | null): Set<string> =>
  new Set(
    String(value || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

export const createOriginChecker = ({
  frontendOrigins,
  capacitorOrigins,
  isDev = false,
}: CorsPolicyOptions): CorsOriginChecker => {
  const allowedOrigins = new Set<string>([
    ...parseOrigins(frontendOrigins),
    ...parseOrigins(capacitorOrigins),
  ]);

  return (origin: string | undefined, callback: CorsOriginCallback): void => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (isDev && allowedOrigins.size === 0) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} không được phép bởi CORS`));
  };
};
