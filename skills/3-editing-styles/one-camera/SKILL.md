---
name: one-camera
description: "Style for edit-video: a full motion-graphics reel with no camera footage, a sky world filmed by one continuous camera where every scene turns into the next (a file falls into a laptop, the screen opens into a prompt, a card flips into a DM), with sound locked to the frame. Use for voiceover-led product, tool or resource reels, giveaway and comment-to-DM promos, or when the creator asks for motion graphics."
---

# One camera

A style on top of `edit-video`, which owns the script, voice, review and delivery.
The whole reel is motion graphics over a voiceover. A bright sky is the world and
one camera films it: it flies to an object, the object becomes the next scene,
the camera rises into space for the turn and dives back down for the call to
action. Nothing cuts. Every sound plays on the first frame that shows its event.

Fits a voiceover reel that sells or explains one thing: a skill file, a template,
a tool, a free resource behind a comment keyword. Skip it when the speaker's face
carries the story, for a long screen demo, or for a personal reflection.

## Fixed identity, open imagination

Keep the identity: one continuous camera, every handover a transformation, one
hero object rendered as a clean designed thing, one accent color, Helvetica Neue
with a Georgia italic for the emphasized word, and sound on the frame. Everything
else is designed for the story in front of you.

- **Every scene turns into the next.** The object the viewer is watching becomes
  the next scene: it falls into a screen and turns into a chip, an input box grows
  into the prompt, a card flips into a DM, a DM drops into the offer. A plain cut
  or a fade to a new layout breaks the style.
- **Frame 0 must look finished.** A clean sky, the hook in large white type and
  the hero object small and glowing. Never raw markdown, code or an empty canvas;
  viewers read raw syntax as broken formatting.
- **The components are a vocabulary, not a storyboard.** Use the ones that picture
  the line, change their order and invent new transformations for the topic. The
  [component guide](references/components.md) lists what exists.
- **One moment worth a screenshot per reel**, usually the hero object landing
  somewhere it changes.

## Story shape

The tested order, which each reel adapts to its own story:

| Beat | Picture |
|---|---|
| Hook | Big white lines on the sky; the hero object waits small in the distance |
| The thing | The camera flies through the hook to the object; wrong answers pop and get struck through on the way |
| It goes in | A laptop rises from the clouds and the object falls into its screen as a file chip |
| It works | Dive into the screen, the prompt types, push in on the send button and press it on the spoken word |
| The result | Pull back out; the laptop plays the example, labelled as an example |
| Disbelief | Rise into space for one line and a slam word, then dive back to the sky |
| Want it | The object falls in again and blooms into the call to action |
| Call to action | Profile card: follow, comment the keyword, the card flips into the DM with the file |
| Offer | A dot-matrix number, a ticket that stamps from FREE to PAID, the end card |

## Truth rules

- **Show real behavior or label it.** Product screens inside the laptop are either
  the real product (`play()` takes your own images or clips) or a labelled example
  (`play(..., { tag: "EXAMPLE" })`). A mockup is never presented as proof.
- **Offers must be true.** Only show a limit, price or deadline the creator will
  honor. Generic placeholders (`@yourhandle`, `KEYWORD`) stay generic until the
  creator supplies the real ones.
- **Borrow mechanisms, not identities.** Rebuild a reference's transformations in
  this look; don't copy another creator's graphics, handle or footage.

## Build

Needs Node 22+, FFmpeg and the workspace runtime from `edit-video`'s
`init-workspace.mjs --install` (HyperFrames and GSAP). No fonts or images ship
with the style; the sky is drawn in CSS unless you pass a sky image.

1. Record or generate the voiceover first and keep a word timeline. Every beat's
   frame comes from it: the press lands on "send", the slam on "no way".
