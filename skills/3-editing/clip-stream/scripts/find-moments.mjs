#!/usr/bin/env node
// Find the best moments in a long stream or VOD and write moments.json.
//
//   node find-moments.mjs --input stream.mp4 [--transcript transcript.json]
//     [--chat chat.json|chat.txt] [--keywords "heist,wanted level"] [--count 12]
//     [--length 20] [--min 8] [--max 60] [--scenes] [--frames]
//     [--from 0:05:00] [--to 3:55:00] [--chat-delay 5] [--threshold 1]
//     [--weights loud=1,speech=0.8,chat=1,scene=0.4] [--out dir]
//
// Signals: loudness spikes against the minute around them (always), excited
// phrases and fast talking (with a transcript), chat bursts (with a chat log)
// and hard scene cuts (--scenes). Nothing leaves the computer.
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs, optionalNumber } from "../lib/args.mjs";
import { run, runCapture } from "../lib/process.mjs";
import {
  chatSignal, combineSignals, DEFAULT_WEIGHTS, describeMoment, formatTime, loudnessSignal, parseChat,
  parseLoudness, parseScenes, parseTime, parseTranscript, peakIn, pickMoments, quoteIn, sceneSignal, speechSignal,
} from "../lib/moments.mjs";

const args = parseArgs(process.argv.slice(2));
const input = typeof args.input === "string" ? args.input : args._[0];
if (!input) {
  console.error("Usage: node find-moments.mjs --input <stream.mp4> [--transcript transcript.json] [--chat chat.json] [--count 12] [--frames]");
  process.exit(2);
}
const source = path.resolve(input);
await fs.access(source);

const count = optionalNumber(args, "count", 12, { min: 1, max: 500 });
const length = optionalNumber(args, "length", 20, { min: 5, max: 180 });
const min = optionalNumber(args, "min", Math.min(8, length), { min: 3, max: length });
const max = optionalNumber(args, "max", Math.max(60, length), { min: length, max: 600 });
const threshold = optionalNumber(args, "threshold", 1, { min: 0 });
const chatDelay = optionalNumber(args, "chat-delay", 5, { min: -30, max: 60 });
const from = args.from ? parseTime(args.from) : 0;
const weights = { ...DEFAULT_WEIGHTS };
if (typeof args.weights === "string") {
  for (const pair of args.weights.split(",")) {
    const [name, value] = pair.split("=").map((s) => s.trim());
    if (!(name in weights) || !Number.isFinite(Number(value))) throw new Error(`--weights takes loud, speech, chat and scene, e.g. loud=0.5,speech=1.2 (got "${pair}")`);
    weights[name] = Number(value);
  }
}
const outDir = path.resolve(typeof args.out === "string" ? args.out : path.join(path.dirname(source), `${path.parse(source).name}-clips`));
await fs.mkdir(outDir, { recursive: true });

const probe = JSON.parse(await runCapture("ffprobe", [
  "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate", "-of", "json", source,
]));
const total = Number(probe.format?.duration);
if (!Number.isFinite(total) || total <= 0) throw new Error("Could not read the source duration");
const to = args.to ? Math.min(total, parseTime(args.to)) : total;
if (!(to > from)) throw new Error("--to must come after --from");
const span = to - from;
const hasAudio = probe.streams?.some((s) => s.codec_type === "audio");
const video = probe.streams?.find((s) => s.codec_type === "video");
const range = ["-ss", String(from), "-t", String(span)];
console.log(`Source ${path.basename(source)}: ${formatTime(total)} (analysing ${formatTime(from)}–${formatTime(to)}).`);

// 1. Loudness: one RMS reading per second of audio (fast: audio only).
let loud = null;
if (hasAudio) {
  console.log("Measuring loudness…");
  const text = await runCapture("ffmpeg", [
    "-hide_banner", "-nostats", "-v", "error", ...range, "-i", source, "-vn",
    "-af", "aresample=16000,asetnsamples=16000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
    "-f", "null", "-",
  ]);
  loud = loudnessSignal(parseLoudness(text, span));
} else {
  console.log("No audio track: loudness is skipped.");
}

// 2. Transcript (absolute stream times; shifted into the analysed range).
let words = [];
let speech = null;
if (typeof args.transcript === "string") {
  const parsed = parseTranscript(JSON.parse(await fs.readFile(path.resolve(args.transcript), "utf8")));
  words = parsed.filter((w) => w.start >= from && w.start < to).map((w) => ({ ...w, start: w.start - from, end: w.end - from }));
  const keywords = typeof args.keywords === "string" ? args.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [];
  speech = speechSignal(words, span, { keywords });
  console.log(`Transcript: ${words.length} words in range.`);
}

