#!/usr/bin/env node
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOUND_DEFINITIONS, soundManifestEntry, wavBuffer } from "../skills/favstash-shortform/lib/sfx.mjs";
import { writeJson } from "../skills/favstash-shortform/lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "skills", "favstash-shortform", "assets", "sfx");
await fs.mkdir(output, { recursive: true });
const sounds = [];
// The checked-in manifest owns curated metadata; synthesis never replaces recordings.
let curated = [];
try {
  const previous = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  curated = previous.sounds.filter(sound => sound.origin === "curated");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
for (const sound of curated) {
  const bytes = await fs.readFile(path.join(output, sound.file));
  if (crypto.createHash("sha256").update(bytes).digest("hex") !== sound.sha256) {
    throw new Error(`Curated sound checksum mismatch: ${sound.file}`);
  }
}

for (const definition of SOUND_DEFINITIONS) {
  const buffer = wavBuffer(definition);
  await fs.writeFile(path.join(output, `${definition.id}.wav`), buffer);
  sounds.push(soundManifestEntry(definition, buffer));
  console.log(`Generated ${definition.id}.wav`);
}

sounds.push(...curated);
await writeJson(path.join(output, "manifest.json"), {
  schemaVersion: 1,
  title: "FavStash Short-Form SFX Pack",
  generatedBy: "scripts/generate-sfx.mjs",
  guidance: "Choose a sound for a visible event and audition it against speech. Prefer curated sounds or the creator's established library; ordinary caption changes stay silent.",
  count: sounds.length,
  sounds,
});
