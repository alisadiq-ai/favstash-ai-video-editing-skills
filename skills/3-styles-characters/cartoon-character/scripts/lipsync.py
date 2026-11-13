#!/usr/bin/env python3
"""Mouth-shape intervals for the cartoon presenter, from a voice track (+ optional word timings).

    python3 lipsync.py --audio vo.mp3 --out mouth.json
    python3 lipsync.py --audio vo.mp3 --words transcript.json --out mouth.json

--words accepts ElevenLabs-style [{"w","s","e"}] or `npx hyperframes transcribe` [{"text","start","end"}].
With words, the mouth only opens inside a word and rounds to "oo" on oo-words; without them it follows loudness only.
Output: [[start_s, end_s, "eh"|"ah"|"oo"], ...] — open intervals only; everything else is the closed/base mouth.
Needs: ffmpeg on PATH, python3 + numpy.
"""
import argparse, json, subprocess
import numpy as np

OO_WORDS = {"you", "you're", "your", "who", "two", "to", "do", "move", "new", "through", "true", "use", "too", "soon"}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--audio", required=True)
    ap.add_argument("--words")
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--closed", type=float, default=0.13, help="loudness (0-1) below which the mouth is closed")
    ap.add_argument("--wide", type=float, default=0.42, help="loudness above which the mouth opens wide (ah)")
    ap.add_argument("--offset", type=float, default=0.0, help="seconds to add (VO placed later in the video)")
    a = ap.parse_args()

    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", a.audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"])
    x = np.frombuffer(raw, np.float32)
    hop = 16000 // a.fps
    n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[max(0, i * hop - hop // 2): i * hop + hop + hop // 2] ** 2)) for i in range(n)])
    voiced = rms[rms > 0.005]
    ref = np.percentile(voiced, 95) if len(voiced) else 1.0
    env = np.zeros(n)
    for i in range(n):  # fast attack, quick release
        env[i] = max(min(1.0, rms[i] / ref), env[i - 1] * 0.55 if i else 0)

    words = None
    if a.words:
        raw_w = json.load(open(a.words))
        words = [{"w": (w.get("w") or w.get("text") or "").lower(), "s": w.get("s", w.get("start")), "e": w.get("e", w.get("end"))} for w in raw_w]

    def word_at(t):
        for w in words:
            if w["s"] - 0.03 <= t <= w["e"] + 0.02:
                return w["w"]
        return None

    shapes = []
    for i in range(n):
        t = i / a.fps
        wd = word_at(t) if words is not None else ""
        if wd is None or env[i] < a.closed:
            s = "closed"
        elif env[i] < a.wide:
            s = "eh"
        else:
            s = "ah"
        if s != "closed" and wd and wd.strip(",.?!") in OO_WORDS:
            s = "oo"
        shapes.append(s)
    for i in range(1, n - 1):  # no single-frame flicker
        if shapes[i] != shapes[i - 1] and shapes[i] != shapes[i + 1]:
            shapes[i] = shapes[i - 1]
    iv = []
    for i, s in enumerate(shapes):
        if iv and iv[-1][2] == s:
            iv[-1][1] = (i + 1) / a.fps
        else:
            iv.append([i / a.fps, (i + 1) / a.fps, s])
    iv = [[round(s0 + a.offset, 3), round(s1 + a.offset, 3), s] for s0, s1, s in iv if s != "closed"]
    json.dump(iv, open(a.out, "w"))
    from collections import Counter
    print(f"{len(iv)} open intervals over {n / a.fps:.1f}s:", dict(Counter(s for *_, s in iv)))


if __name__ == "__main__":
    main()
