import assert from "node:assert/strict";
import test from "node:test";
import { describeBrollFilename, summarizeProbe } from "../lib/media.mjs";

test("descriptive B-roll names become searchable hints", () => {
  assert.deepEqual(describeBrollFilename("typing-on-laptop-dark-desk-closeup-02.mov"), {
    description: "typing on laptop dark desk closeup",
    keywords: ["typing", "on", "laptop", "dark", "desk", "closeup"],
    take: 2,
  });
});

test("probe output is normalized", () => {
  assert.deepEqual(summarizeProbe({
    format: { duration: "12.5", size: "1000", format_name: "mov,mp4" },
    streams: [
      { codec_type: "video", codec_name: "h264", width: 1080, height: 1920, r_frame_rate: "30/1" },
      { codec_type: "audio", codec_name: "aac", sample_rate: "48000", channels: 2 },
    ],
  }), {
    durationSeconds: 12.5,
    bytes: 1000,
    format: "mov,mp4",
    video: { codec: "h264", width: 1080, height: 1920, frameRate: "30/1" },
    audio: { codec: "aac", sampleRate: 48000, channels: 2 },
  });
});
