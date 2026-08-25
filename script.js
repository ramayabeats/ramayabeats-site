const DOWNLOAD_COUNTER_ENDPOINT = "/api/wallpaper-downloads";
const PAGE_VISIT_ENDPOINT = "/api/page-visits";
const PAGE_VISIT_SESSION_PREFIX = "ramaya-page-visit:";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDownloadCount(count) {
  return `${new Intl.NumberFormat("en").format(count)} ${count === 1 ? "download" : "downloads"}`;
}

function showDownloadCount(wallpaperId, count) {
  if (!Number.isInteger(count) || count < 1) return;

  const counter = document.querySelector(`[data-download-count="${CSS.escape(wallpaperId)}"]`);
  if (!counter) return;

  counter.textContent = formatDownloadCount(count);
  counter.hidden = false;
}

async function loadDownloadCounts(wallpaperIds) {
  if (!wallpaperIds.length) return;

  try {
    const params = new URLSearchParams({ ids: wallpaperIds.join(",") });
    const response = await fetch(`${DOWNLOAD_COUNTER_ENDPOINT}?${params}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });

    if (!response.ok) return;

    const { counts = {} } = await response.json();
    Object.entries(counts).forEach(([wallpaperId, count]) => {
      showDownloadCount(wallpaperId, count);
    });
  } catch {
    // The wallpaper download remains available if the optional counter API is offline.
  }
}

async function recordWallpaperDownload(wallpaperId) {
  try {
    const response = await fetch(DOWNLOAD_COUNTER_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ wallpaperId }),
      credentials: "same-origin",
      keepalive: true
    });

    if (!response.ok) return;

    const { count } = await response.json();
    showDownloadCount(wallpaperId, count);
  } catch {
    // Never interrupt the actual file download because analytics are unavailable.
  }
}

function claimPageVisitForSession(pageId) {
  try {
    const sessionKey = `${PAGE_VISIT_SESSION_PREFIX}${pageId}`;
    if (window.sessionStorage.getItem(sessionKey)) return false;

    window.sessionStorage.setItem(sessionKey, "1");
    return true;
  } catch {
    // If session storage is unavailable, avoid overcounting page refreshes.
    return false;
  }
}

function showPageVisitCount(count) {
  if (!Number.isInteger(count) || count < 1) return;

  document.querySelectorAll("[data-page-visit-counter]").forEach((counter) => {
    const output = counter.querySelector("[data-page-visit-count]");
    if (!output) return;

    output.textContent = new Intl.NumberFormat("en").format(count);
    counter.hidden = false;
  });
}

async function initPageVisitCounter() {
  const pageId = document.body?.dataset.pageId;
  if (!pageId) return;

  const shouldIncrement = claimPageVisitForSession(pageId);
  const requestUrl = shouldIncrement
    ? PAGE_VISIT_ENDPOINT
    : `${PAGE_VISIT_ENDPOINT}?${new URLSearchParams({ pageId })}`;

  try {
    const response = await fetch(requestUrl, {
      method: shouldIncrement ? "POST" : "GET",
      headers: shouldIncrement
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      body: shouldIncrement ? JSON.stringify({ pageId }) : undefined,
      credentials: "same-origin",
      keepalive: shouldIncrement
    });

    if (!response.ok) return;

    const { count } = await response.json();
    showPageVisitCount(count);
  } catch {
    // Page analytics are optional and must never interrupt the site experience.
  }
}

async function loadWallpapers() {
  const grid = document.getElementById("wallpaper-grid");

  if (!grid) return;

  try {
    const response = await fetch(`data/${window.wallpaperCollection || "wallpapers"}.json?v=20260825-6`);
    if (!response.ok) throw new Error(`Wallpaper data returned ${response.status}`);

    const wallpapers = await response.json();

    grid.innerHTML = wallpapers.map((item) => {
      const filename = item.filename || item.file.split("/").pop();
      const wallpaperId = item.id;

      if (!wallpaperId) {
        throw new Error(`Wallpaper "${item.title}" is missing a stable id`);
      }

      return `
        <article class="wallpaper-card" data-wallpaper-id="${escapeHtml(wallpaperId)}">
          <div class="wallpaper-preview">
            <img src="${escapeHtml(item.preview || item.file)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>9:16 Phone • Full Resolution</p>
          <p class="wallpaper-download-count" data-download-count="${escapeHtml(wallpaperId)}" hidden></p>
          <a class="download" href="${escapeHtml(item.file)}" download="${escapeHtml(filename)}" data-download-wallpaper="${escapeHtml(wallpaperId)}" aria-label="Download ${escapeHtml(item.title)} wallpaper in full resolution">Download Wallpaper</a>
        </article>
      `;
    }).join("");

    const wallpaperIds = wallpapers.map((item) => item.id);

    grid.querySelectorAll("[data-download-wallpaper]").forEach((link) => {
      link.addEventListener("click", () => {
        void recordWallpaperDownload(link.dataset.downloadWallpaper);
      });
    });

    void loadDownloadCounts(wallpaperIds);
  } catch (error) {
    grid.innerHTML = "<p>Wallpapers could not be loaded. Please try again later.</p>";
    console.error(error);
  }
}

function initGlobalHeader() {
  const header = document.querySelector("[data-global-header]");
  if (!header) return;

  const toggle = header.querySelector(".rds-menu-toggle");
  const panel = header.querySelector(".rds-header__panel");
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Close navigation" : "Open navigation";
    panel.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) setOpen(false);
  });
}

async function initSoundtrack(player) {
  const source = player.dataset.soundtrackSrc;
  const control = player.querySelector(".incubator-soundtrack__control");
  const label = player.querySelector("[data-soundtrack-label]");
  const status = player.querySelector("[data-soundtrack-status]");

  if (!source || !control || !label) return;

  try {
    const response = await fetch(source, { method: "HEAD", cache: "no-store" });
    if (!response.ok) return;
  } catch {
    return;
  }

  const audio = new Audio(source);
  const requestedVolume = Number.parseFloat(player.dataset.soundtrackVolume);
  audio.volume = Number.isFinite(requestedVolume)
    ? Math.min(1, Math.max(0, requestedVolume))
    : 0.25;
  audio.preload = "metadata";
  player.hidden = false;

  const setPlayingState = (playing) => {
    control.setAttribute("aria-pressed", String(playing));
    label.textContent = playing ? "⏸ PAUSE SOUNDTRACK" : "🎵 ACTIVATE SOUNDTRACK";
    if (status) status.textContent = playing ? "Soundtrack playing" : "Soundtrack paused";
  };

  control.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      setPlayingState(false);
      return;
    }

    control.disabled = true;
    label.textContent = "⌛ LOADING SOUNDTRACK";
    if (status) status.textContent = "Soundtrack loading";

    try {
      await audio.play();
      setPlayingState(true);
    } catch {
      setPlayingState(false);
      if (status) status.textContent = "Soundtrack could not be played";
    } finally {
      control.disabled = false;
    }
  });

  audio.addEventListener("ended", () => setPlayingState(false));
  audio.addEventListener("error", () => {
    audio.pause();
    player.hidden = true;
  });
}

function initSoundtracks() {
  document.querySelectorAll("[data-soundtrack]").forEach((player) => {
    void initSoundtrack(player);
  });
}

function initIncubatorMotionVisibility() {
  const hero = document.querySelector(".incubator-cinematic-hero");
  if (!hero || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(([entry]) => {
    hero.classList.toggle("is-motion-paused", !entry.isIntersecting);
  }, { rootMargin: "120px 0px" });

  observer.observe(hero);
}

initGlobalHeader();
void loadWallpapers();
initSoundtracks();
initIncubatorMotionVisibility();
void initPageVisitCounter();
