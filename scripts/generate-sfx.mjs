#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOUND_DEFINITIONS, soundManifestEntry, wavBuffer } from "../lib/sfx.mjs";
import { writeJson } from "../lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, "skills", "shortform-sound-design", "assets", "sfx");
await fs.mkdir(output, { recursive: true });
const sounds = [];

for (const definition of SOUND_DEFINITIONS) {
  const buffer = wavBuffer(definition);
  await fs.writeFile(path.join(output, `${definition.id}.wav`), buffer);
  sounds.push(soundManifestEntry(definition, buffer));
  console.log(`Generated ${definition.id}.wav`);
}

await writeJson(path.join(output, "manifest.json"), {
  schemaVersion: 1,
  title: "FavStash Original Short-Form SFX Starter Pack",
  generatedBy: "scripts/generate-sfx.mjs",
  license: "Apache-2.0",
  guidance: "Use effects as narrative punctuation. Keep them below intelligible speech and avoid adding one merely to satisfy a cadence rule.",
  count: sounds.length,
  sounds,
});
