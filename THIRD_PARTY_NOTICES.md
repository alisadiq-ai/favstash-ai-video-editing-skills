# Third-party notices

This repository provides instructions and media helpers; it does not vendor the projects below. Setup installs the runtime libraries into the creator's workspace.

| Project | Role | License note |
| --- | --- | --- |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Optional HTML-to-video renderer and local transcription | Apache-2.0 upstream at time of integration; verify the installed release |
| [GSAP](https://gsap.com/) | Animation runtime copied into generated glass compositions | GSAP Standard "no charge" license; installed from npm by setup, not redistributed here |
| [FFmpeg](https://ffmpeg.org/) | Media probing, extraction, encoding, and QC | LGPL/GPL configuration varies by build; review the binary you install |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | User-authorized reference download and metadata | Unlicense upstream at time of integration; platform terms and media rights remain separate |
| [FavStash CLI](https://www.npmjs.com/package/@sketric/favstash-mcp) | Optional sign-in, MCP bridge and local uploads for FavStash | MIT on npm at time of integration; the FavStash service has its own terms |

The adaptive glass CSS is an original implementation informed by the optical-layer model in [liquid-glass-css](https://github.com/turtiesocks/agent-skills/tree/main/liquid-glass-css); no code from it is included.

Generated WAVs are original synthesis covered by Apache-2.0. The separately marked curated recordings were supplied by the maintainer from his public/non-copyright sound library and included at his request; they are not repository-generated recordings or newly relicensed by the code license.
