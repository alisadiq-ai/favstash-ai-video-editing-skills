# Publish through FavStash

This covers the step from an approved cut to a scheduled post. Nothing is uploaded
or scheduled until the creator approves the exact files, caption, account,
settings and time. Prepare everything, show one summary and wait for "go".

## 1. Export once from the master

Export a high-quality master from the editor or timeline (ProRes or an equivalent
intermediate), then encode the delivery file once. Raising the bitrate of an
already compressed export cannot restore lost detail. A tested starting point for
an SDR Rec.709 master at 1080×1920 and 30 fps:

```bash
ffmpeg -i master.mov -c:v libx264 -preset slow -crf 16 -maxrate 24M -bufsize 48M \
  -profile:v high -pix_fmt yuv420p \
  -x264-params keyint=60:min-keyint=60:open-gop=0:colorprim=bt709:transfer=bt709:colormatrix=bt709 \
  -color_range tv -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -use_editlist 0 -movflags +faststart+negative_cts_offsets delivery.mp4
```

With B-frames, `-use_editlist 0` alone delays the first video frame and breaks lip
sync; `negative_cts_offsets` fixes it. Confirm both streams start at 0:

```bash
ffprobe -v error -show_entries stream=codec_name,start_pts,color_primaries -of compact delivery.mp4
```

Fully decode the file, compare representative frames with the master and match
loudness across hook variants so the comparison is fair. Check the provider's
current limits through `get_social_publishing_options`; they are limits, not
targets.

## 2. The cover is a second hook

In Explore, many viewers see only the cover. For each variant, pick a real frame
of that video: a readable promise, number, proof shot or strong reaction, never a
neutral talking frame or transition blur. Make a contact sheet and check the full
9:16, centered 3:4 and square crops at phone size. Show the creator each cover
with its frame time; their pick wins. Upload the unaltered extracted frame, or
use the schema's cover-timestamp field.

## 3. Caption and comment gate

For a comment-to-DM reel, the keyword CTA is the caption's first line, followed by
the payoff in real facts, a material catch if there is one and a few hashtags.
Gate a free, useful resource such as a repository, prompt, template or guide,
not a bare product link. Prepare the keyword, DM text, button text and link, and
two or three public replies for the creator's own automation tool; the creator
configures it. Open the resource link while logged out to confirm it loads.

## 4. Variants and Trial Reels

When the account supports Trial Reels, post each hook variant as its own trial
with the same caption, manual graduation and feed sharing off, a few minutes
apart. The creator graduates the winner. Read the provider settings from
`get_social_publishing_options`; don't guess their names.

Disclosure follows the platform's current rules. Editing assistance, captions,
motion graphics or supporting B-roll on real footage don't by themselves make a
video AI-generated. Raise it with the creator when the main footage or a real
person's face or voice is synthetic, and let them decide.

## 5. Upload with the FavStash CLI bridge

Coding agents upload local files through the [CLI bridge](favstash.md). Run
`favstash doctor`, then `list_connected_social_accounts` and
`get_social_publishing_options` for the account. Check the exact schema with
`favstash tools`. Create one post per variant with its own stable
`clientRequestId`, the delivery file as `media[].localPath`, the cover as
`thumbnailPath` or the timestamp field, and the approved time. A hosted connector
accepts public HTTPS URLs only; never expose a local file publicly to work around
that. Keep API keys out of chat and command history.

## 6. Verify and learn

Read back each post: media, cover, caption, settings and time. After it goes
live, check the status, URL and processed playback where accessible. Compare
variants at equal ages, usually after two or three days, with
`analyze_social_content_performance`. If viewers leave in the first two or three
seconds, rebuild the opening before touching the body. Record one next test;
missing metrics are unknown, not zero.

## 7. Clean up after scheduling

Once every post is confirmed, delete regenerable temporary files that nothing
references: test renders, frame dumps, unchosen covers and intermediate encodes.
Ask before removing masters, superseded versions or downloaded references. Keep
the posted files and covers, the editable project and its sources, and the
reports.