2. Write the run's build script in its `work/` folder. Start from the
   [example](scripts/example-build.mjs), which shows every component in 32 s and
   is mechanics only, not a storyboard:

   ```js
   import { Reel } from "<this skill>/lib/one-camera.mjs";
   const reel = new Reel({ output: "<run>/work/sky-v01", total: 960, workspace: "<project>" });
   // world(), camera(), scene() and components; frames from the word timeline
   await reel.compile();
   ```

   `compile()` writes a silent HyperFrames composition plus `cues.json`, one sound
   cue per visible event, already on the frame that first shows it. It refuses to
   overwrite a revision, checks the timeline parses and copies media by hash.
3. Check, look, render:

   ```bash
   .favstash-studio/runtime/node_modules/.bin/hyperframes check <run>/work/sky-v01
   .favstash-studio/runtime/node_modules/.bin/hyperframes snapshot <run>/work/sky-v01 --at 0,2,5,10 --describe false
   .favstash-studio/runtime/node_modules/.bin/hyperframes render <run>/work/sky-v01 --fps 30 --quality high --output <run>/previews/sky-v01.mp4
   ```

   Look at frame 0, every handover and the rise into space before rendering
   everything again. The demo passes `check` with no errors or warnings, so treat
   any new layout warning as a defect.
4. Mix the voice and the cues and put them on the render with `edit-video`'s sound
   sync (its `references/sound-sync.md`):

   ```bash
   node <edit-video>/scripts/sfx-sync.mjs mix <run>/work/sky-v01/cues.json --voice <run>/audio/voice.wav \
     --out <run>/audio/mix-v01.wav --video <run>/previews/sky-v01.mp4 --mux <run>/exports/sky-v01.mp4
   node <edit-video>/scripts/sfx-sync.mjs check <run>/exports/sky-v01.mp4 --mix <run>/audio/mix-v01.wav \
     --cues <run>/work/sky-v01/cues.json --strips <run>/review/sync-v01
   ```

5. Review the encoded export with `edit-video`, including the sync strips: in each
   strip the red frame should be the first that shows its event.

## Sound map (`edit-video`'s SFX pack)

The components write these cues for you; edit `cues.json` or call `reel.cue()` to
change them.

| Visible event | Cue |
|---|---|
| Frame 0 | `curated/hook-impact.wav` |
| Hook word or tag arrives, card or bubble appears | `curated/ui-pop.wav` |
| Strike-through, selection, send pressed, follow, play | `curated/ui-click.wav` |
| Camera move, fly-through, dive, flip, drop | `curated/zoom-swish.wav`, synced on its peak |
| Rise into space | `curated/metallic-riser.wav`, peaking as space arrives |
| Slam word | `curated/hook-impact.wav` |
| File lands, DM file arrives | `clean-ding.wav` |
| Frames land in the screen | `curated/camera-shutter-light.wav`, panned left and right |
| Ticket stamps to PAID | `curated/camera-shutter.wav` with `sub-impact.wav` |
| Object floats out, number forms, call to action | `sparkle.wav` |
| Typed prompt or comment | `typing-tick.wav`, one per ~0.9 s of typing |

## Pitfalls already paid for

- **Camera moves must not overlap.** The builder throws if they do; finish one move
  before the next starts.
- **Handovers start where the object is.** `dropInto()` and friends read the camera
  and the object's float at that frame. Call them on a frame when the camera is
  settled, or they throw rather than jump.
- **No black frame on the rise.** The horizon's rim arrives while the sky is still
  leaving; keep `riseToSpace()`'s order if you restyle it.
- **Frame times round down.** A `set()` timed even a hair after its frame shows one
  frame late and puts its sound one frame early. Use `reel.T()`, never your own
  rounded seconds.
- **A fade-in's first visible frame is the one after it starts.** Components cue
  arrivals one frame after their tween begins for that reason; hard `set()`
  changes cue on their own frame.
- **Mark intentional layering only.** The sheet's title and subtitle and a tag
  flying past carry `data-layout-allow-overlap`; anything else the checker flags is
  a real collision.
- 30 fps only; the builder refuses other rates rather than drift.
