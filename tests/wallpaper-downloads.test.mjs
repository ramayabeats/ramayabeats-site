import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet, onRequestPost } from "../functions/api/wallpaper-downloads.js";

class MockD1Database {
  constructor() {
    this.counts = new Map();
  }

  prepare(query) {
    return {
      bind: (...values) => ({
        all: async () => ({
          results: values
            .filter((id) => this.counts.has(id))
            .map((wallpaperId) => ({ wallpaper_id: wallpaperId, count: this.counts.get(wallpaperId) }))
        }),
        first: async () => {
          assert.match(query, /INSERT INTO wallpaper_downloads/);
          const wallpaperId = values[0];
          const count = (this.counts.get(wallpaperId) || 0) + 1;
          this.counts.set(wallpaperId, count);
          return { count };
        }
      })
    };
  }
}

test("a download action increments a stable wallpaper id", async () => {
  const database = new MockD1Database();
  const makeRequest = () => new Request("https://example.com/api/wallpaper-downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallpaperId: "subject-001-moonlit-temple" })
    });

  const first = await onRequestPost({ request: makeRequest(), env: { DOWNLOADS_DB: database } });
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), {
    wallpaperId: "subject-001-moonlit-temple",
    count: 1
  });

  const second = await onRequestPost({ request: makeRequest(), env: { DOWNLOADS_DB: database } });
  assert.equal((await second.json()).count, 2);
});

test("counts are returned only for ids that already exist", async () => {
  const database = new MockD1Database();
  database.counts.set("subject-001-tokyo-taxi", 7);

  const request = new Request(
    "https://example.com/api/wallpaper-downloads?ids=subject-001-tokyo-taxi,subject-001-metro-strike"
  );
  const response = await onRequestGet({ request, env: { DOWNLOADS_DB: database } });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    counts: { "subject-001-tokyo-taxi": 7 }
  });
});

test("invalid ids are rejected and a missing binding is reported", async () => {
  const database = new MockD1Database();
  const invalidRequest = new Request("https://example.com/api/wallpaper-downloads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallpaperId: "../../wallpaper" })
  });

  const invalidResponse = await onRequestPost({
    request: invalidRequest,
    env: { DOWNLOADS_DB: database }
  });
  assert.equal(invalidResponse.status, 400);

  const missingBindingResponse = await onRequestGet({
    request: new Request("https://example.com/api/wallpaper-downloads?ids=rise-beast"),
    env: {}
  });
  assert.equal(missingBindingResponse.status, 503);
});
