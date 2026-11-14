#!/usr/bin/env python3
"""3d-character builder: a reel spec plus its locked voice -> a HyperFrames project with a Three.js stage, and a cue sheet.

    python3 <skill>/scripts/build.py <edit>/work/<reel>        # the folder that holds spec.py and voice/timing.json

Writes <reel>/index.html (render it with `hyperframes render <reel>`), <reel>/cues.json (for edit-video's sfx-sync.mjs)
and <reel>/assets/ (the stage, the character, the fonts and a copy of three.js). three.js 0.168.0 comes from the workspace
runtime that edit-video's `scripts/init-workspace.mjs --install` prepares, or from FAVSTASH_THREE (a three package folder).

spec.py defines:
  LINES       the spoken lines, in order. *word* = accent (serif italic, accent colour; the character nods on it);
              " | " splits a line into two on-screen phrases. A line that starts with "[<GUEST>] " is a second voice:
              the character keeps its mouth shut on it.
  CHARACTER   options for the kid: {'look': 'boy'|'girl', 'skin', 'hair', 'top', 'bottom', 'shoes'} (colours as '#rrggbb').
  BACKGROUND  the stage colour (floor and sky), and ACCENT, the colour of accent words.                       optional
  VOICES      for edit-video's voice.py, e.g. {'host': 'af_heart'}.
  def build(T) -> dict(shots=[...], acts=[...], card=..., sfx=[...])
     shots   [[t, 'full'|'close'|'side'], ...]  camera shots, each from its start time; 'side' leaves room for the card
     acts    [[t, 'wave'|'point'|'hop'|'happy', end?], ...]  what the character does; an act lasts until its end or the reel's
     card    optional floating card: {'at': t, 'out': t?, 'lines': ['make(reel)', 'render()'], 'progress': True}
     sfx     [[t, sound, gain_db], ...]  t = the frame the event first shows; sound = a pack id such as "ui-pop"
T (the voice timing): T.L(i) and T.E(i) are line i's start and end, T.find('word', line=i) a word's start, T.END the length.
Needs python3, and three.js in the workspace runtime.
"""
import importlib.util, json, os, pathlib, re, shutil, sys

SKILL = pathlib.Path(__file__).resolve().parents[1]
FPS = 30
THREE_VERSION = '0.168.0'
PATH = pathlib.Path


FONT_WEIGHTS = {'thin': 100, 'extralight': 200, 'light': 300, 'regular': 400, 'medium': 500, 'semibold': 600,
                'bold': 700, 'extrabold': 800, 'black': 900}


def font_faces(folder, href, family=None):
    """@font-face rules for every font in `folder`, read from its file name: <family>-<weight or var>[-<style>]."""
    rules = []
    for f in sorted(PATH(folder).iterdir()):
        fmt = {'.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype'}.get(f.suffix.lower())
        if not fmt:
            continue
        parts, style, weight = re.split(r'[-_]', f.stem), 'normal', '400'
        if parts[-1].lower() in ('italic', 'normal'):
            style = parts.pop().lower()
        w = parts[-1].lower()
        if w == 'var':
            weight = '100 900'
            parts.pop()
        elif w.isdigit() or w in FONT_WEIGHTS:
            weight = str(FONT_WEIGHTS.get(w, w))
            parts.pop()
        name = family or ' '.join(p[:1].upper() + p[1:] for p in parts)
        rules.append(f'@font-face {{ font-family: "{name}"; font-style: {style}; font-weight: {weight}; '
                     f'src: url("{href}{f.name}") format("{fmt}"); }}')
    return '\n'.join(rules)


def find_three(start):
    """The three package (pinned 0.168.0) from the workspace runtime, or FAVSTASH_THREE."""
    env = os.environ.get('FAVSTASH_THREE')
    if env and (pathlib.Path(env) / 'build').is_dir():
        return pathlib.Path(env)
    for base in (pathlib.Path(start).resolve(), pathlib.Path.cwd()):
        for p in [base, *base.parents]:
            c = p / '.favstash-studio/runtime/node_modules/three'
            if (c / 'build').is_dir():
                return c
    raise SystemExit(f"three.js not found. Run edit-video's scripts/init-workspace.mjs --workspace <project> --install "
                     f"(it pins three@{THREE_VERSION}), or set FAVSTASH_THREE to a three package folder.")


def copy_three(three, assets):
    """three.js and the two add-ons the stage uses, copied next to the page so the render needs no network."""
    vendor = assets / 'vendor' / 'three'
    for src, dst in [('build/three.module.js', 'three.module.js'), ('LICENSE', 'LICENSE'),
                     ('examples/jsm/environments/RoomEnvironment.js', 'addons/environments/RoomEnvironment.js'),
                     ('examples/jsm/geometries/RoundedBoxGeometry.js', 'addons/geometries/RoundedBoxGeometry.js')]:
        (vendor / dst).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(three / src, vendor / dst)



