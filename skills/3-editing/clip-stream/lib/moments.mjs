// Pure scoring for clip-stream: per-second signals from loudness, speech, chat
// and scene changes, combined and peak-picked into non-overlapping moments.
// Everything here is deterministic and free of I/O so it can be unit-tested.

/** Phrases that usually mark a moment worth clipping, in any game or stream. */
export const HYPE_PHRASES = [
  // Speech-to-text often hears "clip that" as "click that"; both count.
  "clip that", "clip it", "clipped", "click that", "click it", "no way", "let's go", "lets go", "oh my god", "oh my gosh",
  "what the", "are you kidding", "you're kidding", "holy", "insane", "crazy", "let's gooo",
  "did you see", "did that just", "how did", "i can't believe", "bro", "yo", "wait", "run",
  "go go go", "get out", "watch this", "look at this", "oh no", "nooo", "yes yes", "dude",
];
const LAUGHTER = /\b(ha(ha)+|he(he)+|lol|lmao|\[laugh(ter|s|ing)?\]|\(laugh(ter|s|ing)?\))\b/i;

/** Chat tokens that mean "that was a moment" on Twitch, Kick and YouTube. */
export const CHAT_HYPE = [
  "clip", "kekw", "lul", "lol", "lmao", "pog", "pogchamp", "poggers", "omegalul", "w", "ww", "www",
  "monkas", "pepelaugh", "icant", "no way", "😂", "🤣", "💀", "🔥", "omg", "wtf",
];

/** "1:02:03", "02:03", "123.5" or 123.5 → seconds (NaN when unreadable). */
export function parseTime(value) {
  if (typeof value === "number") return value;
  const text = String(value ?? "").trim();
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  const parts = text.split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return Number.NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** Seconds → "h:mm:ss" (or "m:ss" under an hour). */
export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}

/**
 * FFmpeg `ametadata=print` output of per-window astats RMS → dB per second.
 * Windows without a reading (silence reported as -inf) become -100 dB.
 */
export function parseLoudness(text, duration) {
  const length = Math.max(1, Math.ceil(duration ?? 0));
  const values = new Array(length).fill(Number.NaN);
  let time = null;
  for (const line of String(text).split(/\r?\n/)) {
    const pts = line.match(/pts_time:([\d.]+)/);
    if (pts) { time = Number(pts[1]); continue; }
    const rms = line.match(/RMS_level=(-?inf|-?[\d.]+)/i);
    if (rms && time !== null) {
      const second = Math.floor(time);
      if (second >= values.length) values.length = second + 1;
      values[second] = /inf/i.test(rms[1]) ? -100 : Math.max(-100, Number(rms[1]));
    }
  }
  // Fill gaps from the previous reading so a dropped window doesn't look silent.
  let last = -100;
  return Array.from(values, (v) => (Number.isFinite(v) ? (last = v) : last));
}

/** FFmpeg `select=gt(scene,x),metadata=print` output → [{t, score}]. */
export function parseScenes(text) {
  const scenes = [];
  let time = null;
  for (const line of String(text).split(/\r?\n/)) {
    const pts = line.match(/pts_time:([\d.]+)/);
    if (pts) { time = Number(pts[1]); continue; }
    const score = line.match(/scene_score=([\d.]+)/);
    if (score && time !== null) scenes.push({ t: time, score: Number(score[1]) });
  }
  return scenes;
}

/**
 * A transcript as words: HyperFrames' `transcript.json` (an array of
 * {text,start,end}), {words:[…]}, or segments [{start,end,text}] that are
 * spread evenly into words.
 */
export function parseTranscript(data) {
  const list = Array.isArray(data) ? data : data?.words ?? data?.segments ?? [];
  const words = [];
  for (const item of list) {
    const start = Number(item.start);
    const end = Number(item.end ?? item.start);
    const text = String(item.text ?? item.word ?? "").trim();
    if (!text || !Number.isFinite(start)) continue;
    const pieces = text.split(/\s+/);
    if (pieces.length === 1) { words.push({ text, start, end: Math.max(start, end) }); continue; }
    const step = Math.max(0, end - start) / pieces.length;
    pieces.forEach((piece, i) => words.push({ text: piece, start: start + i * step, end: start + (i + 1) * step }));
  }
  return words.sort((a, b) => a.start - b.start);
}

