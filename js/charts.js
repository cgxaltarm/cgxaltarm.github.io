let requestHistory = [];

export function renderCharts(usage) {
  requestHistory = buildRequestHistory(usage);
  renderRequestChart(requestHistory);
  renderTokenChart(usage.history || []);
}

export function resizeCharts(usage) {
  renderCharts(usage);
}

function buildRequestHistory(usage) {
  const recent = Array.isArray(usage.recent) ? usage.recent : [];
  if (recent.length === 0) {
    return Array.from({ length: 24 }, (_, index) => ({
      label: index + 1,
      value: 0,
    }));
  }

  const buckets = new Map();

  recent.forEach((item) => {
    const date = new Date(item.time || Date.now());
    const key = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  return [...buckets.entries()].map(([label, value]) => ({ label, value }));
}

function renderRequestChart(rows) {
  const canvas = document.getElementById("requestChart");
  drawLineChart(canvas, [
    {
      values: rows.map((row) => row.value),
      color: "#38e2a0",
      label: "Requests",
    },
  ]);
}

function renderTokenChart(history) {
  const rows = Array.isArray(history) ? history.slice(-30) : [];
  drawLineChart(document.getElementById("tokenChart"), [
    {
      values: rows.map((row) => Number(row.input || 0)),
      color: "#8065ff",
      label: "Input",
    },
    {
      values: rows.map((row) => Number(row.output || 0)),
      color: "#20c8ff",
      label: "Output",
    },
  ]);
}

function drawLineChart(canvas, series) {
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding = { left: 42, right: 14, top: 14, bottom: 28 };

  context.clearRect(0, 0, width, height);

  const allValues = series.flatMap((item) => item.values);
  const maxValue = Math.max(1, ...allValues) * 1.15;
  const styles = getComputedStyle(document.body);
  const grid = styles.getPropertyValue("--line");
  const muted = styles.getPropertyValue("--muted");

  context.strokeStyle = grid;
  context.lineWidth = 1;
  context.fillStyle = muted;
  context.font = "11px system-ui";

  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) * index) / 4;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();

    const label = compact(maxValue * (1 - index / 4));
    context.fillText(label, 3, y + 4);
  }

  series.forEach((item, seriesIndex) => {
    const values = item.values;

    context.beginPath();
    values.forEach((value, index) => {
      const x =
        padding.left +
        ((width - padding.left - padding.right) * index) /
          Math.max(1, values.length - 1);
      const y =
        height -
        padding.bottom -
        ((height - padding.top - padding.bottom) * value) / maxValue;

      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    context.strokeStyle = item.color;
    context.lineWidth = 2.3;
    context.stroke();

    const legendX = padding.left + seriesIndex * 82;
    context.fillStyle = item.color;
    context.fillRect(legendX, height - 13, 10, 3);
    context.fillStyle = muted;
    context.fillText(item.label, legendX + 15, height - 8);
  });
}

function compact(value) {
  return new Intl.NumberFormat("id-ID", {
    notation: value >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Math.round(value));
}
