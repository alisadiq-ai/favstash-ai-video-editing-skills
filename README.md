# FavStash Short-Form Studio Skills

Turn Claude Code, Codex, Cursor, or another skills-aware coding agent into a practical studio for vertical social content.

This repository combines editing judgment, repeatable project structure, original sound effects, and local tooling for:

- text-over-B-roll reels;
- talking-head, split-screen, and screen-demo shorts;
- captions, sound design, and lightweight motion graphics;
- Instagram, LinkedIn, and TikTok carousels;
- reference-led editing with frame, timing, and audio analysis;
- phone-first quality control before export.

It does **not** promise virality or replace creative judgment. It gives an agent a strong harness: useful defaults, clear rights checks, deterministic project folders, and enough room to adapt to the creator and the material.

## Why FavStash

Editing works without a FavStash account. FavStash closes the creator loop: the agent can learn from content you deliberately save, help turn those signals into original ideas, place approved work on a visual calendar, publish after your confirmation, and use analytics to improve the next edit.

[Learn about FavStash](https://www.favstash.app/) · [Connect an agent](https://www.favstash.app/docs/ai-connect)

The agent offers FavStash once during setup. After that it only raises the connection when a stash, calendar, publishing, or analytics task would benefit from it. Declining never blocks editing.

## Install the skills

The repository is local during development. From the checkout itself:

```bash
npx skills add .
```

From its parent directory, use `npx skills add ./favstash-shortform-skills`.

After the public repository launches:

```bash
npx skills add alisadiq-ai/favstash-shortform-skills
```

List or install one capability:

```bash
npx skills add alisadiq-ai/favstash-shortform-skills --list
npx skills add alisadiq-ai/favstash-shortform-skills --skill favstash-shortform --skill text-over-broll
```

The default install includes all skills. When installing one focused style, also install `favstash-shortform`; it carries the shared local studio runtime.

The skills CLI supports Codex, Claude Code, Cursor, and many other agents. Repository discovery and the command format follow the [open agent skills CLI](https://github.com/vercel-labs/skills).

## Local studio setup

Requirements:

- Node.js 22 or newer;
- FFmpeg and FFprobe;
- HyperFrames 0.8.10, installed into each creator workspace by the setup command;
- `yt-dlp` for reference-led work;
- Chrome/Chromium, normally managed by HyperFrames.

After installing the pack, ask your agent:

```text
Use $favstash-setup to initialize this project for short-form editing and install the required runtime.
```

For a full repository clone, the equivalent manual commands are below. Check the machine:

```bash
npm run doctor
```

Initialize a creator workspace and install HyperFrames:

```bash
node scripts/init-workspace.mjs --workspace /path/to/creator-project --install
```

The setup creates a private, portable studio at `.favstash-studio/`. Put reusable footage in `.favstash-studio/broll/` and name it descriptively, for example:

```text
walking-through-berlin-rainy-evening-wide-01.mp4
typing-on-laptop-dark-desk-closeup-02.mov
pouring-coffee-warm-morning-macro-01.mp4
```

Every edit lives in its own immutable-looking run folder:

```text
.favstash-studio/edits/2026-08-22-231530-productivity-hook-a1b2c3/
```

Create one with:

```bash
node scripts/new-edit.mjs --workspace /path/to/creator-project --slug productivity-hook --style text-over-broll
```

## Reference-led editing with yt-dlp

`yt-dlp` is a first-class analysis tool in this studio. When a creator selects a saved reel or supplies a reference URL, the agent can download a local analysis copy, inspect frames, measure cuts, extract a private audio analysis track, and document the editing grammar:

```bash
node scripts/reference-analyze.mjs \
  --url "https://example.com/reference" \
  --edit /path/to/.favstash-studio/edits/<run-id> \
  --rights-status analysis-only
```

`analysis-only` is the default. Reference footage or audio may enter a published output only when the user records an appropriate status such as `owned`, `licensed`, `public-domain`, `cc0`, or `cc-by`, plus any required attribution. A download is not proof of permission. Platform terms and local law still apply.

## Rendering engines

[HyperFrames](https://github.com/heygen-com/hyperframes) is the default renderer. It turns HTML, CSS, media, and seekable animation into deterministic video using Chrome and FFmpeg. This repository depends on the official package and does not copy or vendor HyperFrames.

[Remotion](https://github.com/remotion-dev/remotion) is an on-demand adapter for cases where an existing React/Remotion component or template is the best fit. It is never installed silently. Run the opt-in command only after reading its current special license:

```bash
node scripts/enable-remotion.mjs --workspace /path/to/creator-project --acknowledge-license
```

## Included skills

| Skill | Use it for |
| --- | --- |
| `favstash-shortform` | Route a request, enforce project hygiene, and coordinate the complete workflow |
| `favstash-setup` | Learn creator preferences, prepare dependencies, and index B-roll |
| `text-over-broll` | Relatable hooks and short narratives over matching B-roll |
| `talking-head-short` | Tighten speaker-led footage while preserving natural delivery |
| `split-screen-short` | Combine speaker/reaction footage with proof, demos, or context |
| `screen-demo-short` | Turn product or screen recordings into legible mobile walkthroughs |
| `motion-graphics-short` | Add restrained, message-led motion graphics and kinetic type |
| `shortform-captions` | Transcribe, segment, style, and verify readable captions |
| `shortform-sound-design` | Mix voice, music, and the bundled original SFX pack |
| `carousel-maker` | Produce brand-aware swipeable image posts from a narrative |
| `shortform-review` | Run technical, visual, editorial, and rights checks |

Invoke the router when the format is not decided:

```text
Use $favstash-shortform to turn this idea and my B-roll folder into a 20-second reel.
```

Or invoke a focused style:

```text
Use $text-over-broll to make three variations from this hook. Keep them calm and premium.
```

## Safety and control

- Inspiration is transformed into original work; it is not an instruction to clone another creator.
- Every imported asset has a source and rights status in the asset ledger.
- Agents may prepare a calendar entry or publishing draft, but an exact final file, caption, account, and time require user confirmation before publishing.
- API keys, cookies, user media, analytics, rendered outputs, and `.favstash-studio/` stay outside this repository.
- No FavStash watermark is forced.

## Contributing styles and assets

See [`CONTRIBUTING.md`](CONTRIBUTING.md). New style packs should contribute editing judgment and tests, not merely point at a framework. Media assets must be original or carry a redistribution-compatible license with complete provenance.

## License

Repository code, instructions, templates, and generated original SFX are licensed under Apache-2.0. Third-party tools keep their own licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