/**
 * A chat log → [{t, text}]. Accepts a JSON array of {t|time|timestamp|offset,
 * text|message|body}, or text lines like "[1:02:03] name: message" or
 * "1:02:03 message".
 */
export function parseChat(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[{") || text.startsWith("[\n") || text.startsWith("[ ") || text.startsWith("{")) {
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : data.comments ?? data.messages ?? [];
      return list
        .map((m) => ({
          t: parseTime(m.t ?? m.time ?? m.timestamp ?? m.offset ?? m.content_offset_seconds ?? m.time_in_seconds),
          text: String(m.text ?? m.message?.body ?? m.message ?? m.body ?? ""),
        }))
        .filter((m) => Number.isFinite(m.t))
        .sort((a, b) => a.t - b.t);
    } catch {
      // Not JSON after all: fall through to line parsing.
    }
  }
  const messages = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\]?\s*(.*)$/);
    if (!match) continue;
    const t = parseTime(match[1]);
    if (Number.isFinite(t)) messages.push({ t, text: match[2] });
  }
  return messages.sort((a, b) => a.t - b.t);
}

function median(sorted) {
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Robust local z-score: how far each value sits above the median of the
 * `window` seconds around it, in MAD units. A loud stream and a quiet one both
 * score their own spikes; a whole loud minute doesn't.
 */
export function localZ(values, window = 60, floor = 1) {
  const half = Math.max(1, Math.floor(window / 2));
  const out = new Array(values.length).fill(0);
  for (let i = 0; i < values.length; i += 1) {
    const slice = values.slice(Math.max(0, i - half), Math.min(values.length, i + half + 1)).sort((a, b) => a - b);
    const m = median(slice);
    const mad = median(slice.map((v) => Math.abs(v - m)).sort((a, b) => a - b));
    out[i] = (values[i] - m) / Math.max(floor, 1.4826 * mad);
  }
  return out;
}

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

/** Moving average over `width` seconds (odd), keeping the array length. */
export function smooth(values, width = 3) {
  const half = Math.floor(width / 2);
  return values.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = i - half; j <= i + half; j += 1) {
      if (j >= 0 && j < values.length) { sum += values[j]; n += 1; }
    }
    return n ? sum / n : 0;
  });
}

function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

/**
 * Loudness in dB per second → a 0–8 score. Half is "louder than the minute
 * around it" (catches spikes in a quiet stretch), half is "louder than this
 * stream usually gets" (its 80th percentile, roughly normal talking over the
 * game), so a scream or an explosion outranks someone simply starting to talk.
 */
export function loudnessSignal(dbs, window = 60) {
  // 3 dB of local spread is the floor, so a near-silent stretch can't turn a cough into a peak.
  const local = localZ(dbs, window, 3).map((z) => clamp(z, 0, 8));
  const usual = percentile(dbs, 0.8);
  return dbs.map((db, i) => 0.5 * local[i] + 0.5 * clamp((db - usual) / 2, 0, 8));
}

