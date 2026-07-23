import crypto from 'node:crypto';
import { HttpError } from './errors.js';

export class RateLimiter {
  #entries = new Map();

  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(identity) {
    const fingerprint = crypto.createHash('sha256').update(identity).digest('hex');
    const now = Date.now();
    const entry = this.#entries.get(fingerprint);

    if (!entry || now >= entry.resetAt) {
      this.#entries.set(fingerprint, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    entry.count += 1;
    if (entry.count > this.maxRequests) {
      throw new HttpError(429, 'rate_limited', 'Too many requests. Try again later.');
    }
  }
}
