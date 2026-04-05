const API_URL = "http://localhost:4000/projects";
let PROJECTS = [];

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getProjectById(id) {
  return PROJECTS.find(p => p.id === id) || null;
}

async function loadProjects() {
  if (PROJECTS.length) return;
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      PROJECTS = data;
    }
  } catch (e) {
    console.error("Failed to load projects", e);
  }
}

async function renderHome() {
  const list = $("#projectList");
  if (!list) return;

  await loadProjects();

  list.innerHTML = PROJECTS.map(p => {
    const href = `project.html?id=${encodeURIComponent(p.id)}`;
    return `
      <li class="project-item">
        <a href="${href}">
          <h2>${escapeHtml(p.title)}</h2>
          <p>${escapeHtml(p.description)}</p>
        </a>
      </li>
    `.trim();
  }).join("");
}

async function renderProject() {
  const view = $("#projectView");
  if (!view) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  await loadProjects();
  const project = id ? getProjectById(id) : null;

  const titleEl = $("#projectTitle");
  const descEl = $("#projectDescription");
  const tagsEl = $("#projectTags");
  const linksEl = $("#projectLinks");

  if (!project) {
    if (titleEl) titleEl.textContent = "Project not found";
    if (descEl) descEl.textContent = "Det projektet finns inte (än).";
    if (tagsEl) tagsEl.innerHTML = "";
    if (linksEl) linksEl.innerHTML = "";
    document.title = "Project not found — Emil Faisal Hasselberg";
    return;
  }

  if (titleEl) titleEl.textContent = project.title;
  if (descEl) descEl.textContent = project.description;
  document.title = `${project.title} — Emil Faisal Hasselberg`;

  if (tagsEl) {
    tagsEl.innerHTML = (project.tags || [])
      .map(t => `<li class="tag">${escapeHtml(t)}</li>`)
      .join("");
  }

  if (linksEl) {
    linksEl.innerHTML = (project.links || [])
      .filter(l => l && l.href)
      .map(l => `<a href="${escapeHtml(l.href)}" target="_blank" rel="noreferrer">${escapeHtml(l.label || l.href)}</a>`)
      .join("");
  }
}

function initScreensaver() {
  const idleDelayMs = 40000;
  const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel", "pointerdown"];
  let idleTimer = null;
  let overlay = null;

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "screensaver-overlay";
    overlay.innerHTML = `
      <div class="screensaver-logo-wrap">
        <img src="Logga_1.png" alt="Logga" />
      </div>
    `;

    overlay.addEventListener("click", hideScreensaver);
    document.body.appendChild(overlay);
    return overlay;
  }

  function showScreensaver() {
    const el = ensureOverlay();
    el.classList.add("active");
  }

  function hideScreensaver() {
    if (!overlay) return;
    overlay.classList.remove("active");
  }

  function resetIdleTimer() {
    hideScreensaver();
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = setTimeout(showScreensaver, idleDelayMs);
  }

  events.forEach(eventName => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  resetIdleTimer();
}

function initImageExtensionFallback() {
  document.addEventListener("error", event => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (target.dataset.extFallbackTried === "true") return;

    const src = target.getAttribute("src");
    if (!src) return;

    let nextSrc = null;
    if (/\.jpg($|[?#])/i.test(src)) {
      nextSrc = src.replace(/\.jpg($|[?#])/i, ".jpeg$1");
    } else if (/\.jpeg($|[?#])/i.test(src)) {
      nextSrc = src.replace(/\.jpeg($|[?#])/i, ".jpg$1");
    }

    if (!nextSrc || nextSrc === src) return;
    target.dataset.extFallbackTried = "true";
    target.src = nextSrc;
  }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  initImageExtensionFallback();
  const page = document.body?.dataset?.page;
  if (page === "home") renderHome();
  if (page === "project") renderProject();
  initScreensaver();
});
