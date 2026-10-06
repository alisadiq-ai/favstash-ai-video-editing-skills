# Install FavStash creator skills

Use this guide when the user asks to set up this pack. Install the eight skills,
prepare the local editing tools and connect FavStash. Reuse what already works;
ask the user only for a needed workspace choice, system permission or account
sign-in. This setup does not authorize publishing, scheduling or uploads.

Repository: [alisadiq-ai/favstash-ai-video-editing-skills](https://github.com/alisadiq-ai/favstash-ai-video-editing-skills).

## 1. Locate the workspace and clone the pack

Detect the current agent, operating system and available package manager. Use
the active creator project when one exists; otherwise ask where the user wants
their footage and edits to live. Do not use a temporary directory as the lasting
installation. If you only have hosted chat access, hand these instructions to a
local coding agent; do not report local installation as complete.

In the commands below, substitute real absolute paths for `<workspace>` and
`<pack>`. Run commands separately and inspect failures before continuing.

Use `<workspace>/.favstash-studio/skills-source` as `<pack>` for a new clone:

```bash
git clone https://github.com/alisadiq-ai/favstash-ai-video-editing-skills.git "<pack>"
```

Create the parent directory first. If this repository is already checked out,
reuse that verified checkout instead. If the destination exists, inspect its
remote and working tree; never overwrite an unrelated folder or discard edits.
An inaccessible repository is an access problem: use the user's authorized
checkout/credentials or report the blocker without creating a replacement repo.

## 2. Prepare the local tools

Check Git, Node.js, npm, FFmpeg, FFprobe and yt-dlp before installing anything.
Node must be **22 or newer**. Keep an already-working installation.

Use the existing trusted package manager for missing tools. On macOS with
Homebrew, install only the missing entries from `git`, `node`, `ffmpeg`, `yt-dlp`.
On Linux or Windows, use the system's supported packages or the official
[Node.js](https://nodejs.org/en/download), [FFmpeg](https://ffmpeg.org/download.html)
and [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation) installation routes.
Check the resulting Node version; a distribution's default may be too old.
Request system elevation only if the chosen installation actually requires it.

Run the pack's setup to install its pinned HyperFrames runtime and GSAP locally:

```bash
node "<pack>/skills/3-editing/edit-video/scripts/init-workspace.mjs" --workspace "<workspace>" --install
```

This prepares `.favstash-studio/runtime/`, a B-roll inbox and optional preferences.
It preserves existing preferences and existing HyperFrames or GSAP versions. Keep
this runtime separate from the creator application's dependencies. Use the
official renderer package; no global renderer install or extra style pack is
necessary. The runtime also provides local transcription (`hyperframes
transcribe`), which downloads a Whisper model on first use.

The `paper-grid` and `breakout-card` styles and the duplicate check also use
Python 3. When the creator wants them, install the packages into a virtual
environment or the user's own Python (not system-wide with elevation):
`numpy opencv-python` for breakout-card plates, `pdqhash scipy numpy` for the
duplicate check and, optionally, `playwright` for paper-grid page captures. The
breakout card's built-in person matte compiles with `swiftc` on macOS; elsewhere
it takes a matte video from another tool. Skip these when the creator only needs
the other styles.

## 3. Install the skills for the current agent

Run the [Agent Skills CLI](https://github.com/vercel-labs/skills) **from the creator
workspace**, using the clone as its source. Choose the actual host identifier
(for example `codex`, `claude-code` or `cursor`); inspect CLI help for other hosts.

```bash
npx --yes skills add "<pack>" --agent <agent-id> --skill find-ideas --skill write-script --skill edit-video --skill adaptive-glass --skill paper-grid --skill breakout-card --skill text-over-footage --skill publish-and-analyze --copy --yes
```

Install for this project by default. Use global scope only if the user asks for
availability across projects. Do not target every installed agent. Verify that
all eight skills were installed with their scripts, references and assets
(`edit-video`'s SFX, each style's builder, the breakout card's fonts). Check `npx skills list --agent <agent-id>` from the same
workspace. If the host needs a reload for discovery, tell the user exactly what
to reload.

## 4. Verify local editing

```bash
node "<pack>/skills/3-editing/edit-video/scripts/doctor.mjs" --workspace "<workspace>" --json --strict
```

Check the report, not just the exit code: Node, npm, FFmpeg, FFprobe, yt-dlp,
HyperFrames and GSAP must each be available for the complete setup (`renderReady`
and `glassReady`). A missing downloader can leave local editing usable but
reference-URL analysis pending. `paperGridReady`, `breakoutCardReady` and
`duplicateCheckReady` report the optional Python pieces.

A CLI version check alone does not verify rendering. Use the installed
`.favstash-studio/runtime/node_modules/.bin/hyperframes` executable (on Windows,
its `.cmd` entry). Inspect its `--help` and `render --help`, then render a tiny
local test composition in `.favstash-studio/setup-check/`. Avoid scaffolding
commands that automatically install another library of agent skills. If Chromium
is missing, use the installed renderer's documented browser setup. Keep the
smoke test local and free of personal footage or remote assets.

Probe and fully decode the resulting MP4 with FFprobe/FFmpeg, and inspect its
frames. Report a rendering failure separately from a successful skill install;
do not call the whole setup ready when only packages installed successfully.

## 5. Connect FavStash

First check whether FavStash already works. Discover FavStash tools in the current
session. If present, make a small, authenticated read-only request using their
current schema, such as `get_stash_summary` with no filters. A successful empty
result is valid. Do not import content, create a post or upload a video as a
connection test. If the call succeeds, keep the existing connection and skip to
the account check below. Do not reinstall a configured server merely because this
session has not loaded its tools; distinguish a missing entry, expired sign-in,
pending reload and a service error.

**For Codex and Claude Code, prefer the FavStash CLI.** It signs in through the
browser and includes a local bridge that can upload files from the workspace.
Check `npm view @sketric/favstash-mcp version` first; the commands below need
0.4.0 or newer.

```bash
npm install -g @sketric/favstash-mcp@latest
favstash auth login
favstash setup --agent codex
favstash doctor
```

Use `--agent claude-code` for Claude Code, and `--dry-run` to preview the change.
Install globally, not from a temporary npx cache: setup pins the bridge to the
installed Node and script paths. The user completes sign-in and consent in the
browser; never ask for tokens or passwords in chat. Setup adds only the
`favstash` entry and preserves other servers. `doctor` verifies the authenticated
handshake; the host still needs its own read-only call after a reload. For SSH,
containers and other headless cases, follow the [CLI guide](https://www.favstash.app/cli.md).

**For other hosts,** follow [FavStash's agent install guide](https://www.favstash.app/INSTALL_FOR_AGENTS.md)
and its host-specific remote MCP and OAuth steps. Do not guess one configuration
format for every agent or build a local MCP server. If a host truly requires an
API key, have the user store it in local secret storage, not in chat, the
repository or preferences.

After configuration, reload if needed and repeat the read-only call. If the user
must restart the host, report **configured, awaiting reload** and name the
verification still needed. If the service is unavailable, report that result
without repeatedly changing settings. If the user declines, finish local editing
setup and record the connection as skipped only in local notes.

When the connection works, check `list_connected_social_accounts`. No connected
social account is different from a broken connection: stash access may work while
publishing or analytics needs an account. Show the returned secure setup link
when needed; the user connects providers inside FavStash. Never claim all
platforms are ready from one successful call.

## 6. Hand off a ready workspace

Report briefly:

- where the eight skills and creator workspace live;
- dependency versions and the smoke-render result;
- whether FavStash is verified, pending sign-in/reload, unavailable or skipped,
  and through which route (CLI bridge or remote MCP);
- whether social accounts are connected, or the exact remaining connection step.

Then offer concrete first prompts:

```text
Use $find-ideas to find three proven reels in my niche, then $write-script to
turn the best one into a few hooks to test and a shared body in my voice.
```

```text
Use $edit-video to turn these takes into a reel in the style that fits
(adaptive-glass, paper-grid, breakout-card or text-over-footage), and show me
the reviewed export before any publishing step.
```

Keep setup separate from creative approval. Do not publish, schedule, upload
creator media or modify remote content during installation.
