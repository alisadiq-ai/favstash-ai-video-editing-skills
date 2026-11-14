#!/usr/bin/env node
// Builds film-styles' style index (skills/3-styles-animated/film-styles/styles/README.md) and the README's
// table of film looks from the STYLE.md files. `--check` exits 1 when either is out of date.
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const styles = path.join(root, "skills", "3-styles-animated", "film-styles", "styles");
const GROUPS = {
  "01-edit-documentary": "Edit & documentary", "02-painting": "Painting & illustration", "03-sketch-board": "Sketch & board",
  "04-traditional-crafts": "Traditional crafts", "05-print": "Print", "06-graphic-type": "Graphic & type",
  "07-line-diagrams": "Line diagrams", "08-cartoons": "Cartoons", "09-games": "Games", "10-film-tape": "Film & tape",
  "11-screens": "Screens & interfaces", "12-light-lines": "Light & lines", "13-3d-miniature": "3D & miniature",
  "14-instruments": "Instruments & evidence", "15-data-maps": "Data & maps",
};
const START = "<!-- film-looks:start -->";
const END = "<!-- film-looks:end -->";

const cell = (text) => text.replace(/\|/g, "/").replace(/\s+/g, " ").trim();
const firstSentence = (text) => (text.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? text).trim();

async function parse(file) {
  const text = await fs.readFile(file, "utf8");
  const title = text.match(/^# (.+)$/m)?.[1].trim() ?? path.basename(path.dirname(file));
  const quote = text.match(/^> (.+)$/m)?.[1] ?? "";
  const good = text.match(/^### Good for\s*\n+([\s\S]+?)(?:\n\n|\n#)/m)?.[1] ?? "";
  return { title, look: cell(firstSentence(quote)), good: cell(good) };
}

export async function build() {
  const index = ["# Style index", "",
    "Film looks grouped by what the picture looks like. Every style makes a 9:16 reel or a 16:9",
    "YouTube video: open its `STYLE.md` for both formats. Name a style by its name or its folder.", ""];
  const table = ["| Group | Looks |", "| --- | --- |"];
  let count = 0;
  for (const [group, label] of Object.entries(GROUPS)) {
    let folders = [];
    try { folders = (await fs.readdir(path.join(styles, group), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort(); } catch { continue; }
    const rows = [];
    for (const folder of folders) {
      const file = path.join(styles, group, folder, "STYLE.md");
      try { await fs.access(file); } catch { continue; }
      rows.push({ folder, ...(await parse(file)) });
    }
    if (!rows.length) continue;
    rows.sort((a, b) => a.title.localeCompare(b.title));
    index.push(`## ${label}`, "", "| Style | Folder | What it looks like | Good for |", "|---|---|---|---|");
    for (const r of rows) index.push(`| ${r.title} | [\`${r.folder}\`](${group}/${r.folder}/STYLE.md) | ${r.look} | ${r.good} |`);
    index.push("");
    table.push(`| ${label} | ${rows.map((r) => `[${r.title}](skills/3-styles-animated/film-styles/styles/${group}/${r.folder}/STYLE.md)`).join(", ")} |`);
    count += rows.length;
  }
  return { index: index.join("\n"), table: table.join("\n"), count };
}

async function main() {
  const check = process.argv.includes("--check");
  const { index, table, count } = await build();
  const indexFile = path.join(styles, "README.md");
  const readmeFile = path.join(root, "README.md");
  const readme = await fs.readFile(readmeFile, "utf8");
  if (!readme.includes(START) || !readme.includes(END)) throw new Error(`README.md needs ${START} and ${END}`);
  const nextReadme = readme.slice(0, readme.indexOf(START) + START.length) + "\n" + table + "\n" + readme.slice(readme.indexOf(END));
  const currentIndex = await fs.readFile(indexFile, "utf8").catch(() => "");
  if (check) {
    const stale = [currentIndex !== index && "the style index", nextReadme !== readme && "the README's film looks"].filter(Boolean);
    if (stale.length) { console.error(`Out of date: ${stale.join(" and ")}. Run npm run film-index.`); process.exit(1); }
    return;
  }
  await fs.writeFile(indexFile, index);
  await fs.writeFile(readmeFile, nextReadme);
  console.log(`Indexed ${count} film styles.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
