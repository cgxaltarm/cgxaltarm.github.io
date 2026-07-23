import { sendJson } from './http.js';

export const getCorsHeaders = (request, allowedOrigins) => {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

export const handlePreflight = (request, response, allowedOrigins) => {
  if (request.method !== 'OPTIONS') return false;

  const headers = getCorsHeaders(request, allowedOrigins);
  if (!headers['Access-Control-Allow-Origin']) {
    sendJson(response, 403, { error: { code: 'origin_not_allowed', message: 'Origin is not allowed.' } });
    return true;
  }

  response.writeHead(204, headers);
  response.end();
  return true;
};
