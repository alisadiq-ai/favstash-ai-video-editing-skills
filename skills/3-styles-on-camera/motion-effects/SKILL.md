---
name: motion-effects
description: "Style for edit-video: a library of 33 named motion effects for talking-head reels (kinetic hook, gravity drop, timeline, title card, comment drop, orbit, frame break, vertigo, paper cut, rewind and more), built in one design system with words behind the speaker and the creator's own footage inside the UI. Use when the creator names an effect, asks for heavy motion graphics, or wants an effects listicle."
---

# Motion effects

A style on top of `edit-video`, which owns the cut, sound and review. The creator
asks for an effect by name ("add a gravity drop on 'drop'") and you build it on the
spoken word, in one consistent design system. The [effect recipes](references/effects.md)
hold the layers, timing, sound and a copy-paste prompt for each one.

## What makes these look premium

Most AI edits look like stickers on a talking head. These don't, because of five habits:

1. **Depth.** Big words sit *behind* the speaker and in front of the room. Cut the
   person out once and stack: camera, words, person, UI.
2. **One design system per reel.** One dark colour taken from the room, one light
   colour, one accent. One serif, one heavy condensed sans, the system UI font for
   anything that imitates an app.
3. **Real content inside the UI.** Frames of the creator's own take, their real
   posts, their real waveform, colours sampled from their frame. Never grey bars
   or fake text where real content exists.
4. **Native, small UI.** App-like pills, fields and cards at phone scale, crisp
   shadows, one per beat, never covering the face.
5. **Restraint.** A caption only for the hook and the call to action; everything
   else is the effect itself.

## The design system (starting defaults)

| Element | Setting |
|---|---|
| Ink | The room's darkest colour, deepened (for a purple-lit room, `#0a0f2c`) |
| Light | Warm cream `#f4eee3` for big words and title cards; white for app UI |
| Accent | One colour (default `#5b9eff`), used for a single word or state per beat |
| Serif | Didot or Bodoni 72 (system fonts on macOS); any high-contrast serif elsewhere |
| Condensed | Avenir Next Condensed Heavy (macOS); any heavy condensed sans elsewhere |
| UI | `-apple-system` / SF Pro, so app imitations read as native |
| Caption | System UI bold 46px, white, soft dark shadow, at chest height |

Pick the ink from the actual footage; the rest of the table stays.

## Layers and setup

Stack inside one camera wrapper so shakes, punch-ins and whips move everything together:

1. the camera video
2. the **behind** layer (big words, the post grid)
3. the person cutout video
4. effect overlays (grades, film, wipes), then the UI, then a checklist and captions

Make the cutout once per take:

```bash
npx hyperframes remove-background take.mp4 -o person.webm --quality best
```

Re-encode both the camera and the cutout with a keyframe every 15 frames before
rendering (`-g 15 -keyint_min 15`; the cutout as VP9 with `yuva420p`). Sparse
keyframes make HyperFrames seek badly and the two layers drift out of sync.

Check the cutout over a flat colour before using it: hair, caps and glasses should hold.

## Placement and timing

- **Each effect lands on the word that names it** (or the word it illustrates) and
  clears about 4 frames before the next one lands.
- **Behind-the-head words** go in the empty band above the head and are sized to end
  before any side panel; let the head cover the bottom of the last line.
- **App UI** sits in the top third (y 230–700) or at chest height (y 1330–1600),
  never over the mouth.
- **Text stays inside x 108–972** on a 1080-wide frame (what a 20:9 phone shows).
  Run `edit-video`'s edge check on the export.
- **Optional checklist** for listicles: a quiet panel at the top right (x 746–962)
  listing every effect, the current one in a light pill, done ones ticked.

## Sound

One sound per visible event, on the frame it happens: an impact when a word lands,
a short whoosh for a whip or a wipe, keys under typing, a click on a tap, a ding on a
completed state. Keep them 4–8 dB under the voice, and let subtitle changes stay silent.

## Review

Watch the export at 4 frames a second before sending: no clipped or stray letters,
no text over the face, every effect on its word, the cutout aligned with the camera.
Then run `edit-video`'s first-second and edge checks.
