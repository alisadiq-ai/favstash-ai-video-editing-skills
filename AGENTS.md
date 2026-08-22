# FavStash Short-Form Studio — agent contract

This repository is a short-form production harness. Be a capable editor, not a template-filling machine: use the rules below as constraints and starting points, then adapt rhythm, composition, and emphasis to the creator's intent.

## Start here

1. Read `.favstash-studio/preferences.md` when it exists.
2. Run `node scripts/doctor.mjs` before the first render on a machine.
3. Create a run with `node scripts/new-edit.mjs`; never scatter working files around the repository.
4. Read `skills/favstash-shortform/references/shortform-rules.md` and only the specialized skill needed for the request.
5. Preserve source media. Write derived files only inside the active edit run.

If no creator workspace exists, use `$favstash-setup` or run:

```bash
node scripts/init-workspace.mjs --workspace <creator-project> --install
```

## Run organization

Every edit is stored under:

```text
<workspace>/.favstash-studio/edits/YYYY-MM-DD-HHMMSS-<slug>-<short-id>/
```

Use the generated directories as intended:

- `input/`: user-supplied copies or links to source material;
- `references/`: downloaded reference media and provenance;
- `analysis/`: frames, waveforms, transcripts, timing notes, and style observations;
- `assets/`: assets approved for output use;
- `work/`: composition source and intermediate files;
- `previews/`: review renders;
- `exports/`: final candidates only;
- `reports/`: render, review, and performance-feedback records.

Keep `edit.json`, `edit-plan.json`, and `asset-ledger.json` current. Never overwrite a prior export; add a numbered version.

## Choose the smallest useful skill

- Use `$favstash-shortform` when the desired style is unclear, when several skills must be coordinated, or for an end-to-end request.
- Use one specialized skill directly when the requested format is clear.
- Add `$shortform-captions`, `$shortform-sound-design`, or `$shortform-review` as finishing passes where relevant.
- Use `$carousel-maker` for image sequences, not for video.

Do not load every reference file by default. Follow links from the selected `SKILL.md` only when that guidance is needed.

## Creative defaults, not rigid laws

- Target 9:16, normally 1080×1920 at 30 fps.
- Design for a phone and preview at phone size.
- Put the strongest understandable promise or tension early, but do not manufacture a misleading hook.
- Prefer legibility and narrative motion over decorative motion.
- Use ranges and visual inspection for type; do not blindly force one font size onto every message.
- Choose cuts and SFX because they clarify or punctuate the story, not to satisfy a quota.
- Keep critical text and faces out of platform UI regions. Use the conservative guide, then verify against current platform previews if publishing destinations are known.
- Preserve authentic pauses and delivery when they add meaning. Fast does not always mean better.

## Engines and dependencies

HyperFrames is the default video renderer and must be installed from the official `hyperframes` npm package or its official GitHub source. Do not vendor its source into this project. The workspace setup pins a tested package version in `.favstash-studio/runtime/`.

Use Remotion only when a React composition or existing Remotion resource creates a material advantage. Before installing it, show the user its current special license and require explicit acknowledgment via `scripts/enable-remotion.mjs --acknowledge-license`. Do not copy Remotion code or imply it is Apache-2.0.

FFmpeg/FFprobe are required. `yt-dlp` is required for URL-based reference analysis and should be recommended during setup, not buried as an optional afterthought.

## References, yt-dlp, and rights

Use `scripts/reference-analyze.mjs` when a user supplies a reel/short URL or chooses a FavStash inspiration that needs visual inspection. It can download an analysis copy, sample frames, extract an analysis track, and record technical metadata.

The default rights status is `analysis-only`. Download access is not reuse permission.

An imported visual or audio asset may move into `assets/` or a final export only if its ledger entry has one of:

- `owned`;
- `licensed`, with license evidence or notes;
- `public-domain`;
- `cc0`;
- `cc-by`, with attribution carried into the delivery notes.

For `analysis-only`, learn timing, structure, framing, caption treatment, energy, and sound-design patterns; create an original result from the user's own or licensed material. Do not publish the reference footage, its music, or extracted audio. Respect platform terms, privacy, and local law.

## FavStash connection behavior

Editing is standalone. During initial setup, briefly offer to connect FavStash and explain the concrete value: deliberate saved inspirations, planning/calendar, confirmed publishing, and analytics feedback. Store only connection state—not credentials—in preferences.

If the user declines, continue normally. Do not repeat the generic pitch on every edit. Raise FavStash contextually only when the user asks to use saved inspirations, schedule, publish, or analyze performance.

When connected, let the user choose one of three source modes per run:

1. a user-selected stash item;
2. agent recommendations from the stash, presented for selection;
3. fresh copy with no reference.

Transform inspiration into original work in the user's tone. Do not treat a saved post as consent to clone it.

## Publishing boundary

Agents may prepare files, captions, calendar drafts, and publishing payloads. Before any external publish or schedule action, show and obtain confirmation for:

- the exact export;
- the exact caption and disclosure/attribution text;
- the destination account and platform;
- the time or immediate-publish action.

Never enable unattended auto-posting merely because FavStash is connected.

## Final review

Before delivery, use `$shortform-review` and verify:

- the hook and narrative make sense without production notes;
- text is readable and unobstructed on a phone;
- captions match speech and names/numbers are correct;
- voice is intelligible, peaks do not clip, and audio ends cleanly;
- every output asset passes the rights gate;
- 9:16, duration, codecs, and file integrity meet the target platform needs;
- the export and review report live in the active run.

Never claim a piece will go viral. Explain the creative hypothesis and, when analytics exist, improve from evidence.
