const API_BASE = 'https://api.dailyflo.me';

const elements = {
  connectionPill: document.querySelector('#connection-pill'),
  connectionLabel: document.querySelector('#connection-label'),
  periodControl: document.querySelector('#period-control'),
  refreshSelect: document.querySelector('#refresh-select'),
  cost: document.querySelector('#total-cost'),
  costNote: document.querySelector('#cost-note'),
  tokens: document.querySelector('#total-tokens'),
  tokenNote: document.querySelector('#token-note'),
  cached: document.querySelector('#cached-tokens'),
  cacheNote: document.querySelector('#cache-note'),
  connectionPanel: document.querySelector('#connection-panel'),
  connectionSymbol: document.querySelector('#connection-symbol'),
  connectionEyebrow: document.querySelector('#connection-eyebrow'),
  connectionTitle: document.querySelector('#connection-title'),
  connectionMessage: document.querySelector('#connection-message'),
  loginForm: document.querySelector('#login-form'),
  password: document.querySelector('#password-input'),
  loginButton: document.querySelector('#login-button'),
  blockedActions: document.querySelector('#blocked-actions'),
  retryButton: document.querySelector('#retry-button'),
  formError: document.querySelector('#form-error'),
  setupDetails: document.querySelector('#setup-details'),
  syncDot: document.querySelector('#sync-dot'),
  syncNote: document.querySelector('#sync-note'),
  staleBanner: document.querySelector('#stale-banner'),
  staleRetry: document.querySelector('#stale-retry'),
  tableWrap: document.querySelector('#model-table-wrap'),
  tableBody: document.querySelector('#model-table-body'),
  emptyState: document.querySelector('#empty-state'),
};

const integerFormatter = new Intl.NumberFormat('id-ID');
const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 2,
});
const dollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let period = 'today';
let refreshTimer;
let lastStats;

const setHidden = (element, hidden) => element.classList.toggle('hidden', hidden);

const isUsageStats = (value) => value
  && typeof value === 'object'
  && typeof value.totalCost === 'number'
  && typeof value.totalPromptTokens === 'number'
  && typeof value.totalCompletionTokens === 'number'
  && value.byModel
  && typeof value.byModel === 'object';

const totalTokens = (model) => model.promptTokens + model.completionTokens;

const aggregateModels = (byModel) => {
  const grouped = new Map();

  Object.entries(byModel).forEach(([key, usage]) => {
    const name = usage.rawModel?.trim() || key.replace(/\s\([^)]*\)$/, '');
    const current = grouped.get(name) || {
      name,
      providers: [],
      promptTokens: 0,
      completionTokens: 0,
      cachedTokens: 0,
      cost: 0,
      lastUsed: undefined,
    };

    if (usage.provider && !current.providers.includes(usage.provider)) {
      current.providers.push(usage.provider);
    }
    current.promptTokens += Number(usage.promptTokens || 0);
    current.completionTokens += Number(usage.completionTokens || 0);
    current.cachedTokens += Number(usage.cachedTokens || 0);
    current.cost += Number(usage.cost || 0);

    if (usage.lastUsed && (!current.lastUsed || Date.parse(usage.lastUsed) > Date.parse(current.lastUsed))) {
      current.lastUsed = usage.lastUsed;
    }
    grouped.set(name, current);
  });

  return [...grouped.values()].sort((a, b) => b.cost - a.cost || totalTokens(b) - totalTokens(a));
};

const formatRelativeTime = (value) => {
  if (!value) return '—';
  const minutes = Math.floor(Math.max(0, Date.now() - Date.parse(value)) / 60_000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
};

const setStatus = (status, label) => {
  elements.connectionPill.dataset.status = status;
  elements.connectionLabel.textContent = label;
  elements.syncDot.dataset.status = status;
};

const setConnectionView = (view, message = '') => {
  setHidden(elements.connectionPanel, view === 'live' || view === 'stale');
  setHidden(elements.loginForm, view !== 'auth' && view !== 'connecting');
  setHidden(elements.blockedActions, view !== 'blocked');
  setHidden(elements.setupDetails, view !== 'blocked');
  setHidden(elements.formError, !message);
  elements.formError.textContent = message;

  if (view === 'checking') {
    setStatus('checking', 'Menghubungkan');
    elements.connectionSymbol.textContent = '↗';
    elements.connectionEyebrow.textContent = 'MEMERIKSA KONEKSI';
    elements.connectionTitle.textContent = 'Menghubungkan ke DailyFlo…';
    elements.connectionMessage.textContent = 'Situs sedang memastikan API dapat dibaca dari browser ini.';
  } else if (view === 'blocked') {
    setStatus('blocked', 'Akses diblokir');
    elements.connectionSymbol.textContent = '!';
    elements.connectionEyebrow.textContent = 'SATU KONFIGURASI DIPERLUKAN';
    elements.connectionTitle.textContent = 'DailyFlo belum mengizinkan akses dari situs ini.';
    elements.connectionMessage.textContent = 'Browser menahan respons lintas domain karena API belum mengirim header CORS. Password tidak diminta dan tidak ada data yang dikirim dari halaman ini.';
  } else if (view === 'auth' || view === 'connecting') {
    setStatus(view, view === 'connecting' ? 'Menghubungkan' : 'Perlu masuk');
    elements.connectionSymbol.textContent = '↗';
    elements.connectionEyebrow.textContent = 'KONEKSI TERSEDIA';
    elements.connectionTitle.textContent = 'Masuk ke DailyFlo.';
    elements.connectionMessage.textContent = 'Password dikirim langsung ke api.dailyflo.me untuk membuat sesi. Situs ini tidak menyimpan password.';
    elements.loginButton.disabled = view === 'connecting';
    elements.loginButton.textContent = view === 'connecting' ? 'Menghubungkan…' : 'Masuk & mulai';
  } else if (view === 'live') {
    setStatus('live', 'Live');
  } else if (view === 'stale') {
    setStatus('stale', 'Tertunda');
  }
};

const appendText = (parent, tag, text, className) => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
};

