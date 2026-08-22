import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { assertInside, compactTimestamp, createRunId, sanitizeSlug } from "../lib/paths.mjs";

test("sanitizes creator-facing slugs", () => {
  assert.equal(sanitizeSlug("  Café: Launch / V2!  "), "cafe-launch-v2");
  assert.equal(sanitizeSlug("***"), "untitled-edit");
  assert.ok(sanitizeSlug("a".repeat(100)).length <= 64);
});

test("builds stable dated run IDs", () => {
  const date = new Date(2026, 7, 22, 23, 15, 30);
  assert.equal(compactTimestamp(date), "2026-08-22-231530");
  const id = createRunId("Productivity Hook", {
    date,
    randomBytes: () => Buffer.from("a1b2c3", "hex"),
  });
  assert.equal(id, "2026-08-22-231530-productivity-hook-a1b2c3");
});

test("rejects paths outside a selected root", () => {
  const root = path.resolve("/tmp/favstash-test-root");
  assert.equal(assertInside(root, path.join(root, "edits", "one")), path.join(root, "edits", "one"));
  assert.throws(() => assertInside(root, path.resolve(root, "..", "escape")), /must stay inside/);
});
