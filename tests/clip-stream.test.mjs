import assert from "node:assert/strict";
import test from "node:test";
import {
  chatSignal, combineSignals, describeMoment, formatTime, loudnessSignal, parseChat, parseLoudness, parseScenes,
  parseTime, parseTranscript, pickMoments, quoteIn, speechSignal,
} from "../skills/3-editing/clip-stream/lib/moments.mjs";
import { coverCrop, fpsFilter, layoutFilter, parseBox, slugify } from "../skills/3-editing/clip-stream/lib/layouts.mjs";

test("times read as seconds and print back", () => {
  assert.equal(parseTime("1:02:03"), 3723);
  assert.equal(parseTime("02:03"), 123);
  assert.equal(parseTime("12.5"), 12.5);
  assert.equal(parseTime(7), 7);
  assert.ok(Number.isNaN(parseTime("soon")));
  assert.equal(formatTime(3723), "1:02:03");
  assert.equal(formatTime(65), "1:05");
});

test("astats output becomes one dB reading per second", () => {
  const text = [
    "frame:0    pts:0       pts_time:0",
    "lavfi.astats.Overall.RMS_level=-30.5",
    "frame:1    pts:16000   pts_time:1",
    "lavfi.astats.Overall.RMS_level=-inf",
    "frame:3    pts:48000   pts_time:3",
    "lavfi.astats.Overall.RMS_level=-8",
  ].join("\n");
  assert.deepEqual(parseLoudness(text, 4), [-30.5, -100, -100, -8]);
});

test("a loud burst scores above a steady stream around it", () => {
  const dbs = Array.from({ length: 300 }, (_, i) => -32 + (i % 7) * 0.3);
  for (const s of [60, 61, 200]) dbs[s] = -6;
  const score = loudnessSignal(dbs);
  const top = score.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(([, i]) => i).sort((a, b) => a - b);
  assert.deepEqual(top, [60, 61, 200]);
  assert.ok(Math.max(...score.slice(0, 50)) < 1);
});

test("transcripts in HyperFrames, words and segment shapes all read as words", () => {
  assert.deepEqual(parseTranscript([{ text: "no", start: 1, end: 1.2, id: "w0" }]), [{ text: "no", start: 1, end: 1.2 }]);
  assert.equal(parseTranscript({ words: [{ word: "yo", start: 2, end: 2.1 }] })[0].text, "yo");
  const spread = parseTranscript({ segments: [{ text: "let's go now", start: 10, end: 13 }] });
  assert.deepEqual(spread.map((w) => w.start), [10, 11, 12]);
});

test("hype phrases and custom keywords mark the second they're said", () => {
  const words = parseTranscript([
    { text: "just", start: 5, end: 5.3 }, { text: "driving", start: 5.3, end: 6 },
    { text: "Clip", start: 40.1, end: 40.4 }, { text: "that!", start: 40.4, end: 40.8 },
    { text: "wanted", start: 90, end: 90.4 }, { text: "level", start: 90.4, end: 90.8 },
  ]);
  const { score, hits } = speechSignal(words, 120, { keywords: ["wanted level"] });
  assert.deepEqual(hits.get(40), ["clip that"]);
  assert.deepEqual(hits.get(90), ["wanted level"]);
  assert.ok(score[40] > score[5]);
});

test("chat logs in JSON and timestamped lines both parse, and bursts score after the delay", () => {
  assert.deepEqual(parseChat('[{"t": 12, "text": "KEKW"}, {"time": "0:15", "text": "clip it"}]'), [
    { t: 12, text: "KEKW" }, { t: 15, text: "clip it" },
  ]);
  assert.deepEqual(parseChat("[0:01:05] viewer: POG\n1:06 nice"), [{ t: 65, text: "viewer: POG" }, { t: 66, text: "nice" }]);
  const messages = [];
  for (let t = 0; t < 600; t += 10) messages.push({ t, text: "hi" });
  for (let i = 0; i < 30; i += 1) messages.push({ t: 305 + i * 0.1, text: "KEKW" });
  const { score } = chatSignal(messages, 600, { delay: 5 });
  const peak = score.indexOf(Math.max(...score));
  assert.ok(peak >= 298 && peak <= 303, `peak at ${peak}`);
});

