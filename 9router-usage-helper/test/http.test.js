import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readBearerToken } from '../src/http.js';

describe('readBearerToken', () => {
  it('parses a valid bearer header', () => {
    assert.equal(readBearerToken('Bearer sk-abc123'), 'sk-abc123');
  });

  it('returns null for missing header', () => {
    assert.equal(readBearerToken(undefined), null);
    assert.equal(readBearerToken(null), null);
  });

  it('returns null for non-bearer scheme', () => {
    assert.equal(readBearerToken('Basic abc123'), null);
  });

  it('trims whitespace', () => {
    assert.equal(readBearerToken('  Bearer   sk-xyz  '), 'sk-xyz');
  });

  it('returns null for empty bearer value', () => {
    assert.equal(readBearerToken('Bearer '), null);
    assert.equal(readBearerToken('Bearer'), null);
  });
});
