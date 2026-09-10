# Contributing

Keep the pack at one adaptive editor plus optional motion graphics and captions.
Improve its judgment with concrete editing lessons. Do not create a skill for
another layout or routine production stage, prescribe fixed cut/SFX quotas, or
add forms and references that a simple edit does not need.

Helpers live once, inside `skills/favstash-shortform/`, and must work when only
that skill is installed. Root scripts are maintainer tools. Check a helper change
with observable behavior in a temporary creator workspace, preserving inputs
and existing preferences.

```bash
npm test
npm run validate
git diff --check
```

Validation checks skill discovery, metadata, local links and bundled SFX. It
does not establish editing quality: try real footage, inspect the encoded cut
and record remaining limitations before considering the pack ready to share.

Contribute only original or redistribution-compatible assets with source,
license, required attribution and checksums. Do not include creator footage,
private fonts, credentials or renders. `.favstash-studio/` and `.dev-private/`
remain ignored; required public attribution belongs in
[third-party notices](THIRD_PARTY_NOTICES.md).