test("scene output parses into cuts", () => {
  assert.deepEqual(parseScenes("frame:0 pts:12 pts_time:3.5\nlavfi.scene_score=0.61"), [{ t: 3.5, score: 0.61 }]);
});

test("moments don't overlap, stay within length limits and rank by score", () => {
  const score = new Array(400).fill(0);
  score[50] = 5; score[52] = 4.5; score[200] = 3; score[390] = 2;
  const moments = pickMoments(combineSignals({ loud: score }), { count: 5, length: 20, min: 8, max: 30, threshold: 0.5 });
  assert.equal(moments.length, 3);
  assert.deepEqual(moments.map((m) => m.rank), [1, 2, 3]);
  for (const m of moments) assert.ok(m.duration >= 8 && m.duration <= 30, `${m.duration}`);
  const sorted = [...moments].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i += 1) assert.ok(sorted[i].start >= sorted[i - 1].end);
  assert.ok(moments[0].start <= 50 && moments[0].end >= 53);
});

test("edges snap to sentence boundaries so lines aren't cut off", () => {
  const words = parseTranscript([
    { text: "okay.", start: 37, end: 37.4 },
    { text: "Watch", start: 38.1, end: 38.4 }, { text: "this", start: 38.4, end: 38.7 }, { text: "jump", start: 38.7, end: 39 },
    { text: "no", start: 50, end: 50.2 }, { text: "way!", start: 50.2, end: 50.6 },
    { text: "That", start: 57, end: 57.2 }, { text: "was", start: 57.2, end: 57.5 }, { text: "sick.", start: 57.5, end: 58.6 },
  ]);
  const score = new Array(120).fill(0);
  score[50] = 5;
  const [moment] = pickMoments(score, { count: 1, length: 20, words });
  assert.ok(Math.abs(moment.start - 37.95) < 0.01, `start ${moment.start}`);
  assert.ok(Math.abs(moment.end - 58.85) < 0.01, `end ${moment.end}`);
  assert.equal(quoteIn(words, moment.start, moment.end), "Watch this jump no way! That was sick.");
});

test("reasons read as a plain sentence", () => {
  assert.equal(describeMoment({ loud: 4.5, chat: 2 }, ["clip that"]), 'A big volume spike, "clip that", chat sped up.');
  assert.equal(describeMoment({}), "Mild peak; check it before keeping.");
});

test("layouts crop a landscape frame to 1080×1920", () => {
  assert.equal(coverCrop(1920, 1080, 1080, 1920, 0.5), "scale=3414:1920:flags=lanczos,crop=1080:1920:1167:0");
  assert.equal(coverCrop(1920, 1080, 1080, 1920, 0), "scale=3414:1920:flags=lanczos,crop=1080:1920:0:0");
  assert.equal(fpsFilter("120/1"), ",fps=60");
  assert.equal(fpsFilter("60000/1001"), "");
  assert.deepEqual(parseBox("1500:40:380:214"), { x: 1500, y: 40, w: 380, h: 214 });
  assert.equal(parseBox("1:2:3"), null);
  const split = layoutFilter({ layout: "split", width: 1920, height: 1080, cam: { x: 1500, y: 40, w: 380, h: 214 }, rate: "60/1" });
  assert.match(split, /crop=380:214:1500:40/);
  assert.match(split, /vstack=inputs=2/);
  assert.match(layoutFilter({ layout: "fill", width: 1920, height: 1080 }), /overlay=\(W-w\)\/2:\(H-h\)\/2/);
  assert.throws(() => layoutFilter({ layout: "split", width: 1920, height: 1080 }), /--cam/);
  assert.equal(slugify("Wheelie past the cops!"), "wheelie-past-the-cops");
  assert.equal(slugify(null, "m01"), "m01");
});
