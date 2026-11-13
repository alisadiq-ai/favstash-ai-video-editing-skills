import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SHELF = { "adaptive-glass": "on-camera", "breakout-card": "on-camera", "motion-effects": "on-camera", "paper-grid": "on-camera", "text-over-footage": "on-camera",
  "animated-explainer": "animated", "product-motion-ads": "animated", "film-styles": "animated", "cartoon-character": "characters", "3d-character": "characters" };
const styleDir = (name) => path.join(root, "skills", `3-styles-${SHELF[name]}`, name);

// Skills install one folder each, so every style has to work without its siblings.
async function installAlone(context, name) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), `favstash-style-${name}-`));
  context.after(async () => fs.rm(temporary, { recursive: true, force: true }));
  const installed = path.join(temporary, name);
  await fs.cp(styleDir(name), installed, { recursive: true });
  return installed;
}

test("adaptive-glass works when installed alone", async (context) => {
  const installed = await installAlone(context, "adaptive-glass");
  const glass = await import(pathToFileURL(path.join(installed, "lib", "glass.mjs")).href);
  await fs.access(path.join(glass.GLASS_ASSETS, "palettes.json"));
  await fs.access(path.join(glass.GLASS_ASSETS, "glass.css"));
  const help = execFileSync(process.execPath, [path.join(installed, "scripts", "scaffold-glass.mjs"), "--help"], { encoding: "utf8" });
  assert.match(help, /scaffold-glass\.mjs/);
});

const python = spawnSync("python3", ["--version"]).status === 0;

for (const [name, module] of [["paper-grid", "paper_grid"], ["breakout-card", "breakout"]]) {
  test(`${name} builder imports when installed alone`, { skip: !python && "python3 not available" }, async (context) => {
    const installed = await installAlone(context, name);
    const result = spawnSync("python3", ["-B", "-c",
      `import sys; sys.path.insert(0, ${JSON.stringify(path.join(installed, "scripts"))}); import ${module}; print(${module}.find_gsap.__name__)`],
    { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /find_gsap/);
  });
}

test("breakout-card bundles its font license", async () => {
  const fonts = await fs.readdir(path.join(styleDir("breakout-card"), "assets", "fonts"));
  assert.ok(fonts.includes("OFL.txt"));
  assert.ok(fonts.filter((file) => file.endsWith(".ttf")).length >= 4);
});

// A minimal reel: two voiced lines and a spec with no character, so it needs only Python.
async function tinyReel(context, character = "None") {
  const reel = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-reel-"));
  context.after(async () => fs.rm(reel, { recursive: true, force: true }));
  await fs.mkdir(path.join(reel, "voice"));
  const line = (text, speaker, start) => {
    const words = text.split(" ").map((w, i) => ({ w, s: start + i * 0.3, e: start + i * 0.3 + 0.25 }));
    return { text, speaker, start: words[0].s, end: words.at(-1).e, words };
  };
  await fs.writeFile(path.join(reel, "voice", "timing.json"),
    JSON.stringify({ duration: 2.4, lines: [line("Hello there world.", "host", 0.1), line("Hi.", "guest", 1.4)] }));
  await fs.writeFile(path.join(reel, "spec.py"), [
    "LINES = ['Hello there *world.*', '[Agent] Hi.']",
    `CHARACTER = ${character}`,
    "def build(T):",
    "    return dict(scenes=[dict(id='s1', t0=0, field='night', html='<div class=\"card\" id=\"c1\"></div>'),",
    "                        dict(id='s2', t0=T.L(1), field='cream', html='')], sfx=[[T.find('world'), 'ui-pop', 0]])",
  ].join("\n"));
  const gsap = path.join(reel, "gsap.min.js");
  await fs.writeFile(gsap, "/* GSAP stand-in for the build test */");
  return { reel, env: { ...process.env, FAVSTASH_GSAP: gsap } };
}

test("animated-explainer builds a reel when installed alone", { skip: !python && "python3 not available" }, async (context) => {
  const installed = await installAlone(context, "animated-explainer");
  const { reel, env } = await tinyReel(context);
  const result = spawnSync("python3", ["-B", path.join(installed, "scripts", "build.py"), reel], { encoding: "utf8", env });
  assert.equal(result.status, 0, result.stderr);
  assert.match(await fs.readFile(path.join(reel, "index.html"), "utf8"), /data-composition-id="main"/);
  const cues = JSON.parse(await fs.readFile(path.join(reel, "cues.json"), "utf8"));
  assert.deepEqual(cues.cues.map((cue) => cue.sound), ["ui-pop"]);
  await fs.access(path.join(reel, "assets", "fonts", "OFL.txt"));
});

test("animated-explainer names cartoon-character when a character is missing", { skip: !python && "python3 not available" }, async (context) => {
  const installed = await installAlone(context, "animated-explainer");
  const { reel, env } = await tinyReel(context, "'ali'");
  delete env.FAVSTASH_CARTOON;
  const result = spawnSync("python3", ["-B", path.join(installed, "scripts", "build.py"), reel], { encoding: "utf8", env });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /cartoon-character/);
});

