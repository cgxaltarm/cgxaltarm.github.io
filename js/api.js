export const PUBLIC_STATS_ENDPOINT = "https://router.dailyflo.me/public-usage";

const sensitivePattern =
  /(api.?key|access.?token|refresh.?token|authorization|secret|password|credential|cookie|prompt|message|content)/i;

export function sanitize(value, depth = 0) {
  if (depth > 7) return null;

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1)).filter((item) => item !== null);
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      if (sensitivePattern.test(key)) continue;
      output[key] = sanitize(item, depth + 1);
    }
    return output;
  }

  return value;
}

export async function fetchUsage() {
  const response = await fetch(PUBLIC_STATS_ENDPOINT, {
    cache: "no-store",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const safe = sanitize(await response.json());
  if (!safe || typeof safe !== "object") {
    throw new Error("Format statistik tidak valid");
  }

  return normalizeUsage(safe);
}

function normalizeUsage(data) {
  return {
    totalTokens: Number(data.totalTokens || 0),
    inputTokens: Number(data.inputTokens || 0),
    outputTokens: Number(data.outputTokens || 0),
    requests: Number(data.requests || 0),
    successes: Number(data.successes || 0),
    failures: Number(data.failures || 0),
    updatedAt: data.updatedAt || new Date().toISOString(),
    providers: Array.isArray(data.providers)
      ? data.providers.map((provider) => ({
          name: String(provider.name || "Provider"),
          status: normalizeStatus(provider.status),
          requests: Number(provider.requests || 0),
          successes: Number(provider.successes || 0),
          failures: Number(provider.failures || 0),
          inputTokens: Number(provider.inputTokens || 0),
          outputTokens: Number(provider.outputTokens || 0),
          totalTokens: Number(provider.totalTokens || 0),
          latency: Number(provider.latency || 0),
          errorRate: Number(provider.errorRate || 0),
          models: Array.isArray(provider.models)
            ? provider.models.map((model) => ({
                name: String(model.name || "Model"),
                requests: Number(model.requests || 0),
                totalTokens: Number(model.totalTokens || 0),
                latency: Number(model.latency || 0),
                errorRate: Number(model.errorRate || 0),
              }))
            : [],
        }))
      : [],
    history: Array.isArray(data.history) ? data.history : [],
    recent: Array.isArray(data.recent) ? data.recent : [],
  };
}

function normalizeStatus(status) {
  const value = String(status || "idle").toLowerCase();
  return ["active", "slow", "offline", "idle"].includes(value) ? value : "idle";
}

export function demoUsage() {
  const now = Date.now();
  const providers = [
    {
      name: "Anthropic",
      status: "active",
      requests: 1520,
      successes: 1505,
      failures: 15,
      inputTokens: 320000,
      outputTokens: 200000,
      totalTokens: 520000,
      latency: 420,
      errorRate: 0.99,
      models: [
        { name: "Claude Sonnet", requests: 1060, totalTokens: 360000, latency: 405, errorRate: 0.8 },
        { name: "Claude Haiku", requests: 460, totalTokens: 160000, latency: 290, errorRate: 1.1 },
      ],
    },
    {
      name: "Google",
      status: "idle",
      requests: 1280,
      successes: 1268,
      failures: 12,
      inputTokens: 245000,
      outputTokens: 141000,
      totalTokens: 386000,
      latency: 310,
      errorRate: 0.94,
      models: [
        { name: "Gemini Flash", requests: 910, totalTokens: 280000, latency: 270, errorRate: 0.7 },
        { name: "Gemini Pro", requests: 370, totalTokens: 106000, latency: 510, errorRate: 1.4 },
      ],
    },
    {
      name: "OpenAI",
      status: "idle",
      requests: 980,
      successes: 957,
      failures: 23,
      inputTokens: 221000,
      outputTokens: 121000,
      totalTokens: 342000,
      latency: 560,
      errorRate: 2.35,
      models: [
        { name: "GPT", requests: 740, totalTokens: 260000, latency: 530, errorRate: 2.1 },
        { name: "o-series", requests: 240, totalTokens: 82000, latency: 710, errorRate: 3.1 },
      ],
    },
    {
      name: "DeepSeek",
      status: "slow",
      requests: 530,
      successes: 501,
      failures: 29,
      inputTokens: 76000,
      outputTokens: 36000,
      totalTokens: 112000,
      latency: 1280,
      errorRate: 5.47,
      models: [
        { name: "DeepSeek Chat", requests: 530, totalTokens: 112000, latency: 1280, errorRate: 5.47 },
      ],
    },
    {
      name: "Mistral",
      status: "idle",
      requests: 310,
      successes: 304,
      failures: 6,
      inputTokens: 52000,
      outputTokens: 26000,
      totalTokens: 78000,
      latency: 470,
      errorRate: 1.94,
      models: [
        { name: "Mistral Large", requests: 310, totalTokens: 78000, latency: 470, errorRate: 1.94 },
      ],
    },
  ];

  const history = Array.from({ length: 24 }, (_, index) => ({
    time: new Date(now - (23 - index) * 60000).toISOString(),
    input: Math.round(1800 + Math.random() * 3200),
    output: Math.round(800 + Math.random() * 1900),
    total: 0,
  })).map((row) => ({ ...row, total: row.input + row.output }));

  return {
    totalTokens: providers.reduce((sum, provider) => sum + provider.totalTokens, 0),
    inputTokens: providers.reduce((sum, provider) => sum + provider.inputTokens, 0),
    outputTokens: providers.reduce((sum, provider) => sum + provider.outputTokens, 0),
    requests: providers.reduce((sum, provider) => sum + provider.requests, 0),
    successes: providers.reduce((sum, provider) => sum + provider.successes, 0),
    failures: providers.reduce((sum, provider) => sum + provider.failures, 0),
    updatedAt: new Date().toISOString(),
    providers,
    history,
    recent: [
      { provider: "Anthropic", model: "Claude Sonnet", total: 1880, latencyMs: 420, status: 200, time: new Date().toISOString() },
      { provider: "Google", model: "Gemini Flash", total: 940, latencyMs: 285, status: 200, time: new Date(now - 9000).toISOString() },
      { provider: "DeepSeek", model: "DeepSeek Chat", total: 1320, latencyMs: 1380, status: 200, time: new Date(now - 17000).toISOString() },
    ],
  };
}
