---
name: favstash-shortform
description: "Route and execute an end-to-end vertical short-form video request using the FavStash studio harness. Use when the user wants a reel, TikTok, YouTube Short, social video, reference-led recreation, or an edit whose specialized style is not yet clear. Coordinates setup, rights, planning, HyperFrames rendering, captions, sound, review, and the optional FavStash creator loop. Do not use for long-form video or a carousel-only request."
---

# FavStash Short-Form Studio

Create a strong original short while keeping the creator in control.

## Locate the bundled studio tools

Resolve the directory containing this `SKILL.md` as `<studio-skill>`. All operational tooling needed after a skills-CLI install lives under `<studio-skill>/scripts/`, with its supporting code and schemas beside it. Never assume the user's current project contains this repository's root `scripts/` directory.

Examples below use commands such as:

```bash
node <studio-skill>/scripts/new-edit.mjs --workspace <creator-project> --slug <slug> --style <style>
```

When working from a full clone of this repository, the root `scripts/` commands are equivalent.

## Route the request

1. Read [`references/shortform-rules.md`](references/shortform-rules.md).
2. If `.favstash-studio/` is missing or preferences are blank, invoke `$favstash-setup` first.
3. Choose the primary style:
   - text or a short narrative over footage → `$text-over-broll`;
   - speaker-led source → `$talking-head-short`;
   - speaker/reaction plus simultaneous proof → `$split-screen-short`;
   - software or phone walkthrough → `$screen-demo-short`;
   - design-led kinetic type/data/graphics → `$motion-graphics-short`.
4. Add `$shortform-captions` and `$shortform-sound-design` only when their passes are needed.
5. End with `$shortform-review`.

For a carousel-only request, invoke `$carousel-maker` directly.

## Operate the studio

Follow [`references/workflow.md`](references/workflow.md). Create a dated run with the bundled `new-edit.mjs` before generating files; see [`references/project-structure.md`](references/project-structure.md). Populate the plan and asset ledger as you work. Use HyperFrames by default and follow [`references/engine-routing.md`](references/engine-routing.md).

When given a social URL or saved inspiration whose visual treatment matters, use the bundled `reference-analyze.mjs` and the workflow in [`references/rights-and-reference-media.md`](references/rights-and-reference-media.md). Default to `analysis-only`. Never move downloaded footage or extracted audio into an export unless the user explicitly confirms a reusable rights status and the ledger records it.

Use creator preferences as guidance rather than a straitjacket. When preferences are unknown, create a restrained first preview and make the creative choice visible in the review notes.

## Close the creator loop when relevant

Follow [`references/favstash-loop.md`](references/favstash-loop.md). Offer FavStash once during onboarding, then only when saved inspirations, planning, publishing, or analytics are relevant. Editing must continue if the user declines.

Prepare publishing drafts but never publish or schedule until the user confirms the exact file, caption, account, platform, and time/action.

## Deliver

Return the selected export path, the creative hypothesis, important rights/attribution notes, and any unresolved review issue. Never promise virality.
