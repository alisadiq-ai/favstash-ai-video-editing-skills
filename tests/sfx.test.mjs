import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SOUND_DEFINITIONS, wavBuffer } from "../skills/3-editing/edit-video/lib/sfx.mjs";

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
  const assetRoot = path.join(root, "skills", "3-editing", "edit-video", "assets", "sfx");
  const manifest = JSON.parse(await fs.readFile(path.join(assetRoot, "manifest.json"), "utf8"));
  const curated = manifest.sounds.filter(sound => sound.origin === "curated");
  assert.equal(manifest.count, SOUND_DEFINITIONS.length + curated.length);
  assert.equal(new Set(manifest.sounds.map(sound => sound.id)).size, manifest.count);
  assert.ok(curated.some(sound => sound.tags.includes("camera")));
  for (const sound of manifest.sounds) {
    const definition = SOUND_DEFINITIONS.find(d => d.id === sound.id);
    const buffer = sound.origin === "curated" ? await fs.readFile(path.join(assetRoot, sound.file)) : wavBuffer(definition);
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(buffer.subarray(8, 12).toString("ascii"), "WAVE");
    assert.equal(buffer.readUInt32LE(24), sound.sampleRate);
    assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"), sound.sha256);
  }
});

test("regeneration preserves curated recordings and metadata", async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-sfx-"));
  try {
    const source = path.join(root, "skills", "3-editing", "edit-video", "assets", "sfx");
    await fs.cp(source, temporary, { recursive: true });
    const before = JSON.parse(await fs.readFile(path.join(temporary, "manifest.json"), "utf8"));
    const generated = spawnSync(process.execPath, [path.join(root, "scripts/generate-sfx.mjs"), temporary], { encoding: "utf8" });
    assert.equal(generated.status, 0, generated.stderr);
    const after = JSON.parse(await fs.readFile(path.join(temporary, "manifest.json"), "utf8"));
    assert.deepEqual(after.sounds.filter(s => s.origin === "curated"), before.sounds.filter(s => s.origin === "curated"));
    for (const sound of after.sounds) {
      const bytes = await fs.readFile(path.join(temporary, sound.file));
      assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), sound.sha256);
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("regeneration rejects a changed curated recording before overwriting output", async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-sfx-integrity-"));
  try {
    const source = path.join(root, "skills", "3-editing", "edit-video", "assets", "sfx");
    await fs.cp(source, temporary, { recursive: true });
    const manifestBefore = await fs.readFile(path.join(temporary, "manifest.json"));
    const manifest = JSON.parse(manifestBefore);
    const curated = manifest.sounds.find(sound => sound.origin === "curated");
    const originalGenerated = wavBuffer(SOUND_DEFINITIONS.find(d => d.id === manifest.sounds[0].id));
    await fs.writeFile(path.join(temporary, manifest.sounds[0].file), originalGenerated);
    await fs.appendFile(path.join(temporary, curated.file), "changed");
    const result = spawnSync(process.execPath, [path.join(root, "scripts/generate-sfx.mjs"), temporary], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Curated sound checksum mismatch/);
    assert.deepEqual(await fs.readFile(path.join(temporary, "manifest.json")), manifestBefore);
    assert.deepEqual(await fs.readFile(path.join(temporary, manifest.sounds[0].file)), originalGenerated);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("edit-video makes a synthesized sound on first use and checks it against the manifest", async () => {
  const { loadPack } = await import("../skills/3-editing/edit-video/lib/sync.mjs");
  const assetRoot = path.join(root, "skills", "3-editing", "edit-video", "assets", "sfx");
  const manifest = JSON.parse(await fs.readFile(path.join(assetRoot, "manifest.json"), "utf8"));
  const pack = await loadPack(assetRoot);
  for (const sound of manifest.sounds) {
    const bytes = await fs.readFile(pack.get(sound.id).file);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), sound.sha256, sound.id);
  }
});
