let scale = 1;
let panX = 0;
let panY = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

let currentProviders = [];
let selectedProviderName = null;
let onSelectProvider = () => {};

export function initTopology({ onSelect }) {
  onSelectProvider = onSelect;

  const wrap = document.getElementById("topologyWrap");

  wrap.addEventListener("mousedown", (event) => {
    if (event.target.closest(".topology-node")) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) return;
    panX += event.clientX - lastX;
    panY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  wrap.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      scale = clamp(scale + (event.deltaY < 0 ? 0.08 : -0.08), 0.65, 1.65);
      applyTransform();
    },
    { passive: false }
  );

  document.getElementById("zoomInButton").addEventListener("click", () => {
    scale = clamp(scale + 0.1, 0.65, 1.65);
    applyTransform();
  });

  document.getElementById("zoomOutButton").addEventListener("click", () => {
    scale = clamp(scale - 0.1, 0.65, 1.65);
    applyTransform();
  });

  document.getElementById("resetTopologyButton").addEventListener("click", () => {
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  });

  window.addEventListener("resize", () => renderTopology(currentProviders, selectedProviderName));
}

export function renderTopology(providers, selectedName = null) {
  currentProviders = providers || [];
  selectedProviderName = selectedName;

  const wrap = document.getElementById("topologyWrap");
  const stage = document.getElementById("topologyStage");
  const links = document.getElementById("topologyLinks");
  const empty = document.getElementById("topologyEmpty");

  stage.querySelectorAll(".topology-node").forEach((node) => node.remove());
  links.innerHTML = "";

  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  const center = { x: width / 2, y: height / 2 };

  stage.insertAdjacentHTML(
    "beforeend",
    nodeMarkup({
      name: "DailyFlow",
      subtitle: "Routing center",
      status: "center",
      x: center.x,
      y: center.y,
      isCenter: true,
      selected: selectedName === null,
    })
  );

  const positions = radialPositions(currentProviders.length, width, height);

  currentProviders.forEach((provider, index) => {
    const position = positions[index];
    stage.insertAdjacentHTML(
      "beforeend",
      nodeMarkup({
        name: provider.name,
        subtitle: `${provider.models?.length || 0} model`,
        status: provider.status,
        x: position.x,
        y: position.y,
        selected: provider.name === selectedName,
      })
    );

    links.appendChild(routeElement(center, position, provider.status));
  });

  empty.classList.toggle("visible", currentProviders.length === 0);

  stage.querySelectorAll(".topology-node").forEach((node) => {
    node.addEventListener("click", () => {
      const providerName = node.dataset.provider || null;
      selectedProviderName = providerName;
      renderTopology(currentProviders, selectedProviderName);
      onSelectProvider(providerName);
    });
  });

  applyTransform();
}

function nodeMarkup({ name, subtitle, status, x, y, isCenter = false, selected = false }) {
  const classes = [
    "topology-node",
    isCenter ? "center" : status,
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <button
      type="button"
      class="${classes}"
      data-provider="${isCenter ? "" : escapeAttribute(name)}"
      style="left:${x}px;top:${y}px"
    >
      <span class="topology-icon">${icon(name)}</span>
      <span class="topology-copy">
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(subtitle)}</small>
      </span>
    </button>
  `;
}

function routeElement(center, target, status) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const control1 = { x: center.x + dx * 0.42, y: center.y + dy * 0.08 };
  const control2 = { x: center.x + dx * 0.58, y: center.y + dy * 0.92 };

  path.setAttribute(
    "d",
    `M ${center.x} ${center.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${target.x} ${target.y}`
  );
  path.setAttribute("class", `topology-route ${status || "idle"}`);

  return path;
}

function radialPositions(count, width, height) {
  if (count === 0) return [];

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width * 0.36, height * 0.34);
  const innerRadius = Math.min(width * 0.22, height * 0.20);

  const positions = [];

  if (count <= 8) {
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      positions.push({
        x: centerX + Math.cos(angle) * outerRadius,
        y: centerY + Math.sin(angle) * outerRadius,
      });
    }
    return positions;
  }

  const outerCount = 8;
  for (let index = 0; index < outerCount; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / outerCount;
    positions.push({
      x: centerX + Math.cos(angle) * outerRadius,
      y: centerY + Math.sin(angle) * outerRadius,
    });
  }

  const remaining = count - outerCount;
  for (let index = 0; index < remaining; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / remaining;
    positions.push({
      x: centerX + Math.cos(angle) * innerRadius,
      y: centerY + Math.sin(angle) * innerRadius,
    });
  }

  return positions;
}

function applyTransform() {
  const stage = document.getElementById("topologyStage");
  stage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function icon(name) {
  return String(name || "?").trim().charAt(0).toUpperCase() || "?";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "");
}
