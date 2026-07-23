import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDateRange } from '../src/dates.js';
import { HttpError } from '../src/errors.js';

const rangeFor = (from, to) => getDateRange(new URLSearchParams({ from, to }), 90);

const expectRangeError = (from, to) => {
  assert.throws(
    () => rangeFor(from, to),
    (error) => error instanceof HttpError && error.status === 400 && error.code === 'invalid_date_range',
  );
};

describe('getDateRange', () => {
  it('returns an inclusive UTC range with an exclusive end', () => {
    assert.deepEqual(rangeFor('2026-07-01', '2026-07-03'), {
      from: '2026-07-01',
      to: '2026-07-03',
      start: '2026-07-01T00:00:00.000Z',
      endExclusive: '2026-07-04T00:00:00.000Z',
    });
  });

  it('rejects malformed and non-calendar dates', () => {
    expectRangeError('2026/07/01', '2026-07-03');
    expectRangeError('2026-02-29', '2026-03-01');
  });

  it('rejects inverted date ranges', () => {
    expectRangeError('2026-07-04', '2026-07-03');
  });

  it('rejects dates beyond the configured maximum range', () => {
    assert.throws(
      () => getDateRange(new URLSearchParams({ from: '2026-01-01', to: '2026-04-01' }), 90),
      (error) => error instanceof HttpError && error.status === 400 && error.code === 'invalid_date_range',
    );
  });
});
