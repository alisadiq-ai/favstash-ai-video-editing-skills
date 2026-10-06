# Contributing

Keep the pack to the creator loop: research, scripting, one editing base with a
few finished styles, and publishing. Improve judgment with concrete lessons from
real videos. Prefer a sharper rule in an existing skill over a new skill.

- **A new style** must be a distinct finished look, tested on real footage, with a
  preview image in `assets/previews/`. It lives in `skills/3-editing-styles/<name>/`
  with its own builder and assets, and relies on `edit-video` for everything shared.
- **Every skill works when installed alone.** Keep helpers, assets and Markdown
  links inside the skill's folder; refer to other skills by name. Root scripts are
  maintainer tools.
- **Don't duplicate FavStash's API.** The MCP tools describe their own parameters;
  skills say when FavStash helps, not how each call works.

```bash
npm test
npm run validate
git diff --check
```

Validation checks skill discovery, names, metadata, local links (including the
installed-alone rule) and bundled SFX. It doesn't establish editing quality: try
real footage, inspect the encoded cut and record remaining limitations. For a
change to a style builder, run its example build, `hyperframes check` and a short
render in a temporary workspace.

Contribute only original or redistribution-compatible assets with source, license,
required attribution and checksums. Don't include creator footage (other than
approved preview images), private fonts, credentials, renders or libraries that
setup can install. Keep examples generic: no real creators' results presented as
facts. `.favstash-studio/` and `.dev-private/` stay ignored; required public
attribution belongs in [third-party notices](THIRD_PARTY_NOTICES.md).
