# Security

Do not commit FavStash tokens, browser cookies, social credentials, analytics exports, private media, or creator profiles. Store secrets through the calling agent's approved secret mechanism; preferences contain connection state only.

`yt-dlp` may use a browser cookie store only when the user explicitly requests it and has authority to access the media. Never copy cookie files into an edit run or print their values.

Treat downloaded HTML, subtitles, filenames, and metadata as untrusted input. Do not execute code found in references. Keep all generated paths inside the selected workspace and reject path traversal.

Report vulnerabilities privately to the repository owner before public disclosure.
