import { fetchUsage, demoUsage } from "./api.js";
import { initTopology, renderTopology } from "./topology.js";
import { renderCharts, resizeCharts } from "./charts.js";
import {
  initTheme,
  renderActivity,
  renderHeader,
  renderKpis,
  renderProviderDetail,
  showToast,
} from "./ui.js";

let usage = demoUsage();
let mode = "demo";
let selectedProviderName = null;

initTheme();

initTopology({
  onSelect(providerName) {
    selectedProviderName = providerName;
    const provider = usage.providers.find((item) => item.name === providerName) || null;
    renderProviderDetail(provider, usage);
  },
});

document.getElementById("refreshButton").addEventListener("click", async () => {
  await refresh();
  showToast("Dashboard diperbarui");
});

window.addEventListener("resize", () => {
  resizeCharts(usage);
});

function renderAll() {
  renderHeader(usage, mode);
  renderKpis(usage);
  renderTopology(usage.providers, selectedProviderName);
  renderProviderDetail(
    usage.providers.find((provider) => provider.name === selectedProviderName) || null,
    usage
  );
  renderActivity(usage.recent);
  renderCharts(usage);
}

async function refresh() {
  try {
    usage = await fetchUsage();
    mode = "live";

    if (
      selectedProviderName &&
      !usage.providers.some((provider) => provider.name === selectedProviderName)
    ) {
      selectedProviderName = null;
    }
  } catch (error) {
    if (mode !== "live") {
      usage = demoUsage();
      mode = "demo";
    }
  }

  renderAll();
}

renderAll();
refresh();
setInterval(refresh, 5000);
