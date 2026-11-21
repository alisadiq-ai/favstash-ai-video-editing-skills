#!/usr/bin/env node
// Clip a stream while it is still live. Records it, logs its chat, and every
// few minutes runs find-moments on the new stretch and cuts each new moment.
//
//   node watch-live.mjs --url twitch.tv/<channel> [--hours 2] [--every 480]
//     [--layout split --cam x:y:w:h | --layout fill | --layout center --focus 0.5]
//     [--threshold 2] [--count 3] [--length 25] [--keywords "heist,cops"] [--out dir]
//
// Twitch: streamlink records (ads skipped, every segment logged with its
// broadcast time) and the chat is read anonymously from Twitch's public IRC.
// Other sites (YouTube, Kick): yt-dlp records; moments come from loudness.
// Stop with Ctrl-C at any time: it runs one last pass, then exits.
import fs from "node:fs";
import fsp from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { optionalNumber, parseArgs } from "../lib/args.mjs";
import { runCapture } from "../lib/process.mjs";
import { mapChatToRecording, nextWindow, overlapsAny, parseIrcLine, recordedSeconds, segmentTracker, twitchChannel } from "../lib/live.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const url = typeof args.url === "string" ? args.url : args._[0];
if (!url) {
  console.error("Usage: node watch-live.mjs --url twitch.tv/<channel> [--hours 2] [--layout split --cam x:y:w:h]");
  process.exit(2);
}
const channel = twitchChannel(url);
const every = optionalNumber(args, "every", 480, { min: 60, max: 3600 });
const hours = optionalNumber(args, "hours", 2, { min: 0, max: 48 });
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const outDir = path.resolve(typeof args.out === "string" ? args.out : `live-${channel ?? "stream"}-${stamp}`);
await fsp.mkdir(outDir, { recursive: true });
const files = {
  video: path.join(outDir, "stream.ts"), segments: path.join(outDir, "stream.segments.jsonl"), start: path.join(outDir, "stream.start"),
  chatLive: path.join(outDir, "chat-live.jsonl"), chat: path.join(outDir, "chat.json"), log: path.join(outDir, "log.jsonl"),
};
const finder = {
  count: String(optionalNumber(args, "count", 3, { min: 1, max: 20 })),
  threshold: String(optionalNumber(args, "threshold", 2, { min: 0 })),
  length: String(optionalNumber(args, "length", 25, { min: 5, max: 180 })),
  chatDelay: String(optionalNumber(args, "chat-delay", 10, { min: -30, max: 60 })),
};
const cutArgs = ["--layout", typeof args.layout === "string" ? args.layout : "center"];
for (const key of ["cam", "focus", "zoom"]) if (typeof args[key] === "string") cutArgs.push(`--${key}`, args[key]);

const has = (bin) => spawnSync(bin, ["--version"], { stdio: "ignore" }).status === 0;
const streamlink = typeof args.streamlink === "string" ? args.streamlink : "streamlink";
const children = [];

// ---------- 1. record ----------
let recorder;
const segments = [];
if (channel && has(streamlink)) {
  console.log(`Recording twitch.tv/${channel} with streamlink (ads skipped).`);
  recorder = spawn(streamlink, ["--loglevel", "debug", "--retry-streams", "5", "--retry-open", "20", "-o", files.video, "-f",
    `twitch.tv/${channel}`, typeof args.quality === "string" ? args.quality : "best"], { stdio: ["ignore", "pipe", "pipe"] });
  const feed = segmentTracker();
  const segLog = fs.createWriteStream(files.segments, { flags: "a" });
  for (const stream of [recorder.stdout, recorder.stderr]) {
    readline.createInterface({ input: stream }).on("line", (line) => {
      const seg = feed(line);
      if (seg) { segments.push(seg); segLog.write(`${JSON.stringify(seg)}\n`); }
      else if (/\[cli\]\[(info|error)\]|error/i.test(line)) console.log(`  ${line.slice(0, 160)}`);
    });
  }
} else {
  if (channel) console.warn("streamlink isn't installed (pipx install streamlink): recording with yt-dlp. Twitch ads may replace the picture and chat timing is approximate.");
  if (!has("yt-dlp")) throw new Error("Needs streamlink (Twitch) or yt-dlp to record the stream");
  console.log(`Recording ${url} with yt-dlp.`);
  recorder = spawn("yt-dlp", ["-f", "best[height<=1080]/best", "--hls-use-mpegts", "--no-part", "-o", files.video, url], { stdio: "ignore" });
}
children.push(recorder);
let recording = true;
recorder.once("exit", () => { recording = false; console.log("The recording stopped (stream ended or offline)."); });
// wall time of the first byte, for chat when there are no segment times
const startWatch = setInterval(() => {
  if (fs.existsSync(files.video) && fs.statSync(files.video).size > 0) { fs.writeFileSync(files.start, String(Date.now() / 1000)); clearInterval(startWatch); }
}, 200);

