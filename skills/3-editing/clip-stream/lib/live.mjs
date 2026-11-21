// Pure helpers for watch-live: read streamlink's segment log, map live chat
// onto the recording, and plan each pass. No I/O here, so it is testable.

const QUEUED = /Queuing \w*HLSSegment\(num=(\d+),.*?duration=([\d.]+),.*?date=([0-9T:.\-+Z ]+)/;
const WRITTEN = /Writing segment (\d+) to output/;
const AD_TITLE = /title='?(Amazon|ad|stitched)/i;

/**
 * Follows streamlink's debug log line by line. Each written segment becomes
 * {num, pos, dur, date}: `pos` is where it starts in the recording (content
 * seconds, so skipped ads leave no gap) and `date` its broadcast time
 * (EXT-X-PROGRAM-DATE-TIME, epoch seconds).
 */
export function segmentTracker() {
  const queued = new Map();
  let pos = 0;
  return function feed(line) {
    const q = QUEUED.exec(line);
    if (q) {
      const date = Date.parse(q[3].trim().replace(" ", "T"));
      queued.set(Number(q[1]), { dur: Number(q[2]), date: Number.isFinite(date) ? date / 1000 : null, ad: AD_TITLE.test(line) });
      return null;
    }
    const w = WRITTEN.exec(line);
    if (!w) return null;
    const num = Number(w[1]);
    const meta = queued.get(num) ?? { dur: 2, date: null, ad: false };
    queued.delete(num);
    const segment = { num, pos: Math.round(pos * 1000) / 1000, dur: meta.dur, date: meta.date };
    pos += meta.dur;
    return segment;
  };
}

/** The last segment whose broadcast time is at or before `wall` (binary search). */
function segmentAt(segments, wall) {
  let lo = 0;
  let hi = segments.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].date <= wall) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

/**
 * Live chat ({wall, text}, wall = when the message arrived) → [{t, text}] on
 * the recording's timeline, through each segment's broadcast time. Messages
 * sent while the recording has nothing (a skipped ad break) are dropped.
 * Without broadcast times, falls back to `start` (wall time of the first byte).
 */
export function mapChatToRecording(messages, segments, { start = null, gapTolerance = 20 } = {}) {
  const dated = segments.filter((s) => Number.isFinite(s.date));
  const out = [];
  for (const m of messages) {
    if (!Number.isFinite(m.wall) || typeof m.text !== "string") continue;
    if (dated.length) {
      const k = segmentAt(dated, m.wall);
      if (k < 0) continue;
      const s = dated[k];
      const offset = m.wall - s.date;
      if (offset > s.dur + gapTolerance) continue;
      out.push({ t: Math.round((s.pos + offset) * 100) / 100, text: m.text });
    } else if (Number.isFinite(start) && m.wall >= start) {
      out.push({ t: Math.round((m.wall - start) * 100) / 100, text: m.text });
    }
  }
  return out;
}

/** Seconds of video recorded so far (end of the last written segment). */
export function recordedSeconds(segments) {
  const last = segments.at(-1);
  return last ? last.pos + last.dur : 0;
}

/**
 * The next window to analyse, once at least `fresh` new seconds are in: back up
 * `overlap` seconds so a moment on the seam is seen whole, and stay `margin`
 * seconds behind the live edge.
 */
export function nextWindow(lastTo, recorded, { overlap = 90, margin = 8, fresh = 60, minimum = 120 } = {}) {
  const to = recorded - margin;
  const from = Math.max(0, lastTo - overlap);
  return to - lastTo >= fresh && to - from >= minimum ? { from, to } : null;
}

/** True when moment `m` overlaps any already-cut moment. */
export function overlapsAny(m, cut) {
  return cut.some((c) => !(m.end <= c.start || m.start >= c.end));
}

/** One Twitch IRC line → a chat message, or null. Names are never kept. */
export function parseIrcLine(line, wall) {
  const at = line.indexOf(" PRIVMSG #");
  if (at < 0) return null;
  const rest = line.slice(at + 10);
  const colon = rest.indexOf(" :");
  if (colon < 0) return null;
  return { wall, text: rest.slice(colon + 2) };
}

/** "https://www.twitch.tv/Name/" or "twitch.tv/name" → "name"; anything else → null. */
export function twitchChannel(url) {
  const m = /(?:^|\/\/|\.)twitch\.tv\/([A-Za-z0-9_]{2,25})\/?(?:[?#].*)?$/.exec(String(url).trim());
  return m ? m[1].toLowerCase() : null;
}
