# Engine routing

## HyperFrames — default

Use HyperFrames for new work in this repository. It is especially suitable for 9:16 layouts, text-over-B-roll, captions, SVG/chart motion, browser fonts, GSAP/Lottie animation, and deterministic local renders. Install the official `hyperframes` package in `.favstash-studio/runtime/`; do not vendor it.

Keep the composition seekable. Avoid wall-clock timers, uncontrolled network resources, and animations that cannot be evaluated at an arbitrary frame. Prefer local media and fonts so a render can be reproduced.

## Remotion — on demand

Use the Remotion adapter only when at least one is true:

- the creator already has a Remotion/React composition worth preserving;
- a required component exists in the Remotion ecosystem and cannot reasonably be expressed in the default runtime;
- the team explicitly standardizes on React compositions for this project.

Before installation, show the current upstream special license and have the user acknowledge it. Run `scripts/enable-remotion.mjs --acknowledge-license`; never silently add it as a base dependency.

## FFmpeg — media utility layer

Use FFmpeg/FFprobe to inspect streams, make review proxies, extract authorized audio, normalize codecs, concatenate compatible output, and run technical QC. Do not replace visual review with a successful FFmpeg exit code.

## Other libraries

Small browser libraries can be added per composition when their license is compatible and their value is clear. Record package name, version, and license in the run report. Avoid copying raw packs from another repository merely because they are accessible.
