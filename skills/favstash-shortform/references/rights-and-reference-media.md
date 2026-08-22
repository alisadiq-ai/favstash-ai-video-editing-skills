# Reference media and rights gate

## Why yt-dlp is part of the studio

A URL, transcript, or FavStash card often omits the details an editor needs. A user-authorized local analysis copy lets the agent inspect shot order, frame composition, animation timing, caption changes, silence, music energy, and sound-cue placement. Use the `scripts/reference-analyze.mjs` bundled inside the `$favstash-shortform` skill for this rather than ad hoc downloads.

## Rights statuses

| Status | Analyze | Include downloaded video/audio in output |
| --- | --- | --- |
| `analysis-only` | Yes | No |
| `owned` | Yes | Yes, within the user's rights |
| `licensed` | Yes | Yes, with license evidence/notes |
| `public-domain` | Yes | Yes, after source verification |
| `cc0` | Yes | Yes, after source verification |
| `cc-by` | Yes | Yes, with required attribution |

`analysis-only` is the default. A user must explicitly confirm a reusable status. `licensed` requires a rights note; `cc-by` requires attribution. The script refuses `--reuse-audio` or `--reuse-video` without a reusable status and `--confirm-rights`.

The gate answers whether this workflow may copy an asset into the output area. It is not legal advice and cannot override platform terms, privacy, publicity rights, trademarks, or restrictions in a specific license.

## Transform, do not clone

For analysis-only references, record transferable principles such as:

- the hook reveals its contradiction in two beats;
- every B-roll shot proves a specific line rather than filling space;
- captions emphasize one changing keyword;
- sound energy rises into the payoff, then drops for the final line.

Then build new copy, new visuals, and new audio from the creator's own or licensed materials. Do not reproduce another creator's exact sequence, distinctive copy, watermark, voice, likeness, or music.

## Cookies and restricted sources

Use `--cookies-from-browser` only at the user's explicit request and only for media they are authorized to access. Never copy the cookie database, print its contents, bypass access controls, or promise that a platform permits downloading. Prefer public, user-supplied, or creator-owned source files when available.
