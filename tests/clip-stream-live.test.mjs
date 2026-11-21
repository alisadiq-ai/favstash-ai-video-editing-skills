import assert from "node:assert/strict";
import test from "node:test";
import {
  mapChatToRecording, nextWindow, overlapsAny, parseIrcLine, recordedSeconds, segmentTracker, twitchChannel,
} from "../skills/3-editing/clip-stream/lib/live.mjs";

const queued = (num, iso, title = "live") =>
  `[stream.segmented][debug] Queuing TwitchHLSSegment(num=${num}, init=False, discontinuity=False, duration=2.000, title='${title}', key=None, byterange=None, date=${iso}, ad=False)`;

test("streamlink's log becomes segments on a gap-free recording timeline", () => {
  const feed = segmentTracker();
  const lines = [
    queued(100, "2026-11-20T22:00:00.000000Z"), "[stream.hls][debug] Writing segment 100 to output",
    queued(101, "2026-11-20T22:00:02.000000Z"), "[stream.hls][debug] Writing segment 101 to output",
    // an ad break: segments 102-150 are filtered, so the next written one is 151
    queued(151, "2026-11-20T22:01:42.000000Z"), "[stream.hls][debug] Writing segment 151 to output",
  ];
  const segs = lines.map(feed).filter(Boolean);
  assert.deepEqual(segs.map((s) => [s.num, s.pos]), [[100, 0], [101, 2], [151, 4]]);
  assert.equal(segs[0].date, Date.parse("2026-11-20T22:00:00Z") / 1000);
  assert.equal(recordedSeconds(segs), 6);
});

test("chat lands on the recording by broadcast time and skips the ad gap", () => {
  const base = Date.parse("2026-11-20T22:00:00Z") / 1000;
  const segs = [{ pos: 0, dur: 2, date: base }, { pos: 2, dur: 2, date: base + 2 }, { pos: 4, dur: 2, date: base + 102 }];
  const chat = [
    { wall: base + 1, text: "first" },        // inside segment 0
    { wall: base + 3.5, text: "second" },     // inside segment 1
    { wall: base + 60, text: "during ads" },  // no video recorded then
    { wall: base + 103, text: "after" },      // back on air
    { wall: base - 5, text: "before" },
  ];
  assert.deepEqual(mapChatToRecording(chat, segs), [{ t: 1, text: "first" }, { t: 3.5, text: "second" }, { t: 5, text: "after" }]);
});

test("without broadcast times, chat falls back to the recording's start time", () => {
  assert.deepEqual(mapChatToRecording([{ wall: 110, text: "x" }, { wall: 90, text: "y" }], [], { start: 100 }), [{ t: 10, text: "x" }]);
});

test("each pass reads the new stretch plus an overlap, and waits for enough video", () => {
  assert.deepEqual(nextWindow(0, 400), { from: 0, to: 392 });
  assert.deepEqual(nextWindow(392, 900), { from: 302, to: 892 });
  assert.equal(nextWindow(392, 450), null);
});

test("a moment that overlaps one already cut is not cut twice", () => {
  const cut = [{ start: 100, end: 125 }];
  assert.equal(overlapsAny({ start: 110, end: 130 }, cut), true);
  assert.equal(overlapsAny({ start: 125, end: 150 }, cut), false);
});

test("IRC chat keeps the message and drops the name", () => {
  assert.deepEqual(parseIrcLine(":someone!someone@someone.tmi.twitch.tv PRIVMSG #chan :no way :O", 5), { wall: 5, text: "no way :O" });
  assert.equal(parseIrcLine("PING :tmi.twitch.tv", 5), null);
});

test("Twitch links give the channel name", () => {
  assert.equal(twitchChannel("https://www.twitch.tv/KaiCenat/"), "kaicenat");
  assert.equal(twitchChannel("twitch.tv/some_streamer?ref=x"), "some_streamer");
  assert.equal(twitchChannel("https://www.youtube.com/@someone/live"), null);
});
