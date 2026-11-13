# Third-party notices

This repository provides instructions and media helpers. Apart from the fonts marked **bundled**, it does not vendor the projects below; setup or the creator installs them.

| Project | Role | License note |
| --- | --- | --- |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Optional HTML-to-video renderer and local transcription | Apache-2.0 upstream at time of integration; verify the installed release |
| [GSAP](https://gsap.com/) | Animation runtime copied into generated style compositions | GSAP Standard "no charge" license; installed from npm by setup, not redistributed here |
| [FFmpeg](https://ffmpeg.org/) | Media probing, extraction, encoding, and QC | LGPL/GPL configuration varies by build; review the binary you install |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | User-authorized reference download and metadata | Unlicense upstream at time of integration; platform terms and media rights remain separate |
| [FavStash CLI](https://www.npmjs.com/package/@sketric/favstash-mcp) | Optional sign-in, MCP bridge and local uploads for FavStash | MIT on npm at time of integration; the FavStash service has its own terms |
| [Montserrat](https://github.com/JulietaUla/Montserrat) | Caption and graphics font **bundled** in `skills/3-editing-styles/breakout-card/assets/fonts/` | SIL Open Font License 1.1; the license text ships beside the fonts |
| [Inter Tight](https://github.com/rsms/inter), [Instrument Serif](https://github.com/Instrument/instrument-serif), [Geist Mono](https://github.com/vercel/geist-font) | Type for animated-explainer and 3d-character, **bundled** in each skill's `assets/fonts/` | SIL Open Font License 1.1; the license text ships beside the fonts |
| [three.js](https://github.com/mrdoob/three.js) r168 | 3D rendering for 3d-character, **bundled** in `skills/3-editing-styles/3d-character/assets/vendor/three/` (the core module plus two add-ons) | MIT; the license text ships beside it |
| [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) via `hyperframes tts` | Optional free local voice for animated reels | Apache-2.0 upstream; HyperFrames downloads the model, not distributed here |
| [Chatterbox](https://github.com/resemble-ai/chatterbox) | Optional free local voice that clones the creator's own voice | MIT; archived by Resemble AI in August 2026; installed by the creator with pip; its output carries Resemble's Perth watermark |
| [ElevenLabs](https://elevenlabs.io) | Optional hosted voice with word timestamps | A paid service with its own terms; used only with the creator's own API key |
| [PDQ](https://github.com/facebook/ThreatExchange/tree/main/pdq) via `pdqhash` | Frame hashing for the optional duplicate check | BSD-style upstream license; installed with pip, verify the installed package |
| [NumPy](https://numpy.org/), [SciPy](https://scipy.org/), [OpenCV](https://opencv.org/) | Optional duplicate check, breakout-card plates, voice and lip-sync timing, and building a cartoon rig | BSD / Apache-2.0 upstream; installed with pip |
| [Playwright](https://playwright.dev/python/) | Optional page captures and layout snapshots for paper-grid | Apache-2.0; installed with pip, uses the local Chrome |
| Apple Vision | Built-in person matte for breakout-card on macOS | Part of macOS; not distributed here |

The adaptive glass CSS is an original implementation informed by the optical-layer model in [liquid-glass-css](https://github.com/turtiesocks/agent-skills/tree/main/liquid-glass-css); no code from it is included.

Generated WAVs are original synthesis covered by Apache-2.0. The separately marked curated recordings were supplied by the maintainer from his public/non-copyright sound library and included at his request; they are not repository-generated recordings or newly relicensed by the code license.

The `product-motion-ads` method is informed by [brag](https://github.com/latent-spaces/brag) (MIT); no text or code from it is included. Its preview image (`assets/previews/product-motion-ads.jpg`) shows an ad an agent built with the skill from brag's MIT-licensed "Horse Tinder" example site, a fictional app; its artwork was drawn in code.

The other style preview images in `assets/previews/` come from the maintainer's own reels, with the speaker replaced by a placeholder figure, and are included with his permission; they are not covered by the code license for reuse as stock footage.

The sample characters in `skills/3-editing-styles/cartoon-character/characters/` (a cartoon of Ali, the maintainer, and Stashy, the FavStash mascot) are included at the maintainer's request for trying the skills. They are not covered by the code license; their [terms](skills/3-editing-styles/cartoon-character/characters/README.md) say how they may be used.

The `animated-explainer` preview (`assets/previews/animated-explainer.jpg`) is three frames of a reel the skill built from its worked example, with the Ali sample as the cursor and a Kokoro voice. The `cartoon-character` preview is composed from the two sample rigs.

The `3d-character` method follows the code-built 3D films of [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) (three.js scenes rendered frame by frame, characters made from shapes in code); no text or code from it is included. Its preview (`assets/previews/3d-character.jpg`) shows frames of the worked example built by the skill.