const renderModels = (models) => {
  elements.tableBody.replaceChildren();
  const maxTokens = Math.max(...models.map(totalTokens), 1);

  models.forEach((model, index) => {
    const row = document.createElement('tr');
    const modelCell = document.createElement('td');
    const modelWrap = document.createElement('div');
    modelWrap.className = 'model-cell';
    appendText(modelWrap, 'span', String(index + 1).padStart(2, '0'), 'model-rank');
    const identity = document.createElement('div');
    appendText(identity, 'strong', model.name);
    appendText(identity, 'span', model.providers.join(' · ') || 'provider tidak diketahui');
    modelWrap.append(identity);
    modelCell.append(modelWrap);

    const track = document.createElement('div');
    track.className = 'usage-track';
    const fill = document.createElement('span');
    fill.style.width = `${Math.max(2, (totalTokens(model) / maxTokens) * 100)}%`;
    track.append(fill);
    modelCell.append(track);

    const tokenCell = document.createElement('td');
    tokenCell.dataset.label = 'Token';
    appendText(tokenCell, 'strong', compactFormatter.format(totalTokens(model)));
    appendText(tokenCell, 'span', `${compactFormatter.format(model.promptTokens)} in · ${compactFormatter.format(model.completionTokens)} out · ${compactFormatter.format(model.cachedTokens)} cache`);

    const costCell = document.createElement('td');
    costCell.dataset.label = 'Biaya';
    costCell.className = 'cost-cell';
    costCell.textContent = dollarFormatter.format(model.cost);

    const lastCell = document.createElement('td');
    lastCell.dataset.label = 'Terakhir';
    lastCell.textContent = formatRelativeTime(model.lastUsed);

    row.append(modelCell, tokenCell, costCell, lastCell);
    elements.tableBody.append(row);
  });

  setHidden(elements.tableWrap, models.length === 0);
  setHidden(elements.emptyState, models.length > 0);
};

const renderStats = (stats) => {
  lastStats = stats;
  const allTokens = stats.totalPromptTokens + stats.totalCompletionTokens;
  const cachedShare = stats.totalPromptTokens
    ? (stats.totalCachedTokens / stats.totalPromptTokens) * 100
    : 0;

  elements.cost.textContent = dollarFormatter.format(stats.totalCost);
  elements.costNote.textContent = 'Estimasi pada rentang waktu terpilih';
  elements.tokens.textContent = compactFormatter.format(allTokens);
  elements.tokenNote.textContent = `${integerFormatter.format(stats.totalPromptTokens)} input · ${integerFormatter.format(stats.totalCompletionTokens)} output`;
  elements.cached.textContent = compactFormatter.format(stats.totalCachedTokens);
  elements.cacheNote.textContent = `${cachedShare.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari token input`;
  elements.syncNote.textContent = `Sinkron ${new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;
  renderModels(aggregateModels(stats.byModel));
};

const scheduleRefresh = () => {
  window.clearInterval(refreshTimer);
  if (!lastStats) return;
  refreshTimer = window.setInterval(
    () => void loadUsage({ quiet: true }),
    Number(elements.refreshSelect.value) * 1_000,
  );
};

const loadUsage = async ({ quiet = false } = {}) => {
  if (!quiet && !lastStats) setConnectionView('checking');
  setHidden(elements.staleBanner, true);

  try {
    const response = await fetch(`${API_BASE}/api/usage/stats?period=${encodeURIComponent(period)}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      setConnectionView('auth');
      window.clearInterval(refreshTimer);
      return;
    }
    if (!response.ok) throw new Error(`DailyFlo merespons dengan status ${response.status}.`);

    const payload = await response.json();
    if (!isUsageStats(payload)) throw new Error('Format data usage tidak dikenali.');

    renderStats(payload);
    setConnectionView('live');
    scheduleRefresh();
  } catch (error) {
    if (lastStats) {
      setConnectionView('stale');
      setHidden(elements.staleBanner, false);
    } else {
      setConnectionView('blocked');
    }
    window.clearInterval(refreshTimer);
  }
};

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = elements.password.value;
  if (!password) return;
  setConnectionView('connecting');

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Password tidak diterima.');
    if (payload.mustChangePassword) throw new Error('Password perlu diubah melalui dashboard DailyFlo asli.');

    elements.password.value = '';
    await loadUsage();
  } catch (error) {
    setConnectionView('auth', error instanceof Error ? error.message : 'Proses masuk gagal.');
  }
});

elements.periodControl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-period]');
  if (!button || button.dataset.period === period) return;
  period = button.dataset.period;
  elements.periodControl.querySelectorAll('button').forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  void loadUsage();
});

elements.refreshSelect.addEventListener('change', scheduleRefresh);
elements.retryButton.addEventListener('click', () => void loadUsage());
elements.staleRetry.addEventListener('click', () => void loadUsage());

void loadUsage();
