# Ramaya Beats Studio Website

Official static website for Ramaya Beats Studio.

## How to add a new phone wallpaper

1. Upload your new image to:

```text
assets/wallpapers/
```

2. Open:

```text
data/wallpapers.json
```

3. Add a new entry:

```json
{
  "title": "Your Wallpaper Name",
  "format": "Phone 9:16",
  "file": "assets/wallpapers/your-file-name.jpg"
}
```

4. Commit changes.

Cloudflare Pages will automatically update the website.
