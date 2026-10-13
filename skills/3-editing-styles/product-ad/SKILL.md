---
name: product-ad
description: "Style for edit-video: a vertical motion-graphics ad built in code from the product itself (its code, site, app or screenshots), with an optional voiceover and every sound on its frame. No camera footage needed. Use when a creator wants to promote something they built, a tool, template or free resource, a comment-to-DM giveaway, or asks for a motion-graphics or launch video for Reels, TikTok or Shorts."
---

# Product ad

A style on top of `edit-video`, which owns the voice, captions, sound mix and
review. The whole reel is motion graphics made from the real product: its
interface, copy and flow, animated as one continuous piece where each scene turns
into the next, with sound locked to the picture. This skill is a method, not a
template: the product decides what appears, and you design every scene for it.

Fits a reel that sells or explains one thing someone built: an app, a tool, a
template, a skill file, a free resource behind a comment keyword. Skip it when the
creator's face carries the story (use a footage style) or the product has nothing
to show yet.

## Creative laws

- **The first second decides.** Frame 0 must look finished and already say what
  the reel is about: the hook in large type over the product's world, the product
  visible. Never an empty canvas, a logo sting or raw code/markdown, which reads as
  broken formatting.
- **Show the product in use.** Entry → key action → result beats a landing page
  describing it. Reuse the real interface, copy, colors and assets; rebuild only
  what you can't reuse. No abstract filler.
- **Every claim is grounded.** Names, numbers, features and quotes must exist in
  the product, its README, its UI or the creator's brief. Hooks, jokes and
  connective lines are free to invent; claims are not. Label a mockup or a staged
  demo as an example on screen.
- **One object carries the story.** Each scene turns into the next through
  something the viewer is already watching: a file falls into a screen and becomes
  a chip, an input grows into the prompt card, a card flips into a DM. A cut to an
  unrelated layout restarts attention. See [motion](references/motion.md).
- **Readable at speed.** Pace comes from motion, not from pulling text early: a
  short label holds ~0.8 s settled, a sentence ~0.3 s per word.
- **Sound on the frame.** Every hit plays on the first frame that shows its event.
- **One look.** The product's palette and type (or the creator's brand), one
  accent, consistent motion. Keep critical text inside `edit-video`'s safe area.
- **An honest ending.** The call to action matches what the creator actually
  offers: a comment keyword that really sends the thing, a link that works, a
  limit or price they will honor.

## Workflow

Use the run folder `edit-video` creates (`scripts/new-edit.mjs`, or the existing
one when revising): the plan goes in `analysis/`, product material in `assets/`,
the composition, voice and mixes in `work/`, renders in `previews/`, finished
videos in `exports/` and reviews and sync strips in `reports/`. Number every
revision (`ad-v01`, `ad-v02`, …) and keep the earlier ones.

1. **Inspect the product.** Read its code (main page, styles, routes, key
   components) or capture its site, plus any screenshots, demo clips and the
   creator's brief. Note the exact colors and fonts, the strongest visual, the
   copy you may quote and the 2–3 beats of the product in use. Never carry secrets,
   tokens, internal URLs or real customer data into the ad; swap in plausible
   stand-ins and say so.
   - **Assets stay local and owned.** Use images, clips and fonts that are in the
     project or that the creator supplies. Don't download stock photos or fonts a
     page merely links to; ask for the files, or redraw the idea in code (shapes,
     silhouettes, the UI itself) and note the swap. Prefer the product's own font
     files or an installed font (`@font-face { src: local(...) }`); a web font URL
     makes the renderer fetch it at build time.
2. **Plan** in `analysis/ad-plan.md` with the [story guide](references/story.md):
   angle, hook, beats, the handover between every pair of scenes, on-screen text,
   voiceover lines, the call to action and the sound events. Get the creator's OK
   on the plan when they are present.
3. **Voiceover first, when there is one.** The creator's own recording is best.
   Otherwise use a voice service they already use, or HyperFrames' local
   text-to-speech (`hyperframes tts`; it downloads a voice model once, then runs
   offline). Transcribe it to word timings and take every beat's frame from them:
   the click lands on "send", the reveal on its word. Without a voiceover, pace the
   beats by reading time and, if there is music, its strong hits. Music is the
   creator's licensed track, one they own, a bed you make in code, or none; the SFX
   pack has no music.
