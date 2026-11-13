#!/usr/bin/env python3
"""Build a presenter rig from one base image + its edited variants (all on a flat green background).

    python3 build_rig.py my-character/rig.config.json                              # build my-character/rig/
    python3 build_rig.py <config> --out /tmp/rig-test --register                    # auto-align drifting variants

Config (paths relative to the config file):
    {"base": "source/base-a.png", "out": "rig", "size": 1024, "mirror": true,
     "poses":   {"neutral": "source/base-a.png", "point": "source/pose-point.png", ...},
     "patches": [{"name": "m-ah", "from": "source/v-mouth-ah.png", "roi": [x0, y0, x1, y1]}, ...]}

- Poses are whole images (keyed, mirrored, resized). Swap them on beats.
- Patches are only the pixels a variant changed versus the base inside `roi` (base coordinates),
  feathered, so they drop onto ANY pose whose face matches the base (mouth visemes, blinks, brows).
- Prints an alignment report. Pixel-aligned edits (fal nano-banana-pro) measure ~0.05 px.
  --register warps each input onto the base first (ECC affine on the head box): use it for
  generators that redraw slightly (e.g. ChatGPT image edits) and check the report before trusting patches.
Needs: python3 with numpy + opencv-python (cv2).
"""
import argparse, json, pathlib, sys
import cv2
import numpy as np


def key_green(img, lo=30, hi=150):
    """Flat green background -> alpha, with despill on the soft edge."""
    b, g, r = [img[..., i].astype(np.float32) for i in range(3)]
    greenness = g - np.maximum(r, b)
    a = np.clip(1.0 - (greenness - lo) / (hi - lo), 0, 1)
    gnew = np.where(greenness > 0, np.maximum(r, b) + 0.15 * np.maximum(greenness, 0) * (1 - a), g)
    return np.dstack([b, np.minimum(g, gnew), r, a * 255]).astype(np.uint8)


def head_box(shape):
    h, w = shape[:2]
    return int(w * 0.22), int(h * 0.07), int(w * 0.80), int(h * 0.71)  # x0, y0, x1, y1 — hair to chin for a centred bust


def gray(img):
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)


def fit_canvas(img, shape):
    """Put an input of another size (e.g. ChatGPT's 1122x1402) on the base canvas: fit the width, pad/crop the height with green."""
    H, W = shape[:2]
    if img.shape[:2] == (H, W):
        return img
    img = cv2.resize(img, (W, round(img.shape[0] * W / img.shape[1])), interpolation=cv2.INTER_CUBIC)
    h = img.shape[0]
    if h >= H:
        return img[(h - H) // 2:(h - H) // 2 + H]
    top = (H - h) // 2
    return cv2.copyMakeBorder(img, top, H - h - top, 0, 0, cv2.BORDER_CONSTANT, value=(0, 255, 0))


def similarity_guess(base, img, head):
    """Scale + rotation + shift (base -> input coords) from ORB matches on the head, or None."""
    orb = cv2.ORB_create(5000)
    kb, db = orb.detectAndCompute(cv2.cvtColor(base, cv2.COLOR_BGR2GRAY), head)
    ki, di = orb.detectAndCompute(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), None)
    if db is None or di is None:
        return None
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(db, di)
    if len(m) < 20:
        return None
    src = np.float32([kb[x.queryIdx].pt for x in m])
    dst = np.float32([ki[x.trainIdx].pt for x in m])
    M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=3.0)
    return M.astype(np.float32) if M is not None and inliers.sum() >= 20 else None


