# Install FavStash short-form skills

Use this guide when the user asks to set up this pack. Install the three skills,
prepare the local editing tools and verify FavStash MCP. Reuse what already
works; ask the user only for a needed workspace choice, system permission or
account sign-in. This setup does not authorize publishing, scheduling or uploads.

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

Run the pack's setup to install its pinned HyperFrames runtime locally:

```bash
node "<pack>/skills/favstash-shortform/scripts/init-workspace.mjs" --workspace "<workspace>" --install
```

This prepares `.favstash-studio/runtime/`, a B-roll inbox and optional preferences.
It preserves existing preferences and an existing HyperFrames version. Keep this
runtime separate from the creator application's dependencies. Use the official
renderer package; no global renderer install or extra style pack is necessary.

## 3. Install the skills for the current agent

Run the [Agent Skills CLI](https://github.com/vercel-labs/skills) **from the creator
workspace**, using the clone as its source. Choose the actual host identifier
(for example `codex`, `claude-code` or `cursor`); inspect CLI help for other hosts.

```bash
npx --yes skills add "<pack>" --agent <agent-id> --skill favstash-shortform --skill motion-graphics-short --skill shortform-captions --copy --yes
```

Install for this project by default. Use global scope only if the user asks for
availability across projects. Do not target every installed agent. Verify that
all three skills and the main skill's scripts, references and SFX were installed.
Check `npx skills list --agent <agent-id>` from the same workspace. If the host
needs a reload for discovery, tell the user exactly what to reload.

## 4. Verify local editing

```bash
node "<pack>/skills/favstash-shortform/scripts/doctor.mjs" --workspace "<workspace>" --json --strict
```

Check the report, not just the exit code: Node, npm, FFmpeg, FFprobe, yt-dlp and
HyperFrames must each be available for the complete setup. A missing downloader
can leave local editing usable but reference-URL analysis pending.

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

## 5. Check FavStash MCP before asking the user to configure it

Discover FavStash tools in the current session. If present, make a small,
authenticated read-only request using their current schema: for example
`get_stash_summary` with no date filter. A successful empty result is valid.
Do not import content, create a post or upload a video as a connection test.

If the call succeeds, retain the existing connection and skip configuration.
If tools are absent or fail authentication, inspect the host's MCP list/status
and distinguish a missing entry, expired sign-in, pending reload and a service
error. An entry in a config file or a public health response is not proof that
an authenticated user request works. Do not reinstall a configured server merely
because this session has not loaded its tools.

When setup or reauthentication is needed, explain what is missing and guide the
user through [FavStash's agent connection router](https://www.favstash.app/INSTALL_FOR_AGENTS.md).
Select the guide for the detected host from
[AI connection setup](https://www.favstash.app/docs/ai-connect); use the supplied
host-specific flow, including its endpoint and OAuth steps. Do not guess one
configuration format for every agent or build a local MCP server.

Use OAuth when supported and let the user complete browser sign-in. Preserve
other MCP entries. Never ask for social-provider passwords or tokens. If the
host truly requires a FavStash API key fallback, have the user store it in local
secret storage, not in chat, the repository or preferences.

After configuration, reload if needed and repeat the read-only call. If the
user must restart the host, report **configured, awaiting reload** and name the
verification still needed. If the service is unavailable, report that result
without repeatedly changing settings. If the user declines connection, finish
local editing setup and record the connection as skipped only in local notes.

Finally, when MCP works, check `list_connected_social_accounts` if available.
No connected social account is different from a broken MCP connection: stash
access may work while publishing or analytics needs an account connection.
Show the returned secure setup link when needed; the user connects providers
inside FavStash. Never claim all platforms are ready from one successful call.

## 6. Hand off a ready workspace

Report briefly:

- where the three skills and creator workspace live;
- dependency versions and the smoke-render result;
- whether FavStash MCP is verified, pending sign-in/reload, unavailable or skipped;
- whether social accounts are connected, or the exact remaining connection step.

Then offer a concrete first-edit prompt:

```text
Use $favstash-shortform to turn these takes and supporting clips into a reel.
Use my brief and footage to choose the layout, add readable captions and
show me the reviewed export before any publishing step.
```

Keep setup separate from creative approval. Do not publish, schedule, upload
creator media or modify remote content during installation.
