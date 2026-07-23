import http from 'node:http';
import { config } from './config.js';
import { getCorsHeaders, handlePreflight } from './cors.js';
import { UsageDatabase } from './database.js';
import { getDateRange } from './dates.js';
import { HttpError } from './errors.js';
import { readBearerToken, sendJson } from './http.js';
import { RateLimiter } from './rate-limit.js';

const database = new UsageDatabase(config.databasePath);
const rateLimiter = new RateLimiter(config.rateLimitWindowMs, config.rateLimitMaxRequests);

const requestIp = (request) => request.socket.remoteAddress ?? 'unknown';

const usageResponse = (key, range) => {
  const keyRecord = database.lookupActiveKey(key);
  const usage = database.getUsage(key, range);

  return {
    range: { from: range.from, to: range.to, timezone: 'UTC' },
    key: {
      id: keyRecord.id,
      name: keyRecord.name ?? null,
      machineId: keyRecord.machineId ?? null,
      status: 'active',
      createdAt: keyRecord.createdAt,
    },
    summary: {
      requests: usage.requests,
      successfulRequests: usage.successfulRequests,
      failedRequests: usage.failedRequests,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      cost: usage.cost,
    },
    daily: usage.daily,
  };
};

const server = http.createServer((request, response) => {
  const corsHeaders = getCorsHeaders(request, config.allowedOrigins);

  try {
    if (handlePreflight(request, response, config.allowedOrigins)) return;

    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true }, corsHeaders);
      return;
    }

    if (request.method !== 'GET' || url.pathname !== '/api/key/usage') {
      throw new HttpError(404, 'not_found', 'Endpoint not found.');
    }

    if (request.headers.origin && !corsHeaders['Access-Control-Allow-Origin']) {
      throw new HttpError(403, 'origin_not_allowed', 'Origin is not allowed.');
    }

    const key = readBearerToken(request.headers.authorization);
    if (!key || key.length > 512) {
      throw new HttpError(401, 'invalid_api_key', 'The API key is invalid or inactive.');
    }

    rateLimiter.check(`${requestIp(request)}:${key}`);
    const range = getDateRange(url.searchParams, config.maxRangeDays);
    sendJson(response, 200, usageResponse(key, range), corsHeaders);
  } catch (error) {
    const httpError = error instanceof HttpError ? error : new HttpError(503, 'service_unavailable', 'Usage data is temporarily unavailable.');
    sendJson(response, httpError.status, { error: { code: httpError.code, message: httpError.message } }, corsHeaders);
  }
});

server.listen(config.port, config.host, () => {
  console.log(`9Router usage helper listening on http://${config.host}:${config.port}`);
});

const close = () => {
  server.close(() => {
    database.close();
    process.exit(0);
  });
};

process.once('SIGINT', close);
process.once('SIGTERM', close);
