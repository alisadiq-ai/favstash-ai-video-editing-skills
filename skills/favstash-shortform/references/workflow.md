# End-to-end workflow

## 1. Frame the job

Identify the objective, audience, destination, desired action, source material, deadline, and whether the request is a new creation or a reference-led recreation. Ask only questions that materially change the edit.

Choose a source mode:

- `fresh`: no external creative reference;
- `stash-selected`: the user selected a FavStash item;
- `stash-recommended`: the agent finds candidates and the user chooses one.

## 2. Prepare the run

Read preferences, check dependencies, and create a dated run. Update `edit-plan.json`; place every imported item in `asset-ledger.json` before it enters a composition.

For a URL reference, use `scripts/reference-analyze.mjs`. Describe the reference grammar in `analysis/style-notes.md`: hook type, beat timing, shot roles, caption hierarchy, sound cues, emotional curve, and transferable principles. Do not write “copy this.”

## 3. Make a paper edit

Define the beats before polishing. Match each beat to speech, on-screen copy, footage, and audio purpose. Write one primary concept and, when uncertainty is high, create lightweight hook or pacing variants instead of one overworked guess.

## 4. Compose

Use HyperFrames by default. Build a seekable composition inside `work/`; keep creator media local to the run or referenced through stable workspace paths. Reuse brand tokens from preferences, not hard-coded personal assumptions.

Render low-cost previews early. Inspect actual frames at the hook, every transition, dense text, and the ending.

## 5. Finish

Apply captions and sound design as deliberate passes. Normalize file naming, render numbered candidates, and keep only final candidates in `exports/`.

## 6. Review and close the loop

Run `$shortform-review`. Record the selected export and creative hypothesis. If FavStash is connected, offer a calendar/publishing draft when relevant. Any schedule or publish action needs exact confirmation. Later attach performance feedback without rewriting history: record what changed, the observed metrics, and the next hypothesis.