class Timing:
    def __init__(self, p):
        d = json.loads(pathlib.Path(p).read_text()); self.LN = d['lines']; self.END = d['duration']

    def L(self, i): return self.LN[i]['start']
    def E(self, i): return self.LN[i]['end']

    def find(self, word, line=None, n=1):
        norm = lambda s: re.sub(r"[^a-z0-9%$']", '', s.lower())
        k = 0
        for i, l in enumerate(self.LN):
            if line is not None and i != line: continue
            for w in l['words']:
                if norm(w['w']) == norm(word):
                    k += 1
                    if k == n: return w['s']
        raise KeyError(f'{word!r} (n={n}, line={line}) is not in the voice')


def phrases(spec, T, mark):
    acc, out = [], []
    for i, line in enumerate(spec.LINES):
        line = line[len(mark):] if line.startswith(mark) else line
        chunks = [c.split() for c in line.split(' | ')]
        tw = T.LN[i]['words']
        if sum(len(c) for c in chunks) != len(tw):
            raise SystemExit(f'line {i}: {sum(len(c) for c in chunks)} script words vs {len(tw)} voice words\n  {line}\n  {[w["w"] for w in tw]}')
        k = 0
        for n, chunk in enumerate(chunks):
            words = []
            for j, tok in enumerate(chunk):
                if tok.startswith('*'): acc.append([i, k + j])
                words.append({'t': tok.replace('*', ''), 's': round(tw[k + j]['s'], 3), 'acc': tok.startswith('*')})
            out.append({'t0': 0 if not out else round(words[0]['s'] - .08, 3), 'words': words, 'big': i == 0 and n == 0, 'lit0': not out})
            k += len(chunk)
    for a, b in zip(out, out[1:]): a['t1'] = b['t0']
    out[-1]['t1'] = None
    return out, acc


def main(reel):
    reel = pathlib.Path(reel).resolve()
    s = importlib.util.spec_from_file_location('spec', reel / 'spec.py'); spec = importlib.util.module_from_spec(s); s.loader.exec_module(spec)
    T = Timing(reel / 'voice/timing.json')
    B = spec.build(T)
    PH, ACC = phrases(spec, T, f"[{getattr(spec, 'GUEST', 'Agent')}] ")
    end = round(T.END + .4, 3)
    data = dict(END=end, LINES=T.LN, ACC=ACC, PHRASES=PH, CHARACTER=getattr(spec, 'CHARACTER', {'look': 'boy'}),
                BACKGROUND=getattr(spec, 'BACKGROUND', '#FFE9D6'), ACCENT=getattr(spec, 'ACCENT', '#3D6FE0'),
                SHOTS=B.get('shots') or [[0, 'full']], ACTS=B.get('acts', []), CARD=B.get('card'))
    three = find_three(reel)
    if (reel / 'assets').exists(): shutil.rmtree(reel / 'assets')
    shutil.copytree(SKILL / 'assets', reel / 'assets')
    copy_three(three, reel / 'assets')
    fonts = font_faces(SKILL / 'assets' / 'fonts', 'assets/fonts/')
    dark = '#231B3A'
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1920" />
<script type="importmap">{{"imports": {{"three": "./assets/vendor/three/three.module.js", "three/addons/": "./assets/vendor/three/addons/"}}}}</script>
<style>
{fonts}
html, body {{ margin: 0; background: #000; }}
#root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Inter Tight", sans-serif; }}
#gl {{ position: absolute; inset: 0; width: 1080px; height: 1920px; display: block; }}
#say {{ position: absolute; left: 128px; width: 824px; top: 300px; z-index: 5; }}
.ph {{ position: absolute; left: 0; top: 0; width: 824px; font-weight: 750; font-size: 88px; line-height: 1.0; letter-spacing: -.035em; opacity: 0; }}
.ph.big {{ font-size: 108px; letter-spacing: -.042em; line-height: .97; }}
.w {{ display: inline-block; color: rgba(35, 27, 58, .22); }}
.w.lit {{ color: {dark}; }}
.w.i {{ font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-weight: 400; font-size: 1.12em; letter-spacing: -.01em; }}
.w.i.lit {{ color: var(--acc); }}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{end}" data-width="1080" data-height="1920" data-no-timeline>
<canvas id="gl" width="2160" height="3840"></canvas><div id="say"></div></div>
<script>window.DATA = {json.dumps(data)};
window.__hf = window.__hf || {{}}; window.__hf.buildReady = window.__hf.buildReady || {{}};
window.__hf.buildReady.stage = new Promise((r) => {{ window.__sceneReady = r; }});</script>
<script type="module" src="assets/stage.js"></script>
</body></html>
'''
    (reel / 'index.html').write_text(html)
    cues = [{'t': round(c[0], 3), 'sound': c[1], 'gain': c[2] if len(c) > 2 else 0} for c in B.get('sfx', [])]
    (reel / 'cues.json').write_text(json.dumps({'fps': FPS, 'total': end, 'cues': cues}, indent=1))
    print(f"{reel.name}: {len(PH)} phrases, {len(data['SHOTS'])} shots, {len(data['ACTS'])} acts, {end:.2f} s, {len(cues)} cues, "
          f"{data['CHARACTER'].get('look', 'boy')} -> {reel / 'index.html'}")


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] in ('-h', '--help'):
        print(__doc__); sys.exit(0 if len(sys.argv) == 2 else 2)
    main(sys.argv[1])
