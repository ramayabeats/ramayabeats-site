# Ramaya Beats Studio Website

Official static website for Ramaya Beats Studio.

## Site structure

- `index.html` — home and current collections
- `brainrot-incubator.html` — local Brainrot Incubator experience and Nigiri Ronin Wasabimaru collection
- `crazy-brainrot.html` — Crazy Brainrot collection
- `beach-brainrot-party.html` — Brainrot Beach Club Party collection
- `data/*.json` — wallpaper lists loaded by `script.js`, including the four-file Nigiri Ronin release
- `functions/api/wallpaper-downloads.js` — Cloudflare Pages Function for real per-wallpaper download counts
- `migrations/0001_create_wallpaper_downloads.sql` — D1 schema for persistent counts

The shared navigation follows **RDS-001 Global Header v1.0**. Its design notes are in `design-system/RDS-001-global-header.md`.

## Brainrot Incubator branding

The Incubator is the official Ramaya Universe archive that discovers, classifies, documents and archives Brainrots. It does not create them.

The approved pattern is preserved as three transparent master assets:

```text
assets/brainrot-incubator/brainrot-incubator-brand-hero.png
assets/brainrot-incubator/brainrot-incubator-brand-compact.png
assets/brainrot-incubator/brainrot-incubator-icon.png
```

The page serves optimized WebP versions of the hero and compact lockups, plus a small PNG favicon derived from the icon master. The permanent slogan `WHERE LEGENDS ARE BORN` remains part of the full lockup and is also available as accessible HTML fallback text.

The reusable archive chamber and dossier use the same `data-subject-number` and `data-subject-name` hooks. To release Subject 002, 003 or 050, keep their component classes and update only the subject number, name, image, facts and collection key.

The current chamber is configured for `SUBJECT-001 — Nigiri Ronin Wasabimaru` and uses `assets/brainrot-incubator/subject-001-chamber.jpg` as the featured subject render.

Subject media uses the reusable `.subject-media-card` component with `data-subject-media`, `data-subject-number` and `data-youtube-url` hooks. Future Subject releases should keep this structure and replace only the subject number, video URL, thumbnail, title and subtitle. Subject 001 uses the locally archived official YouTube thumbnail at `assets/brainrot-incubator/subject-001-origin-video.jpg`.

The reusable soundtrack control uses `data-soundtrack`, `data-soundtrack-src` and `data-soundtrack-volume`. Subject 001 expects:

```text
assets/audio/subject-001-soundtrack.mp3
```

Playback never autostarts. The control becomes available only after that asset responds successfully, and starts at 25% volume.

## Subject 001 origin stills

The Incident Report uses canonical film stills stored at these paths:

```text
assets/brainrot-incubator/origin/origin-01-basement.jpg
assets/brainrot-incubator/origin/origin-02-old-wasabi.jpg
assets/brainrot-incubator/origin/origin-02-shockwave.jpg
assets/brainrot-incubator/origin/origin-03-contamination.jpg
assets/brainrot-incubator/origin/origin-04-carrier.jpg
assets/brainrot-incubator/origin/origin-05-transfer.jpg
assets/brainrot-incubator/origin/origin-06-awakening.jpg
```

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
  "id": "collection-your-wallpaper-name",
  "title": "Your Wallpaper Name",
  "file": "assets/wallpapers/your-file-name.jpg"
}
```

The `id` is permanent and is used by the download counter. Keep it lowercase, use letters/numbers/hyphens only, and do not change it when renaming or replacing the image file.

Wallpaper cards use the neutral label `9:16 Phone • Full Resolution`. Do not add exact pixel dimensions manually. If exact dimensions are introduced later, derive them from the source file automatically.

4. Commit changes.

Cloudflare Pages will automatically update the website.

## Download counter setup on Cloudflare

The counter starts at zero when deployed and increments only when a visitor clicks a wallpaper download link. Image previews do not call the counting endpoint. If the endpoint or database is unavailable, the original file download still works and the count remains hidden.

One-time Cloudflare setup:

1. In Cloudflare, create a D1 database (for example `ramayabeats-downloads`).
2. Open its SQL console and run `migrations/0001_create_wallpaper_downloads.sql`.
3. Open the Pages project settings and add a D1 binding named exactly `DOWNLOADS_DB`, selecting that database. Add it to Production and Preview if both environments should count downloads.
4. Redeploy the Pages project so the Function and binding are active.

No database ID or credentials are stored in this repository.
