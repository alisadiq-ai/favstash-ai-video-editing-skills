#!/usr/bin/env node
// Cut the kept moments from moments.json into 1080×1920 clips.
//
//   node cut-clips.mjs --moments <dir>/moments.json [--layout center|fill|split]
//     [--focus 0.5] [--cam x:y:w:h] [--cam-height 640] [--zoom 1] [--only m01,m03]
//     [--crf 18] [--out <dir>/clips] [--input stream.mp4]
//
// A moment's own "layout", "focus", "cam", "zoom", "start", "end" and "title"
// override the defaults, so edit moments.json after review and cut again.
// Moments with "keep": false are skipped.
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { optionalNumber, parseArgs } from "../lib/args.mjs";
import { run, runCapture } from "../lib/process.mjs";
import { LAYOUTS, layoutFilter, parseBox, slugify } from "../lib/layouts.mjs";
import { parseTime } from "../lib/moments.mjs";

const args = parseArgs(process.argv.slice(2));
const momentsPath = typeof args.moments === "string" ? path.resolve(args.moments) : null;
if (!momentsPath) {
  console.error("Usage: node cut-clips.mjs --moments <dir>/moments.json [--layout center|fill|split] [--cam x:y:w:h]");
  process.exit(2);
}
const plan = JSON.parse(await fs.readFile(momentsPath, "utf8"));
const source = path.resolve(typeof args.input === "string" ? args.input : plan.source?.path ?? "");
await fs.access(source);
const outDir = path.resolve(typeof args.out === "string" ? args.out : path.join(path.dirname(momentsPath), "clips"));
await fs.mkdir(outDir, { recursive: true });

const defaults = {
  layout: typeof args.layout === "string" ? args.layout : "center",
  focus: optionalNumber(args, "focus", 0.5, { min: 0, max: 1 }),
  cam: parseBox(args.cam),
  camHeight: optionalNumber(args, "cam-height", 640, { min: 320, max: 960 }),
  zoom: optionalNumber(args, "zoom", 1, { min: 1, max: 2 }),
};
if (!LAYOUTS.includes(defaults.layout)) throw new Error(`--layout must be one of ${LAYOUTS.join(", ")}`);
if (args.cam && !defaults.cam) throw new Error("--cam must be x:y:w:h in source pixels, e.g. 1500:40:380:214");
const crf = optionalNumber(args, "crf", 18, { min: 10, max: 35 });
const only = typeof args.only === "string" ? new Set(args.only.split(",").map((s) => s.trim())) : null;

const probe = JSON.parse(await runCapture("ffprobe", [
  "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate", "-of", "json", source,
]));
const video = probe.streams?.find((s) => s.codec_type === "video");
if (!video?.width) throw new Error("The source has no video stream");
const hasAudio = probe.streams?.some((s) => s.codec_type === "audio");

const chosen = (plan.moments ?? []).filter((m) => m.keep !== false && (!only || only.has(m.id) || only.has(String(m.rank))));
if (!chosen.length) throw new Error("No moments to cut: every moment is keep:false or filtered out by --only");

const clips = [];
for (const [index, moment] of chosen.entries()) {
  // Hand-added moments may use "1:02:03" times.
  const start = parseTime(moment.start);
  const end = parseTime(moment.end);
  if (!Number.isFinite(start) || !(end > start)) { console.warn(`Skipping ${moment.id}: start and end must be times with end after start`); continue; }
  const settings = {
    layout: moment.layout ?? defaults.layout,
    focus: moment.focus ?? defaults.focus,
    cam: parseBox(moment.cam) ?? defaults.cam,
    camHeight: moment.camHeight ?? defaults.camHeight,
    zoom: moment.zoom ?? defaults.zoom,
  };
  const name = `${String(index + 1).padStart(2, "0")}-${slugify(moment.title, moment.id ?? "moment")}.mp4`;
  const output = path.join(outDir, name);
  const graph = layoutFilter({ ...settings, width: video.width, height: video.height, rate: video.r_frame_rate });
  await run("ffmpeg", [
    "-hide_banner", "-v", "error", "-stats", "-y",
    "-ss", start.toFixed(3), "-i", source, "-t", (end - start).toFixed(3),
    "-filter_complex", graph, "-map", "[v]",
    ...(hasAudio ? ["-map", "0:a:0", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"] : ["-an"]),
    "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", output,
  ]);
  clips.push({
    file: path.relative(path.dirname(momentsPath), output),
    id: moment.id ?? null,
    title: moment.title ?? null,
    sourceStart: start,
    sourceEnd: end,
    duration: Math.round((end - start) * 100) / 100,
    layout: settings.layout,
    reason: moment.reason ?? null,
  });
  console.log(`Cut ${name} (${settings.layout}, ${(end - start).toFixed(1)}s)`);
}

const manifest = path.join(path.dirname(momentsPath), "clips.json");
await fs.writeFile(manifest, `${JSON.stringify({ schemaVersion: 1, source, generatedAt: new Date().toISOString(), clips }, null, 2)}\n`);
console.log(`\n${clips.length} clip${clips.length === 1 ? "" : "s"} in ${outDir}\nWrote ${manifest}`);
