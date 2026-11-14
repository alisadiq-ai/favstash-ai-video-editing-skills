# FavStash creator skills

Fourteen skills in four stages of the short-form loop. For a user-requested
installation, follow [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md).

| Stage | Skill | Use it to |
| --- | --- | --- |
| 1 · Research | [find-ideas](skills/1-research/find-ideas/SKILL.md) | Find proven references and choose the next idea |
| 2 · Script | [write-script](skills/2-scripting/write-script/SKILL.md) | Write one or more hooks to test, one shared body and the editor brief |
| 3 · Edit | [edit-video](skills/3-editing/edit-video/SKILL.md) | Cut, caption, sound, motion graphics, safe areas and review: the base for every edit |
| 3 · Style, on camera | [breakout-card](skills/3-styles-on-camera/breakout-card/SKILL.md), [paper-grid](skills/3-styles-on-camera/paper-grid/SKILL.md), [adaptive-glass](skills/3-styles-on-camera/adaptive-glass/SKILL.md), [text-over-footage](skills/3-styles-on-camera/text-over-footage/SKILL.md) | Add exactly one finished look to a reel with the creator or their footage |
| 3 · Style, on camera | [motion-effects](skills/3-styles-on-camera/motion-effects/SKILL.md) | Add named motion effects (kinetic hook, gravity drop, orbit, vertigo, rewind and 28 more) to any edit |
| 3 · Style, animated | [animated-explainer](skills/3-styles-animated/animated-explainer/SKILL.md), [product-motion-ads](skills/3-styles-animated/product-motion-ads/SKILL.md) | Make a whole reel with no camera: a voice-keyed explainer, or a product ad |
| 3 · Style, animated | [film-styles](skills/3-styles-animated/film-styles/SKILL.md) | Make a whole reel or a 16:9 YouTube explainer in one of 99 film looks (whiteboard, stick figures, cel anime, newsreel, 3D maps, tilt-shift…) |
| 3 · Style, characters | [cartoon-character](skills/3-styles-characters/cartoon-character/SKILL.md), [3d-character](skills/3-styles-characters/3d-character/SKILL.md) | Add a presenter: a lip-synced 2D cartoon (a sample, or the creator's own made with AI) or a cute 3D kid |
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
