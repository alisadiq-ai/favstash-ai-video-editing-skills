# Short-form release checklist

## Blockers

- file cannot play, is corrupt, has missing/frozen frames, or has the wrong deliverable;
- critical text/face/control is clipped or predictably hidden by destination UI;
- captions materially misquote speech, names, numbers, or qualifiers;
- voice is unintelligible, sync is visibly wrong, or audio clips severely;
- an output contains an `analysis-only`, unknown, or prohibited asset;
- required attribution/disclosure is missing;
- a claim, before/after, testimonial, or product result is materially misleading;
- private data or an unapproved person/location is visible.

## High-value warnings

- hook is understandable but slow or mismatched to the payoff;
- text is technically readable but tiring at phone size;
- a cut, crop, animation, or SFX calls attention to itself without helping the point;
- dense simultaneous layers compete;
- ending feels accidental or cuts off resonance;
- encoding quality noticeably damages gradients, captions, or motion;
- the creative hypothesis is not recorded, making later analytics less useful.

## Optional taste notes

- alternate font weight, crop, music energy, motion curve, or emphasis choice;
- a possible hook/pacing variant worth testing rather than declaring objectively better;
- a brand preference that should be added to preferences after creator approval.

## Technical target for default video

- 1080×1920, 9:16, normally 30 fps;
- H.264 video, `yuv420p`, AAC audio, fast-start MP4;
- duration appropriate to the selected platform and story;
- sane loudness and no unexpected silence, truncation, or duplicate frames.

Platform constraints change. Verify current primary documentation before making a release-blocking claim based on file-size, duration, codec, or UI-overlay limits.

## Review report shape

Record candidate filename/hash, review date, target platforms, technical probe, summary takeaway, blockers, warnings, optional notes, rights result, and final recommendation: `do-not-release`, `revise`, or `ready-for-user-approval`.
