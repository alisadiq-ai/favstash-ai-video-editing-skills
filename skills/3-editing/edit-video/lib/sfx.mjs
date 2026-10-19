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

const TAU = 2 * Math.PI;

// A band-pass resonator (constant 0 dB peak). Higher q rings longer.
function resonator(hz, q) {
  const w = (TAU * hz) / SAMPLE_RATE;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const a1 = (-2 * Math.cos(w)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return {
    reset() { x1 = x2 = y1 = y2 = 0; },
    step(x) {
      const y = b0 * x - b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      return y;
    },
  };
}

// Noise-burst clicks through a resonator bank: crisp, broadband mechanical hits.
// events: [start seconds, gain]; bank: [[Hz, q, level], ...]. Filter state resets at time 0.
function clicker({ events, bank, burstDecay = 900, direct = 0.5, dark = 0, body }) {
  const filters = bank.map(([hz, q, level]) => ({ filter: resonator(hz, q), level }));
  const bodyFilter = body ? resonator(body.hz, body.q) : null;
  return ({ time, noise, smoothNoise }) => {
    if (time === 0) {
      for (const { filter } of filters) filter.reset();
      bodyFilter?.reset();
    }
    const excitation = noise * (1 - dark) + 4 * smoothNoise * dark;
    let burst = 0;
    for (const [at, gain] of events) if (time >= at) burst += gain * excitation * Math.exp(-(time - at) * burstDecay);
    let value = direct * burst;
    for (const { filter, level } of filters) value += level * filter.step(burst);
    if (bodyFilter) value += body.level * bodyFilter.step(burst);
    return value;
  };
}

// A rising wash of high, slightly inharmonic partials for the shimmer.
const SHIMMER_PARTIALS = (() => {
  const random = seededRandom(1709);
  return Array.from({ length: 26 }, (_, index) => {
    const position = index / 25;
    return {
      hz: (5200 + 7200 * position) * (0.98 + random() * 0.04),
      onset: 0.03 + 0.4 * position + (random() - 0.5) * 0.05,
      amp: 0.45 + random() * 0.55,
      decay: 10 + random() * 8,
    };
  });
})();
const SHIMMER_AIR = resonator(10_500, 2.5);

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
    id: "clean-ding",
    title: "Clean Ding",
    duration: 0.55,
    seed: 404,
    tags: ["success", "reveal", "bright"],
    use: "A positive result or satisfying completion; use sparingly.",
    sample: ({ time, expEnvelope: env }) => (Math.sin(2 * Math.PI * 1046.5 * time) + 0.42 * Math.sin(2 * Math.PI * 1569.75 * time)) * env(time, 7.4),
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
    tags: ["typing", "input", "ui"],
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
  {
    id: "tick",
    title: "Tick",
    duration: 0.09,
    seed: 1304,
    tags: ["step", "mechanical", "precise"],
    use: "One step, checklist row or spec callout landing; keep it quiet under the voice.",
    sample: clicker({
      events: [[0.004, 1], [0.013, 0.3]],
      bank: [[3300, 120, 2.4], [6200, 160, 2.6], [9300, 220, 3.4], [12_400, 120, 1]],
      burstDecay: 1100,
      direct: 0.22,
      dark: 0.35,
    }),
  },
  {
    id: "latch",
    title: "Latch",
    duration: 0.2,
    seed: 1405,
    tags: ["lock", "connected", "mechanical"],
    use: "Something locks, closes or connects: a lid, a clasp, an account linked.",
    sample: clicker({
      events: [[0.004, 0.35], [0.05, 1], [0.088, 0.4]],
      bank: [[1250, 25, 2.2], [2900, 90, 2.4], [5300, 130, 2.4], [8300, 150, 2.2]],
      burstDecay: 800,
      direct: 0.22,
      dark: 0.4,
      body: { hz: 190, q: 4, level: 3 },
    }),
  },
  {
    id: "ratchet",
    title: "Ratchet",
    duration: 0.4,
    seed: 1506,
    tags: ["progress", "mechanism", "mechanical"],
    use: "Progress or a mechanism engaging: a dial turning, a setting stepping into place.",
    sample: clicker({
      events: [[0.004, 0.75], [0.056, 0.9], [0.105, 0.8], [0.152, 1], [0.197, 0.85], [0.24, 0.95], [0.282, 0.8], [0.323, 1]],
      bank: [[1400, 20, 1.6], [2700, 110, 2.2], [4500, 140, 2.2], [7200, 170, 2.4], [10_600, 120, 1.2]],
      burstDecay: 1000,
      direct: 0.2,
      dark: 0.35,
    }),
  },
  {
    id: "thock",
    title: "Thock",
    duration: 0.12,
    seed: 1607,
    tags: ["land", "settle", "wood"],
    use: "A product, card or block settling into place.",
    sample: clicker({
      events: [[0.004, 1]],
      bank: [[620, 7, 3.2], [1150, 9, 2.4], [2300, 10, 1.4], [4700, 7, 0.6]],
      burstDecay: 650,
      direct: 0.3,
      dark: 0.35,
      body: { hz: 240, q: 4, level: 4 },
    }),
  },
  {
    id: "shimmer",
    title: "Shimmer",
    duration: 0.9,
    seed: 1708,
    tags: ["highlight", "sheen", "premium"],
    use: "A highlight or sheen passing over the product; syncs on its peak, keep it under the voice.",
    sample: ({ time, noise }) => {
      if (time === 0) SHIMMER_AIR.reset();
      let value = 0;
      for (const partial of SHIMMER_PARTIALS) {
        const t = time - partial.onset;
        if (t < 0) continue;
        value += partial.amp * Math.sin(TAU * partial.hz * t) * (1 - Math.exp(-t * 220)) * Math.exp(-t * partial.decay);
      }
      const air = 0.3 * SHIMMER_AIR.step(noise) * Math.exp(-(((time - 0.28) / 0.17) ** 2));
      return value / 8 + air;
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