4. **Build** a HyperFrames composition in `work/ad-vNN/` (Node 22+ and the
   workspace runtime from `edit-video`'s `init-workspace.mjs --install`). If
   HyperFrames' own skills are installed (`hyperframes-core`,
   `hyperframes-animation`, `hyperframes-keyframes`), read them for the composition
   contract and animation mechanics; they track the current renderer. Their
   `product-launch-video` workflow can build from your plan when the creator wants
   its presets and has signed in to its services; keep the format at 1080×1920 and
   your plan as the brief. Otherwise write the composition yourself following
   [motion](references/motion.md). Either way, write `cues.json` beside it: one
   sound cue per visible event (format in `edit-video`'s sound-sync reference).
5. **Check and look before rendering.** Run, from the workspace:

   ```bash
   .favstash-studio/runtime/node_modules/.bin/hyperframes check work/ad-vNN --at-transitions \
     --caption-zone "x0=0;y0=.65;x1=1;y1=1"
   ```

   - **Errors** fail the build. **Layout warnings** on visible text (overlap,
     overflow, text in the bottom app-UI band set by `--caption-zone`) are defects
     unless the layering is deliberate and marked on that element. Lint notes about
     file size can stay for one continuous composition.
   - If the contrast pass reports **0 text checks**, it didn't measure anything:
     judge contrast on the snapshots.
   - Snapshot frame 0 and every handover at its start, middle and end with
     `hyperframes snapshot work/ad-vNN --describe false --at …` (times in seconds:
     frame ÷ 30, rounded down to 4 decimals). `--describe false` keeps frames off
     outside vision services. Look at every PNG, fix and repeat. Keep critical text
     inside `edit-video`'s safe area (x 72–900, y 269–1248 at 1080×1920) and measure
     the widest line, not just its anchor.
6. **Render** with `hyperframes render work/ad-vNN --fps 30 --quality high --output
   previews/ad-vNN.mp4`, then scan it for black frames and dead holds:

   ```bash
   ffmpeg -i previews/ad-vNN.mp4 -vf "blackdetect=d=0.03,freezedetect=n=0.003:d=1.5" -an -f null - 2>&1 | grep -E "black_|freeze_"
   ```

   A hold longer than ~1.5 s with nothing moving reads as a stall; give it motion
   or cut it.
7. **Sound.** Mix the voice and `cues.json` onto the render with `edit-video`'s
   `scripts/sfx-sync.mjs mix work/ad-vNN/cues.json --out work/mix-vNN.wav
   [--voice …] --video previews/ad-vNN.mp4 --mux exports/ad-vNN.mp4`, then
   `sfx-sync.mjs check exports/ad-vNN.mp4 --mix work/mix-vNN.wav --cues … --strips
   reports/sync-vNN` and look at the strips: each red frame should be the first
   that shows its event. Use `--crop x,y,w,h` to zoom on small events.
8. **Review and deliver** with `edit-video`: the encoded export, frame 0 and the
   first 3 seconds, every handover at phone size, safe areas, a full decode, and the
   claims against the source. Say what you measured and what you could not judge
   (a listening pass). Keep numbered versions; never publish without the creator's
   approval of the exact post, and confirm the call to action really delivers.

## Pitfalls already paid for

- A later element that isn't hidden at frame 0 shows before its cue. Set the
  starting state of everything explicitly.
- Frame times rounded up (29.0667 s for frame 872) fire a hard switch one frame
  late and put its sound a frame early. Compute times from frame numbers and round
  down.
- A fade-in's first visible frame is the one after it starts; a hard switch shows
  on its own frame. Cue each accordingly.
- Font stacks with quotes break an inline `style` attribute and silently fall back
  to Times. Put design tokens in a stylesheet.
- A big move into a new world (rising into space, diving into a screen) goes black
  for a frame if the old layer leaves before the new one arrives. Bring the new
  layer in first.
- Tilted or layered text trips the layout checker. Mark only the specific
  deliberate blocks with `data-layout-allow-overlap`; anything else is a real
  collision.
- Text over a busy crossfade turns to mud. Stagger it: old out, new in, or carry
  one object across instead.

The inspect → plan → build method and the grounding and reading-time rules are
informed by [brag](https://github.com/latent-spaces/brag) (MIT); no third-party text
or code is included.
