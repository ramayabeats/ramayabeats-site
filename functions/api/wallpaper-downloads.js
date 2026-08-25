const WALLPAPER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/;
const MAX_IDS_PER_REQUEST = 100;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");

  return new Response(JSON.stringify(data), { ...init, headers });
}

function getDatabase(env) {
  return env.DOWNLOADS_DB;
}

function validWallpaperId(value) {
  return typeof value === "string" && WALLPAPER_ID_PATTERN.test(value);
}

export async function onRequestGet({ request, env }) {
  const database = getDatabase(env);
  if (!database) return json({ error: "Download counter storage is not configured" }, { status: 503 });

  const url = new URL(request.url);
  const ids = [...new Set((url.searchParams.get("ids") || "").split(",").filter(Boolean))];

  if (!ids.length) return json({ counts: {} });
  if (ids.length > MAX_IDS_PER_REQUEST || ids.some((id) => !validWallpaperId(id))) {
    return json({ error: "Invalid wallpaper ids" }, { status: 400 });
  }

  const placeholders = ids.map(() => "?").join(", ");
  const { results = [] } = await database
    .prepare(`SELECT wallpaper_id, download_count AS count FROM wallpaper_downloads WHERE wallpaper_id IN (${placeholders})`)
    .bind(...ids)
    .all();

  const counts = Object.fromEntries(results.map((row) => [row.wallpaper_id, Number(row.count)]));
  return json({ counts });
}

export async function onRequestPost({ request, env }) {
  const database = getDatabase(env);
  if (!database) return json({ error: "Download counter storage is not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const wallpaperId = body?.wallpaperId;
  if (!validWallpaperId(wallpaperId)) {
    return json({ error: "Invalid wallpaper id" }, { status: 400 });
  }

  const result = await database
    .prepare(`
      INSERT INTO wallpaper_downloads (wallpaper_id, download_count, updated_at)
      VALUES (?, 1, datetime('now'))
      ON CONFLICT(wallpaper_id) DO UPDATE SET
        download_count = download_count + 1,
        updated_at = datetime('now')
      RETURNING download_count AS count
    `)
    .bind(wallpaperId)
    .first();

  return json({ wallpaperId, count: Number(result.count) });
}
