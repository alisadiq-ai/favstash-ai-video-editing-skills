# Motion: one continuous piece

How to build an ad where nothing cuts: the camera moves through one world and every
scene grows out of the last. The snippets are patterns to adapt, not a library.
When HyperFrames' own skills are installed, they are the authority on the
composition contract and current APIs; this page covers the craft on top.

## The composition

A HyperFrames composition is an HTML page rendered frame by frame:

```html
<div id="root" data-composition-id="main" data-start="0" data-duration="32"
     data-width="1080" data-height="1920">
  <!-- layers, back to front -->
</div>
<script src="assets/gsap.min.js"></script>
<script>
  gsap.set("#later-thing", { opacity: 0 });          // frame-0 state, explicit
  const tl = gsap.timeline({ paused: true });
  // tl.to(...), tl.fromTo(...), tl.set(...) at times computed from frames
  window.__timelines = window.__timelines || {};
  window.__timelines.main = tl;
</script>
```

- Copy GSAP from the workspace runtime
  (`.favstash-studio/runtime/node_modules/gsap/dist/gsap.min.js`) into the
  composition's `assets/`, with every image, clip and font it uses.
- **Seekable:** every frame is a pure function of time. No `onUpdate` side effects,
  timers, `Math.random()` or infinite repeats; the renderer jumps around the
  timeline.
- Put design tokens (colors, font stacks) in a stylesheet, not an inline `style`
  attribute: quoted font names end the attribute and the text falls back to Times.
- Times come from frames: `t = Math.floor(frame / 30 * 10000) / 10000`. Rounding
  up puts a switch one frame late.
- Avoid two tweens on the same property of the same element at once; the checker
  flags it and the result jumps.

## One camera

Film a world instead of switching slides. Two wrappers make the camera:

```html
<div id="cam" style="position:absolute;inset:0;overflow:hidden">
  <div id="camScale" style="transform-origin:540px 960px">
    <div id="camPan"> <!-- the world: objects at world coordinates --> </div>
  </div>
</div>
```

To look at world point (X, Y) at zoom S, set `#camPan` to x = 540 − X,
y = 960 − Y and `#camScale` to scale S. A world point P then appears on screen at
`540 + S·(P − X)` horizontally (and the same with 960 vertically). Keep that
formula in the build script so a handover can find where things are.

- One move at a time; let a move settle before a handover starts from it.
- Ease moves in and out (`power3.inOut`); a short swish sound peaks mid-move.
- Screen-space layers (captions, cards, the CTA) sit above `#cam` and don't move
  with it.

## Handovers

The rule: **the next thing starts exactly where the current thing is on screen.**
At the handover frame, compute the current object's screen box (camera state plus
its own transform, including any floating motion at that moment), place the new
element, or a clone, on that box, hide the old one on the same frame, then animate
the new one into its role. The viewer sees one object change, not two objects swap.

| Handover | Picture | Notes |
|---|---|---|
| Drop into | An object shrinks and falls into a target (a file into a screen) and becomes part of it (a chip in the input) | Target reacts on landing: glow, pop; sound on the landing frame |
| Grow into | A small element expands into the next scene (an input box becomes the prompt card) | Scale the parent so the element fills the frame, then swap to the full-size version |
| Push in / pull out | The camera dives toward a detail (the send button), then pulls back to show the result | Keep the detail on screen through the whole move |
| Flip | A card turns edge-on and the next card comes round (profile → DM) | Swap at exactly 90°; use a large perspective so it reads as a card, not a door |
| Bloom | A circle grows from the object and reveals the next layer | `clip-path: circle()` from the object's centre |
| Stream | Copies fly out of one object into another ("every frame came from this file") | Stagger by 2–3 frames; quiet repeated sounds, panned |
| Rise / dive | The whole world slides away for a tone change (into space for a dramatic line, back down after) | Bring the new layer's edge in **before** the old layer has left, or a frame goes black |
| Match shape | Something with the same shape replaces it (a dot becomes a button) | Match size and position on the swap frame |

## Text and objects

- Hero objects are rendered as clean designed things: a document card with a title
  and numbered steps, not raw markdown; a real UI recreation, not a grey box.
- Things that enter later start hidden in the markup (`opacity:0`) or in `gsap.set`.
- A short gentle float keeps a hero object alive while it waits; account for it when
  a handover starts from it.
- Mark deliberate layering for the layout checker on the specific text block only:
  `data-layout-allow-overlap` (overlap) or `data-layout-allow-overflow` (things that
  travel off canvas, clouds, glows).

## Sound cues from the build

Write `cues.json` next to the composition while you build each event, so the sound
follows the real timing:

```json
{ "fps": 30, "total": 32, "cues": [
  { "frame": 0,   "t": 0,      "sound": "curated/hook-impact.wav", "gain": -6, "label": "opening" },
  { "frame": 45,  "t": 1.5,    "sound": "curated/ui-pop.wav",      "gain": -2, "label": "hook word" },
  { "frame": 288, "t": 9.6,    "sound": "curated/ui-click.wav",    "gain": 2,  "label": "send pressed" }
] }
```

Each cue's frame is the first frame that shows its event: the frame after a fade-in
starts, the same frame for a hard switch. `edit-video`'s sound-sync reference owns
the format, the sync rules and the mixer.

## Look before you render

- `hyperframes check <comp>`: no errors; read every warning.
- Snapshots at frame 0, then each handover's start, middle and end
  (`hyperframes snapshot <comp> --at 0,5.8,6.0,6.2,…`). Look for flashes, empty
  frames, overflow, text collisions and anything outside the safe area.
- After rendering, scan for black frames
  (`ffmpeg -i ad.mp4 -vf blackdetect=d=0.03 -an -f null -`) and watch it once at
  phone size with sound.
