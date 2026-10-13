// one-camera reel builder: a sky world filmed by one continuous camera, where every scene turns into the next.
//
// Import from a run's build script (see scripts/example-build.mjs). Positions are frames at the reel fps; durations are
// seconds. Everything lands on one paused GSAP timeline registered as window.__timelines.main, and compile() writes a
// silent HyperFrames composition plus cues.json: one sound cue per visible event, timed to the first frame that shows
// it, for edit-video's sfx-sync mixer.
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const ONE_CAMERA_ASSETS = fileURLToPath(new URL("../assets/", import.meta.url));
const STUDIO = ".favstash-studio";
const GSAP_IN_RUNTIME = path.join("runtime", "node_modules", "gsap", "dist", "gsap.min.js");
const W = 1080;
const H = 1920;

export const TOKENS = {
  ink: "#141826", ink2: "#3d4158", muted: "#6c718c", accent: "#1e40af", accent2: "#5b9eff", coral: "#d4512a", peach: "#fff1e8",
  "sky-top": "#0a4c98", "sky-mid": "#3f88d6", "sky-bottom": "#d6e7f7", "page-top": "#f6f7fd", "page-bottom": "#e7ecfb",
  grad: "linear-gradient(100deg, #1e40af 0%, #3f6fe6 45%, #5b9eff 100%)",
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: 'Menlo, "SF Mono", Consolas, monospace',
  card: "0 30px 80px rgba(40, 50, 120, .18), 0 2px 0 rgba(20, 20, 60, .04)", "horizon-top": "1290px",
};

// Sound names map to edit-video's SFX pack (assets/sfx/). The mixer finds each file's own sync point.
export const SOUNDS = {
  pop: "curated/ui-pop.wav", click: "curated/ui-click.wav", swish: "curated/zoom-swish.wav", shutter: "curated/camera-shutter.wav",
  "shutter-light": "curated/camera-shutter-light.wav", impact: "curated/hook-impact.wav", riser: "curated/metallic-riser.wav",
  sparkle: "sparkle.wav", sub: "sub-impact.wav", ding: "clean-ding.wav", tick: "typing-tick.wav",
};

const IMAGE = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const VIDEO = new Set([".mp4", ".mov", ".webm", ".m4v"]);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const js = (value) => JSON.stringify(value);
const idOk = (id) => /^[a-z][a-z0-9-]*$/.test(id);

// 5x7 dot glyphs for dotNumber().
const GLYPHS = {
  0: "01110100011001110101110011000101110", 1: "00100011000010000100001000010001110", 2: "01110100010000100010001000100011111",
  3: "11111000100010000010000011000101110", 4: "00010001100101010010111110001000010", 5: "11111100001111000001000011000101110",
  6: "00110010001000011110100011000101110", 7: "11111000010001000100010000100001000", 8: "01110100011000101110100011000101110",
  9: "01110100011000101111000010001001100", "+": "00000001000010011111001000010000000", "%": "11000110010001000100010001001100011",
  $: "00100011111010001110001011111000100", x: "00000100010101000100010101000100000",
};

// The world sheet bobs with a 1.2 s sine yoyo; its offset at time t, so a hand-off starts exactly where it is.
function floatOffset(t) {
  const phase = (t % 2.4) / 1.2;
  const p = phase <= 1 ? phase : 2 - phase;
  return -24 * (1 - Math.cos(Math.PI * p)) / 2;
}

async function exists(target) {
  try { await fs.access(target); return true; } catch { return false; }
}

async function sha256(target) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of createReadStream(target)) hash.update(chunk);
  return hash.digest("hex");
}

