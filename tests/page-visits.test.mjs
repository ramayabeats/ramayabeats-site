import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet, onRequestPost } from "../functions/api/page-visits.js";

class MockD1Database {
  constructor() {
    this.counts = new Map();
  }

  prepare(query) {
    return {
      bind: (pageId) => ({
        first: async () => {
          if (query.includes("INSERT INTO page_visits")) {
            const count = (this.counts.get(pageId) || 0) + 1;
            this.counts.set(pageId, count);
            return { count };
          }

          assert.match(query, /SELECT visit_count AS count FROM page_visits/);
          return this.counts.has(pageId) ? { count: this.counts.get(pageId) } : null;
        }
      })
    };
  }
}

function postVisit(pageId) {
  return new Request("https://example.com/api/page-visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId })
  });
}

test("a new page session increments a stable page id", async () => {
  const database = new MockD1Database();

  const first = await onRequestPost({
    request: postVisit("brainrot-incubator"),
    env: { DOWNLOADS_DB: database }
  });
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), {
    pageId: "brainrot-incubator",
    count: 1
  });

  const second = await onRequestPost({
    request: postVisit("brainrot-incubator"),
    env: { DOWNLOADS_DB: database }
  });
  assert.equal((await second.json()).count, 2);
});

test("reading the persisted count does not increment it", async () => {
  const database = new MockD1Database();
  database.counts.set("brainrot-incubator", 8);

  const makeRequest = () => new Request(
    "https://example.com/api/page-visits?pageId=brainrot-incubator"
  );

  const first = await onRequestGet({
    request: makeRequest(),
    env: { DOWNLOADS_DB: database }
  });
  const refresh = await onRequestGet({
    request: makeRequest(),
    env: { DOWNLOADS_DB: database }
  });

  assert.deepEqual(await first.json(), { pageId: "brainrot-incubator", count: 8 });
  assert.deepEqual(await refresh.json(), { pageId: "brainrot-incubator", count: 8 });
  assert.equal(database.counts.get("brainrot-incubator"), 8);
});

test("future page ids use independent counters", async () => {
  const database = new MockD1Database();

  await onRequestPost({ request: postVisit("subject-001"), env: { DOWNLOADS_DB: database } });
  await onRequestPost({ request: postVisit("crazy-brainrot"), env: { DOWNLOADS_DB: database } });
  await onRequestPost({ request: postVisit("subject-001"), env: { DOWNLOADS_DB: database } });

  assert.equal(database.counts.get("subject-001"), 2);
  assert.equal(database.counts.get("crazy-brainrot"), 1);
});

test("invalid page ids and a missing binding are rejected", async () => {
  const database = new MockD1Database();
  const invalidResponse = await onRequestPost({
    request: postVisit("../../archive"),
    env: { DOWNLOADS_DB: database }
  });
  assert.equal(invalidResponse.status, 400);

  const missingBindingResponse = await onRequestGet({
    request: new Request("https://example.com/api/page-visits?pageId=brainrot-incubator"),
    env: {}
  });
  assert.equal(missingBindingResponse.status, 503);
});