// 3. Chat log.
let chat = null;
if (typeof args.chat === "string") {
  const messages = parseChat(await fs.readFile(path.resolve(args.chat), "utf8"))
    .filter((m) => m.t >= from && m.t < to + chatDelay).map((m) => ({ ...m, t: m.t - from }));
  chat = chatSignal(messages, span, { delay: chatDelay });
  console.log(`Chat: ${messages.length} messages in range (shifted ${chatDelay}s earlier).`);
}

// 4. Scene cuts (decodes the video at low resolution; slower on long streams).
let scene = null;
if (args.scenes && video) {
  console.log("Detecting scene cuts…");
  const text = await runCapture("ffmpeg", [
    "-hide_banner", "-nostats", "-v", "error", ...range, "-i", source, "-an",
    "-vf", "fps=4,scale=320:-2,select='gt(scene,0.35)',metadata=print:file=-", "-f", "null", "-",
  ]);
  scene = sceneSignal(parseScenes(text), span);
}

if (!loud && !speech && !chat && !scene) throw new Error("No signal to score: the file has no audio and no transcript, chat or --scenes was given");
const signals = { loud, speech: speech?.score ?? null, chat: chat?.score ?? null, scene };
const combined = combineSignals(signals, weights);
const picked = pickMoments(combined, { count, length, min, max, threshold, words, duration: span });

const moments = picked.map((m) => {
  const strengths = Object.fromEntries(Object.entries(signals).filter(([, v]) => v).map(([k, v]) => [k, peakIn(v, m.start, m.end)]));
  const phrases = [];
  for (let s = Math.floor(m.start); s <= Math.floor(m.end); s += 1) for (const p of speech?.hits.get(s) ?? []) if (!phrases.includes(p)) phrases.push(p);
  const start = Math.round((m.start + from) * 100) / 100;
  const end = Math.round((m.end + from) * 100) / 100;
  return {
    rank: m.rank,
    id: `m${String(m.rank).padStart(2, "0")}`,
    keep: true,
    title: null,
    start,
    end,
    peak: Math.round((m.peak + from) * 100) / 100,
    duration: m.duration,
    at: `${formatTime(start)}–${formatTime(end)}`,
    score: m.score,
    signals: strengths,
    reason: describeMoment(strengths, phrases),
    quote: quoteIn(words, m.start, m.end),
  };
});

// 5. Optional review sheets: start, peak and end side by side, one JPG per moment.
if (args.frames && video) {
  const framesDir = path.join(outDir, "frames");
  await fs.mkdir(framesDir, { recursive: true });
  for (const moment of moments) {
    const times = [moment.start + 0.5, moment.peak, Math.max(moment.start, moment.end - 0.5)];
    const sheet = path.join(framesDir, `${moment.id}.jpg`);
    await run("ffmpeg", [
      "-hide_banner", "-v", "error", "-y",
      ...times.flatMap((t) => ["-ss", t.toFixed(2), "-i", source]),
      "-filter_complex", "[0:v]scale=640:-2,setsar=1[a];[1:v]scale=640:-2,setsar=1[b];[2:v]scale=640:-2,setsar=1[c];[a][b][c]hstack=inputs=3",
      "-frames:v", "1", "-q:v", "4", sheet,
    ], { stdio: "ignore" });
    moment.frames = path.relative(outDir, sheet);
  }
}

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: { path: source, duration: Math.round(total * 100) / 100, width: video?.width ?? null, height: video?.height ?? null, rate: video?.r_frame_rate ?? null },
  analysed: { from, to: Math.round(to * 100) / 100 },
  settings: { count, length, min, max, threshold, chatDelay, weights },
  signalsUsed: Object.keys(signals).filter((k) => signals[k]),
  moments,
};
const output = path.join(outDir, "moments.json");
await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`);

console.log(`\n${moments.length} moment${moments.length === 1 ? "" : "s"} (signals: ${result.signalsUsed.join(", ")}):`);
for (const m of moments) console.log(`  ${m.id}  ${m.at.padEnd(17)} ${String(m.duration).padStart(5)}s  score ${String(m.score).padStart(5)}  ${m.reason}`);
if (moments.length < count) console.log(`\nOnly ${moments.length} of ${count} cleared the threshold (${threshold}). Lower --threshold for more, weaker picks.`);
console.log(`\nWrote ${output}`);
