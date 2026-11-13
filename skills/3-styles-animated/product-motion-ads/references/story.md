# Planning the ad

Write `analysis/ad-plan.md` before building. One page; it is the contract the build
follows. If the creator brought a script or hooks from `write-script`, keep their
approved words and plan the picture around them.

## Answer first

1. What is it, in one sentence a stranger understands?
2. Who is it for, and what does it change for them?
3. What is the most impressive or surprising true thing about it?
4. What does using it look like (entry → key action → result), and where: in its
   own app, inside another app (an AI assistant, a terminal agent, a chat tool), or
   in a real setting (a kitchen, a desk, a bag)?
5. What real material can appear: interface, product photos, packaging, copy,
   demo clips? What are the exact labels, states and variants, and what doesn't
   exist?
6. What is the hero object, the one thing the viewer follows through the reel
   (a file, a card, a phone, a product shot)?
7. What should the viewer do at the end, and is the offer real?

If an answer is missing, ask the creator or find it in the source. Don't fill it in
with a guess.

## Study references

When polish matters (a launch film, a paid ad), study strong references before you
shape the plan. Gather 6–10 launch films or ads in the same lane, the creator's
picks first. `edit-video`'s reference helper samples frames; add your own around
every beat and handover. For each scene of your plan, write what to copy and from
which reference: a move, a layout, a type treatment, a sound.

Measure the rhythm as well: picture changes per 10 s, and how many of them are hard
cuts. In ten launch films studied, most changes were moves inside the shot
(punch-ins, card morphs), with only 2–3 hard cuts per 10 s, and whoosh energy built
about 0.3 s before each cut. Take your rhythm from your references' numbers, not
from a fixed count.

Moves that read as premium there: a big prompt card that morphs into a status pill,
a punch-in to one huge button, a page section lifting out as a card while the rest
blurs; for a physical product, a slow turn that lands on the hero angle, or the
product opening into its parts. [Motion](motion.md) covers how to build them. References are for analysis:
copy the move, never the footage, music or brand.

## Shape

A starting shape for 20–40 seconds at 30 fps, not a template:

| Beat | Time | Job |
|---|---|---|
| Hook | 0–3 s | The claim or question in large type over the product's world; the hero object visible |
| Turn | 3–6 s | Wrong answers struck out, or the problem in one picture; the camera reaches the hero object |
| In use | 6–18 s | The product doing its job: entry, the key action on its spoken word, the result |
| Proof | 18–24 s | The result shown big, or a second quick example; label staged examples |
| Reaction | optional | One short line or slam word for disbelief or emphasis |
| Call to action | last 5–8 s | Follow, comment the keyword, link, or download: shown as the action itself (the comment being typed, the DM arriving) |

Hook lines follow the creator's copy rules from `write-script` when they exist: a
proven hook copied with only the false details swapped beats a clever new one.

## Storyboard

For every scene, write:

```markdown
### 3 — The prompt — 6.2–9.8 s
Picture: the laptop's input box grows into a full-width prompt card; the prompt types; push in on send.
Text on screen: "Make a launch video for my product" (typed)
Voiceover: "…you just drop it in, type one line and hit enter."
Handover in: the input box from scene 2 grows into this card.
Handover out: pull back; the card shrinks into the laptop, which now plays the result.
Sound: typing ticks while typing; swish on the push-in; click on "enter" (frame 288).
Copy: reference 4 at 0:12–0:14, the punch-in that ends on one huge button.
```

Check the plan before building:

- Every pair of scenes has a handover that carries an object or the camera, not a
  cut to an unrelated layout.
- Every line of text has its reading time inside its scene.
- No pause between voice lines in the first ~10 s runs past about 0.9 s.
- Every claim traces to the source; staged examples are labelled.
- The total fits the voiceover or the target length.
- The ending shows the real offer.

## Sound plan

List the visible events that deserve sound: arrivals, clicks, camera moves, a
reveal, the call to action. Most get one short sound; ordinary text changes stay
silent; cues closer than about 6 frames merge. `edit-video`'s SFX pack covers the
usual set (pop, click, swish, shutter, impact, riser, ding, typing, sparkle) plus
short mechanical sounds for product moments (tick, ratchet, latch, thock,
shimmer); the style's sound map pairs them with events. Exact frames come from the
build, not the plan.

Short, dry mechanical sounds make a product piece feel premium: a tick for each
step, a ratchet for progress, a latch when something closes or connects, a thock
when it settles. Keep them under the voice.

A music bed timed section by section to the scenes lands its drop on the turn. When scenes later move, offset the bed's start so the drop still
lands rather than making a new bed. Duck it under the voice (the mixer ducks every
cue under `--voice`) and carve a little room for the voice with EQ.
