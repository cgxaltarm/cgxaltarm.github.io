import { DatabaseSync } from 'node:sqlite';
import { HttpError } from './errors.js';

const numeric = (value) => Number(value ?? 0);

export class UsageDatabase {
  constructor(databasePath) {
    this.database = new DatabaseSync(databasePath, { readOnly: true, allowExtension: false });
  }

  lookupActiveKey(key) {
    const row = this.database
      .prepare('SELECT id, name, machineId, isActive, createdAt FROM apiKeys WHERE key = ? LIMIT 1')
      .get(key);

    if (!row || row.isActive !== 1) {
      throw new HttpError(401, 'invalid_api_key', 'The API key is invalid or inactive.');
    }

    return row;
  }

  getUsage(key, range) {
    const summary = this.database
      .prepare(`
        SELECT
          COUNT(*) AS requests,
          SUM(CASE WHEN status BETWEEN '200' AND '299' THEN 1 ELSE 0 END) AS successfulRequests,
          SUM(CASE WHEN status NOT BETWEEN '200' AND '299' THEN 1 ELSE 0 END) AS failedRequests,
          SUM(promptTokens) AS promptTokens,
          SUM(completionTokens) AS completionTokens,
          SUM(cost) AS cost
        FROM usageHistory
        WHERE apiKey = ? AND timestamp >= ? AND timestamp < ?
      `)
      .get(key, range.start, range.endExclusive);

    const daily = this.database
      .prepare(`
        SELECT
          substr(timestamp, 1, 10) AS date,
          COUNT(*) AS requests,
          SUM(promptTokens) AS promptTokens,
          SUM(completionTokens) AS completionTokens,
          SUM(cost) AS cost
        FROM usageHistory
        WHERE apiKey = ? AND timestamp >= ? AND timestamp < ?
        GROUP BY substr(timestamp, 1, 10)
        ORDER BY date ASC
      `)
      .all(key, range.start, range.endExclusive)
      .map((row) => ({
        date: row.date,
        requests: numeric(row.requests),
        promptTokens: numeric(row.promptTokens),
        completionTokens: numeric(row.completionTokens),
        totalTokens: numeric(row.promptTokens) + numeric(row.completionTokens),
        cost: numeric(row.cost),
      }));

    const promptTokens = numeric(summary.promptTokens);
    const completionTokens = numeric(summary.completionTokens);
    const requests = numeric(summary.requests);

    return {
      requests,
      successfulRequests: numeric(summary.successfulRequests),
      failedRequests: numeric(summary.failedRequests),
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: numeric(summary.cost),
      daily,
    };
  }

  close() {
    this.database.close();
  }
}