for (const character of ["ali", "stashy"]) {
  test(`cartoon-character's ${character} rig builds presenter markup when installed alone`, { skip: !python && "python3 not available" }, async (context) => {
    const installed = await installAlone(context, "cartoon-character");
    const work = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-presenter-"));
    context.after(async () => fs.rm(work, { recursive: true, force: true }));
    await fs.writeFile(path.join(work, "schedule.json"), JSON.stringify({ total: 3, poses: [[0, "neutral"], [1.5, "point"]], upper: [[0, 1, "worried"]] }));
    await fs.writeFile(path.join(work, "mouth.json"), JSON.stringify([[0.2, 0.5, "ah"], [0.6, 0.8, "oo"]]));
    const result = spawnSync("python3", ["-B", path.join(installed, "scripts", "presenter.py"),
      "--rig", path.join(installed, "characters", character, "rig"), "--rig-url", "assets/presenter",
      "--schedule", path.join(work, "schedule.json"), "--mouth", path.join(work, "mouth.json"),
      "--out-html", path.join(work, "presenter.html"), "--out-pres", path.join(work, "pres.json")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const html = await fs.readFile(path.join(work, "presenter.html"), "utf8");
    for (const part of ["pr-neutral", "pr-point", "pr-m-ah", "pr-m-oo", "pr-e-closed", "pr-u-worried"]) assert.match(html, new RegExp(part));
  });
}

test("3d-character builds a Three.js reel when installed alone", { skip: !python && "python3 not available" }, async (context) => {
  const installed = await installAlone(context, "3d-character");
  const { reel } = await tinyReel(context);
  await fs.writeFile(path.join(reel, "spec.py"), [
    "LINES = ['Hello there *world.*', '[Agent] Hi.']",
    "CHARACTER = {'look': 'girl'}",
    "def build(T):",
    "    return dict(shots=[[0, 'full'], [T.L(1), 'close']], acts=[[T.L(1), 'wave']],",
    "                card={'at': .5, 'lines': ['make(reel)']}, sfx=[[T.find('world'), 'ui-pop', 0]])",
  ].join("\n"));
  const result = spawnSync("python3", ["-B", path.join(installed, "scripts", "build.py"), reel], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const html = await fs.readFile(path.join(reel, "index.html"), "utf8");
  assert.match(html, /data-no-timeline/);
  assert.match(html, /"look": "girl"/);
  await fs.access(path.join(reel, "assets", "vendor", "three", "three.module.min.js"));
  await fs.access(path.join(reel, "assets", "vendor", "three", "LICENSE"));
  const cues = JSON.parse(await fs.readFile(path.join(reel, "cues.json"), "utf8"));
  assert.deepEqual(cues.cues.map((cue) => cue.sound), ["ui-pop"]);
});
