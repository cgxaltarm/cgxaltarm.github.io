import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter } from '../src/rate-limit.js';
import { HttpError } from '../src/errors.js';

describe('RateLimiter', () => {
  it('allows requests within the limit', () => {
    const limiter = new RateLimiter(60_000, 3);
    assert.doesNotThrow(() => limiter.check('user-a'));
    assert.doesNotThrow(() => limiter.check('user-a'));
    assert.doesNotThrow(() => limiter.check('user-a'));
  });

  it('throws 429 once the limit is exceeded', () => {
    const limiter = new RateLimiter(60_000, 2);
    limiter.check('user-b');
    limiter.check('user-b');
    assert.throws(
      () => limiter.check('user-b'),
      (error) => error instanceof HttpError && error.status === 429,
    );
  });

  it('tracks separate identities independently', () => {
    const limiter = new RateLimiter(60_000, 1);
    assert.doesNotThrow(() => limiter.check('user-c'));
    assert.doesNotThrow(() => limiter.check('user-d'));
  });
});