def align(base, img, register):
    """Return (aligned image, dx, dy, response). Registration = ORB guess + ECC affine over the head box."""
    img = fit_canvas(img, base.shape)
    x0, y0, x1, y1 = head_box(base.shape)
    B, I = gray(base)[y0:y1, x0:x1], gray(img)[y0:y1, x0:x1]
    win = cv2.createHanningWindow(B.shape[::-1], cv2.CV_32F)
    (dx, dy), resp = cv2.phaseCorrelate(B, I, win)
    if not register:
        return img, dx, dy, resp
    head = np.zeros(base.shape[:2], np.uint8)
    head[y0:y1, x0:x1] = 255  # fit the head only: poses move the arms, expressions move little else
    warp = similarity_guess(base, img, head)
    if warp is None:  # template(base) coords -> input coords
        warp = np.eye(2, 3, dtype=np.float32)
        warp[0, 2], warp[1, 2] = dx, dy
    try:
        _, warp = cv2.findTransformECC(gray(base), gray(img), warp, cv2.MOTION_AFFINE,
                                       (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), head, 5)
    except cv2.error:
        print("   ECC did not converge; using the phase-correlation shift only", file=sys.stderr)
    out = cv2.warpAffine(img, warp, (base.shape[1], base.shape[0]), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 255, 0))
    (dx2, dy2), resp2 = cv2.phaseCorrelate(B, gray(out)[y0:y1, x0:x1], win)
    return out, dx2, dy2, resp2


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("config")
    ap.add_argument("--out", help="output dir (default: config's out)")
    ap.add_argument("--register", action="store_true", help="warp every input onto the base before use")
    a = ap.parse_args()
    cfg_path = pathlib.Path(a.config).resolve()
    cfg = json.loads(cfg_path.read_text())
    root = cfg_path.parent
    out = pathlib.Path(a.out) if a.out else root / cfg.get("out", "rig")
    out.mkdir(parents=True, exist_ok=True)
    size, mirror = cfg.get("size", 1024), cfg.get("mirror", True)
    lo, hi = cfg.get("key", {}).get("lo", 30), cfg.get("key", {}).get("hi", 150)
    base = cv2.imread(str(root / cfg["base"]))
    H, W = base.shape[:2]
    S = size / W
    report = []

    def finish(rgba):
        rgba = cv2.flip(rgba, 1) if mirror else rgba
        return cv2.resize(rgba, (size, int(H * S)), interpolation=cv2.INTER_AREA)

    for name, rel in cfg["poses"].items():
        img = cv2.imread(str(root / rel))
        img, dx, dy, resp = align(base, img, a.register)
        report.append((f"pose-{name}", dx, dy, resp, None))
        cv2.imwrite(str(out / f"pose-{name}.png"), finish(key_green(img, lo, hi)))

    meta = {}
    for p in cfg["patches"]:
        img = cv2.imread(str(root / p["from"]))
        img, dx, dy, resp = align(base, img, a.register)
        d = np.abs(base.astype(int) - img.astype(int)).sum(2).astype(np.float32)
        x0, y0, x1, y1 = p["roi"]
        sub = (d[y0:y1, x0:x1] > p.get("thr", 40)).astype(np.uint8) * 255
        sub = cv2.morphologyEx(sub, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        sub = cv2.morphologyEx(sub, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
        sub = cv2.dilate(sub, np.ones((p.get("grow", 14),) * 2, np.uint8))
        m = np.zeros(d.shape, np.uint8)
        m[y0:y1, x0:x1] = sub
        f = p.get("feather", 21)
        m = cv2.GaussianBlur(m, (f * 2 + 1, f * 2 + 1), 0)
        rgba = key_green(img, lo, hi)
        rgba[..., 3] = (rgba[..., 3].astype(np.float32) * (m / 255.0)).astype(np.uint8)
        ys, xs = np.where(m > 4)
        if not len(xs):
            print(f"   {p['name']}: no change found inside roi — check the variant or the roi", file=sys.stderr)
            continue
        bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        crop = rgba[by0:by1, bx0:bx1]
        if mirror:
            crop = cv2.flip(crop, 1)
            bx0 = W - bx1  # left edge after the flip; the width is unchanged
        crop = cv2.resize(crop, (max(1, int(crop.shape[1] * S)), max(1, int(crop.shape[0] * S))), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(out / f"{p['name']}.png"), crop)
        meta[p["name"]] = dict(x=round(bx0 * S, 1), y=round(by0 * S, 1), w=crop.shape[1], h=crop.shape[0])
        changed = (d[y0:y1, x0:x1] > 60).mean() * 100
        report.append((p["name"], dx, dy, resp, changed))
    (out / "patches.json").write_text(json.dumps(meta, indent=1))

    print(f"rig -> {out}")
    print(f"{'input':14} {'shift px':>14} {'match':>6} {'roi changed':>12}")
    for n, dx, dy, resp, ch in report:
        flag = "" if (abs(dx) < 1.5 and abs(dy) < 1.5 and resp > 0.5) else "  <-- drifts: rerun with --register or regenerate"
        print(f"{n:14} {dx:+6.2f},{dy:+6.2f} {resp:6.2f} {'' if ch is None else f'{ch:10.1f}%'}{flag}")


if __name__ == "__main__":
    main()
