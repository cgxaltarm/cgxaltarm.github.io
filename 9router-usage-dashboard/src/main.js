const elements = {
  credentialInput: document.querySelector('#api-key-input'),
  backendUrl: document.querySelector('#backend-url-input'),
  loadButton: document.querySelector('#load-btn'),
  logoutButton: document.querySelector('#logout-btn'),
  rangeSelect: document.querySelector('#range-select'),
  authSection: document.querySelector('#auth-section'),
  dashboard: document.querySelector('#dashboard-content'),
  keyStatus: document.querySelector('#key-status-container'),
  keyName: document.querySelector('#key-name-display'),
  rangeDisplay: document.querySelector('#range-display'),
  cost: document.querySelector('#val-cost'),
  averageCost: document.querySelector('#val-avg-cost-daily'),
  requests: document.querySelector('#val-requests'),
  successRate: document.querySelector('#val-success-rate'),
  tokens: document.querySelector('#val-tokens'),
  tokenSplit: document.querySelector('#val-token-split'),
  progressValue: document.querySelector('#progress-value'),
  progressDetail: document.querySelector('#progress-detail'),
  progressFill: document.querySelector('#progress-fill'),
  progressTrack: document.querySelector('.progress-track'),
  chart: document.querySelector('#chart-parent'),
  tooltip: document.querySelector('#chart-tooltip'),
};

let activeCredential = '';
let backendUrl = '';
let dailyData = [];

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const exactNumberFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const formatTokens = (value) => numberFormatter.format(Number(value ?? 0));
const formatCurrency = (value) => currencyFormatter.format(Number(value ?? 0));

const dateRange = (days) => {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - Number(days) + 1);

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

