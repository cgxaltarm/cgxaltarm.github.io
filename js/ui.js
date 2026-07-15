export function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", {
    notation: Number(value) >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Math.round(Number(value) || 0));
}

export function renderHeader(usage, mode) {
  document.getElementById("sourceMode").textContent = mode === "live" ? "Live · tersanitasi" : "Demo lokal";
  document.getElementById("updatedAt").textContent = new Date(usage.updatedAt || Date.now()).toLocaleTimeString("id-ID");

  const dot = document.getElementById("systemDot");
  const label = document.getElementById("systemLabel");

  dot.className = `status-dot ${mode === "live" ? "active" : "slow"}`;
  label.textContent = mode === "live" ? "9Router online" : "Endpoint belum aktif";
}

export function renderKpis(usage) {
  const activeProviders = usage.providers.filter((provider) => provider.status === "active").length;
  const totalModels = usage.providers.reduce((sum, provider) => sum + provider.models.length, 0);
  const totalProviderRequests = usage.providers.reduce((sum, provider) => sum + provider.requests, 0);
  const averageLatency = usage.providers.length
    ? Math.round(usage.providers.reduce((sum, provider) => sum + provider.latency, 0) / usage.providers.length)
    : 0;

  document.getElementById("kpiRequests").textContent = formatNumber(usage.requests);
  document.getElementById("kpiRequestTrend").textContent =
    totalProviderRequests > 0 ? `${formatNumber(totalProviderRequests)} request terdistribusi` : "Belum ada data";

  document.getElementById("kpiTokens").textContent = formatNumber(usage.totalTokens);
  document.getElementById("kpiTokenSplit").textContent =
    `Input ${formatNumber(usage.inputTokens)} · Output ${formatNumber(usage.outputTokens)}`;

  document.getElementById("kpiLatency").textContent = `${averageLatency} ms`;
  document.getElementById("kpiLatencyState").textContent =
    averageLatency >= 1200 ? "Lambat" : averageLatency > 0 ? "Normal" : "Belum ada data";

  document.getElementById("kpiProviders").textContent = `${activeProviders} / ${usage.providers.length}`;
  document.getElementById("kpiModelCount").textContent = `${totalModels} model terdeteksi`;
}

export function renderProviderDetail(provider, usage) {
  if (!provider) {
    document.getElementById("detailProviderName").textContent = "DailyFlow";
    document.getElementById("detailProviderStatus").textContent = "Routing center";
    document.getElementById("detailBadge").textContent = "Core";
    document.getElementById("detailRequests").textContent = formatNumber(usage.requests);
    document.getElementById("detailTokens").textContent = formatNumber(usage.totalTokens);
    document.getElementById("detailLatency").textContent = "—";
    document.getElementById("detailError").textContent = "—";
    document.getElementById("detailModelCount").textContent =
      `${usage.providers.reduce((sum, item) => sum + item.models.length, 0)} model`;
    document.getElementById("modelList").innerHTML =
      `<div class="model-item"><strong>Pilih provider</strong><small>Model akan ditampilkan berdasarkan provider yang dipilih.</small></div>`;
    return;
  }

  document.getElementById("detailProviderName").textContent = provider.name;
  document.getElementById("detailProviderStatus").textContent = provider.status;
  document.getElementById("detailBadge").textContent = provider.status;
  document.getElementById("detailRequests").textContent = formatNumber(provider.requests);
  document.getElementById("detailTokens").textContent = formatNumber(provider.totalTokens);
  document.getElementById("detailLatency").textContent = `${provider.latency} ms`;
  document.getElementById("detailError").textContent = `${provider.errorRate}%`;
  document.getElementById("detailModelCount").textContent = `${provider.models.length} model`;

  const list = document.getElementById("modelList");
  list.innerHTML = provider.models.length
    ? provider.models
        .map(
          (model) => `
            <div class="model-item">
              <strong>${escapeHtml(model.name)}</strong>
              <small>
                ${formatNumber(model.requests)} request ·
                ${formatNumber(model.totalTokens)} token ·
                ${model.latency} ms ·
                ${model.errorRate}% error
              </small>
            </div>
          `
        )
        .join("")
    : `<div class="model-item"><strong>Belum ada model</strong><small>Model muncul setelah digunakan melalui proxy.</small></div>`;
}

export function renderActivity(recent) {
  const list = document.getElementById("activityList");

  list.innerHTML = recent.length
    ? recent
        .slice(0, 14)
        .map(
          (item) => `
            <div class="activity-item">
              <span class="status-dot ${Number(item.status) >= 500 ? "offline" : Number(item.latencyMs) >= 1200 ? "slow" : "active"}"></span>
              <div>
                <p><strong>${escapeHtml(item.provider || "Provider")}</strong> · ${escapeHtml(item.model || "Model")}</p>
                <small>${formatNumber(item.total || 0)} token · ${Number(item.latencyMs || 0)} ms · HTTP ${escapeHtml(item.status || "—")}</small>
              </div>
              <small>${new Date(item.time || Date.now()).toLocaleTimeString("id-ID")}</small>
            </div>
          `
        )
        .join("")
    : `<div class="activity-item"><span class="status-dot idle"></span><div><p>Belum ada aktivitas</p><small>Request akan tampil setelah melewati proxy.</small></div><small>—</small></div>`;
}

export function initTheme() {
  const button = document.getElementById("themeButton");

  if (localStorage.getItem("dailyflow-theme") === "light") {
    document.body.classList.add("light");
    button.textContent = "🌙";
  }

  button.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const light = document.body.classList.contains("light");
    localStorage.setItem("dailyflow-theme", light ? "light" : "dark");
    button.textContent = light ? "🌙" : "☀️";
    window.dispatchEvent(new Event("resize"));
  });
}

export function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[character]));
}
