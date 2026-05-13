async function loadWallpapers() {
  const grid = document.getElementById("wallpaper-grid");

  try {
    const response = await fetch("data/wallpapers.json");
    const wallpapers = await response.json();

    grid.innerHTML = wallpapers.map((item) => `
      <article class="wallpaper-card">
        <div class="wallpaper-preview">
          <img src="${item.file}" alt="${item.title}">
        </div>
        <h3>${item.title}</h3>
        <p>${item.format || "Phone 9:16"}</p>
        <a class="download" href="${item.file}" target="_blank">Download wallpaper</a>
      </article>
    `).join("");
  } catch (error) {
    grid.innerHTML = "<p>Wallpapers could not be loaded. Please try again later.</p>";
    console.error(error);
  }
}

loadWallpapers();
