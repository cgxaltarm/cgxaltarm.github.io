import path from 'node:path';

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = (value) =>
  new Set(
    (value ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

export const config = {
  host: process.env.HOST ?? '127.0.0.1',
  port: parsePositiveInteger(process.env.PORT, 20129),
  databasePath: process.env.NINE_ROUTER_DB_PATH ?? path.join(process.env.APPDATA ?? '', '9router', 'db', 'data.sqlite'),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  rateLimitWindowMs: parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: parsePositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 30),
  maxRangeDays: parsePositiveInteger(process.env.MAX_RANGE_DAYS, 90),
};