// GSAP comes from the workspace runtime that edit-video's `init-workspace.mjs --install` prepares.
export async function findRuntimeGsap(...starts) {
  if (process.env.FAVSTASH_GSAP && await exists(process.env.FAVSTASH_GSAP)) return path.resolve(process.env.FAVSTASH_GSAP);
  for (const start of starts.filter(Boolean)) {
    let directory = path.resolve(start);
    for (;;) {
      const candidate = path.basename(directory) === STUDIO ? path.join(directory, GSAP_IN_RUNTIME) : path.join(directory, STUDIO, GSAP_IN_RUNTIME);
      if (await exists(candidate)) return candidate;
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  return null;
}

export class Reel {
  /**
   * @param {object} options
   * @param {string} options.output   new composition directory (must not exist)
   * @param {number} options.total    length in frames
   * @param {number} [options.fps=30]
   * @param {string|{plate:string}} [options.sky="day"]  "day" (procedural), "none" or { plate: "<image>" }
   * @param {object} [options.tokens] CSS token overrides (see TOKENS)
   * @param {string} [options.gsap]   path to gsap.min.js; otherwise found from the workspace runtime
   * @param {string} [options.workspace] where to look for .favstash-studio
   */
  constructor({ output, total, fps = 30, sky = "day", tokens = {}, gsap, workspace, title = "one-camera reel" } = {}) {
    if (!output) throw new Error("Reel needs an output directory.");
    if (!Number.isInteger(total) || total <= 0) throw new Error("Reel needs total, a positive whole number of frames.");
    if (fps !== 30) throw new Error("This tested builder runs at 30 fps.");
    Object.assign(this, { output: path.resolve(output), total, fps, sky, gsap, workspace, title });
    this.tokens = { ...TOKENS, ...tokens };
    this.ids = new Set();
    this.layers = [];          // screen-space scene layers, in paint order
    this.worldHtml = [];       // everything the camera films
    this.target = null;        // the container html() writes into
    this.init = [];            // gsap.set lines: frame-0 state
    this.tl = [];              // timeline lines
    this.cues = [];
    this.media = new Map();    // absolute source -> composition-relative path
    this.extraCss = [];
    this.cam = { x: W / 2, y: H / 2, s: 1 };
    this.camMoves = [];
    this.space = null;
    this.fills = new Map();   // placeholders filled at compile time (typed text, slides)
  }

  // ---------------------------------------------------------------- time, timeline and cue helpers
  // Round frame times down: a time rounded up past frame/fps would fire a set() one frame late.
  T(frame) { return Math.floor((frame / this.fps) * 10000 + 1e-6) / 10000; }
  frames(seconds) { return Math.round(seconds * this.fps); }
  claim(id) {
    if (!idOk(id)) throw new Error(`Use a lowercase id like "hook-1", not "${id}".`);
    if (this.ids.has(id)) throw new Error(`Duplicate id "${id}".`);
    this.ids.add(id);
    return id;
  }
  at(frame, label) {
    if (!Number.isInteger(frame) || frame < 0 || frame > this.total) throw new Error(`${label ?? "Frame"} ${frame} is outside 0..${this.total}.`);
    return frame;
  }
  set(sel, props, frame) {
    if (frame === 0) this.init.push(`gsap.set(${js(sel)},${js(props)});`);
    else this.tl.push(`tl.set(${js(sel)},${js(props)},${this.T(this.at(frame))});`);
  }
  initSet(sel, props) { this.init.push(`gsap.set(${js(sel)},${js(props)});`); }
  fromTo(sel, from, to, frame, dur, ease = "power2.out", extra = {}) {
    this.tl.push(`tl.fromTo(${js(sel)},${js(from)},${js({ ...to, ...extra, duration: dur, ease, immediateRender: false })},${this.T(this.at(frame))});`);
  }
  to(sel, props, frame, dur, ease = "power2.out", extra = {}) {
    this.tl.push(`tl.to(${js(sel)},${js({ ...props, ...extra, duration: dur, ease })},${this.T(this.at(frame))});`);
  }
  /** A sound on a frame. `frame` is the first frame that shows the event; gain is dB relative to the pack's suggested gain. */
  cue(sound, frame, { gain = 0, pan = 0, dur, label } = {}) {
    const file = SOUNDS[sound] ?? sound;
    if (frame < 0 || frame > this.total) return;
    this.cues.push({ t: this.T(frame), frame, sound: file, gain, pan, ...(dur ? { dur } : {}), ...(label ? { label } : {}) });
  }
  blurIn(sel, frame, { y = 30, blur = 16, dur = 0.38 } = {}) {
    this.fromTo(sel, { opacity: 0, y, filter: `blur(${blur}px)` }, { opacity: 1, y: 0, filter: "blur(0px)" }, frame, dur, "power3.out");
  }
  blurOut(sel, frame, { y = -30, blur = 12, dur = 0.25 } = {}) {
    this.to(sel, { opacity: 0, y, filter: `blur(${blur}px)` }, frame, dur, "power2.in");
  }
  pop(sel, frame, { from = 0.6, dur = 0.45, ease = "back.out(2)" } = {}) {
    this.fromTo(sel, { opacity: 0, scale: from }, { opacity: 1, scale: 1 }, frame, dur, ease);
  }
  /** Type text by revealing pre-built spans (seek-safe). */
  typed(sel, text, f0, f1, { tick = true } = {}) {
    const n = Math.max(1, text.length);
    const spans = [...text].map((c, k) => `<span class="tc" data-k="${k}" style="display:none">${esc(c)}</span>`).join("");
    for (let k = 0; k < n; k += 1) this.set(`${sel} .tc[data-k="${k}"]`, { display: "inline" }, Math.round(f0 + (f1 - f0) * (k / n)));
    if (tick) for (let f = f0; f < f1; f += 27) this.cue("tick", f + 1, { gain: -4, label: "typing" });
    return spans;
  }

  // ---------------------------------------------------------------- structure
  html(markup) {
    if (!this.target) throw new Error("Call html() inside reel.scene(...) or reel.world(...).");
    this.target.push(markup);
  }
  css(text) { this.extraCss.push(text); }
  fill(key) { return `__FILL__${key}__`; }
  /** A screen-space layer visible from start to end. Components called inside fn are added to it. */
  scene(id, start, end, fn, { page = false } = {}) {
    this.claim(id);
    this.at(start, `${id} start`); this.at(end, `${id} end`);
    if (end <= start) throw new Error(`Scene ${id} must end after it starts.`);
    const layer = { id, html: [], page };
    this.layers.push(layer);
    this.set(`#${id}`, { opacity: 1 }, start);
    if (end < this.total) this.set(`#${id}`, { opacity: 0 }, end);
    const previous = this.target;
    this.target = layer.html;
    try { fn?.(); } finally { this.target = previous; }
    return layer;
  }
  /** Things the camera films. World coordinates are pixels on a 1080x1920 plane the camera moves over. */
  world(fn) {
    const previous = this.target;
    this.target = this.worldHtml;
    try { fn(); } finally { this.target = previous; }
  }

  // ---------------------------------------------------------------- the camera: a world point P lands at 540 + S * (P - X)
  cameraSet({ x = W / 2, y = H / 2, scale = 1 }) {
    this.cam = { x, y, s: scale };
    this.initSet("#camT", { x: W / 2 - x, y: H / 2 - y });
    this.initSet("#camS", { scale });
  }
  camera(frame, dur, { x = this.cam.x, y = this.cam.y, scale = this.cam.s }, ease = "power3.inOut", { swish = true } = {}) {
    const last = this.camMoves.at(-1);
    if (last && frame < last.end) throw new Error(`Camera moves must not overlap (frame ${frame} starts before ${last.end}).`);
    this.to("#camT", { x: W / 2 - x, y: H / 2 - y }, frame, dur, ease);
    this.to("#camS", { scale }, frame, dur, ease);
    const end = frame + this.frames(dur);
    this.camMoves.push({ start: frame, end, from: { ...this.cam }, to: { x, y, s: scale } });
    this.cam = { x, y, s: scale };
    if (swish) this.cue("swish", frame + Math.round(this.frames(dur) * (ease.endsWith(".in") ? 0.9 : ease.endsWith(".out") ? 0.15 : 0.5)), { gain: -3, label: "camera move" });
  }
  /** Where the camera is at a frame when no move is running. */
  cameraAt(frame) {
    let state = this.camMoves[0]?.from ?? this.cam;
    for (const move of this.camMoves) {
      if (frame >= move.end) state = move.to;
      else if (frame > move.start) throw new Error(`cameraAt(${frame}) falls inside a camera move; pick a frame after it settles.`);
    }
    return state;
  }
  toScreen(point, frame) {
    const { x, y, s } = this.cameraAt(frame);
    return { x: W / 2 + s * (point.x - x), y: H / 2 + s * (point.y - y), s };
  }

  // ---------------------------------------------------------------- the opening: hook lines, the hero sheet, the fly-through
  // The sheet is tilted, so the auditor sees its stacked lines' boxes overlap; the title and subtitle are marked for that.
  sheetMarkup(id, { title, subtitle = "", steps = [], tab = "SKILL.md" }) {
    return `<div id="${id}" class="sheet"><div class="tab">${esc(tab)}</div><div class="st" data-layout-allow-overlap>${esc(title)}</div>`
      + (subtitle ? `<div class="ss" data-layout-allow-overlap>${esc(subtitle)}</div>` : "")
      + `<ol>${steps.map((s, k) => `<li><b>${k + 1}</b>${esc(s)}</li>`).join("")}</ol></div>`;
  }
  /** The hero object, placed in the world at its centre (x, y). Render it as a clean sheet; never raw syntax. */
  sheet(id, spec, { x = W / 2, y = H / 2, rotation = -6, glow = true, float = true } = {}) {
    this.claim(id);
    this.sheets ??= {};
    this.sheets[id] = { spec, x, y, rotation, float };
    this.lastSheetTab = spec.tab ?? "SKILL.md";
    this.html(`<div id="${id}-wrap" style="position:absolute;left:${x - 200}px;top:${y - 250}px;width:400px;height:500px">`
      + (glow ? `<div id="${id}-halo" class="halo" style="left:-250px;top:-200px" data-layout-allow-overflow></div>` : "")
      + this.sheetMarkup(id, spec) + `<div id="${id}-sel" class="select" style="left:-14px;top:-14px;width:428px;height:528px"><i></i><i></i><i></i><i></i></div></div>`);
    this.initSet(`#${id}`, { rotation });
    if (float) this.tl.push(`tl.to(${js(`#${id}`)},{y:-24,duration:1.2,ease:"sine.inOut",yoyo:true,repeat:${Math.max(1, Math.floor(this.total / 36) - 1)}},0);`);
  }
  /** Big hook lines on the sky. kind: "static" (on screen from frame 0), "blur" or "pop" (on their word's frame). */
  hook(id, lines) {
    this.claim(id);
    let top = 236;
    const parts = lines.map((line, k) => {
      const lid = `${id}-${k}`;
      const size = line.size ?? 96;
      const y = line.top ?? top;
      top = y + size * 1.12;
      return `<div id="${lid}" class="hookline" style="top:${y}px;font-size:${size}px${line.kind === "static" || !line.kind ? "" : ";opacity:0"}">${line.html}</div>`;
    });
    this.html(`<div id="${id}">${parts.join("")}</div>`);
    if (!this.cues.some((c) => c.label === "opening")) this.cue("impact", 0, { gain: -6, label: "opening" });
    lines.forEach((line, k) => {
      const sel = `#${id}-${k}`;
      const kind = line.kind ?? "static";
      if (kind === "static") this.fromTo(sel, { y: 10 }, { y: 0 }, 0, 0.6);
      else if (kind === "blur") { this.blurIn(sel, line.at, { y: 14, blur: 8, dur: 0.3 }); this.cue("pop", line.at + 1, { gain: -10, label: `hook line ${k}` }); }
      else if (kind === "pop") {
        this.fromTo(sel, { opacity: 0, scale: 0.6, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, line.at, 0.4, "back.out(1.6)");
        this.cue("pop", line.at + 1, { gain: -2, label: `hook word ${k}` });
      } else throw new Error(`Unknown hook line kind "${kind}".`);
    });
  }
  /** The hook rushes past the lens as the camera starts to fly. */
  passLens(id, frame) {
    this.to(`#${id}`, { scale: 2.6, opacity: 0, filter: "blur(14px)" }, frame, 0.28, "power2.in");
    this.cue("swish", frame + 8, { gain: -2, label: "hook passes the lens" });
  }
  /** A glass tag that pops at the camera, gets struck through and rushes past ("Not an editor."). */
  strikeTag(id, text, { at, strike, out, x = W / 2, y = 760 }) {
    this.claim(id);
    this.html(`<div id="${id}" class="tag" style="left:${x}px;top:${y}px;opacity:0"><span class="x"></span><span class="w" data-layout-allow-overlap>${esc(text)}<s></s></span></div>`);
    this.initSet(`#${id}`, { xPercent: -50, yPercent: -50 });
    this.initSet(`#${id} s`, { scaleX: 0 });
    this.fromTo(`#${id}`, { opacity: 0, scale: 0.32, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, at, 0.26);
    this.cue("pop", at + 1, { gain: -2, label: `${text} arrives` });
    this.to(`#${id} s`, { scaleX: 1 }, strike, 0.18);
    this.fromTo(`#${id} .x`, { scale: 0.4, rotation: -90 }, { scale: 1, rotation: 0 }, strike, 0.25, "back.out(2.6)");
    this.cue("click", strike, { gain: -2, label: `${text} struck` });
    this.to(`#${id}`, { scale: 2.8, opacity: 0, filter: "blur(12px)" }, out, 0.2, "power2.in");
    this.cue("swish", out + 5, { gain: -6, label: `${text} rushes past` });
  }
  /** Cloud puffs streaming past the lens during a fly-through. */
  puffs(id, frame, count = 4, spacing = 12) {
    this.claim(id);
    const paths = [[-980, -380], [1000, -160], [-900, 420], [940, 300], [-700, -620], [760, 620]];
    const items = [];
    for (let k = 0; k < count; k += 1) {
      const [ex, ey] = paths[k % paths.length];
      const sel = `#${id}-${k}`;
      items.push(`<div id="${id}-${k}" class="puff" style="left:190px;top:750px;opacity:0"></div>`);
      const t0 = frame + k * spacing;
      this.fromTo(sel, { opacity: 0, scale: 0.22, x: ex * 0.06, y: ey * 0.06 }, { opacity: 0.92, scale: 1.25, x: ex * 0.35, y: ey * 0.35 }, t0, 0.32, "power1.in");
      this.to(sel, { opacity: 0, scale: 3.6, x: ex, y: ey }, t0 + 10, 0.3, "power2.in");
    }
    this.html(items.join(""));
  }
  /** Selection box and cursor on a world sheet: "Just this." */
  select(id, frame) {
    this.fromTo(`#${id}-sel`, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1 }, frame, 0.3, "power3.out");
    this.cue("click", frame + 1, { gain: -2, label: "selection" });
  }
  hideSelect(id, frame) { this.to(`#${id}-sel`, { opacity: 0 }, frame, 0.15); }

  // ---------------------------------------------------------------- narration on screen
  /** A glass pill caption for narration over the sky. */
  pill(id, text, frame, out, { x = W / 2, y = 1430, big = false } = {}) {
    this.claim(id);
    this.html(`<div id="${id}" class="pill${big ? " big" : ""}" style="left:${x}px;top:${y}px;opacity:0">${text}</div>`);
    this.blurIn(`#${id}`, frame, { y: 20, blur: 10 });
    this.cue("pop", frame + 1, { gain: -10, label: "pill" });
    if (out) this.blurOut(`#${id}`, out);
  }
  /** A centred statement line. `light` for white type on sky or space. highlight = { word index, at, color }. */
  statement(id, html, frame, out, { y = 700, size = 72, light = true, highlight } = {}) {
    this.claim(id);
    this.html(`<div id="${id}" class="statement${light ? " light" : ""}" style="top:${y}px;font-size:${size}px;opacity:0">${html}</div>`);
    this.blurIn(`#${id}`, frame, { y: 16, blur: 10 });
    if (highlight) {
      this.set(`#${id} .hl`, { backgroundColor: highlight.color ?? "#2f5fe0" }, highlight.at);
      this.cue("click", highlight.at, { gain: -6, label: "highlight" });
    }
    if (out) this.blurOut(`#${id}`, out);
  }
  /** The big slam word ("no way."). Lands on its first visible frame with an impact. */
  slam(id, text, frame, { y = 850, size = 220 } = {}) {
    this.claim(id);
    this.html(`<div id="${id}" class="slam" style="top:${y}px;font-size:${size}px;opacity:0">${esc(text)}</div>`);
    this.fromTo(`#${id}`, { opacity: 0, scale: 1.35, filter: "blur(30px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, frame - 1, 0.4, "power3.out");
    this.cue("impact", frame, { gain: 0, label: "slam" });
    if (this.space) this.to("#space .horizon", { boxShadow: "0 -2px 0 1px rgba(220,235,255,1), 0 -40px 120px 20px rgba(80,140,255,1), 0 -160px 300px 80px rgba(60,110,255,.6)" }, frame, 0.3);
  }

  // ---------------------------------------------------------------- the laptop: the object goes in, the screen opens something
  laptop(id, { y = 720, app = "Claude Code", placeholder = "Ask anything…" } = {}) {
    this.claim(id);
    this.laptops ??= {};
    this.laptops[id] = { y };
    this.html(`<div id="${id}-wrap" class="lapwrap"><div id="${id}" class="laptop" style="top:${y}px">`
      + `<div class="lid"><span class="cam"></span><div id="${id}-screen" class="screen">`
      + `<div id="${id}-app" class="view app"><div class="side"><i></i><i></i><i></i></div><div class="main"><div class="mark"></div>`
      + `<div class="in"><span id="${id}-chip" class="chip"><i></i>${esc(this.lastSheetTab ?? "SKILL.md")}</span>${esc(placeholder)}<b></b></div></div></div>`
      + `<div id="${id}-poster" class="view poster" style="opacity:0"><div class="play"></div><b id="${id}-poster-title"></b><span id="${id}-poster-label"></span></div>`
      + `<div id="${id}-slides" class="view" style="opacity:0">${this.fill(`${id}-slides`)}</div><div id="${id}-bar" class="bar"><i></i></div>`
      + `</div></div><div class="hinge"></div><div class="base"><span class="notch"></span></div></div></div>`);
    this.laptops[id].app = app;
  }
  /** Laptop rises out of the clouds. */
  laptopRise(id, frame) {
    this.fromTo(`#${id}`, { y: 1300, rotateX: 24 }, { y: 0, rotateX: 0 }, frame, 0.62, "power3.out");
    this.cue("swish", frame + 4, { gain: -3, label: "laptop rises" });
  }
  inputRect(laptopId) {
    const top = this.laptops[laptopId].y;
    return { x: 340, y: top + 268, w: 520, h: 110 };
  }
  /** The world sheet lifts, is let go and falls into the laptop screen, becoming the file chip in the input. */
  dropInto(sheetId, laptopId, frame) {
    const sheet = this.sheets?.[sheetId];
    if (!sheet || !this.laptops?.[laptopId]) throw new Error("dropInto needs a sheet() and a laptop() created earlier.");
    if (!this.target) throw new Error("Call dropInto inside the laptop's scene.");
    const bob = sheet.float ? floatOffset(frame / this.fps) : 0;
    const start = this.toScreen({ x: sheet.x, y: sheet.y + bob }, frame);
    const id = this.claim(`${sheetId}-drop`);
    this.html(`<div id="${id}" style="position:absolute;left:${start.x - 200}px;top:${start.y - 250}px;width:400px;height:500px;opacity:0;transform-origin:50% 50%">`
      + this.sheetMarkup(`${id}-sheet`, sheet.spec).replace('class="sheet"', 'class="sheet" style="left:0;top:0"') + "</div>");
    this.initSet(`#${id}`, { scale: start.s, rotation: sheet.rotation });
    this.set(`#${id}`, { opacity: 1 }, frame);
    this.set(`#${sheetId}-wrap`, { opacity: 0 }, frame);
    const input = this.inputRect(laptopId);
    const target = { x: input.x + 100, y: input.y + 32 };
    const fly = 0.5;
    const land = frame + this.frames(fly);
    this.to(`#${id}`, { x: target.x - start.x }, frame, fly, "power2.inOut");
    this.to(`#${id}`, { y: target.y - start.y }, frame, fly, "power3.in");
    this.to(`#${id}`, { scale: 0.074 }, frame, fly, "power2.in");
    this.to(`#${id}`, { rotation: 7 }, frame, fly * 0.6, "sine.inOut");
    this.to(`#${id}`, { opacity: 0 }, land - 2, 0.07);
    this.fromTo(`#${laptopId}-chip`, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1 }, land - 2, 0.32, "back.out(2.4)");
    this.fromTo(`#${laptopId}-screen`, { boxShadow: "0 0 0 0 rgba(91,158,255,0)" }, { boxShadow: "0 0 60px 10px rgba(91,158,255,.9)" }, land, 0.15, "power2.out", { yoyo: true, repeat: 1 });
    this.cue("swish", land - 2, { gain: -2, label: "sheet falls in" });
    this.cue("pop", land - 1, { gain: 0, label: "chip lands" });
    this.cue("ding", land, { gain: -8, label: "screen glows" });
    return land;
  }
  /** A prompt card (screen space) the laptop's input box grows into. */
  promptCard(id, { chip = "Opus" } = {}) {
    this.claim(id);
    this.html(`<div id="${id}" class="prompt" style="opacity:0"><div id="${id}-text" class="text">${this.fill(`${id}-text`)}</div>`
      + `<div class="row"><span class="chip">${esc(chip)}</span><span id="${id}-send" class="send"><span id="${id}-ring" class="ring"></span></span></div></div>`);
  }
  /** Dive into the screen: the laptop scales until its input box is the prompt card. */
  diveIn(laptopId, promptId, frame) {
    const input = this.inputRect(laptopId);
    const s = 900 / input.w;
    this.to(`#${laptopId}-wrap`, { scale: s, x: 90 - s * input.x, y: 760 - s * input.y }, frame, 0.42, "power3.in");
    this.fromTo(`#${promptId}`, { opacity: 0, scale: 0.93 }, { opacity: 1, scale: 1 }, frame + 10, 0.3);
    this.to(`#${laptopId}-wrap`, { opacity: 0 }, frame + 12, 0.12);
    this.cue("swish", frame + 11, { gain: -2, label: "dive into the screen" });
  }
  typePrompt(id, text, f0, f1) {
    this.fills.set(`${id}-text`, this.typed(`#${id}-text`, text, f0, f1) + '<span class="caret"></span>');
  }
  /** Push in on the send button and press it on `frame` (the spoken "enter"). */
  press(id, frame) {
    // The card (left 90, top 760, 900x300) scales about its centre (540, 910); its send button sits at (910, 990).
    // Land the button right of centre at (760, 1000) so the end of the prompt stays readable beside it.
    const s = 2.3;
    this.to(`#${id}`, { scale: s, x: 760 - (540 + s * (910 - 540)), y: 1000 - (910 + s * (990 - 910)) }, frame - 22, 0.42, "power3.inOut");
    this.cue("swish", frame - 16, { gain: -6, label: "push in on send" });
    this.to(`#${id}-send`, { scale: 0.8 }, frame - 1, 0.06, "power1.in");
    this.to(`#${id}-send`, { scale: 1.12, backgroundColor: "#2f5fe0" }, frame + 1, 0.16, "back.out(3)");
    this.to(`#${id}-send`, { scale: 1 }, frame + 7, 0.2);
    this.fromTo(`#${id}-ring`, { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 2.6 }, frame + 1, 0.45);
    this.cue("click", frame, { gain: 2, label: "send pressed" });
    this.cue("pop", frame + 2, { gain: -8, label: "send turns blue" });
  }
  /** Pull back out of the screen: the laptop returns showing a poster with a play button. */
  pullOut(promptId, laptopId, frame, { title = "Launch video", label = "EXAMPLE" } = {}) {
    this.to(`#${promptId}`, { opacity: 0, scale: 1.6, filter: "blur(8px)" }, frame - 5, 0.14, "power2.in");
    this.set(`#${laptopId}-app`, { opacity: 0 }, frame - 4);
    this.set(`#${laptopId}-poster`, { opacity: 1 }, frame - 4);
    this.set(`#${laptopId}-poster-title`, { textContent: title }, 0);
    this.set(`#${laptopId}-poster-label`, { textContent: label }, 0);
    this.to(`#${laptopId}-wrap`, { opacity: 1 }, frame - 3, 0.16);
    this.to(`#${laptopId}-wrap`, { scale: 1, x: 0, y: 0 }, frame - 4, 0.62, "power3.out");
    this.cue("swish", frame - 1, { gain: -2, label: "pull back out" });
  }
  /** Play an example inside the laptop: slides = [{ html, at }] or [{ media: "<image|video>", at }], with a progress bar. */
  play(laptopId, f0, f1, slides, { tag } = {}) {
    if (!slides?.length) throw new Error("play() needs at least one slide.");
    this.to(`#${laptopId}-poster .play`, { scale: 0.8 }, f0 - 3, 0.08, "power1.inOut", { yoyo: true, repeat: 1 });
    this.cue("click", f0 - 1, { gain: -4, label: "play" });
    this.set(`#${laptopId}-poster`, { opacity: 0 }, f0);
    this.set(`#${laptopId}-slides`, { opacity: 1 }, f0);
    this.set(`#${laptopId}-bar`, { opacity: 1 }, f0);
    this.fromTo(`#${laptopId}-bar i`, { scaleX: 0 }, { scaleX: 1 }, f0, (f1 - f0) / this.fps, "none");
    const markup = slides.map((slide, k) => {
      const sid = `${laptopId}-s${k}`;
      const until = slides[k + 1]?.at ?? f1;
      // The first slide replaces the poster on the same frame (no blank screen); later ones fade in.
      if (k === 0) { this.set(`#${sid}`, { opacity: 1 }, slide.at); this.fromTo(`#${sid}`, { scale: 1.04 }, { scale: 1 }, slide.at, 0.25); }
      else this.fromTo(`#${sid}`, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1 }, slide.at, 0.25);
      // Each slide fades out just before the next one arrives, so two slides never share the screen.
      if (k + 1 < slides.length) this.to(`#${sid}`, { opacity: 0, scale: 0.98 }, Math.max(slide.at + 8, until - 5), 0.15, "power2.in");
      if (k) this.cue("pop", slide.at + 1, { gain: -10, label: `slide ${k}` });
      if (slide.media) {
        const ext = path.extname(slide.media).toLowerCase();
        const src = this.useMedia(slide.media);
        const clip = VIDEO.has(ext)
          ? `<video class="clip" src="${src}" data-start="${this.T(slide.at)}" data-duration="${this.T(until - slide.at)}" data-track-index="1" muted playsinline></video>`
          : `<img src="${src}" alt="">`;
        return `<div id="${sid}" class="slide" style="padding:0">${clip}</div>`;
      }
      return `<div id="${sid}" class="slide">${slide.html}</div>`;
    }).join("");
    this.fills.set(`${laptopId}-slides`, markup);
    if (tag) {
      const tid = this.claim(`${laptopId}-tag`);
      this.html(`<div id="${tid}" class="extag" style="top:${this.laptops[laptopId].y - 90}px;opacity:0">${esc(tag)}</div>`);
      this.pop(`#${tid}`, f0, { from: 0.8, dur: 0.3 });
      this.to(`#${tid}`, { opacity: 0 }, f1 - 6, 0.2);
    }
  }
  /** Frames stream out of a fresh sheet and into the laptop screen ("Every frame came from that one file"). */
  stream(id, laptopId, frame, { count = 7, spec } = {}) {
    this.claim(id);
    const ly = this.laptops[laptopId].y;
    const screenCentre = { x: 540, y: ly + 280 };
    this.html(`<div id="${id}" style="position:absolute;left:600px;top:300px;width:400px;height:500px;opacity:0">`
      + this.sheetMarkup(`${id}-sheet`, spec ?? this.sheets?.[Object.keys(this.sheets ?? {})[0]]?.spec ?? { title: "One file" }).replace('class="sheet"', 'class="sheet" style="left:0;top:0"')
      + "</div>");
    this.fromTo(`#${id}`, { opacity: 0, scale: 0.12, x: screenCentre.x - 800, y: screenCentre.y - 550, rotation: 0 },
      { opacity: 1, scale: 1, x: 0, y: 0, rotation: 4 }, frame - 3, 0.6, "power3.out");
    this.cue("sparkle", frame - 2, { gain: -2, label: "the file floats out" });
    const minis = [];
    for (let k = 0; k < count; k += 1) {
      const mid = `${id}-f${k}`;
      minis.push(`<div id="${mid}" class="frame-mini" style="left:725px;top:417px;opacity:0"></div>`);
      const t0 = frame + 18 + k * 3;
      const dx = (k - (count - 1) / 2) * 100 - 60;
      this.fromTo(`#${mid}`, { opacity: 0, x: 0, y: 0, scale: 0.5, rotation: 0 }, { opacity: 1, x: dx, y: 250, scale: 1, rotation: (k - 3) * 5 }, t0, 0.26);
      this.to(`#${mid}`, { x: screenCentre.x - 800, y: screenCentre.y - 550, scale: 0.22, rotation: 0 }, t0 + 8, 0.32, "power2.in");
      this.to(`#${mid}`, { opacity: 0 }, t0 + 16, 0.06);
      this.cue("shutter-light", t0 + 16, { gain: -6, pan: k % 2 ? -0.3 : 0.3, label: `frame ${k} lands` });
    }
    this.html(minis.join(""));
  }

  // ---------------------------------------------------------------- space: rise out of the sky, then dive back down
  /** The camera rises into space. `sink` = selectors of layers that fall away with the sky. */
  riseToSpace(frame, { sink = [], horizonTop = 1290 } = {}) {
    this.space = { horizonTop };
    this.initSet("#space .horizon", { top: horizonTop });
    this.to("#sky", { y: 950 }, frame, 0.65, "power2.in");
    for (const sel of sink) this.to(sel, { y: 1400 }, frame, 0.65, "power2.in");
    this.set("#space", { opacity: 1, y: -2000 }, frame);
    this.to("#space", { y: 0 }, frame, 0.72, "power2.inOut");
    // The rim arrives while the sky is still leaving, so no frame goes black; its dark body stays clear until the sky has gone.
    this.fromTo("#space .horizon", { opacity: 0, y: 240 }, { opacity: 1, y: 0 }, frame + 10, 0.85, "power3.out");
    this.to("#space .horizon", { backgroundColor: "rgba(3,5,12,1)" }, frame + 13, 0.3, "power1.in");
    this.cue("riser", frame + 22, { gain: -4, label: "rise into space" });
  }
  diveDown(frame, { unsink = [] } = {}) {
    this.to("#space .horizon", { opacity: 0, y: 500 }, frame - 2, 0.25, "power2.in");
    this.to("#space", { y: -2000 }, frame, 0.6, "power2.inOut");
    this.set("#space", { opacity: 0 }, Math.min(this.total, frame + 19));
    this.to("#sky", { y: 0 }, frame + 2, 0.6, "power2.out");
    for (const sel of unsink) this.to(sel, { y: 0 }, frame + 2, 0.6, "power2.out");
    this.cue("sub", frame + 4, { gain: -4, label: "dive down" });
    this.cue("swish", frame + 9, { gain: -3, label: "dive down" });
  }
  /** A sheet falls in spinning ("Want it?"). */
  fall(id, spec, frame, { x = W / 2, y = 1010 } = {}) {
    this.claim(id);
    this.html(`<div id="${id}" style="position:absolute;left:${x - 200}px;top:${y - 250}px;width:400px;height:500px;perspective:1200px">`
      + `<div id="${id}-spin" style="position:absolute;inset:0;transform-style:preserve-3d">`
      + this.sheetMarkup(`${id}-sheet`, spec).replace('class="sheet"', 'class="sheet" style="left:0;top:0;backface-visibility:hidden"') + "</div></div>");
    this.initSet(`#${id}`, { y: -1150 });
    this.to(`#${id}`, { y: 0 }, frame, 0.55, "power3.out");
    this.fromTo(`#${id}-spin`, { rotationY: -320 }, { rotationY: 0 }, frame, 0.7, "power2.out", { transformPerspective: 1400 });
  }

  // ---------------------------------------------------------------- the CTA: bloom, follow, comment, flip to the DM, drop
  /** Reveal a scene layer with a growing circle from (x, y). Call before or after scene() with that layer's id. */
  bloom(sceneId, frame, { x = 540, y = 884 } = {}) {
    this.initSet(`#${sceneId}`, { clipPath: `circle(0px at ${x}px ${y}px)` });
    this.to(`#${sceneId}`, { clipPath: `circle(1500px at ${x}px ${y}px)` }, frame, 0.55, "power2.inOut");
    this.cue("sparkle", frame + 1, { gain: -4, label: "bloom" });
    this.cue("swish", frame + 8, { gain: -6, label: "bloom" });
  }
  profileCard(id, { handle = "@yourhandle", bio = "Short videos, built with AI", initials = "YH", avatar, top = 520 } = {}) {
    this.claim(id);
    const face = avatar ? `<img src="${this.useMedia(avatar)}" alt="">` : esc(initials);
    this.html(`<div id="${id}" class="card" style="top:${top}px"><div class="who"><div class="avatar">${face}</div><div><div class="handle">${esc(handle)}</div>`
      + `<div class="bio">${esc(bio)}</div></div></div><div id="${id}-follow" class="follow">Follow</div><div class="grid"><i></i><i></i><i></i></div>`
      + `<div class="comment"><span id="${id}-typed" class="typed">${this.fill(`${id}-typed`)}</span><span id="${id}-ph">Add a comment…</span><span id="${id}-post" class="post">Post</span></div></div>`);
  }
  profileIn(id, frame) {
    this.fromTo(`#${id}`, { opacity: 0, scale: 0.47, y: -111 }, { opacity: 1, scale: 1, y: 0 }, frame, 0.5, "power3.out");
  }
  /** Follow becomes Following on `frame`. */
  follow(id, frame) {
    this.to(`#${id}-follow`, { scale: 0.94 }, frame - 2, 0.08, "power1.inOut", { yoyo: true, repeat: 1 });
    this.set(`#${id}-follow`, { className: "follow on", textContent: "Following ✓" }, frame);
    this.cue("click", frame, { gain: 2, label: "follow" });
  }
  comment(id, keyword, f0, f1, postAt) {
    this.set(`#${id}-ph`, { display: "none" }, f0);
    this.fills.set(`${id}-typed`, this.typed(`#${id}-typed`, keyword, f0, f1));
    this.set(`#${id}-post`, { opacity: 1 }, postAt);
    this.cue("click", postAt, { gain: -2, label: "comment posted" });
  }
  /** Flip one card into another, edge-on at `frame`. */
  flip(fromSel, toSel, frame) {
    this.to(fromSel, { rotationY: 90 }, frame - 7, 0.22, "power2.in", { transformPerspective: 3200 });
    this.set(fromSel, { opacity: 0 }, frame);
    this.set(toSel, { opacity: 1 }, frame);
    this.fromTo(toSel, { rotationY: -90 }, { rotationY: 0 }, frame, 0.32, "power2.out", { transformPerspective: 3200 });
    this.cue("swish", frame, { gain: -2, label: "flip" });
  }
  dmThread(id, { handle = "@yourhandle", initials = "YH", keyword = "KEYWORD", reply = "Here it is!", file = "your-file.md", top = 560 } = {}) {
    this.claim(id);
    this.html(`<div id="${id}" class="card dm" style="top:${top}px;opacity:0"><div class="who"><div class="avatar" style="width:72px;height:72px;font-size:30px">${esc(initials)}</div>`
      + `<div class="handle" style="font-size:34px">${esc(handle)}</div></div>`
      + `<div id="${id}-k" class="bubble me" style="opacity:0">${esc(keyword)}</div><div id="${id}-r" class="bubble them" style="opacity:0">${esc(reply)}</div>`
      + `<div id="${id}-f" class="file" style="opacity:0"><i></i>${esc(file)}</div></div>`);
  }
  dmPlay(id, { keywordAt, replyAt, fileAt }) {
    this.pop(`#${id}-k`, keywordAt, { from: 0.6, dur: 0.35 }); this.cue("pop", keywordAt + 1, { gain: -6, label: "keyword bubble" });
    this.pop(`#${id}-r`, replyAt, { from: 0.6, dur: 0.35 }); this.cue("pop", replyAt + 1, { gain: -6, label: "reply" });
    this.pop(`#${id}-f`, fileAt, { from: 0.7, dur: 0.35 }); this.cue("ding", fileAt + 1, { gain: -2, label: "file arrives" });
  }
  /** Shrink an element and drop it into a point (the DM card drops into the next scene). */
  dropTo(sel, frame, { x, y, rotation = -14 }) {
    this.to(sel, { scale: 0.18, x, y, rotation }, frame - 8, 0.32, "power3.in");
    this.to(sel, { opacity: 0 }, frame, 0.06);
    this.cue("swish", frame - 1, { gain: -4, label: "drop" });
  }

  // ---------------------------------------------------------------- FOMO pieces and the end card
  /** A number built from glowing dots ("200"). Characters: 0-9 + % $ x. */
  dotNumber(id, text, frame, { top = 700 } = {}) {
    this.claim(id);
    const glyphs = [...String(text)].map((ch) => {
      const bits = GLYPHS[ch];
      if (!bits) throw new Error(`dotNumber cannot draw "${ch}".`);
      return `<div class="glyph">${[...bits].map((b) => `<i class="${b === "1" ? "on" : "off"}"></i>`).join("")}</div>`;
    }).join("");
    this.html(`<div id="${id}" class="dots" style="top:${top}px">${glyphs}</div>`);
    this.initSet(`#${id} i.on`, { opacity: 0, scale: 0 });
    this.tl.push(`tl.to(${js(`#${id} i.on`)},{opacity:1,scale:1,duration:.22,ease:"back.out(3)",stagger:{each:.008,from:"start"}},${this.T(frame)});`);
    this.cue("sparkle", frame + 1, { gain: 0, label: "number forms" });
  }
  ticket(id, { label = "FIRST 200", value = "FREE", labelAfter = "AFTER 200", valueAfter = "PAID", top = 900 } = {}) {
    this.claim(id);
    this.tickets ??= {};
    this.tickets[id] = { labelAfter, valueAfter };
    this.html(`<div id="${id}" class="ticket" style="top:${top}px;opacity:0"><small id="${id}-l">${esc(label)}</small><b id="${id}-v">${esc(value)}</b></div>`
      + `<div id="${id}-lens" class="lens" style="left:230px;top:${top + 20}px;opacity:0"></div>`);
  }
  ticketIn(id, frame) { this.pop(`#${id}`, frame, { from: 0.7, ease: "back.out(1.8)" }); this.cue("pop", frame + 1, { gain: 0, label: "ticket" }); }
  lensSweep(id, f0, f1) {
    this.fromTo(`#${id}-lens`, { opacity: 0, x: -160, y: 60 }, { opacity: 1, x: 0, y: 0 }, f0, 0.3);
    this.to(`#${id}-lens`, { x: 280 }, f0 + 9, (f1 - f0 - 9) / this.fps, "power1.inOut");
    this.cue("swish", f0 + 2, { gain: -8, label: "lens" });
  }
  /** The ticket stamps to its second value on `frame` (a hard cut, with a short wobble). */
  stamp(id, frame) {
    const { labelAfter, valueAfter } = this.tickets[id];
    this.set(`#${id}`, { className: "ticket paid" }, frame);
    this.set(`#${id}-l`, { textContent: labelAfter }, frame);
    this.set(`#${id}-v`, { textContent: valueAfter }, frame);
    this.fromTo(`#${id}`, { rotate: 0 }, { rotate: -4 }, frame, 0.08, "power1.inOut", { yoyo: true, repeat: 3 });
    this.to(`#${id}-lens`, { opacity: 0 }, frame + 8, 0.2);
    this.cue("shutter", frame, { gain: 0, label: "stamp" });
    this.cue("sub", frame, { gain: -6, label: "stamp" });
  }
  endCard(id, frame, { handle = "@yourhandle", initials = "YH", avatar, cta = "Comment KEYWORD", terms = "", top = 560 } = {}) {
    this.claim(id);
    const face = avatar ? `<img src="${this.useMedia(avatar)}" alt="">` : esc(initials);
    this.html(`<div id="${id}" class="endcard" style="top:${top}px;opacity:0"><div id="${id}-ring" class="ring"><div class="avatar">${face}</div></div>`
      + `<div class="handle">${esc(handle)}</div><div id="${id}-cta" class="cta">${esc(cta)}</div>${terms ? `<div class="terms">${esc(terms)}</div>` : ""}</div>`);
    this.fromTo(`#${id}`, { opacity: 0, y: 80 }, { opacity: 1, y: 0 }, frame, 0.5, "power3.out");
    this.pop(`#${id}-ring`, frame + 1, { from: 0.6, ease: "back.out(1.6)" });
    this.pop(`#${id}-cta`, frame + 9, { from: 0.5, ease: "back.out(2.4)" });
    if (this.total - frame > 40) this.to(`#${id}-cta`, { scale: 1.06 }, frame + 27, 0.35, "sine.inOut", { yoyo: true, repeat: 3 });
    this.cue("pop", frame + 1, { gain: 0, label: "end card" });
    this.cue("sparkle", frame + 10, { gain: -2, label: "call to action" });
  }

  // ---------------------------------------------------------------- media and output
  useMedia(source) {
    const absolute = path.resolve(source);
    if (!IMAGE.has(path.extname(absolute).toLowerCase()) && !VIDEO.has(path.extname(absolute).toLowerCase())) {
      throw new Error(`Unsupported media: ${source}`);
    }
    if (!this.media.has(absolute)) this.media.set(absolute, null);
    return `__MEDIA__${absolute}__`;
  }
  skyMarkup() {
    if (this.sky === "none") return "";
    if (typeof this.sky === "object" && this.sky.plate) return `<img class="plate" src="${this.useMedia(this.sky.plate)}" alt="">`;
    // Procedural clouds: fixed positions, so every render is identical.
    const clouds = [[-160, 1260, 760, 300], [420, 1330, 820, 320], [180, 1520, 900, 360], [-240, 1640, 760, 330], [600, 1600, 760, 340],
      [700, 300, 520, 200], [-120, 420, 460, 170], [300, 120, 380, 130], [80, 980, 520, 180], [640, 1060, 480, 170]];
    return clouds.map(([x, y, w, h]) => `<div class="cloud" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" data-layout-allow-overflow></div>`).join("") + '<div class="haze" data-layout-allow-overflow></div>';
  }

  /** Write the composition: index.html, style.css, gsap, media and cues.json. */
  async compile() {
    if (await exists(this.output)) throw new Error(`Output already exists: ${this.output}. Choose a new revision directory.`);
    const gsap = this.gsap ? path.resolve(this.gsap) : await findRuntimeGsap(this.workspace, this.output, process.cwd());
    if (!gsap || !(await exists(gsap))) {
      throw new Error("GSAP was not found. Run edit-video's scripts/init-workspace.mjs --workspace <project> --install, or pass gsap: '<gsap.min.js>'.");
    }
    const sky = this.skyMarkup();
    // Tokens go in a <style> block: font stacks carry quotes that would end an inline style attribute.
    const tokens = Object.entries(this.tokens).map(([k, v]) => `--${k}:${String(v).replace(/[<>]/g, "")}`).join(";");
    const layers = this.layers.map((layer) => `<div id="${layer.id}" class="layer${layer.page ? " page" : ""}" style="opacity:0">${layer.html.join("")}</div>`).join("");
    const script = `${this.init.join("\n")}\nconst tl=gsap.timeline({paused:true});\n${this.tl.join("\n")}\nwindow.__timelines=window.__timelines||{};window.__timelines.main=tl;`;
    try { new vm.Script(script); } catch (error) { throw new Error(`Generated timeline does not parse: ${error.message}`); }
    let page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(this.title)}</title>`
      + `<script src="assets/gsap.min.js"></script><link rel="stylesheet" href="style.css"><style>#root{${tokens}}</style></head><body>`
      + `<div id="root" data-composition-id="main" data-start="0" data-duration="${this.T(this.total)}" data-width="${W}" data-height="${H}">`
      + `<div id="sky" class="layer">${sky}</div><div id="space" class="layer"><div class="fade"></div><div class="horizon"></div></div>`
      + `<div id="cam" class="layer"><div id="camS"><div id="camT">${this.worldHtml.join("")}</div></div></div>${layers}</div>`
      + `<script>\n${script}\n</script></body></html>\n`;
    page = page.replace(/__FILL__([a-z0-9-]+)__/g, (_, key) => this.fills.get(key) ?? "");

    await fs.mkdir(path.dirname(this.output), { recursive: true });
    await fs.mkdir(this.output);
    await fs.mkdir(path.join(this.output, "assets"));
    const manifest = [];
    for (const source of this.media.keys()) {
      if (!(await exists(source))) throw new Error(`Missing media: ${source}`);
      const digest = await sha256(source);
      const copied = `assets/${digest.slice(0, 16)}${path.extname(source).toLowerCase()}`;
      if (!(await exists(path.join(this.output, copied)))) await fs.copyFile(source, path.join(this.output, copied));
      page = page.split(`__MEDIA__${source}__`).join(copied);
      manifest.push({ source, copiedTo: copied, sha256: digest });
    }
    await fs.copyFile(gsap, path.join(this.output, "assets", "gsap.min.js"));
    const css = await fs.readFile(path.join(ONE_CAMERA_ASSETS, "one-camera.css"), "utf8");
    await fs.writeFile(path.join(this.output, "style.css"), `${css}\n${this.extraCss.join("\n")}\n`);
    await fs.writeFile(path.join(this.output, "index.html"), page);
    await fs.writeFile(path.join(this.output, "hyperframes.json"), `${js({ media: { autoProxy: false } })}\n`);
    await fs.writeFile(path.join(this.output, "media-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const cues = [...this.cues].sort((a, b) => a.frame - b.frame);
    await fs.writeFile(path.join(this.output, "cues.json"), `${JSON.stringify({
      fps: this.fps, total: this.T(this.total), sfxPack: "edit-video/assets/sfx",
      note: "Each t is the first frame that shows its event. Mix with edit-video's scripts/sfx-sync.mjs mix; audition against the voice.",
      cues,
    }, null, 2)}\n`);
    return { output: this.output, frames: this.total, seconds: this.T(this.total), layers: this.layers.length, cues: cues.length, media: manifest.length };
  }
}
