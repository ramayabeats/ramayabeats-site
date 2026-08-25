const PAGE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");

  return new Response(JSON.stringify(data), { ...init, headers });
}

function getDatabase(env) {
  return env.DOWNLOADS_DB;
}

function validPageId(value) {
  return typeof value === "string" && PAGE_ID_PATTERN.test(value);
}

export async function onRequestGet({ request, env }) {
  const database = getDatabase(env);
  if (!database) return json({ error: "Page visit storage is not configured" }, { status: 503 });

  const pageId = new URL(request.url).searchParams.get("pageId");
  if (!validPageId(pageId)) {
    return json({ error: "Invalid page id" }, { status: 400 });
  }

  const result = await database
    .prepare("SELECT visit_count AS count FROM page_visits WHERE page_id = ?")
    .bind(pageId)
    .first();

  return json({ pageId, count: result ? Number(result.count) : 0 });
}

export async function onRequestPost({ request, env }) {
  const database = getDatabase(env);
  if (!database) return json({ error: "Page visit storage is not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pageId = body?.pageId;
  if (!validPageId(pageId)) {
    return json({ error: "Invalid page id" }, { status: 400 });
  }

  const result = await database
    .prepare(`
      INSERT INTO page_visits (page_id, visit_count, updated_at)
      VALUES (?, 1, datetime('now'))
      ON CONFLICT(page_id) DO UPDATE SET
        visit_count = visit_count + 1,
        updated_at = datetime('now')
      RETURNING visit_count AS count
    `)
    .bind(pageId)
    .first();

  return json({ pageId, count: Number(result.count) });
}
