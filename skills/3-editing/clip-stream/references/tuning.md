# Tuning by stream type

Start with the defaults, review the frames, then change one setting at a time.
Record what you changed and why in the working folder, so the next stream
starts from settings that worked.

| Stream | Start with | Watch for |
| --- | --- | --- |
| Driving and open world (car chases, heists, police) | `--length 25 --keywords "cops,wanted,heist,crash"`; `center` with `focus` on the car, or `fill` when the minimap matters | Long calm drives score low on purpose; the radio can play licensed music, so flag it |
| Shooters and battle royale | `--length 20 --scenes`; `fill` to keep the kill feed, or `split` with a facecam | Gunfire is loud all game: try `--weights loud=0.6,speech=1.2` so reactions beat ordinary fights |
| Horror | `--length 15`; `split` for the jump-scare reaction | Screams spike hard; check that the scare is visible in the cut, not just the reaction |
| Sports and racing | `--length 20 --scenes` (replays cut hard) | Commentary in the game itself can look like excitement; read the quote |
| Just chatting and podcasts | `--length 35 --max 60`, a transcript and chat; `center` on the speaker | Laughter and chat bursts lead; snap edges to whole sentences (automatic with a transcript) |
| Silent gameplay | `--scenes --weights loud=1.5` and the creator's timestamps | Weak signals: show the creator the list before cutting many |

## Lengths

- TikTok and Reels: 15–35 seconds usually hold best for a single moment.
- YouTube Shorts: the same, with room up to 60 seconds for a story.
- Long setups lose people: open on the action and put the context in the hook
  line instead.

## Long streams

- Loudness reads only the audio, so a four-hour stream takes a few minutes.
  `--scenes` decodes the video at low resolution and takes much longer; use
  `--from`/`--to` to test settings on one hour first.
- Transcribing hours of audio takes a while on a laptop. Start it first, and
  run one heavy job at a time so the computer stays usable.
- The finder's output is a plan, not a render. Re-run it with new settings as
  often as needed; only `cut-clips` writes video.

## Chat replays

Chat reacts a few seconds after the moment; `--chat-delay 5` (the default)
shifts it back. Raise it for a stream with a long broadcast delay. A chat
burst with clip requests and emotes (KEKW, POG, LUL, 💀) scores higher than
plain message volume.