// ---------- 2. chat (Twitch, anonymous read-only; names are never stored) ----------
if (channel) {
  const chatLog = fs.createWriteStream(files.chatLive, { flags: "a" });
  const connect = () => {
    const socket = net.connect(6667, "irc.chat.twitch.tv", () => {
      socket.write(`PASS SCHMOOPIIE\r\nNICK justinfan${Math.floor(10000 + Math.random() * 89999)}\r\nJOIN #${channel}\r\n`);
    });
    let buffer = "";
    socket.setEncoding("utf8");
    socket.on("data", (data) => {
      buffer += data;
      const lines = buffer.split("\r\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith("PING")) { socket.write("PONG :tmi.twitch.tv\r\n"); continue; }
        const message = parseIrcLine(line, Date.now() / 1000);
        if (message) chatLog.write(`${JSON.stringify(message)}\n`);
      }
    });
    socket.on("error", () => {});
    socket.on("close", () => { if (recording) setTimeout(connect, 2000); });
    children.push({ kill: () => socket.destroy() });
  };
  connect();
  console.log(`Reading #${channel} chat.`);
}

// ---------- 3. a pass every few minutes ----------
const readJsonl = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const probeSeconds = async () => Number(await runCapture("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", files.video]).catch(() => "0")) || 0;
const node = (script, list) => new Promise((resolve) => {
  const child = spawn(process.execPath, [path.join(here, script), ...list], { stdio: ["ignore", "pipe", "pipe"] });
  let err = "";
  child.stderr.on("data", (d) => { err += d; });
  child.once("exit", (code) => resolve({ code, err }));
});

const cut = [];
let lastTo = 0;
let pass = 0;
const began = Date.now();
async function runPass(final = false) {
  const recorded = segments.length ? recordedSeconds(segments) : await probeSeconds();
  const window = nextWindow(lastTo, recorded, final ? { fresh: 10, minimum: 30, margin: 1 } : {});
  if (!window) return;
  pass += 1;
  const dir = path.join(outDir, `pass-${String(pass).padStart(2, "0")}`);
  const start = fs.existsSync(files.start) ? Number(fs.readFileSync(files.start, "utf8")) : null;
  const chat = channel ? mapChatToRecording(readJsonl(files.chatLive), segments, { start }) : [];
  if (chat.length) await fsp.writeFile(files.chat, JSON.stringify(chat));
  const found = await node("find-moments.mjs", ["--input", files.video, ...(chat.length ? ["--chat", files.chat, "--chat-delay", finder.chatDelay] : []),
    "--from", window.from.toFixed(1), "--to", window.to.toFixed(1), "--count", finder.count, "--threshold", finder.threshold,
    "--length", finder.length, "--min", "12", "--max", "45", ...(typeof args.keywords === "string" ? ["--keywords", args.keywords] : []), "--frames", "--out", dir]);
  if (found.code !== 0) { fs.appendFileSync(files.log, `${JSON.stringify({ pass, error: found.err.slice(-400) })}\n`); return; }
  const plan = JSON.parse(await fsp.readFile(path.join(dir, "moments.json"), "utf8"));
  const fresh = plan.moments.filter((m) => !overlapsAny(m, cut) && (final || m.end < window.to - 5));
  if (fresh.length) {
    const done = await node("cut-clips.mjs", ["--moments", path.join(dir, "moments.json"), "--only", fresh.map((m) => m.id).join(","), ...cutArgs]);
    if (done.code === 0) cut.push(...fresh.map((m) => ({ start: m.start, end: m.end })));
  }
  lastTo = window.to;
  const entry = { pass, at: new Date().toISOString(), from: window.from, to: window.to, chat: chat.length, cut: fresh.map((m) => [m.id, m.at, m.reason]) };
  fs.appendFileSync(files.log, `${JSON.stringify(entry)}\n`);
  console.log(`Pass ${pass}: ${window.from.toFixed(0)}–${window.to.toFixed(0)} s, ${chat.length} chat messages, ${fresh.length} new clip${fresh.length === 1 ? "" : "s"}${fresh.map((m) => `\n  ${m.at}  ${m.reason}`).join("")}`);
}

let stopping = false;
async function stop(reason) {
  if (stopping) return;
  stopping = true;
  console.log(`${reason} Last pass…`);
  for (const child of children) try { child.kill(); } catch { /* already gone */ }
  await new Promise((r) => setTimeout(r, 1500));
  await runPass(true);
  console.log(`\n${cut.length} clip${cut.length === 1 ? "" : "s"} in ${outDir}/pass-*/clips (log: ${files.log}).`);
  process.exit(0);
}
process.on("SIGINT", () => stop("Stopped."));
process.on("SIGTERM", () => stop("Stopped."));

console.log(`First pass in ~2 minutes, then every ${every / 60} minutes${hours ? ` for ${hours} h` : " until the stream ends"}. Ctrl-C to stop.`);
await new Promise((r) => setTimeout(r, 130_000));
while (!stopping) {
  await runPass();
  if (!recording) { await stop("Stream over."); break; }
  if (hours && Date.now() - began > hours * 3600_000) { await stop("Time's up."); break; }
  await new Promise((r) => setTimeout(r, every * 1000));
}
