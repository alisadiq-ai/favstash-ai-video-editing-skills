# Third-party notices

This repository provides instructions and media helpers. Apart from the Montserrat font, it does not vendor the projects below; setup or the creator installs them.

| Project | Role | License note |
| --- | --- | --- |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Optional HTML-to-video renderer and local transcription | Apache-2.0 upstream at time of integration; verify the installed release |
| [GSAP](https://gsap.com/) | Animation runtime copied into generated style compositions | GSAP Standard "no charge" license; installed from npm by setup, not redistributed here |
| [FFmpeg](https://ffmpeg.org/) | Media probing, extraction, encoding, and QC | LGPL/GPL configuration varies by build; review the binary you install |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | User-authorized reference download and metadata | Unlicense upstream at time of integration; platform terms and media rights remain separate |
| [FavStash CLI](https://www.npmjs.com/package/@sketric/favstash-mcp) | Optional sign-in, MCP bridge and local uploads for FavStash | MIT on npm at time of integration; the FavStash service has its own terms |
| [Montserrat](https://github.com/JulietaUla/Montserrat) | Caption and graphics font **bundled** in `skills/3-editing-styles/breakout-card/assets/fonts/` | SIL Open Font License 1.1; the license text ships beside the fonts |
| [PDQ](https://github.com/facebook/ThreatExchange/tree/main/pdq) via `pdqhash` | Frame hashing for the optional duplicate check | BSD-style upstream license; installed with pip, verify the installed package |
| [NumPy](https://numpy.org/), [SciPy](https://scipy.org/), [OpenCV](https://opencv.org/) | Optional duplicate check and breakout-card plates | BSD / Apache-2.0 upstream; installed with pip |
| [Playwright](https://playwright.dev/python/) | Optional page captures and layout snapshots for paper-grid | Apache-2.0; installed with pip, uses the local Chrome |
| Apple Vision | Built-in person matte for breakout-card on macOS | Part of macOS; not distributed here |

The adaptive glass CSS is an original implementation informed by the optical-layer model in [liquid-glass-css](https://github.com/turtiesocks/agent-skills/tree/main/liquid-glass-css); no code from it is included.

Generated WAVs are original synthesis covered by Apache-2.0. The separately marked curated recordings were supplied by the maintainer from his public/non-copyright sound library and included at his request; they are not repository-generated recordings or newly relicensed by the code license.

The style preview images in `assets/previews/` come from the maintainer's own reels, with the speaker replaced by a placeholder figure, and are included with his permission; they are not covered by the code license for reuse as stock footage.
