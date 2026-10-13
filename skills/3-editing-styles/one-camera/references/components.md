# One-camera components

Everything lives in [lib/one-camera.mjs](../lib/one-camera.mjs). Positions are
frames at 30 fps; durations are seconds; coordinates are pixels on the 1080×1920
canvas. Ids are lowercase (`hook`, `mac`, `cap-1`) and unique. The
[example build](../scripts/example-build.mjs) calls almost all of them.

## Structure

| Call | What it does |
|---|---|
| `new Reel({ output, total, sky, tokens, gsap, workspace, title })` | A reel `total` frames long. `sky`: `"day"` (drawn in CSS), `"none"` or `{ plate: "<image>" }`. `tokens` overrides colors and fonts (see `TOKENS`). GSAP is found from `workspace`'s runtime unless `gsap` points at a file. |
| `world(fn)` | Things the camera films. Components called inside land in the world. |
| `scene(id, start, end, fn, { page })` | A screen-space layer shown from `start` to `end`. `page: true` gives it the light page background used by the call-to-action scenes. |
| `html(markup)`, `css(text)` | Your own elements and styles inside the current world or scene. |
| `set`, `to`, `fromTo`, `blurIn`, `blurOut`, `pop` | Timeline helpers on frames; a `set` on frame 0 becomes the initial state. |
| `cue(sound, frame, { gain, pan, dur, label })` | A sound cue on the first frame that shows its event. `sound` is a pack name (`pop`, `click`, `swish`, `shutter`, `shutter-light`, `impact`, `riser`, `sparkle`, `sub`, `ding`, `tick`) or a file in `edit-video`'s pack. |
| `compile()` | Writes `index.html`, `style.css`, `assets/`, `hyperframes.json`, `media-manifest.json` and `cues.json`. |

## The camera

A world point `P` appears at `540 + S·(P − X)`, where `X` is where the camera looks
and `S` its scale.

| Call | What it does |
|---|---|
| `cameraSet({ x, y, scale })` | Where the camera starts. |
| `camera(frame, dur, { x, y, scale }, ease, { swish })` | Fly there. Moves must not overlap. Adds a swish cue unless `swish: false`. |
| `cameraAt(frame)`, `toScreen(point, frame)` | Where the camera is, and where a world point appears, on a settled frame. |

## Opening

| Call | What it does |
|---|---|
| `sheet(id, { title, subtitle, steps, tab }, { x, y, rotation, glow, float })` | The hero object in the world: a clean document card with a tab, title and numbered steps, a halo and a gentle float. Call inside `world()`. |
| `hook(id, [{ html, size, top, kind, at }])` | Hook lines in white on the sky. `kind`: `static` (on screen at frame 0), `blur` or `pop` (on their word's frame). Adds the opening impact. |
| `passLens(id, frame)` | The hook rushes past the lens as the camera starts to fly. |
| `strikeTag(id, text, { at, strike, out, x, y })` | A glass tag pops in, gets struck through and rushes past ("not an editor"). |
| `puffs(id, frame, count)` | Cloud puffs streaming past the lens during a fly-through. |
| `select(id, frame)`, `hideSelect(id, frame)` | Selection box with corner handles on a sheet. |

## Narration on screen

| Call | What it does |
|---|---|
| `pill(id, html, frame, out, { x, y, big })` | A glass caption pill over the sky. |
| `statement(id, html, frame, out, { y, size, light, highlight: { at } })` | A centered line; a `<span class="hl">` inside it gets highlighted at `highlight.at`. |
| `slam(id, text, frame, { y, size })` | The big slam word, with an impact on its first visible frame. |

## The laptop

| Call | What it does |
|---|---|
| `laptop(id, { y, placeholder })` + `laptopRise(id, frame)` | A laptop with an assistant-style app rises out of the clouds. |
| `dropInto(sheetId, laptopId, frame)` | The world sheet lifts, falls into the screen and becomes the file chip in the input. Returns the landing frame. Call inside the laptop's scene, on a frame when the camera is settled. |
| `promptCard(id, { chip })` + `diveIn(laptopId, promptId, frame)` | Dive into the screen: the input box grows into a big prompt card. |
| `typePrompt(id, text, f0, f1)` | Type the prompt between two frames, with typing ticks. |
| `press(id, frame)` | Push in on the send button and press it on `frame`. |
| `pullOut(promptId, laptopId, frame, { title, label })` | Pull back out; the laptop shows a poster with a play button. |
| `play(laptopId, f0, f1, [{ html \| media, at }], { tag })` | Play an example inside the screen with a progress bar. `media` takes your own image or clip; `tag` labels it ("EXAMPLE"). |
| `stream(id, laptopId, frame, { count, spec })` | The file floats back out and frames stream from it into the screen. |

## Space

| Call | What it does |
|---|---|
| `riseToSpace(frame, { sink, horizonTop })` | The sky falls away, the horizon's rim arrives, then space. `sink` lists layers that fall with the sky. |
| `diveDown(frame, { unsink })` | Back down to the sky. |
| `fall(id, spec, frame, { x, y })` | A sheet falls in spinning ("Want it?"). |

## Call to action

| Call | What it does |
|---|---|
| `bloom(sceneId, frame, { x, y })` | Reveal a scene with a growing circle. |
| `profileCard(id, { handle, bio, initials, avatar })` + `profileIn(id, frame)` | A profile card with a follow button, three posts and a comment box. `avatar` takes an image; otherwise initials. |
| `follow(id, frame)` | Follow becomes Following on the frame. |
| `comment(id, keyword, f0, f1, postAt)` | Type the keyword into the comment box and post it. |
| `flip(fromSel, toSel, frame)` | Flip one card into another, edge-on at `frame`. |
| `dmThread(id, { handle, keyword, reply, file })` + `dmPlay(id, { keywordAt, replyAt, fileAt })` | The DM: the keyword, the reply and the file arrive. |
| `dropTo(sel, frame, { x, y })` | Shrink an element and drop it out of frame. |

## Offer and end

| Call | What it does |
|---|---|
| `dotNumber(id, text, frame, { top })` | A number in glowing dots (0–9, `+`, `%`, `$`, `x`). |
| `ticket(id, { label, value, labelAfter, valueAfter })` + `ticketIn`, `lensSweep`, `stamp` | A ticket reading FREE, a lens sweeps it, and it stamps to PAID. |
| `endCard(id, frame, { handle, initials, avatar, cta, terms })` | Avatar ring, handle, call-to-action button and small terms. |

## Your own pieces

Write new transformations with `html()`, `css()` and the timeline helpers, and give
each visible event a `cue()` on the frame that first shows it. A tween's first
visible frame is the one after it starts; a `set()` shows on its own frame. Things
that enter later start hidden (`opacity:0` in their markup). Keep each new piece
generic enough to reuse, and mark only deliberate text layering with
`data-layout-allow-overlap`.
