import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildGlassComposition, findRuntimeGsap } from "../skills/3-editing-styles/adaptive-glass/lib/glass.mjs";

const probe = async () => ({ format: { duration: "2" } });

async function fixture(context, scene) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "glass-scaffold-test-"));
  context.after(async () => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, "camera.mp4"), "camera");
  await fs.writeFile(path.join(root, "proof.png"), "proof");
  await fs.writeFile(path.join(root, "gsap.min.js"), "/* test double */");
  const config = {
    cameraSource: "camera.mp4", fps: 30, durationFrames: 60,
    scenes: [{
      id: "proof", startFrame: 0, endFrame: 60, layout: "split-half", type: "media-bleed",
      media: [{ path: "proof.png", startFrame: 0, endFrame: 60 }], ...scene,
    }],
  };
  const build = async (changes = {}) => {
    const file = path.join(root, "config.json");
    await fs.writeFile(file, JSON.stringify({ ...config, ...changes }));
    const output = path.join(root, "output");
    await buildGlassComposition(file, output, { probe, gsap: path.join(root, "gsap.min.js") });
    return { output, html: await fs.readFile(path.join(output, "index.html"), "utf8") };
  };
  return { root, build };
}

test("unboxed proof fills the selected pane without glass or labels", async (context) => {
  for (const [layout, height] of [["split-half", 960], ["split-third", 1120], ["full-proof", 1920]]) {
    const { build } = await fixture(context, { layout });
    const { output, html } = await build();
    assert.match(html, new RegExp(`class="bleedViewport" style="height:${height}px"`));
    assert.doesNotMatch(html, /class="glass|class="heading"|class="sheen"/);
    const source = html.match(/<img [^>]*src="([^"]+)"[^>]*style="object-fit:cover/)?.[1];
    assert.ok(source, "the proof image should cover its pane");
    await fs.access(path.join(output, source));
    const captions = JSON.parse(await fs.readFile(path.join(output, "captions.json"), "utf8"));
    assert.deepEqual(captions.anchors[0].frames, [0, 60]);
  }
});

test("a glass card uses the modern material and adds copy only when supplied", async (context) => {
  const { build } = await fixture(context, { type: "media-card" });
  const plain = await build();
  assert.equal(plain.html.match(/data-glass="optical" data-glass-tone="dark" class="glass /g)?.length, 1);
  assert.doesNotMatch(plain.html, /promoMeta|promoTitle|promoFooter/);
  await fs.rm(plain.output, { recursive: true });

  const labelled = await build({ scenes: [{
    id: "proof", startFrame: 0, endFrame: 60, layout: "split-half", type: "media-card",
    label: "Source", title: "Result\nSecond line", footer: "Context",
    media: [{ path: "proof.png", startFrame: 0, endFrame: 60 }],
  }] });
  for (const name of ["promoMeta", "promoTitle", "promoFooter"]) assert.match(labelled.html, new RegExp(`class="${name}"`));
  assert.equal(labelled.html.match(/<span class="line">/g)?.length, 2);
  assert.doesNotMatch(labelled.html, /<br>/);
});

test("frame 0 state is set before the timeline so seeking cannot blank it", async (context) => {
  const { build } = await fixture(context, {});
  const { html } = await build();
  assert.match(html, /gsap\.set\("#scene-proof",\{"opacity":1\}\);.*const tl=gsap\.timeline/);
  assert.doesNotMatch(html, /tl\.set\("#scene-proof",\{"opacity":1\},0\)/);
  assert.match(html, /window\.__timelines\.main=tl/);
});

test("invalid plans fail before anything is written", async (context) => {
  const { root, build } = await fixture(context, { layout: "face" });
  await assert.rejects(build(), /split or full-proof/);
  await assert.rejects(build({ scenes: [{
    id: "proof", startFrame: 0, endFrame: 60, layout: "split-half", type: "media-bleed",
    media: [{ path: "proof.png", startFrame: 0, endFrame: 30 }],
  }] }), /complete prepared media coverage/);
  await assert.rejects(build({ glassMaterial: "hero", scenes: [{
    id: "proof", startFrame: 0, endFrame: 60, layout: "face", type: "none",
  }] }), /soft or optical/);
  await assert.rejects(build({ palette: "neon" }), /Unknown palette/);
  await assert.rejects(fs.access(path.join(root, "output")));
});

test("an existing revision is never overwritten", async (context) => {
  const { build } = await fixture(context, {});
  const { output } = await build();
  const before = await fs.readFile(path.join(output, "index.html"));
  await assert.rejects(build(), /already exists/);
  assert.deepEqual(await fs.readFile(path.join(output, "index.html")), before);
});

test("palettes are swappable and GSAP is found in the workspace runtime", async (context) => {
  const { root, build } = await fixture(context, {});
  const { output } = await build({ palette: "charcoal" });
  assert.match(await fs.readFile(path.join(output, "style.css"), "utf8"), /--bg:#2a2a2e/);

  const run = path.join(root, "workspace", ".favstash-studio", "edits", "run", "work");
  await fs.mkdir(run, { recursive: true });
  assert.equal(await findRuntimeGsap(run), null);
  const gsap = path.join(root, "workspace", ".favstash-studio", "runtime", "node_modules", "gsap", "dist", "gsap.min.js");
  await fs.mkdir(path.dirname(gsap), { recursive: true });
  await fs.writeFile(gsap, "/* runtime copy */");
  assert.equal(await findRuntimeGsap(run), gsap);
});
