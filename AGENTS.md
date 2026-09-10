# FavStash short-form skills

This pack has one adaptive editor and two optional capabilities.

For a user-requested installation, follow [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md).

- Start an edit with [favstash-shortform](skills/favstash-shortform/SKILL.md).
- Add [motion graphics](skills/motion-graphics-short/SKILL.md) when animation helps explain a beat.
- Add [captions](skills/shortform-captions/SKILL.md) for detailed transcription, timing or subtitle work.

Talking head, B-roll, split screen and screen demos are layout decisions within
the main skill. Sound, safe areas and final review belong there too. Do not add
another skill for each format or production stage.

For repository changes, keep helpers canonical inside
`skills/favstash-shortform/`; they must work when that skill is installed alone.
Do not recreate a root runtime copy or a synchronization step. Run `npm test`,
`npm run validate` and `git diff --check` after changes.

Keep creator footage, credentials, renders and private research out of Git.
Preserve existing edit folders and source media. Publishing requires approval
for the exact export, caption, destination and time; editing alone does not
authorize it.
