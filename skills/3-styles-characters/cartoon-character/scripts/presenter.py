#!/usr/bin/env python3
"""Turn a rig + a beat schedule + lip-sync intervals into presenter markup and its performance data.

    python3 presenter.py --rig <run>/assets/presenter --rig-url assets/presenter \
        --schedule schedule.json --mouth mouth.json --out-html presenter.html --out-pres pres.json

schedule.json (authored per reel, seconds on the video timeline; full example in ../assets/example-schedule.json):
    {"total": 35.8,
     "poses":   [[0, "shrug"], [3.1, "neutral"], [7.6, "point"], ...],      # first entry is the opening pose
     "upper":   [[0, 7.6, "worried"], [8.2, 9.5, "excited"]],              # brows/eyes windows
     "sleep":   [22.5, 23.4],                                               # optional: eyes closed + tilt + Zzz
     "bounces": [2.15, 8.23, 20.57],                                        # small hops on key words
     "night":   7.75}                                                       # optional: day shadow -> violet rim glow
Poses and patches come from the rig folder (every pose-*.png, every entry in patches.json), so new ones need no code.
Placement defaults (bottom-right, faces left, face ~x 620-840, y 1460-1680): --left 455 --top 1185 --size 655.
Paste presenter.html into the composition root, load ../assets/presenter.css + presenter.js, and call
addPresenter(tl, PRES) with PRES = the contents of pres.json (see SKILL.md).
"""
import argparse, json, pathlib, random

PATCH_ORDER = ["u-worried", "u-excited", "e-closed", "m-frown", "m-grin", "m-eh", "m-ah", "m-oo"]
LAYER = {"u": 0, "e": 1, "m": 2}  # brows/eyes, then blinks, then mouths on top
REST = {"excited": "grin", "worried": "frown"}  # mouth between words inside an upper window


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rig", required=True, help="local rig folder (pose-*.png, patch pngs, patches.json)")
    ap.add_argument("--rig-url", required=True, help="the same folder as the composition references it")
    ap.add_argument("--schedule", required=True)
    ap.add_argument("--mouth", required=True)
    ap.add_argument("--out-html", required=True)
    ap.add_argument("--out-pres", required=True)
    ap.add_argument("--left", type=int, default=455)
    ap.add_argument("--top", type=int, default=1185)
    ap.add_argument("--size", type=int, default=655)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--seed", type=int, default=11)
    a = ap.parse_args()

    rig = pathlib.Path(a.rig)
    meta = json.loads((rig / "patches.json").read_text())
    sch = json.loads(pathlib.Path(a.schedule).read_text())
    mouth_open = json.loads(pathlib.Path(a.mouth).read_text())
    total = float(sch["total"])
    upper = sch.get("upper", [])
    sleep = sch.get("sleep")

    def rest(t):  # a new expression u-<name> rests on m-<name> when the rig has one
        for s, e, n in upper:
            if s <= t < e:
                return REST.get(n, n if f"m-{n}" in meta else "none")
        return "none"

    states = []
    for f in range(int(total * a.fps) + 1):
        t = f / a.fps
        st = rest(t)
        for s, e, shape in mouth_open:
            if s <= t < e:
                st = shape
                break
        if sleep and sleep[0] <= t < sleep[1]:
            st = "none"
        states.append(st)
    mouth = []
    for f, st in enumerate(states):
        if not mouth or mouth[-1][1] != st:
            mouth.append([round(f / a.fps, 3), st])

    rng = random.Random(a.seed)
    blinks, t = [], 1.2
    while t < total - 0.5:
        if not (sleep and sleep[0] - 0.4 < t < sleep[1] + 0.2):
            blinks.append(round(t, 3))
        t += rng.uniform(2.4, 4.0)

    pres = dict(poses=sch["poses"], upper=upper, sleep=sleep, blinks=blinks, bounces=sch.get("bounces", []),
                mouth=mouth, night=sch.get("night"), total=total)
    pathlib.Path(a.out_pres).write_text(json.dumps(pres))

    scale = a.size / 1024
    names = sorted((p.stem[5:] for p in rig.glob("pose-*.png")), key=lambda p: (p != "neutral", p))
    poses = "".join(f'<img class="pr-pose" id="pr-{p}" src="{a.rig_url}/pose-{p}.png">' for p in names)
    order = sorted(meta, key=lambda n: (LAYER.get(n[0], 3), PATCH_ORDER.index(n) if n in PATCH_ORDER else 99, n))
    patches = "".join(
        f'<img class="pr-patch" id="pr-{n}" src="{a.rig_url}/{n}.png" style="left:{meta[n]["x"]}px;top:{meta[n]["y"]}px;width:{meta[n]["w"]}px;height:{meta[n]["h"]}px">'
        for n in order)
    missing = sorted({p for _, p in sch["poses"]} - set(names))
    if missing:
        print(f"   schedule uses poses the rig doesn't have: {missing}")
    html = (f'<div id="presenter" style="left:{a.left}px;top:{a.top}px;width:{a.size}px;height:{a.size}px">'
            f'<div id="pr-body"><div id="pr-glow"><div id="pr-scale" style="transform:scale({scale:.4f})">{poses}{patches}'
            '<div id="pr-zzz"><span data-layout-allow-overlap>Z</span><span data-layout-allow-overlap style="font-size:.72em">z</span>'
            '<span data-layout-allow-overlap style="font-size:.5em">z</span></div></div></div></div></div>')
    pathlib.Path(a.out_html).write_text(html)
    print(f"presenter: {len(sch['poses'])} poses, {len(mouth)} mouth changes, {len(blinks)} blinks -> {a.out_html}, {a.out_pres}")


if __name__ == "__main__":
    main()
