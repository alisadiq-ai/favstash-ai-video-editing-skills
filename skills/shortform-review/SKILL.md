---
name: shortform-review
description: "Review a finished or near-finished vertical short for editorial clarity, phone readability, platform-safe composition, caption and audio accuracy, asset rights, render integrity, and delivery readiness. Use before presenting, scheduling, or publishing any video produced with this pack, and when diagnosing why an edit feels weak without rebuilding it."
---

# Short-Form Review

Review the encoded candidate, not just the composition source. Diagnose first; do not silently rebuild a user's approved creative direction.

## Review order

1. Read [`references/review-checklist.md`](references/review-checklist.md) and the active run's plan, ledger, and preferences.
2. Probe the export with FFprobe. Confirm dimensions, duration, video/audio streams, frame rate, pixel format, and playback integrity.
3. Watch once in real time without pausing for the audience experience. State the one-sentence takeaway you actually received.
4. Watch muted at phone size for hook, hierarchy, safe placement, captions, pacing, and visual continuity.
5. Listen without watching on phone speakers/headphones for speech edits, clarity, mix, transitions, and the ending.
6. Inspect the hook frame, dense-text frames, transitions, proof/claim frames, and final frame at full resolution.
7. Audit every used asset against `asset-ledger.json`. Any `analysis-only` asset in output is a release blocker.
8. Write `reports/review-vNN.md` with pass/blocker/warning findings and exact timestamps. Re-render only after the user or active editing workflow accepts the fix.

Do not label subjective preference as a technical failure. Separate release blockers from high-value improvements and optional taste notes. Never promise that passing review will make a video viral.
