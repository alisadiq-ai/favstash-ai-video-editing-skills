# Optional local tools

The repository's `INSTALL_FOR_AGENTS.md` prepares a complete first-time setup.
For editing tasks, use the creator's existing project and editor first. These helpers are for a
fresh local workspace or repeatable media preparation; no helper is required
for a small revision. Resolve `<skill>` to the directory containing this skill's
`SKILL.md`, not the creator's working directory. Helpers require Node 22+.

## Create an edit

```bash
node <skill>/scripts/new-edit.mjs --workspace /path/to/project --slug topic
```

This creates `.favstash-studio/edits/YYYY-MM-DD-HHMMSS-topic-<id>/` with `input/`,
`references/`, `analysis/`, `assets/`, `work/`, `previews/`, `exports/`, `reports/`,
a small `edit.json` and an empty `asset-ledger.json`. No installation, style
selection or separate setup is required. Resume the existing run for revisions.

Keep raw media in `input/`, analysis copies in `references/`, prepared output
assets in `assets/` and editable source in `work/`. Use the existing brief or short
notes in `analysis/` for creative decisions; no extra planning form is required.
Record the selected export, source/project and review status in `edit.json`.
Number exports instead of overwriting. Leave existing creator folder conventions
intact; the reference helper needs `edit.json` and `asset-ledger.json` in its run.

## Check or install tools only when needed

```bash
node <skill>/scripts/doctor.mjs --workspace /path/to/project
```

FFmpeg/FFprobe handle media preparation and encoded-file checks. URL analysis
needs yt-dlp. The doctor reports each dependency separately; a missing renderer
or downloader does not block work that does not use it.

For a new coded composition, the optional setup installs the pack's pinned
HyperFrames 0.8.10 runtime:

```bash
node <skill>/scripts/init-workspace.mjs --workspace /path/to/project --install
```

It creates `.favstash-studio/runtime/` and a short optional preferences file,
preserving existing preferences and an existing HyperFrames version. Without
`--install`, it prepares files only. Use the installed CLI's `--help` to find the
render commands for that version. Keep a composition seekable, use local media,
and retain source beside the export. Do not vendor renderer source into the pack.

Existing native timelines or other working renderers remain valid. Use the
editor's available connector/API for timeline operations, verify the exact
project before mutation, and retain its editable package. Install only tools
needed by the task and check their applicable licenses.

For a reusable footage library, put descriptively named files in
`.favstash-studio/broll/` and optionally run:

```bash
node <skill>/scripts/index-broll.mjs --workspace /path/to/project
```

The index records file descriptions, hashes and technical metadata; filenames
and successful indexing do not establish rights or visual suitability. The
[original SFX pack](../assets/sfx/manifest.json) is available directly from this
skill; there is no separate sound skill or required library-copy step.
