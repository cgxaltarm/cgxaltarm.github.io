import { HttpError } from './errors.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const parseDate = (value, field) => {
  if (!DATE_PATTERN.test(value)) {
    throw new HttpError(400, 'invalid_date_range', `${field} must be YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, 'invalid_date_range', `${field} must be a valid calendar date.`);
  }

  return date;
};

export const getDateRange = (searchParams, maxRangeDays) => {
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getTime() - 29 * DAY_MS).toISOString().slice(0, 10);
  const from = searchParams.get('from') ?? defaultFrom;
  const to = searchParams.get('to') ?? defaultTo;
  const fromDate = parseDate(from, 'from');
  const toDate = parseDate(to, 'to');

  if (fromDate > toDate || (toDate.getTime() - fromDate.getTime()) / DAY_MS + 1 > maxRangeDays) {
    throw new HttpError(400, 'invalid_date_range', `Date range must be between 1 and ${maxRangeDays} days.`);
  }

  const endExclusive = new Date(toDate.getTime() + DAY_MS).toISOString();
  return { from, to, start: fromDate.toISOString(), endExclusive };
};
