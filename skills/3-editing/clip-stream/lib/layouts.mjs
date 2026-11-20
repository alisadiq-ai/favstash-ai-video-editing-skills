// 9:16 layouts for a landscape stream. Each builder returns an FFmpeg
// -filter_complex graph that reads [0:v] and ends in [v] at OUT_W×OUT_H.

export const OUT_W = 1080;
export const OUT_H = 1920;
export const LAYOUTS = ["center", "fill", "split"];

const even = (value) => Math.max(2, Math.round(value / 2) * 2);
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0.5));

/** "x:y:w:h" (source pixels) → {x, y, w, h}, or null when unreadable. */
export function parseBox(text) {
  if (!text) return null;
  const parts = String(text).split(/[:,x ]/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  const [x, y, w, h] = parts;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

/**
 * Fill a W×H frame from the source by scaling to cover and cropping, with
 * the crop window placed by `focus` (0 = left edge, 0.5 = centre, 1 = right).
 */
export function coverCrop(srcW, srcH, outW, outH, focus = 0.5) {
  const scale = Math.max(outW / srcW, outH / srcH);
  const w = even(srcW * scale);
  const h = even(srcH * scale);
  const x = Math.round((w - outW) * clamp01(focus));
  const y = Math.round((h - outH) / 2);
  return `scale=${w}:${h}:flags=lanczos,crop=${outW}:${outH}:${x}:${y}`;
}

/** Frame-rate cap: keep the source rate (60 fps gameplay stays smooth) up to `max`. */
export function fpsFilter(rate, max = 60) {
  const [n, d = 1] = String(rate ?? "").split("/").map(Number);
  const fps = d ? n / d : Number.NaN;
  return Number.isFinite(fps) && fps > max + 0.5 ? `,fps=${max}` : "";
}

/**
 * Build the video graph for one clip.
 * - center: crop a 9:16 window out of the frame at `focus`.
 * - fill: the whole frame, fitted to the width, over a blurred copy of itself
 *   (keeps the HUD, minimap and kill feed; smaller picture).
 * - split: the facecam box (`cam`, source pixels) on top, the game below.
 */
export function layoutFilter({ layout = "center", width, height, focus = 0.5, cam = null, camHeight = 640, zoom = 1, rate } = {}) {
  if (!width || !height) throw new Error("Source width and height are required");
  const tail = `${fpsFilter(rate)},setsar=1,format=yuv420p[v]`;
  if (layout === "center") {
    return `[0:v]${coverCrop(width, height, OUT_W, OUT_H, focus)}${tail}`;
  }
  if (layout === "fill") {
    // Blur at quarter size and scale back up: same look, a fraction of the cost.
    const fgW = even(OUT_W * Math.max(1, zoom));
    const fgH = even((height / width) * fgW);
    const fg = zoom > 1
      ? `scale=${fgW}:${fgH}:flags=lanczos,crop=${OUT_W}:${Math.min(fgH, OUT_H)}`
      : `scale=${OUT_W}:${even(Math.min(OUT_H, (height / width) * OUT_W))}:flags=lanczos`;
    return [
      `[0:v]split=2[bgsrc][fgsrc]`,
      `[bgsrc]${coverCrop(width, height, OUT_W / 4, OUT_H / 4)},boxblur=8:2,eq=brightness=-0.12:saturation=1.1,scale=${OUT_W}:${OUT_H}[bg]`,
      `[fgsrc]${fg}[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2${tail}`,
    ].join(";");
  }
  if (layout === "split") {
    if (!cam) throw new Error("The split layout needs --cam x:y:w:h (the facecam box in source pixels)");
    const camH = even(Math.min(OUT_H / 2, Math.max(320, camHeight)));
    const gameH = OUT_H - camH;
    const box = {
      x: Math.min(cam.x, width - 2), y: Math.min(cam.y, height - 2),
      w: even(Math.min(cam.w, width - cam.x)), h: even(Math.min(cam.h, height - cam.y)),
    };
    return [
      `[0:v]split=2[camsrc][gamesrc]`,
      `[camsrc]crop=${box.w}:${box.h}:${box.x}:${box.y},${coverCrop(box.w, box.h, OUT_W, camH)}[cam]`,
      `[gamesrc]${coverCrop(width, height, OUT_W, gameH, focus)}[game]`,
      `[cam][game]vstack=inputs=2${tail}`,
    ].join(";");
  }
  throw new Error(`Unknown layout "${layout}". Use one of: ${LAYOUTS.join(", ")}`);
}

/** A short, filesystem-safe name from a title. */
export function slugify(text, fallback = "moment") {
  const slug = String(text ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return slug || fallback;
}
