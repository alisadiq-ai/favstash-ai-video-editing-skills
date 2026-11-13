# Make a character with AI

A rig needs one base image and a set of edits of it, all the same size, all on the
same flat green background. Ali's cartoon took about 23 edits, around $3.50 with an
editing model.

Use one image model for the whole character, one that edits an image and keeps its
subject (GPT Image, Nano Banana, Seedream, Flux Kontext and similar). Keep every
output at the base's size. Save the sources in `my-character/source/`.

## 1. The base

Generate until the base is right; everything else is an edit of it.

> A flat 2D cartoon character, front-facing, chest up, centred, looking slightly left
> of camera, neutral friendly expression, mouth closed, both arms down and out of
> frame. Thick clean outlines, soft cel shading, bold readable shapes. Plain flat
> chroma-green background (#00B140), no shadow on the background, no text.

For a person: attach two or three photos of them (front, side, and one showing the
haircut) and add "drawn as this person: same face shape, hair, glasses and beard".
Only make a likeness of someone who asked for it.

Check at phone size: the face reads in a 200 px circle, the outline survives on dark
and light backgrounds, and nothing touches the frame edge except the body.

## 2. Poses

One edit per pose, from the base:

> Same character, same size and position, same face, same expression, same
> background. Change only the arms: [pointing up and to the left with the right index
> finger / thumbs up at chest height / one hand raised waving / both palms up in a
> shrug]. Keep the head and body exactly where they are.

Name them `pose-point.png`, `pose-thumbs.png`, `pose-wave.png`, `pose-shrug.png`.
The base is `neutral`.

## 3. Face patches

One edit per state, from the base, changing only the face:

| File | Edit |
|---|---|
| `v-mouth-ah.png` | Mouth wide open, as saying "ah" |
| `v-mouth-eh.png` | Mouth half open, teeth showing, as saying "eh" |
| `v-mouth-oo.png` | Lips rounded small, as saying "oo" |
| `v-eyes-closed.png` | Eyes gently closed, as in a blink |
| `v-worried.png` | Brows raised in the middle, worried; small frown |
| `v-excited.png` | Brows up, eyes bright; big closed-mouth grin |

> Same image. Change only the mouth: [state]. Everything else, including the face
> outline, the eyes and the background, stays exactly as it is.

## 4. Build the rig

Copy [`assets/rig.config.example.json`](../assets/rig.config.example.json) to
`my-character/rig.config.json` and set:

- `poses`: pose name → source file. Every pose must keep the head where the base has
  it, because the face patches sit on every pose.
- `patches`: each patch's source file and `roi`, the box in the base's pixels that
  holds the change (the mouth area for mouths, eyes for blinks, brows and eyes for
  expressions). The mouth box also serves `m-grin` and `m-frown`.
- `mirror`: true flips everything so the character faces left (toward content on
  the left of the frame).

```bash
python3 <skill>/scripts/build_rig.py my-character/rig.config.json
python3 <skill>/scripts/build_rig.py my-character/rig.config.json --register   # when the model redrew slightly
```

Read the alignment report: every input should shift well under a pixel. Then look
at the face patches on every pose; a mouth that floats off the face means the head
moved in that pose's edit. Redo that edit rather than forcing it.

## 5. Try it

Put `CHARACTER = 'my-character/rig'` (a path relative to the reel's folder) in an
`animated-explainer` spec and build a short test, or snapshot a corner presenter.
Watch the mouth against the voice at normal speed before making a whole reel.
