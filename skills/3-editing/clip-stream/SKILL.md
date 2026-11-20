---
name: clip-stream
description: "Turn a long stream, VOD or gameplay recording into vertical highlight clips: find the best moments from loudness, speech, chat and scene cuts, review them by eye, then cut 1080×1920 clips ready for edit-video. Use when the creator hands over a stream, VOD or long recording and asks for clips, highlights, Shorts or a week of posts from it."
---

# Clip a stream

Turns hours of stream into a short list of moments worth posting, then cuts
each one to 9:16. Everything runs on the creator's computer with FFmpeg and the
local transcriber; nothing is uploaded. The finder ranks; you judge. Look at
every moment before you cut it.

## Rights first

- Clip the creator's own streams and recordings, or streams whose owner has
  said yes (many streamers run clipping programs; follow their rules on
  credit, length and where clips may go). Never download someone else's VOD
  to clip it without that permission.
- Games have their own video policies, and licensed music inside a game (car
  radios, menus) can get a clip muted or claimed. Flag clips with music playing
  and check the publisher's policy before the creator monetizes.
- Drop anything that shows private details: chat names the creator didn't mean
  to feature, DMs, notifications, email, location or payment screens.

## 1. Get the source

Prefer the original recording (OBS, a capture card or the console's export):
it has the best picture and separate audio. For the creator's own VOD on a
platform, download it once with yt-dlp:

```bash
yt-dlp -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 -o stream.mp4 "<url of their VOD>"
```

Keep the source untouched in a dated working folder. The finder writes
`<name>-clips/` next to it.

## 2. Transcribe (recommended)

Commentary is the best signal for *why* a moment matters. Start the
transcription first; on a multi-hour stream it takes a while:

```bash
npx hyperframes transcribe stream.mp4 --json --model base.en
```

It writes `transcript.json` (use `small.en` for accuracy, `--language` for
other languages). Skip it for no-commentary gameplay.

If the creator can export their own chat replay with timestamps, save it as
JSON (`[{"t": 3723, "text": "KEKW"}]`, also `time`, `timestamp` or
`content_offset_seconds`) or as lines like `[1:02:03] name: message`.

## 3. Find moments

Ask for about 1.5× the clips you need, so review has room to drop the weak ones:

```bash
node <skill>/scripts/find-moments.mjs --input stream.mp4 \
  --transcript transcript.json --chat chat.json --count 45 --frames
```

| Option | Use |
| --- | --- |
| `--count 45` | How many moments to return (fewer if not enough clear the bar) |
| `--length 20 --min 8 --max 60` | Target, shortest and longest clip in seconds; the peak lands about 60% in, so the setup comes before the payoff |
| `--keywords "heist,wanted level"` | Words that matter in this game or community; they score like "clip that" |
| `--from 0:05:00 --to 3:50:00` | Skip the "starting soon" screen and the outro |
| `--scenes` | Add hard cuts on screen (deaths, respawns, replays, edited VODs); decodes the video, so slower |
| `--weights loud=0.5,speech=1.2` | Rebalance signals, e.g. when game music is loud the whole time |
| `--threshold 1` | Lower it for more, weaker picks |
| `--frames` | Write `frames/mNN.jpg` per moment: start, peak and end side by side |

It writes `moments.json`: each moment has `start`, `end`, `peak`, `score`, the
strength of each signal, a one-line `reason` and the `quote` spoken in it.
[Tuning by stream type](references/tuning.md) covers shooters, driving and
open-world games, horror, just-chatting and silent gameplay.

## 4. Review by eye

Open every frames sheet and read the reason and quote. Then edit
`moments.json`:

- Set `"keep": false` on menus, loading screens, idle driving, duplicates of a
  better moment and anything from the rights list above.
- Give each kept moment a short `title`. It names the file and is a first draft
  of the hook line.
- Trim `start` so the clip opens on action within its first second, and move
  `end` to just after the payoff or reaction. Times may be seconds or `"1:02:03"`.
- Add moments the creator remembers ("the bank heist around 1:22") as new
  entries with an `id`, `start` and `end`. Quiet, clever plays score low; the
  creator's memory catches them.

Show the creator the kept list with titles before cutting a big batch.

## 5. Cut

```bash
node <skill>/scripts/cut-clips.mjs --moments stream-clips/moments.json --layout center
```

| Layout | Looks like | Fits |
| --- | --- | --- |
| `center` (default) | A 9:16 window cut from the frame; `--focus 0`–`1` slides it left to right | Driving, action and anything with one clear subject |
| `fill` | The whole frame fitted to the width over a blurred copy of itself; `--zoom 1.3` crops in | Games where the HUD, minimap or kill feed tells the story |
| `split` | The facecam on top (`--cam x:y:w:h`, the box in source pixels) and the game below | Streams where the reaction is half the moment |

Find the facecam box from a frames sheet or a single frame. Any moment can
carry its own `layout`, `focus`, `zoom` or `cam`, so one batch can mix them.
Clips land in `clips/NN-title.mp4` (1080×1920, H.264, source frame rate up to
60 fps, AAC audio) with a `clips.json` manifest.

Before editing, watch two or three clips at phone size: the first frame isn't
a transition or black, the action sits inside the frame, and the sound level is
even.

## 6. Edit, post and learn

- **Edit** with `edit-video` and the `text-over-footage` style: a hook line in
  the first second, captions from the transcript where someone talks, and
  sound kept. For volume, lock one template (type, position, colour) and change
  only the line and the captions, then render the batch.
- **Post** with `publish-and-analyze`: show the creator each clip, caption,
  account and time, and schedule only after their OK. Spread clips through the
  day and across days. FavStash caps posts per account per day (about ten on
  TikTok and YouTube) and says when a cap is hit.
- **Learn:** after a few days, compare which clips held viewers. Feed what
  worked back in: the `--keywords`, the layout, the clip length and what review
  keeps.

## Limits

- It finds loud, excited and busy moments. A silent stream with steady game
  audio gives weak signals: add a transcript, chat or `--scenes`, or work from
  the creator's own timestamps.
- Scores compare each second with the minute around it, so a stream that's
  loud throughout still shows its spikes, but a whole hype minute may rank as
  one moment.
- The crop doesn't track motion. Choose `focus` per moment, or use `fill` when
  the action moves across the frame.
