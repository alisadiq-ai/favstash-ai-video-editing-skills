# Effect recipes

Each effect: what it is, how to build it, its sound, and the prompt a creator can
paste. Sizes are for a 1080×1920 frame; times are from the word the effect lands on.

## 1. Kinetic hook

Two hook words slam in one at a time behind the speaker's head.

- **Build:** behind layer, heavy condensed sans about 176px, cream, left-aligned in
  the band above the head; the second line low enough that the head covers its
  bottom. Each word: scale 1.7→1 and blur 14→0px in 4 frames (`power4.in`), then a
  3-frame camera shake (about 10px).
- **Sound:** an impact on each landing.
- **Prompt:** `Open my video with a kinetic hook: the two hook words slam in one at a time behind my head, huge condensed letters that land sharp with a tiny camera shake and an impact sound on each.`

## 2. Gravity drop

Serif letters fall from above, bounce and settle behind the head.

- **Build:** a small italic serif lead word ("gravity") fades in; the big word
  (serif, about 200px, on one line) drops letter by letter from 1400px above with
  `bounce.out` over 0.42s, staggered 0.07s, each with a small starting tilt. Exit by
  fading, never by sliding into the frame.
- **Sound:** one soft thud as the letters settle.
- **Prompt:** `Add a gravity drop: the word falls in letter by letter from above my head, bounces and settles behind me, in a big elegant serif with a small italic lead word.`

## 3. Giant captions

A spoken phrase as one huge word plus an italic accent word.

- **Build:** front layer, top left. Word one in the condensed sans about 176px,
  popping in with `back.out`; word two in italic serif about 118px in the accent
  colour, rising in on its own spoken word.
- **Sound:** a pop on the first word, a soft whoosh on the second.
- **Prompt:** `Show this line as giant captions: the first word huge in a heavy condensed font, the second in an italic serif in my accent colour, each appearing on the exact frame I say it, above my head.`

## 4. Prompt bar

A chat input types a short request and sends it.

- **Build:** a white pill about 620×104 in the top third: the assistant's logo, a tiny
  grey label, placeholder text that the typed request replaces at about 32
  characters a second, a round dark send button that squishes and changes colour on send.
- **Sound:** keys under the typing, a click on send.
- **Prompt:** `Show a chat prompt bar above my head that types a short request letter by letter, then the send button squishes and lights up. Make it look like a real app: white pill, logo, small label, clean system font.`

## 5. Storyboard deck

Frames of the creator's own take are dealt out like cards.

- **Build:** six portrait frames from the take (150×266, 16px radius, thin light
  border, soft shadow) start stacked and tilted at the centre, then deal into a row
  at chest height with a 0.045s stagger and a slight fan.
- **Sound:** one whoosh as the deck deals.
- **Prompt:** `Make a storyboard deck: take six frames from my own video and deal them out like cards into a fanned row at chest height, with a soft shadow and a thin border on each.`

## 6. File drop

The creator's raw clip flies into a drop zone.

