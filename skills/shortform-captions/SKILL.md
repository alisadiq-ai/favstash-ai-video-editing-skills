---
name: shortform-captions
description: "Create and quality-check timed captions for a short-form video: transcribe speech, segment readable phrases, style a quiet caption rail or selective emphasis, and verify names, numbers, timing, and platform-safe placement. Use as a finishing pass for spoken or narrated shorts, or when the user explicitly requests burned-in subtitles."
---

# Short-Form Captions

Captions are language first and animation second. Accuracy, timing, and readability outrank flashy word effects.

## Workflow

1. Read the shared [short-form rules](../favstash-shortform/references/shortform-rules.md) and [`references/caption-guide.md`](references/caption-guide.md).
2. Work inside an existing edit run. Transcribe locally when possible; preserve a time-aligned source (`.srt`, `.vtt`, or structured JSON) in `analysis/`.
3. Compare the transcript with audio. Correct names, brands, numbers, acronyms, punctuation, and meaningful disfluencies manually.
4. Segment by spoken thought and reading rhythm. Avoid single-word karaoke unless the user wants that visual identity and it remains comfortable to read.
5. Choose one model: quiet verbatim rail, phrase cards, or selective embedded emphasis. Do not make every word the climax.
6. Place captions in context with faces, on-screen text, and platform UI. Test high-contrast and complex-background frames.
7. Render a caption proof and watch in real time with sound on and off. Check that each phrase appears when it is spoken and remains long enough to read.
8. Save the corrected transcript, caption data, and any disclosure/translation notes in the run.

Do not invent speech the audio does not contain. Label paraphrased on-screen summaries separately from verbatim captions.
