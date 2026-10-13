import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SAMPLE_RATE, duckUnder, planCues, renderCues, snapUp, syncPoint, verifyPlacement, writeWav, measureAttack } from "../skills/3-editing/edit-video/lib/sync.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const ffmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

function stereo(seconds, fill) {
  const frames = Math.round(seconds * SAMPLE_RATE);
  const out = new Float32Array(frames * 2);
  for (let i = 0; i < frames; i += 1) out[2 * i] = out[2 * i + 1] = fill(i / SAMPLE_RATE);
  return out;
}

test("struck sounds sync on their attack, swells on their peak", () => {
  // Silence, then a click at 50 ms that decays.
  const click = stereo(0.3, (t) => (t < 0.05 ? 0 : Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-(t - 0.05) * 30)));
  const struck = syncPoint(click);
  assert.equal(struck.struck, true);
  assert.ok(Math.abs(struck.sync - 0.05) <= 0.004, JSON.stringify(struck));

  // A whoosh that swells for 300 ms and fades.
  const whoosh = stereo(0.5, (t) => Math.sin(2 * Math.PI * 300 * t) * (t < 0.3 ? (t / 0.3) ** 2 : Math.max(0, 1 - (t - 0.3) * 5)));
  const swell = syncPoint(whoosh);
  assert.equal(swell.struck, false);
  assert.ok(Math.abs(swell.sync - 0.3) <= 0.01, JSON.stringify(swell));

  // A sound that starts on its first sample is struck: before the file is silence.
  assert.equal(syncPoint(stereo(0.2, (t) => Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 20))).struck, true);
});

test("cue times snap up to the frame that shows the event", () => {
  assert.equal(snapUp(0, 30), 0);
  assert.equal(snapUp(1.0333, 30), 31 / 30);   // rounded input stays on its frame
  assert.equal(snapUp(1.04, 30), 32 / 30);     // between frames: the next one draws it
  assert.equal(snapUp(29.0667, 30), 872 / 30);
});

test("ducking lowers effects only while the voice speaks", () => {
  const effects = stereo(1, () => 0.5);
  const voice = stereo(1, (t) => (t >= 0.5 ? 0.3 * Math.sin(2 * Math.PI * 200 * t) : 0));
  duckUnder(effects, voice, { duckDb: 6 });
  assert.ok(Math.abs(effects[2 * Math.round(0.25 * SAMPLE_RATE)] - 0.5) < 1e-6);
  assert.ok(Math.abs(effects[2 * Math.round(0.9 * SAMPLE_RATE)] - 0.5 * 10 ** (-6 / 20)) < 0.01);
});

test("the mixer lands every struck sound on its frame", { skip: !ffmpeg && "ffmpeg not available" }, async (context) => {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-sync-"));
  context.after(async () => fs.rm(work, { recursive: true, force: true }));
  // A click with 40 ms of silence in front, as many sound files have.
  await writeWav(path.join(work, "late-click.wav"), stereo(0.25, (t) => (t < 0.04 ? 0 : 0.8 * Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-(t - 0.04) * 40))));
  const sheet = { fps: 30, total: 2, cues: [
    { t: 0.5, sound: "late-click.wav", label: "own file" },
    { t: 1.0333, sound: "curated/ui-pop.wav", label: "pack file" },
    { frame: 50, t: 1.6, sound: "ui-click", label: "pack id" },
    { frame: 55, sound: "curated/ui-pop.wav", label: "frame only" },
  ] };
  const planned = await planCues(sheet, { baseDir: work });
  assert.deepEqual(planned.map((cue) => Math.round(cue.frameTime * 30)), [15, 31, 50, 55]);
  await assert.rejects(planCues({ fps: 30, cues: [{ sound: "ui-pop" }] }), /needs a frame or a numeric t/);
  assert.ok(Math.abs(planned[0].start - (0.5 - 0.04)) < 0.003);
  for (const row of await verifyPlacement(planned)) assert.ok(Math.abs(row.errorMs) <= 2, JSON.stringify(row));
  const { buffer } = await renderCues(planned, sheet.total);
  assert.ok(Math.abs(measureAttack(buffer, 0.5) - 0.5) <= 0.002);
});

test("sfx-sync mixes, masters and muxes a cue sheet", { skip: !ffmpeg && "ffmpeg not available" }, async (context) => {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-sync-cli-"));
  context.after(async () => fs.rm(work, { recursive: true, force: true }));
  const script = path.join(root, "skills", "3-editing", "edit-video", "scripts", "sfx-sync.mjs");
  await fs.writeFile(path.join(work, "cues.json"), JSON.stringify({ fps: 30, total: 3, cues: [
    { t: 0, sound: "curated/hook-impact.wav", gain: -6 },
    { t: 1, sound: "curated/ui-pop.wav" },
    { t: 2, sound: "curated/zoom-swish.wav" },
  ] }));
  const video = path.join(work, "silent.mp4");
  const made = spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=108x192:r=30:d=3", "-pix_fmt", "yuv420p", video]);
  assert.equal(made.status, 0, String(made.stderr));
  const mix = spawnSync(process.execPath, [script, "mix", path.join(work, "cues.json"), "--out", path.join(work, "mix.wav"),
    "--video", video, "--mux", path.join(work, "exports", "final.mp4")], { encoding: "utf8" });
  assert.equal(mix.status, 0, mix.stderr);
  assert.match(mix.stdout, /3 cues on 3\.00 s/);
  const loud = Number(mix.stdout.match(/loudness (-?[\d.]+) LUFS/)[1]);
  const peak = Number(mix.stdout.match(/true peak (-?[\d.]+) dBTP/)[1]);
  assert.ok(Math.abs(loud + 14) <= 0.5, mix.stdout);
  assert.ok(peak <= -2.4, mix.stdout);
  const check = spawnSync(process.execPath, [script, "check", path.join(work, "exports", "final.mp4"), "--mix", path.join(work, "mix.wav"),
    "--cues", path.join(work, "cues.json"), "--strips", path.join(work, "strips"), "--crop", "0,0,108,96", "--width", "120"], { encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr + check.stdout);
  assert.match(check.stdout, /audio track vs mix: 0 samples/);
  await fs.access(path.join(work, "strips", "sync-01.jpg"));
});
