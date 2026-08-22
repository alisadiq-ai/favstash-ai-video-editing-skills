import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SOUND_DEFINITIONS, wavBuffer } from "../lib/sfx.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("SFX synthesis is deterministic and emits PCM WAV", () => {
  const first = wavBuffer(SOUND_DEFINITIONS[0]);
  const second = wavBuffer(SOUND_DEFINITIONS[0]);
  assert.equal(first.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(first.subarray(8, 12).toString("ascii"), "WAVE");
  assert.equal(first.readUInt32LE(24), 48_000);
  assert.equal(crypto.createHash("sha256").update(first).digest("hex"), crypto.createHash("sha256").update(second).digest("hex"));
});

test("generated SFX manifest matches definitions and files", async () => {
  const assetRoot = path.join(root, "skills", "shortform-sound-design", "assets", "sfx");
  const manifest = JSON.parse(await fs.readFile(path.join(assetRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.count, SOUND_DEFINITIONS.length);
  for (const sound of manifest.sounds) {
    const buffer = await fs.readFile(path.join(assetRoot, sound.file));
    assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"), sound.sha256);
  }
});
