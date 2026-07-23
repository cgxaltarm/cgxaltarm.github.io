import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCorsHeaders, handlePreflight } from '../src/cors.js';

describe('getCorsHeaders', () => {
  it('returns empty headers when origin is missing', () => {
    assert.deepEqual(getCorsHeaders({ headers: {} }, new Set(['https://username.github.io'])), {});
  });

  it('returns empty headers when origin is not allowed', () => {
    assert.deepEqual(getCorsHeaders({ headers: { origin: 'https://malicious.com' } }, new Set(['https://username.github.io'])), {});
  });

  it('returns CORS headers when origin is allowed', () => {
    const allowed = new Set(['https://username.github.io']);
    const headers = getCorsHeaders({ headers: { origin: 'https://username.github.io' } }, allowed);
    assert.equal(headers['Access-Control-Allow-Origin'], 'https://username.github.io');
    assert.equal(headers['Access-Control-Allow-Methods'], 'GET, OPTIONS');
  });
});
