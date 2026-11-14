#!/usr/bin/env node
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOUND_DEFINITIONS, soundManifestEntry, wavBuffer } from "../skills/3-editing/edit-video/lib/sfx.mjs";
import { writeJson } from "../skills/3-editing/edit-video/lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
// With no folder, refresh the pack's manifest only: synthesized sounds don't ship as audio (the plugin directory takes
// no binaries), edit-video makes them on first use. With a folder, also write every synthesized WAV there to audition.
const pack = path.join(root, "skills", "3-editing", "edit-video", "assets", "sfx");
const output = process.argv[2] ? path.resolve(process.argv[2]) : pack;
const writeAudio = Boolean(process.argv[2]);
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
  if (writeAudio) await fs.writeFile(path.join(output, `${definition.id}.wav`), buffer);
  sounds.push(soundManifestEntry(definition, buffer));
  console.log(`${writeAudio ? "Generated" : "Checked"} ${definition.id}.wav`);
}

sounds.push(...curated);
await writeJson(path.join(output, "manifest.json"), {
  schemaVersion: 1,
  title: "FavStash Short-Form SFX Pack",
  generatedBy: "scripts/generate-sfx.mjs",
  guidance: "Choose a sound for a visible event and audition it against speech. Prefer the creator's established library when they have one; ordinary caption changes stay silent.",
  count: sounds.length,
  sounds,
});
