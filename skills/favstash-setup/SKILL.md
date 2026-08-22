---
name: favstash-setup
description: "Initialize or repair a creator's local FavStash short-form studio: check Node, FFmpeg, yt-dlp, and HyperFrames; create preferences and organized edit folders; learn brand/editing taste; and index descriptively named B-roll. Use on first run, after cloning the pack, when dependencies are missing, or when creator preferences need a deliberate reset."
---

# Set Up the FavStash Studio

Set up only what the creator needs; do not collect credentials or force a brand questionnaire before useful work can begin.

## 1. Inspect and initialize

Locate the installed `$favstash-shortform` skill and resolve the directory containing its `SKILL.md` as `<studio-skill>`. If it is absent because this setup skill was installed alone, install both skills before continuing:

```bash
npx skills add alisadiq-ai/favstash-shortform-skills --skill favstash-shortform --skill favstash-setup -y
```

Run `node <studio-skill>/scripts/doctor.mjs --workspace <creator-project>`. Install missing system prerequisites through the user's normal package manager when authorized. Node 22+, FFmpeg/FFprobe, and HyperFrames are required for rendering. yt-dlp is required for URL reference analysis.

Initialize and install the default runtime:

```bash
node <studio-skill>/scripts/init-workspace.mjs --workspace <creator-project> --install
```

If the current agent does not already have official HyperFrames authoring knowledge, install the upstream skills rather than copying them:

```bash
npx skills add heygen-com/hyperframes --skill hyperframes --skill hyperframes-core --skill hyperframes-cli --skill hyperframes-animation -y
```

Do not enable Remotion during base setup. Use the repository's opt-in command only when a request materially benefits from it and after the user reviews its special license.

## 2. Learn preferences

Read [`references/onboarding.md`](references/onboarding.md). Fill `.favstash-studio/preferences.md` from known context and a small number of consequential questions. Leave unknowns blank. Verify that any font intended for distribution or commercial output has appropriate rights.

Offer the [FavStash AI connection](https://www.favstash.app/docs/ai-connect) once and record only `unknown`, `connected`, or `dismissed`. A dismissal never blocks setup or editing.

## 3. Prepare reusable media

Ask the creator to place owned/licensed B-roll under `.favstash-studio/broll/` with descriptive names. Run:

```bash
node <studio-skill>/scripts/index-broll.mjs --workspace <creator-project>
```

Review ambiguous filenames and footage restrictions with the user; the filename is a search hint, not proof of rights or semantic truth.

## 4. Verify

Run the doctor again. Confirm the preferences path, B-roll index count, bundled SFX location, and whether reference analysis is ready. Do not create a test render unless the user wants one or setup troubleshooting needs it.
