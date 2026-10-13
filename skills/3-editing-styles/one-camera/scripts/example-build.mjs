#!/usr/bin/env node
// Demo and smoke test for the one-camera builder: every component in 32 s, no creator media needed.
//
//   node <skill>/scripts/example-build.mjs <new-output-dir> [--workspace <project>] [--gsap <gsap.min.js>]
//
// Frame numbers here are demo beats. In a real run, take every frame from the voiceover's word timeline, put the
// build script in the run's work/ folder and design the beats for that story; this file shows mechanics only.
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { Reel } = await import(pathToFileURL(path.join(here, "..", "lib", "one-camera.mjs")).href);

const args = process.argv.slice(2);
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
if (args.includes("--help") || !args[0] || args[0].startsWith("--")) {
  console.log("Usage: node <skill>/scripts/example-build.mjs <new-output-dir> [--workspace <project>] [--gsap <gsap.min.js>]");
  process.exit(args.includes("--help") ? 0 : 1);
}

const reel = new Reel({ output: args[0], total: 960, workspace: option("workspace"), gsap: option("gsap"), title: "one-camera demo" });
const file = { title: "Launch videos", subtitle: "One prompt in, one finished ad out.", steps: ["Write the hook", "Animate every scene", "Design the sound", "Render the video"], tab: "SKILL.md" };

// 1. Frame 0: a clean sky, the hook in white, the file small and glowing far off. Then the camera flies to it.
reel.world(() => reel.sheet("file", file, { x: 540, y: 960 }));
reel.cameraSet({ x: 540, y: -40, scale: 0.22 });
reel.camera(0, 2.35, { y: 400, scale: 0.27 }, "sine.inOut", { swish: false });
reel.scene("open", 0, 176, () => {
  reel.hook("hook", [
    { html: "What if", size: 84, top: 236 },
    { html: 'one <span class="serif">file</span>', size: 168, top: 330 },
    { html: "could make", size: 54, top: 590, kind: "blur", at: 30 },
    { html: "videos", size: 196, top: 670, kind: "pop", at: 44 },
    { html: '<span class="serif">like this?</span>', size: 120, top: 880, kind: "blur", at: 58 },
  ]);
  reel.passLens("hook", 72);
  reel.puffs("puffs", 78, 4);
  reel.strikeTag("tag-editor", "an editor", { at: 80, strike: 92, out: 104 });
  reel.strikeTag("tag-team", "a team", { at: 104, strike: 116, out: 128 });
  reel.pill("cap-file", 'A skill <span class="serif">file.</span>', 126, 160, { y: 1520, big: true });
});
reel.camera(76, 1.4, { x: 540, y: 960, scale: 0.95 }, "power3.inOut");
reel.select("file", 122);

// 2. The file moves up, a laptop rises out of the clouds, the file falls into its screen and becomes the chip.
reel.hideSelect("file", 152);
reel.camera(150, 0.5, { x: 540, y: 1700, scale: 0.6 }, "power2.inOut");
reel.scene("lap", 150, 500, () => {
  reel.laptop("mac", { y: 720 });
  reel.laptopRise("mac", 150);
  reel.dropInto("file", "mac", 172);
  reel.pill("cap-into", "Into Claude Code", 176, 212, { y: 1460 });
  // 3. Dive into the screen: the input box becomes the prompt card. Type, push in, press send.
  reel.promptCard("prompt", { chip: "Opus" });
  reel.diveIn("mac", "prompt", 214);
  reel.typePrompt("prompt", "Make a launch video for my product", 230, 268);
  reel.press("prompt", 288);
  // 4. Pull back out; the laptop plays the example as a launch video.
  reel.pullOut("prompt", "mac", 302, { title: "Your product", label: "LAUNCH VIDEO" });
  reel.pill("cap-watch", "Watch this example.", 304, 330, { y: 1460 });
  reel.play("mac", 318, 402, [
    { html: '<b>Your product</b><span>Post <span class="serif accent">smarter.</span></span>', at: 318 },
    { html: "<b>Save what works</b><span>Every reel you love, searchable</span>", at: 346 },
    { html: "<b>Plan the week</b><span>Seven posts, one message</span>", at: 374 },
  ], { tag: "EXAMPLE · MADE WITH ONE FILE" });
  // 5. The file floats back out and the frames stream into the screen.
  reel.stream("frames", "mac", 408, { count: 7, spec: file });
  reel.pill("cap-every", "Every frame came from one file.", 414, 470, { y: 1460 });
});

// 6. Rise into space for the disbelief line, then dive back down.
reel.riseToSpace(486, { sink: ["#lap"] });
reel.scene("thinking", 490, 584, () => {
  reel.statement("think", 'And right now you\'re <span class="hl">thinking…</span>', 500, null, { y: 700, size: 56, highlight: { at: 524 } });
  reel.slam("noway", "no way.", 540);
});
reel.diveDown(580);
reel.scene("want", 578, 640, () => {
  reel.statement("wantit", "Want it?", 596, 626, { y: 380, size: 140 });
  reel.fall("want-file", file, 590);
});

// 7. The file blooms into a profile card: follow, comment the keyword, then the card flips to the DM.
reel.scene("follow", 628, 712, () => {
  reel.statement("followtext", 'Follow and comment <span class="accent">KEYWORD</span>', 632, 704, { y: 330, size: 60, light: false });
  reel.profileCard("profile", { handle: "@yourhandle", initials: "YH" });
  reel.profileIn("profile", 630);
  reel.follow("profile", 652);
  reel.comment("profile", "KEYWORD", 668, 688, 694);
}, { page: true });
reel.bloom("follow", 628, { x: 540, y: 1010 });
reel.scene("dm", 712, 800, () => {
  reel.statement("dmtext", "It lands in your DMs.", 714, 790, { y: 330, size: 60, light: false });
  reel.dmThread("dm-card", { handle: "@yourhandle", keyword: "KEYWORD", reply: "Here's your file. Enjoy!", file: "launch-videos.md" });
  reel.dmPlay("dm-card", { keywordAt: 724, replyAt: 740, fileAt: 754 });
  reel.dropTo("#dm-card", 798, { x: -260, y: 520 });
}, { page: true });
reel.flip("#profile", "#dm-card", 712);

// 8. FOMO: a dot-matrix number, then a FREE ticket stamps to PAID. End card.
reel.scene("fomo", 798, 884, () => {
  reel.statement("first", "Only the first", 800, 878, { y: 300, size: 64, light: false });
  reel.dotNumber("n200", "200", 808, { top: 440 });
  reel.statement("free", 'get it <span class="accent">free.</span>', 826, 878, { y: 800, size: 64, light: false });
  reel.ticket("deal", { top: 1060 });
  reel.ticketIn("deal", 838);
  reel.lensSweep("deal", 846, 872);
  reel.stamp("deal", 872);
}, { page: true });
reel.scene("end", 884, 960, () => {
  reel.endCard("endcard", 886, { handle: "@yourhandle", initials: "YH", cta: "Comment KEYWORD", terms: "First 200 get it free" });
}, { page: true });

const summary = await reel.compile();
console.log(JSON.stringify(summary));
console.log("Next: hyperframes check, snapshot a few frames, render, then mix cues.json with edit-video's scripts/sfx-sync.mjs.");
