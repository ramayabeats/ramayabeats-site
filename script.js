async function loadWallpapers() {
  const grid = document.getElementById("wallpaper-grid");

  if (!grid) return;

  try {
    const response = await fetch(`data/${window.wallpaperCollection || "wallpapers"}.json?v=20260825-3`);
    if (!response.ok) throw new Error(`Wallpaper data returned ${response.status}`);

    const wallpapers = await response.json();

    grid.innerHTML = wallpapers.map((item) => {
      const filename = item.filename || item.file.split("/").pop();

      return `
        <article class="wallpaper-card">
          <div class="wallpaper-preview">
            <img src="${item.preview || item.file}" alt="${item.title}" loading="lazy" decoding="async">
          </div>
          <h3>${item.title}</h3>
          <p>9:16 Phone • Full Resolution</p>
          <a class="download" href="${item.file}" download="${filename}" aria-label="Download ${item.title} wallpaper in full resolution">Download Wallpaper</a>
        </article>
      `;
    }).join("");
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

initGlobalHeader();
loadWallpapers();
