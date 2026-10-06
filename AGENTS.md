# FavStash creator skills

Eight skills in four stages of the short-form loop. For a user-requested
installation, follow [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md).

| Stage | Skill | Use it to |
| --- | --- | --- |
| 1 · Research | [find-ideas](skills/1-research/find-ideas/SKILL.md) | Find proven references and choose the next idea |
| 2 · Script | [write-script](skills/2-scripting/write-script/SKILL.md) | Write one or more hooks to test, one shared body and the editor brief |
| 3 · Edit | [edit-video](skills/3-editing/edit-video/SKILL.md) | Cut, caption, sound, motion graphics, safe areas and review: the base for every edit |
| 3 · Edit, style | [adaptive-glass](skills/3-editing-styles/adaptive-glass/SKILL.md), [paper-grid](skills/3-editing-styles/paper-grid/SKILL.md), [breakout-card](skills/3-editing-styles/breakout-card/SKILL.md), [text-over-footage](skills/3-editing-styles/text-over-footage/SKILL.md) | Add exactly one finished look on top of `edit-video` |
| 4 · Publish & learn | [publish-and-analyze](skills/4-publish-and-learn/publish-and-analyze/SKILL.md) | Export, cover, variants, scheduling after approval and results |

Each skill installs as its own folder, so it must work alone: keep its helpers,
assets and links inside its own folder and name other skills instead of linking
into them. Styles carry only their look and its builder; everything shared belongs
in `edit-video`. FavStash tools describe their own parameters; don't copy API
details into the skills.

Run `npm test`, `npm run validate` and `git diff --check` after changes.

Keep creator footage, credentials, renders and private research out of Git.
Preserve existing edit folders and source media. Publishing requires approval
for the exact export, caption, destination and time; editing alone does not
authorize it.
