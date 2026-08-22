import crypto from "node:crypto";

export const SAMPLE_RATE = 48_000;

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function expEnvelope(time, decay) {
  return Math.exp(-time * decay);
}

function chirp(time, startHz, endHz, duration, phase = 0) {
  const slope = (endHz - startHz) / duration;
  return Math.sin(2 * Math.PI * (startHz * time + 0.5 * slope * time * time) + phase);
}

function synthesize(definition) {
  const length = Math.max(1, Math.round(definition.duration * SAMPLE_RATE));
  const samples = new Float64Array(length);
  const random = seededRandom(definition.seed);
  let smoothNoise = 0;

  for (let index = 0; index < length; index += 1) {
    const time = index / SAMPLE_RATE;
    const progress = index / Math.max(1, length - 1);
    const noise = random() * 2 - 1;
    smoothNoise += (noise - smoothNoise) * 0.075;
    samples[index] = definition.sample({
      time,
      progress,
      noise,
      smoothNoise,
      expEnvelope,
      chirp,
    });
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const normalization = peak > 0 ? 0.78 / peak : 1;
  const pcm = new Int16Array(length);
  for (let index = 0; index < length; index += 1) {
    const fadeIn = Math.min(1, index / (SAMPLE_RATE * 0.002));
    const fadeOut = Math.min(1, (length - 1 - index) / (SAMPLE_RATE * 0.008));
    const value = Math.max(-1, Math.min(1, samples[index] * normalization * fadeIn * fadeOut));
    pcm[index] = Math.round(value * 32767);
  }
  return pcm;
}

export const SOUND_DEFINITIONS = Object.freeze([
  {
    id: "soft-click",
    title: "Soft Click",
    duration: 0.075,
    seed: 101,
    tags: ["ui", "caption", "subtle"],
    use: "Small text changes, ticks, or quiet interface moments.",
    sample: ({ time, noise, expEnvelope: env }) => (noise * 0.55 + Math.sin(2 * Math.PI * 1800 * time) * 0.25) * env(time, 58),
  },
  {
    id: "hard-click",
    title: "Hard Click",
    duration: 0.09,
    seed: 202,
    tags: ["ui", "cut", "punchy"],
    use: "Decisive UI selection or a sharp visual cut.",
    sample: ({ time, noise, expEnvelope: env }) => (noise * 0.62 + Math.sin(2 * Math.PI * 900 * time) * 0.4) * env(time, 42),
  },
  {
    id: "clean-pop",
    title: "Clean Pop",
    duration: 0.16,
    seed: 303,
    tags: ["text", "reveal", "friendly"],
    use: "Word, icon, or lightweight graphic reveals.",
    sample: ({ time, chirp: sweep, expEnvelope: env }) => (sweep(time, 780, 330, 0.16) + Math.sin(2 * Math.PI * 110 * time) * 0.25) * env(time, 24),
  },
  {
    id: "clean-ding",
    title: "Clean Ding",
    duration: 0.55,
    seed: 404,
    tags: ["success", "reveal", "bright"],
    use: "A positive result or satisfying completion; use sparingly.",
    sample: ({ time, expEnvelope: env }) => (Math.sin(2 * Math.PI * 1046.5 * time) + 0.42 * Math.sin(2 * Math.PI * 1569.75 * time)) * env(time, 7.4),
  },
  {
    id: "error-buzz",
    title: "Error Buzz",
    duration: 0.32,
    seed: 505,
    tags: ["error", "contrast", "comic"],
    use: "A clear mistake or contrast beat; avoid under serious narration.",
    sample: ({ time, expEnvelope: env }) => (Math.sin(2 * Math.PI * 138 * time) + 0.55 * Math.sin(2 * Math.PI * 184 * time)) * env(time, 4.8) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 11 * time)),
  },
  {
    id: "soft-whoosh",
    title: "Soft Whoosh",
    duration: 0.42,
    seed: 606,
    tags: ["transition", "gentle", "movement"],
    use: "Slow pans, card movement, or a soft scene transition.",
    sample: ({ progress, noise, smoothNoise }) => (noise - smoothNoise) * Math.sin(Math.PI * progress) ** 1.5,
  },
  {
    id: "fast-whoosh",
    title: "Fast Whoosh",
    duration: 0.19,
    seed: 707,
    tags: ["transition", "fast", "swipe"],
    use: "A motivated whip, swipe, or rapid reframing transition.",
    sample: ({ progress, noise, smoothNoise }) => (noise - smoothNoise * 0.6) * Math.sin(Math.PI * progress) ** 0.8,
  },
  {
    id: "deep-whoosh",
    title: "Deep Whoosh",
    duration: 0.68,
    seed: 808,
    tags: ["transition", "cinematic", "low"],
    use: "A major section change or slower high-stakes reveal.",
    sample: ({ time, progress, smoothNoise, chirp: sweep }) => (smoothNoise * 1.2 + 0.5 * sweep(time, 180, 55, 0.68)) * Math.sin(Math.PI * progress),
  },
  {
    id: "short-riser",
    title: "Short Riser",
    duration: 0.82,
    seed: 909,
    tags: ["anticipation", "build", "reveal"],
    use: "Build toward a reveal; resolve it rather than leaving tension hanging.",
    sample: ({ time, progress, noise, chirp: sweep }) => (sweep(time, 180, 1450, 0.82) * 0.58 + noise * 0.22) * progress ** 1.35,
  },
  {
    id: "sub-impact",
    title: "Sub Impact",
    duration: 0.64,
    seed: 1001,
    tags: ["impact", "reveal", "low"],
    use: "One important claim, number, or final reveal—not every cut.",
    sample: ({ time, noise, chirp: sweep, expEnvelope: env }) => (sweep(time, 105, 38, 0.64) + noise * 0.28 * env(time, 36)) * env(time, 5.2),
  },
  {
    id: "typing-tick",
    title: "Typing Tick",
    duration: 0.055,
    seed: 1102,
    tags: ["typing", "caption", "ui"],
    use: "Occasional typed-character accents; never repeat on every letter for long copy.",
    sample: ({ time, noise, expEnvelope: env }) => (noise * 0.45 + Math.sin(2 * Math.PI * 2400 * time) * 0.22) * env(time, 83),
  },
  {
    id: "sparkle",
    title: "Sparkle",
    duration: 0.72,
    seed: 1203,
    tags: ["delight", "highlight", "bright"],
    use: "A delightful payoff or premium highlight; keep below the voice.",
    sample: ({ time, expEnvelope: env }) => {
      const first = Math.sin(2 * Math.PI * 1396.9 * time) * env(time, 7.8);
      const secondTime = Math.max(0, time - 0.11);
      const second = time >= 0.11 ? 0.7 * Math.sin(2 * Math.PI * 2093 * secondTime) * env(secondTime, 9) : 0;
      const thirdTime = Math.max(0, time - 0.23);
      const third = time >= 0.23 ? 0.48 * Math.sin(2 * Math.PI * 2637 * thirdTime) * env(thirdTime, 10) : 0;
      return first + second + third;
    },
  },
]);

export function wavBuffer(definition) {
  const pcm = synthesize(definition);
  const dataLength = pcm.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let index = 0; index < pcm.length; index += 1) buffer.writeInt16LE(pcm[index], 44 + index * 2);
  return buffer;
}

export function soundManifestEntry(definition, buffer) {
  return {
    id: definition.id,
    title: definition.title,
    file: `${definition.id}.wav`,
    durationSeconds: definition.duration,
    sampleRate: SAMPLE_RATE,
    channels: 1,
    bitDepth: 16,
    tags: definition.tags,
    recommendedUse: definition.use,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    license: "Apache-2.0",
    provenance: "Deterministically synthesized by scripts/generate-sfx.mjs; contains no third-party recording.",
  };
}
