---
name: favstash-shortform
description: "Edit reels, TikToks and YouTube Shorts adaptively from a brief, footage or reference. Use for assembly, revisions, sound, safe captions and export review; choose layouts from the material instead of a fixed style template."
---

# Adaptive short-form editing

Make the treatment fit the story and actual footage. Talking head, text over
B-roll, split screen, screen demos and full-screen proof are layouts within one
edit. A natural reflection can stay simple; a product claim may need moving proof.

## Start from what exists

- Read the brief, supplied references and any creator preferences. Resume the
  existing project for revisions and preserve prior cuts. Keep approved copy
  and the mix during a layout-only revision.
- Inspect representative frames and listen to the takes when playback is
  available. Transcribe speech when needed; preserve meaning, qualifiers and
  natural pauses. Do not invent spoken words or silently rewrite an approved claim.
- Use the existing editor and run structure when they work. For a fresh project,
  keep inputs, assets, editable source, previews, exports and review notes in one
  dated folder. The [local helpers](references/local-tools.md) can create this;
  they are optional, and editing does not require an onboarding questionnaire.
- Use the creator's brand and references to choose type, color, energy and
  composition. When unspecified, make a restrained first cut. Do not impose a
  fixed glass treatment, palette, camera split or editing app.

## Build the cut

Find the strongest honest opening and the minimum context needed for its payoff.
Choose each shot for what the viewer needs to see at that moment:

| Material | Useful treatment |
| --- | --- |
| Personal delivery or emotion | Full camera; remove false starts while retaining meaningful breaths, humor and pauses |
| Voice plus a visible action/result | Speaker and proof together while both remain legible; expand the proof for detail |
| Desktop or phone demo | Crop to the actual action, preserve spatial continuity and hold the result long enough to inspect |
| Copy over footage | Match action or emotion to the line; give each phrase time to read without adding an unnecessary speaker |
| Relationship or idea that needs explanation | A purposeful graphic insert; use `$motion-graphics-short` if available for the animation pass |

Own the supporting work: source, capture, trim and inspect the footage available
within the task. Ask for a specific missing asset only when access or recording
requires the creator. Show real product behavior; label mockups and conceptual
graphics. Check screen captures for private data across moving frames.

Use a reference for timing, composition and sound patterns. A transcript alone
does not establish its visual treatment. See [reference media](references/reference-media.md)
when analyzing a URL or reusing third-party material. Keep source/rights notes
for output assets; downloadable does not mean reusable.

## Compose for a phone

Default to 1080×1920, 9:16, normally 30 fps unless the brief or source calls for
something else. Keep faces proportionate and complete; inspect crops and blurred
fills for a second ghost face. Enlarge useful detail instead of fitting an
unreadable desktop into a tiny panel. Change layout on meaningful beats.

For an unknown destination, use this **conservative working mask** at 1080×1920:
essential text, captions and demonstrated UI detail within **x=72..900,
y=269..1248**. Scale proportionally for another 9:16 resolution. This is a house
guide, not an official platform specification; check the intended app's current
preview before publication. Footage and decorative panels can extend beyond it.

Center main captions and cards on the **whole canvas, x=540**. A centered critical
box can be at most **720 px wide** under that mask. Inset or wrap essential contents
inside wider panels instead of shifting the whole design left. Measure the whole
text box, backing, outline and shadow, including animated extremes; a safe anchor
alone does not establish safe placement. Keep eyes, mouth and focal actions clear
of captions and expected app controls.

Use one coherent type hierarchy and colors that work with the real footage.
Start captions around 46–68 px on a 1080-wide export, usually one or two meaningful
lines, then inspect at phone size. Preserve the actual words and keep caption
changes aligned with speech. Use `$shortform-captions` if available for detailed
timing, translations or caption revisions. Avoid competing transcript layers.

## Sound and motion

Speech comes first. Trim with short fades, preserve natural tone and remove
unwanted source/demo audio. Duck music and SFX under speech; silence is valid.
Use owned or licensed music. If the creator will add native platform music,
deliver the appropriate cut without a music bed and note the intended timing.

Make SFX follow visible events: a click for an action, pop for an arrival, swish
for motivated travel. Align the audible transient, accounting for leading silence,
and listen for overlapping effects. Subtitle changes do not each need a sound.
The optional [original SFX pack](assets/sfx/manifest.json) lives with this skill;
copy only selected sounds into the edit and record their source.

Keep editable source and separate audio/caption tracks when the editor supports
them. Use FFmpeg for straightforward trims/assembly and HyperFrames when a coded
composition helps. Read [local tools](references/local-tools.md) only when setup
or analysis helpers are needed. Render a representative treated sample, inspect
it, then finish the requested cut; do not multiply variants before it works.

## Review and deliver

Inspect the **encoded candidate**, following [review](references/review.md):
opening, changing layouts, longest captions, moving proof, sound and ending.
Verify streams and full decode as well as visual quality. Report only checks
actually performed; measurements do not prove a listening pass.

Keep numbered exports and the recoverable project/source. Show the actual video,
summarize what changed and state remaining limitations. Technical validity,
creative acceptance and publication approval are separate.

Editing works without FavStash. When saved inspirations, calendar work or results
are relevant, use the [optional FavStash connection](references/favstash.md).
Never publish, schedule or upload merely because a cut is finished or a service
is connected; obtain approval for the exact outward action.