function normalizeWords(text) {
  return text.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Speech per second: excitement phrases (built-in plus `keywords`), laughter,
 * and talking much faster than usual. Returns the score array and, per second,
 * the phrases heard there so the reason line can quote them.
 */
export function speechSignal(words, duration, { keywords = [], window = 60 } = {}) {
  const length = Math.max(1, Math.ceil(duration));
  const score = new Array(length).fill(0);
  const hits = new Map();
  const rate = new Array(length).fill(0);
  for (const word of words) {
    const second = Math.floor(word.start);
    if (second >= 0 && second < length) rate[second] += 1;
  }
  const rateZ = localZ(rate, window, 1);
  for (let i = 0; i < length; i += 1) score[i] += clamp(rateZ[i], 0, 4) * 0.5;

  const phrases = [...new Set([...HYPE_PHRASES, ...keywords].map(normalizeWords).filter(Boolean))];
  const custom = new Set(keywords.map(normalizeWords));
  const tokens = words.map((w) => ({ ...w, norm: normalizeWords(w.text) }));
  const mark = (second, phrase, weight) => {
    for (let d = -1; d <= 2; d += 1) {
      const s = second + d;
      if (s >= 0 && s < length) score[s] += weight * (d === 0 ? 1 : 0.5);
    }
    if (second >= 0 && second < length) {
      const list = hits.get(second) ?? [];
      if (!list.includes(phrase)) list.push(phrase);
      hits.set(second, list);
    }
  };
  for (let i = 0; i < tokens.length; i += 1) {
    if (LAUGHTER.test(tokens[i].text)) mark(Math.floor(tokens[i].start), "laughing", 1.5);
    for (const phrase of phrases) {
      const parts = phrase.split(" ");
      if (i + parts.length > tokens.length) continue;
      const window = tokens.slice(i, i + parts.length).map((t) => t.norm).join(" ");
      if (window === phrase) {
        // "clip that" is the streamer asking for a clip: the strongest single cue.
        const weight = /^cli(p|ck) (that|it)$|^clipped$/.test(phrase) ? 4 : custom.has(phrase) ? 3 : parts.length > 1 ? 2.5 : 1.2;
        mark(Math.floor(tokens[i].start), phrase, weight);
      }
    }
  }
  return { score, hits };
}

/**
 * Chat per second, shifted `delay` seconds earlier (chat reacts after the
 * moment): message-rate spikes plus clip/emote reactions.
 */
export function chatSignal(messages, duration, { delay = 5, window = 120 } = {}) {
  const length = Math.max(1, Math.ceil(duration));
  const count = new Array(length).fill(0);
  const hype = new Array(length).fill(0);
  const tokens = new Set(CHAT_HYPE.map((t) => t.toLowerCase()));
  for (const message of messages) {
    const second = Math.floor(message.t - delay);
    if (second < 0 || second >= length) continue;
    count[second] += 1;
    const words = message.text.toLowerCase().split(/[\s,.!?]+/).filter(Boolean);
    if (words.some((w) => tokens.has(w)) || /no way|clip/.test(message.text.toLowerCase()) || /[😂🤣💀🔥]/u.test(message.text)) hype[second] += 1;
  }
  const rateZ = localZ(smooth(count, 5), window, 0.5);
  const score = rateZ.map((z, i) => clamp(z, 0, 6) + Math.min(3, hype[i] * 0.5));
  return { score, count };
}

/** Scene cuts → a small per-second bump (edited VODs, replays, deaths and respawns). */
export function sceneSignal(scenes, duration) {
  const length = Math.max(1, Math.ceil(duration));
  const score = new Array(length).fill(0);
  for (const scene of scenes) {
    const second = Math.floor(scene.t);
    if (second >= 0 && second < length) score[second] = Math.max(score[second], clamp(scene.score * 4, 0, 3));
  }
  return score;
}

export const DEFAULT_WEIGHTS = { loud: 1, speech: 0.8, chat: 1, scene: 0.4 };

/** Weighted sum of the available signals, smoothed over 3 seconds. */
export function combineSignals(signals, weights = DEFAULT_WEIGHTS) {
  const length = Math.max(...Object.values(signals).filter(Boolean).map((s) => s.length), 1);
  const total = new Array(length).fill(0);
  for (const [name, values] of Object.entries(signals)) {
    if (!values) continue;
    const weight = weights[name] ?? 1;
    for (let i = 0; i < values.length; i += 1) total[i] += weight * values[i];
  }
  return smooth(total, 3);
}

/** Word index at a sentence or breath boundary: punctuation, or a pause of ≥ 0.6 s. */
function boundaries(words) {
  const starts = [];
  const ends = [];
  words.forEach((word, i) => {
    const previous = words[i - 1];
    if (!previous || /[.!?]$/.test(previous.text) || word.start - previous.end >= 0.6) starts.push(word.start);
    const next = words[i + 1];
    if (!next || /[.!?]$/.test(word.text) || next.start - word.end >= 0.6) ends.push(word.end);
  });
  return { starts, ends };
}

function nearest(list, target, lo, hi) {
  let best = null;
  for (const value of list) {
    if (value < lo || value > hi) continue;
    if (best === null || Math.abs(value - target) < Math.abs(best - target)) best = value;
  }
  return best;
}

/**
 * Peak-pick up to `count` non-overlapping moments from a per-second score.
 * Each window puts its peak `pre` seconds in (setup before, payoff after),
 * snaps its edges to sentence boundaries when words exist (so nobody is cut
 * off mid-line) and stays within [min, max] seconds.
 */
export function pickMoments(score, {
  count = 12,
  length = 20,
  min = 8,
  max = 60,
  pre = Math.round(length * 0.6),
  gap = 4,
  threshold = 1,
  words = [],
  duration = score.length,
} = {}) {
  const post = Math.max(1, length - pre);
  const { starts, ends } = boundaries(words);
  const order = score.map((value, second) => ({ value, second })).sort((a, b) => b.value - a.value || a.second - b.second);
  const moments = [];
  for (const { value, second } of order) {
    if (moments.length >= count || value < threshold) break;
    const peak = second + 0.5;
    if (moments.some((m) => peak >= m.start - gap && peak <= m.end + gap)) continue;
    let start = clamp(peak - pre, 0, duration);
    let end = clamp(peak + post, 0, duration);
    const snappedStart = nearest(starts, start, start - 3, Math.min(start + 2, peak - 2));
    const snappedEnd = nearest(ends, end, Math.max(end - 2, peak + 1), end + 3);
    if (snappedStart !== null) start = Math.max(0, snappedStart - 0.15);
    if (snappedEnd !== null) end = Math.min(duration, snappedEnd + 0.25);
    if (end - start > max) end = start + max;
    if (end - start < min) {
      const grow = (min - (end - start)) / 2;
      start = clamp(start - grow, 0, duration);
      end = clamp(start + min, 0, duration);
    }
    if (moments.some((m) => start < m.end + gap && end > m.start - gap)) continue;
    moments.push({ start: round(start), end: round(end), peak: round(peak), score: round(value) });
  }
  return moments
    .sort((a, b) => b.score - a.score)
    .map((m, i) => ({ rank: i + 1, ...m, duration: round(m.end - m.start) }));
}

const round = (value) => Math.round(value * 100) / 100;

/** Strongest value of a signal inside a window. */
export function peakIn(values, start, end) {
  let best = 0;
  for (let s = Math.floor(start); s <= Math.min(values.length - 1, Math.floor(end)); s += 1) best = Math.max(best, values[s] ?? 0);
  return round(best);
}

/** The words spoken inside a window, trimmed for a reason line. */
export function quoteIn(words, start, end, limit = 220) {
  const text = words.filter((w) => w.start >= start && w.end <= end + 0.3).map((w) => w.text).join(" ").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

/** One plain sentence on why a moment was picked, from its strongest signals. */
export function describeMoment({ loud = 0, speech = 0, chat = 0, scene = 0 }, phrases = []) {
  const parts = [];
  if (loud >= 2) parts.push(loud >= 7 ? "a big volume spike" : "louder than usual");
  if (phrases.length) parts.push(`"${phrases.slice(0, 3).join('", "')}"`);
  else if (speech >= 2.5) parts.push("fast, excited talking");
  if (chat >= 1.5) parts.push(chat >= 4 ? "chat exploded" : "chat sped up");
  if (scene >= 1) parts.push("a hard cut on screen");
  if (!parts.length) return "Mild peak; check it before keeping.";
  const text = parts.join(", ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}