const formatDate = (value) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${value}T00:00:00Z`));

const renderChart = (daily) => {
  dailyData = daily;
  if (!daily.length) {
    elements.chart.innerHTML = '<p class="empty-state">No usage data is available for this period.</p>';
    return;
  }

  const width = 960;
  const height = 320;
  const padding = { top: 20, right: 24, bottom: 52, left: 64 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxTokens = Math.max(...daily.map((day) => Number(day.totalTokens)), 1);
  const roundedMax = Math.ceil(maxTokens / 1_000) * 1_000 || 1;
  const step = plotWidth / daily.length;
  const barWidth = Math.min(36, Math.max(10, step - 6));
  const ticks = 4;
  const horizontalGrid = Array.from({ length: ticks + 1 }, (_, index) => {
    const value = (roundedMax / ticks) * index;
    const y = padding.top + plotHeight - (value / roundedMax) * plotHeight;
    return `<g><line class="chart-grid" x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}"/><text class="chart-axis-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${formatTokens(value)}</text></g>`;
  }).join('');

  const bars = daily.map((day, index) => {
    const tokens = Number(day.totalTokens);
    const barHeight = Math.max((tokens / roundedMax) * plotHeight, 1);
    const x = padding.left + index * step + (step - barWidth) / 2;
    const y = padding.top + plotHeight - barHeight;
    const r = Math.min(4, barHeight / 2);
    const labelVisible = daily.length <= 10 || index === 0 || index === daily.length - 1 || index % 5 === 0;
    const label = labelVisible
      ? `<text class="chart-axis-label" x="${x + barWidth / 2}" y="${height - 24}" text-anchor="middle">${formatDate(day.date)}</text>`
      : '';
    // 4px rounded top, square baseline — use a path instead of rect
    const barPath = `M${x},${padding.top + plotHeight} V${y + r} Q${x},${y} ${x + r},${y} H${x + barWidth - r} Q${x + barWidth},${y} ${x + barWidth},${y + r} V${padding.top + plotHeight} Z`;
    return `<g class="bar-group" tabindex="0" role="img" aria-label="${formatDate(day.date)}: ${exactNumberFormatter.format(tokens)} tokens, ${formatCurrency(day.cost)}" data-index="${index}"><path class="chart-bar" d="${barPath}"/><rect class="bar-hit" x="${x - 2}" y="${y}" width="${barWidth + 4}" height="${barHeight}" fill="transparent"/><title>${formatDate(day.date)}\n${exactNumberFormatter.format(tokens)} tokens\n${formatCurrency(day.cost)}</title></g>${label}`;
  }).join('');

  const tableRows = daily.map((day) => `<tr><td>${formatDate(day.date)}</td><td>${exactNumberFormatter.format(day.requests)}</td><td>${exactNumberFormatter.format(day.totalTokens)}</td><td>${formatCurrency(day.cost)}</td></tr>`).join('');

  elements.chart.innerHTML = `
    <div class="chart-scroll">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="daily-chart-title daily-chart-desc" preserveAspectRatio="none">
        <title id="daily-chart-title">Daily token usage</title>
        <desc id="daily-chart-desc">Bar chart of the total tokens used each day. Hover or focus a bar for detailed values.</desc>
        ${horizontalGrid}
        <line class="chart-axis" x1="${padding.left}" x2="${width - padding.right}" y1="${padding.top + plotHeight}" y2="${padding.top + plotHeight}"/>
        ${bars}
      </svg>
    </div>
    <details class="chart-table">
      <summary>View daily usage data as a table</summary>
      <div class="table-scroll"><table><thead><tr><th>Date</th><th>Requests</th><th>Tokens</th><th>Cost</th></tr></thead><tbody>${tableRows}</tbody></table></div>
    </details>`;

  // Tooltip interaction events
  const barGroups = elements.chart.querySelectorAll('.bar-group');
  const showTooltip = (event, target) => {
    const idx = Number(target.getAttribute('data-index'));
    const day = dailyData[idx];
    if (!day) return;

    // Build tooltip DOM securely
    elements.tooltip.innerHTML = '';
    const dateDiv = document.createElement('div');
    dateDiv.className = 'tooltip-date';
    dateDiv.textContent = formatDate(day.date);
    elements.tooltip.append(dateDiv);

    const tokenRow = document.createElement('div');
    tokenRow.className = 'tooltip-row';
    const tokenKey = document.createElement('span');
    tokenKey.className = 'tooltip-key';
    const tokenValue = document.createElement('span');
    tokenValue.className = 'tooltip-value';
    tokenValue.textContent = exactNumberFormatter.format(day.totalTokens);
    const tokenLabel = document.createElement('span');
    tokenLabel.className = 'tooltip-label';
    tokenLabel.textContent = ' tokens';
    tokenRow.append(tokenKey, tokenValue, tokenLabel);

    const costRow = document.createElement('div');
    costRow.className = 'tooltip-row';
    costRow.style.marginTop = '0.125rem';
    const costValue = document.createElement('span');
    costValue.className = 'tooltip-value';
    costValue.textContent = formatCurrency(day.cost);
    const costLabel = document.createElement('span');
    costLabel.className = 'tooltip-label';
    costLabel.textContent = ' cost';
    costRow.append(costValue, costLabel);

    elements.tooltip.append(tokenRow, costRow);
    elements.tooltip.classList.remove('hidden');
    elements.tooltip.setAttribute('aria-hidden', 'false');

    // Positioning
    const chartRect = elements.chart.getBoundingClientRect();
    const barRect = target.querySelector('.chart-bar').getBoundingClientRect();
    const tooltipX = barRect.left + barRect.width / 2 - chartRect.left;
    const tooltipY = barRect.top - chartRect.top - 8;

    elements.tooltip.style.left = `${tooltipX}px`;
    elements.tooltip.style.top = `${tooltipY}px`;
  };

  const hideTooltip = () => {
    elements.tooltip.classList.add('hidden');
    elements.tooltip.setAttribute('aria-hidden', 'true');
  };

  barGroups.forEach((group) => {
    group.addEventListener('mouseenter', (e) => showTooltip(e, group));
    group.addEventListener('focus', (e) => showTooltip(e, group));
    group.addEventListener('mouseleave', hideTooltip);
    group.addEventListener('blur', hideTooltip);
  });
};

const renderDashboard = (data) => {
  const days = Math.max(data.daily.length, 1);
  const summary = data.summary;
  const successRate = summary.requests === 0 ? 0 : Math.round((summary.successfulRequests / summary.requests) * 100);

  elements.keyName.textContent = data.key.name || `Key ${data.key.id}`;
  elements.rangeDisplay.textContent = `${formatDate(data.range.from)} – ${formatDate(data.range.to)} · UTC`;
  elements.cost.textContent = formatCurrency(summary.cost);
  elements.averageCost.textContent = `Daily average: ${formatCurrency(summary.cost / days)}`;
  elements.requests.textContent = exactNumberFormatter.format(summary.requests);
  elements.successRate.textContent = `Success: ${successRate}% (${exactNumberFormatter.format(summary.successfulRequests)} of ${exactNumberFormatter.format(summary.requests)})`;
  elements.tokens.textContent = formatTokens(summary.totalTokens);
  elements.tokenSplit.textContent = `${formatTokens(summary.promptTokens)} prompt · ${formatTokens(summary.completionTokens)} completion`;

  // Progress bar — status color by rate
  elements.progressValue.textContent = `${successRate}%`;
  elements.progressDetail.textContent = `${exactNumberFormatter.format(summary.successfulRequests)} of ${exactNumberFormatter.format(summary.requests)} requests completed successfully`;
  elements.progressFill.style.width = `${successRate}%`;
  elements.progressTrack.setAttribute('aria-valuenow', String(successRate));

  // Color the fill by severity thresholds (status palette)
  let fillColor;
  if (successRate >= 95) fillColor = 'var(--status-good)';
  else if (successRate >= 80) fillColor = 'var(--status-warning)';
  else if (successRate >= 50) fillColor = 'var(--status-serious)';
  else fillColor = 'var(--status-critical)';
  elements.progressFill.style.backgroundColor = fillColor;

  renderChart(data.daily);

  elements.authSection.classList.add('hidden');
  elements.dashboard.classList.remove('hidden');
  elements.dashboard.style.opacity = '';
  elements.keyStatus.classList.remove('hidden');
};

const setLoading = (isLoading) => {
  elements.loadButton.disabled = isLoading;
  elements.loadButton.textContent = isLoading ? 'Loading…' : 'Load Usage';
};

const showError = (message) => {
  const existing = document.querySelector('#error-message');
  if (existing) existing.remove();

  const error = document.createElement('p');
  error.id = 'error-message';
  error.className = 'form-error';
  error.textContent = message;
  elements.authSection.append(error);
};

const loadUsage = async () => {
  const suppliedKey = elements.credentialInput.value.trim() || activeCredential;
  const suppliedUrl = elements.backendUrl.value.trim().replace(/\/$/, '') || backendUrl;

  if (!suppliedKey) {
    showError('Enter an API key to load usage.');
    elements.credentialInput.focus();
    return;
  }

  try {
    const target = new URL(suppliedUrl);
    if (!['http:', 'https:'].includes(target.protocol)) throw new TypeError();
  } catch {
    showError('Enter a valid HTTP or HTTPS API Helper URL.');
    elements.backendUrl.focus();
    return;
  }

  const { from, to } = dateRange(elements.rangeSelect.value);
  setLoading(true);
  document.querySelector('#error-message')?.remove();

  // Keep frame visible at reduced opacity while refetching (dataviz: no flash/skeleton)
  if (!elements.dashboard.classList.contains('hidden')) {
    elements.dashboard.style.opacity = '0.5';
  }

  try {
    const response = await fetch(`${suppliedUrl}/api/key/usage?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${suppliedKey}` },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error?.message || `Request failed with status ${response.status}.`);
    }

    activeCredential = suppliedKey;
    backendUrl = suppliedUrl;
    elements.credentialInput.value = '';
    renderDashboard(payload);
  } catch (error) {
    elements.dashboard.style.opacity = '';
    showError(error instanceof Error ? error.message : 'Unable to load usage data.');
  } finally {
    setLoading(false);
  }
};

const clearKey = () => {
  activeCredential = '';
  backendUrl = '';
  elements.dashboard.classList.add('hidden');
  elements.keyStatus.classList.add('hidden');
  elements.authSection.classList.remove('hidden');
  elements.credentialInput.value = '';
  elements.credentialInput.focus();
};

elements.loadButton.addEventListener('click', loadUsage);
elements.credentialInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loadUsage();
});
elements.logoutButton.addEventListener('click', clearKey);
elements.rangeSelect.addEventListener('change', () => {
  if (activeCredential && backendUrl) loadUsage();
});
