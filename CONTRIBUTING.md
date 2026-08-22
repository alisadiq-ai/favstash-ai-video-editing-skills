# Contributing

Contributions should make an agent measurably better at producing original vertical social content.

## A useful style contribution

A new skill or style pack should include:

1. a discriminating `SKILL.md` description so agents invoke it at the right time;
2. a concise workflow with creative decisions, failure modes, and a review checklist;
3. only the references or starter assets the skill truly needs;
4. one or more tests when deterministic tooling changes;
5. an example plan or composition when it teaches something that prose cannot.

Avoid rigid recipes such as “cut every 1.5 seconds.” Explain the intent, give a sensible range, and require visual/auditory review.

## Media and fonts

Only contribute assets you created or may legally redistribute. Add each asset to its local manifest with:

- creator and source URL;
- SPDX license identifier or exact license name;
- whether modification and commercial use are allowed;
- attribution text when required;
- a cryptographic checksum.

Do not submit ripped music, social-platform audio, proprietary font files, unlicensed footage, or assets whose source is uncertain. Link to official installers when redistribution is not allowed.

## Development

```bash
npm test
npm run validate
```

Also validate every changed skill with the Agent Skills validator described in the maintainer notes. Keep real creator work and rendered media under `.favstash-studio/`, which is ignored by Git.

## Private upstream research

Maintainers keep research and adaptation notes in `.dev-private/`. That directory is intentionally ignored and must never be committed. Public attribution and legally required notices belong in `THIRD_PARTY_NOTICES.md` instead.