- **Build:** a dark frosted drop zone (dashed light border, download icon, "Drop raw
  footage") in the top third; a portrait thumbnail of the take arcs in from the right
  and lands; the border turns solid accent and the label becomes the file name and length.
- **Sound:** a pop when the file lands.
- **Prompt:** `Add a file drop: a frosted drop zone that says "Drop raw footage", then a thumbnail of my clip flies in and lands, the border turns solid and the label changes to the file name and length.`

## 7. Timeline

A video-editor timeline built from the creator's real footage and audio.

- **Build:** a dark panel at chest height: a running timecode, a ruler, a filmstrip
  track of real frames from the take, an audio track drawn from the take's real
  waveform peaks, and a red playhead sweeping left to right. Tracks wipe in from the left.
- **Sound:** a soft whoosh as it rises.
- **Prompt:** `Pop up a video-editor timeline at chest height built from my real footage: a filmstrip of my own frames, my actual audio waveform underneath, a running timecode and a playhead sweeping across.`

## 8. Grade slider

A thin line sweeps across and leaves the finished grade behind it.

- **Build:** two full-frame overlays with `backdrop-filter`: ahead of the line a
  flat, desaturated look; behind it the finished grade. A thin light vertical line
  with a small dark pill reading BEFORE | AFTER at chest height sweeps across in about 0.8s.
- **Sound:** one soft whoosh for the sweep.
- **Prompt:** `Add a before/after grade slider: a thin vertical line sweeps across my video; ahead of it the image is flat and grey, behind it the finished colour grade, with a small BEFORE | AFTER label on the line.`

## 9. Eyedropper

An eyedropper samples real colours from the frame into a palette.

- **Build:** an eyedropper cursor visits four points (wall, skin, a light, clothing);
  at each, a loupe circle shows that pixel's colour and a swatch with its hex code
  pops into a white palette card at chest height. Sample the colours from the actual
  frame at that moment.
- **Sound:** a click per sample.
- **Prompt:** `Add an eyedropper: a cursor samples four real colours from my frame, a loupe shows each colour, and the swatches with their hex codes pop into a small white palette.`

## 10. Film look

A wipe reveals a film grade, then letterbox bars close in.

- **Build:** a thin light line wipes top to bottom; above it a warm film grade
  (sepia about 0.35, a touch more contrast) and moving grain (an overlay noise tile
  shifted every 2 frames). Black 190px letterbox bars slide in as the wipe finishes.
- **Sound:** a light shutter on the wipe.
- **Prompt:** `Give one shot a film look: a thin line wipes down the frame revealing a warm film grade with moving grain, then black letterbox bars slide in.`

## 11. Title card

A full-frame title card cuts in over the camera.

- **Build:** a full-frame card in the reel's ink with a soft radial glow, a small
  spaced timecode, the title in the serif about 200px on two lines rising and
  unblurring on their words, and a short thin rule drawing in underneath.
- **Sound:** one low thud.
- **Prompt:** `Cut to a full-screen title card: dark background with a soft glow, the title in a big elegant serif on two lines, a small timecode above and a thin line drawing in underneath.`

## 12. Phone frame

The camera comes back inside a phone and then fills the screen again.

- **Build:** from the title card (or a cut), the camera wrapper rises in at 64% with
  rounded corners inside a light 14px bezel on the ink background, then scales back
  to full screen while the bezel grows past the edges and fades.
- **Sound:** a whoosh as it rises.
- **Prompt:** `Put my video inside a phone frame: it slides up small with rounded corners and a light bezel on a dark background, then zooms back to full screen.`

## 13. Post grid

The creator's real posts pop up behind their head.

- **Build:** behind layer, six portrait frames from the creator's real posts
  (190×338, 18px radius, soft shadow) in a 3×2 grid above and around the head,
  popping in with `back.out` and a 0.05s stagger; the head covers the lower row's edge.
- **Sound:** a quiet pop per tile.
- **Prompt:** `Add a post grid: six thumbnails from my real posts pop up behind my head one after another, with my head in front of them.`

## 14. Real feed

A whip pan into a real clip from the creator's feed and back.

- **Build:** the camera slides out sideways with motion blur (about 26px) over 0.14s
  while the clip slides in from the other side unblurring; it plays for about half a
  second, then whips back the same way.
- **Sound:** a whoosh each way.
- **Prompt:** `Whip pan out of my shot into one of my real reels with motion blur, play it for half a second, then whip back.`

## 15. Video card

A real landscape clip plays in a card with a serif label.

- **Build:** a 16:9 clip in a 22px-radius card with a deep shadow in the top third,
  an italic serif label above it and a small grey line naming the source. It rises in
  and plays live.
- **Sound:** a soft whoosh.
- **Prompt:** `Show a landscape clip playing inside a rounded video card above my head, with an italic serif label and a small caption naming the source.`

## 16. Comment drop

The call to action shows the comment and the reply that follows.

- **Build:** a real-looking comment field (white pill, a generic viewer avatar,
  "Add a comment…") types the keyword; the Post button lights up and is tapped; a
  reply bubble from the creator's account drops in: "Sent. Check your DMs." Then the
  keyword slams in behind the head like the kinetic hook, with a two-line caption at chest height.
- **Sound:** keys, a click on Post, a ding on the reply, an impact on the big keyword.
- **Prompt:** `End with a comment drop: a comment field types my keyword and posts it, a reply from my account drops in saying "Sent. Check your DMs.", and the keyword slams in big behind my head.`

## 17. Orbit

The creator's real posts circle their head, passing behind and in front.

- **Build:** six portrait thumbnails (150×266) on an ellipse around the head (about 400×120px), one turn every 1.1s. Keep two copies of each, one on the behind layer and one above the person, and show the front copy only while it is on the near half of the ellipse; scale it up slightly there.
- **Sound:** one whoosh.
- **Prompt:** `Add an orbit: six thumbnails from my real posts circle around my head, passing behind me and then in front of me.`

## 18. Frame break

The shot shrinks into a picture frame and the creator breaks out of it.

- **Build:** scale the camera into a thick cream frame on the ink background, and draw a second copy of the person cutout at the same scale with no clipping, so head and hands overlap the frame's border.
- **Sound:** a thud as the frame lands.
- **Prompt:** `Add a frame break: my shot shrinks into a picture frame and my head and hands break out over the frame's edge.`

## 19. UI world

A chat app appears above the creator's head and types the request.

- **Build:** a cream app card (about 860×440) in the top third with the assistant's name in the serif, a short greeting and an input box that types the request.
- **Sound:** a whoosh, keys under the typing.
- **Prompt:** `Add a UI world moment: a chat app card appears above my head with a greeting and an input box that types my request.`

## 20. Digital zoom

A crop zoom onto the face with a camera readout.

- **Build:** zoom the camera to about 2.1× on the face in 3 frames, with white corner brackets, a red REC dot and a zoom readout that counts 1.0× → 2.1×.
- **Sound:** a light shutter.
- **Prompt:** `Add a digital zoom: crop in fast on my face with camera corner brackets, a REC dot and a zoom number counting up.`

## 21. Checklist

A native checklist ticks off three steps.

- **Build:** a white card in the top third with three rows; each round checkbox fills green with a tick, 0.12s apart, and the row text darkens.
- **Sound:** a click per tick.
- **Prompt:** `Add a checklist: a clean white card with three steps that tick off one by one with green checkmarks.`

## 22. Headline wall

Titles of the creator's real posts are pinned up behind their head.

- **Build:** six cream paper notes with tape, each holding one real post title in the serif, popping in staggered on the behind layer with slight tilts.
- **Sound:** one pop.
- **Prompt:** `Add a headline wall: the titles of six of my real posts appear as taped paper notes on the wall behind my head.`

## 23. Zoom-through cut

Punch into a lens of the glasses and come out the other side.

- **Build:** zoom the camera to 7× into one lens with blur, flash white at the midpoint, then zoom back out from the other lens to 1×.
- **Sound:** one fast whoosh.
- **Prompt:** `Add a zoom-through cut: zoom fast into one lens of my glasses, flash white, then zoom back out from the other lens.`

## 24. Spotlight

Everything dims except a circle around the face.

- **Build:** a radial dark overlay with a clear circle on the face and a thin glowing ring that pulses once.
- **Sound:** a low thud.
- **Prompt:** `Add a spotlight: dim everything except a soft circle around my face, with a thin glowing ring that pulses once.`

## 25. Pull-back reveal

The camera pulls back to show it's playing inside an editor.

- **Build:** an editor window (title bar, a media bin of frames from the take, a filmstrip timeline with a playhead) sits under the camera layer; scale the camera down into the viewer area as the window scales in from 1.9×.
- **Sound:** a whoosh.
- **Prompt:** `Add a pull-back reveal: pull my shot back to show it's playing inside a video editor, with a media bin and a timeline of my own frames.`

## 26. Green screen

A green flash, then the creator is keyed onto another scene.

- **Build:** hide the camera for 3 frames of solid green, then show a new background clip behind the person cutout, with a small "keyed" chip.
- **Sound:** a pop.
- **Prompt:** `Add a green screen moment: flash green for a split second, then key me onto a different background clip.`

## 27. Paper cut

A cut-paper collage with a sticker outline around the creator.

- **Build:** a yellow halftone paper background with a torn cream sheet and tape, ransom-note letters in mixed fonts and colours dropping in, and the person cutout with a white sticker outline (stacked drop-shadows).
- **Sound:** a strong shutter.
- **Prompt:** `Add a paper cut look: a yellow paper collage background, ransom-note letters, and me cut out with a white sticker outline.`

## 28. Doodle boil

Hand-drawn doodles around the head, boiling.

- **Build:** white marker doodles (a crown, sparkles, a swirl, an arrow, a heart) draw on, then jitter by a couple of pixels every 3 frames so the lines boil like hand animation.
- **Sound:** a pop.
- **Prompt:** `Add a doodle boil: white hand-drawn doodles around my head (a crown, sparkles, arrows) that draw on and jitter like hand animation.`

## 29. Vertigo

A dolly zoom: the room zooms in while the creator pulls back.

- **Build:** replace the camera with a clean plate of the room (inpaint one frame where the cutout says "person") and scale it up to about 1.45 while the person cutout scales down to 0.8.
- **Sound:** a riser.
- **Prompt:** `Add a vertigo dolly zoom: the room behind me zooms in while I pull back, like the classic film shot.`

## 30. Cover story

A magazine cover with the masthead behind the head.

- **Build:** a huge serif masthead on the behind layer, a small spaced issue line above it, two cover lines on the sides and a barcode, with the effect name still readable.
- **Sound:** a light shutter.
- **Prompt:** `Turn my shot into a magazine cover: a huge serif masthead behind my head, an issue line, cover lines on the sides and a barcode.`

## 31. Glass type

A frosted glass word behind the head.

- **Build:** heavy condensed letters on the behind layer with a faint white fill, a bright thin outline and a soft blue glow, unblurring as they land.
- **Sound:** a soft whoosh.
- **Prompt:** `Add a glass type word behind my head: big see-through letters with a bright edge and a soft glow.`

## 32. Rewind

The shot scrubs backwards on a VHS overlay.

- **Build:** play a reversed copy of the previous moment at double speed, with scanlines, a blinking "◀◀ REW" and a timecode counting down; hide the person layer meanwhile.
- **Sound:** a whoosh.
- **Prompt:** `Add a rewind: my shot plays backwards fast with VHS scanlines, a blinking REW label and a timecode counting down.`

## 33. Light leak

Warm light sweeps across the frame.

- **Build:** two soft orange and pink radial glows in screen blend mode slide across the frame and fade.
- **Sound:** a soft whoosh.
- **Prompt:** `Add a light leak: warm orange and pink light sweeps across my shot and fades out.`
