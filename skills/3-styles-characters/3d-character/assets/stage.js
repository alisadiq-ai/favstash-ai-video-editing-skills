// The 3d-character stage: one pastel colour for floor and sky, soft light, a chibi character that talks from the
// voice's word times, an optional floating card, camera shots cut on spoken words and the spoken line word-lit on top.
// Everything is a pure function of time t (HyperFrames sends it through the `hf-seek` event).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeKid } from './characters.js';

const D = window.DATA, W = 1080, H = 1920;
document.documentElement.style.setProperty('--acc', D.ACCENT);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(2); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(D.BACKGROUND); scene.fog = new THREE.Fog(D.BACKGROUND, 9, 20);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .35;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: D.BACKGROUND, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
scene.add(new THREE.HemisphereLight('#ffffff', D.BACKGROUND, 1.25));
const key = new THREE.DirectionalLight('#FFF1E2', 1.7); key.position.set(-2.4, 4.5, 3.4); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -1 });
key.shadow.radius = 10; key.shadow.bias = -.0005; key.shadow.normalBias = .02; scene.add(key);
const rim = new THREE.DirectionalLight('#DDE6FF', .9); rim.position.set(2.5, 2.5, -3); scene.add(rim);

const C = makeKid(D.CHARACTER); scene.add(C.root);

// ---------- the floating card (optional): a few lines of code or text that type in, and a progress bar
const CARD = D.CARD;
const card = new THREE.Group(); card.position.set(C.width * .5 + .62, C.focus + .05, .25); card.rotation.y = -.42; card.visible = false; scene.add(card);
let drawCard = () => {};
if (CARD) {
  const body = new THREE.Mesh(new RoundedBoxGeometry(.95, .68, .08, 8, .06), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .35, clearcoat: .6 }));
  body.castShadow = true; card.add(body);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 700; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.87, .6), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.z = .041; card.add(face);
  const tokens = (line) => line.split(/(\w+(?=\()|'[^']*'|"[^"]*")/).filter(Boolean).map((s) => [/^\w+$/.test(s) ? '#C3A6FF' : /^['"]/.test(s) ? '#A6F0B8' : '#FFFFFF', s]);
  drawCard = (t) => {
    g.fillStyle = '#1B1830'; g.beginPath(); g.roundRect(0, 0, 1024, 700, 48); g.fill();
    ['#FF6B7A', '#FFC857', '#59D49B'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(60 + i * 40, 56, 13, 0, 7); g.fill(); });
    const size = Math.min(92, Math.floor(880 / Math.max(...CARD.lines.map((l) => l.length)) * 1.6));
    g.font = `600 ${size}px "Geist Mono", Menlo, monospace`;
    let typed = Math.max(0, (t - CARD.at) * 40), y = 200;
    for (const line of CARD.lines) {
      let x = 70;
      for (const [col, s] of tokens(line)) { const show = s.slice(0, Math.max(0, Math.min(s.length, typed))); typed -= s.length; g.fillStyle = col; g.fillText(show, x, y); x += g.measureText(s).width; }
      y += size * 1.55;
    }
    if (CARD.progress !== false) {
      const p = Math.max(0, Math.min(1, (t - CARD.at - .45) / .55));
      g.fillStyle = '#2E2A48'; g.beginPath(); g.roundRect(70, 560, 884, 44, 22); g.fill();
      g.fillStyle = '#59D49B'; g.beginPath(); g.roundRect(70, 560, Math.max(44, 884 * p), 44, 22); g.fill();
    }
    tex.needsUpdate = true;
  };
}

// ---------- camera shots, framed from the character's size; cut on the times in DATA.SHOTS
const fit = (k, ax = 0) => { const h = Math.max(C.top / .54, C.width * 16 / 9 * 1.2) * k, top = k < 1 ? C.focus + .62 * h : C.top + .36 * h; return { d: h / .4617, y: top - h / 2, ax }; };
const SH = { full: fit(1), close: fit(.74), side: fit(1.25, .55) };
const camera = new THREE.PerspectiveCamera(26, W / H, .05, 80);
const ez = (u) => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
function shotAt(t) {
  let i = 0; D.SHOTS.forEach((s, k) => { if (s[0] <= t + 1e-6) i = k; });
  const t1 = D.SHOTS[i + 1]?.[0] ?? D.END; return [SH[D.SHOTS[i][1]] ?? SH.full, Math.min(1, (t - D.SHOTS[i][0]) / Math.max(.01, t1 - D.SHOTS[i][0]))];
}

// ---------- performance from the voice and the actions in DATA.ACTS ([start, name, end?])
const WORDS = D.LINES.flatMap((l, i) => l.words.map((w, j) => ({ ...w, acc: D.ACC.some(([a, b]) => a === i && b === j), host: (l.speaker ?? 'host') === 'host' })));
const VOW = { a: 1, e: .65, i: .55, y: .55, o: .8, u: .6, w: .45, m: .02, b: .02, p: .02, f: .2, v: .2 };
function mouthAt(t) {
  const w = WORDS.find((x) => x.host && t >= x.s - .02 && t <= x.e + .01); if (!w) return 0;
  const L = w.w.toLowerCase().replace(/[^a-z]/g, '') || 'a';
  return VOW[L[Math.min(L.length - 1, Math.floor((t - w.s) / Math.max(.05, w.e - w.s) * L.length))]] ?? .35;
}
const hash = (n) => { const x = Math.sin(n * 91.3) * 43758.5; return x - Math.floor(x); };
const BLINKS = []; for (let t = 1.1; t < D.END; t += 2.3 + hash(t) * 1.5) BLINKS.push(t);
const blinkAt = (t) => { for (const b of BLINKS) { const d = t - b; if (d >= 0 && d < .15) return d < .05 ? d / .05 : 1 - (d - .05) / .1; } return 0; };
const pulse = (t, at, len = .4) => { const d = t - at; return d < 0 || d > len ? 0 : Math.sin(d / len * Math.PI); };
const ramp = (t, a, len = .35) => Math.max(0, Math.min(1, (t - a) / len));
const act = (t, name) => D.ACTS.find(([a, n, e]) => n === name && t >= a && t < (e ?? D.END));

// ---------- the spoken line, word-lit
const say = document.getElementById('say');
const PH = D.PHRASES.map((p) => {
  const el = document.createElement('div'); el.className = 'ph' + (p.big ? ' big' : ''); say.appendChild(el);
  const ws = p.words.map((w) => { const s = document.createElement('span'); s.className = 'w' + (w.acc ? ' i' : ''); s.textContent = w.t; el.appendChild(s); el.appendChild(document.createTextNode(' ')); return s; });
  return { el, ws, p };
});
function captions(t) {
  for (const { el, ws, p } of PH) {
    const on = t >= p.t0 && (p.t1 == null || t < p.t1); el.style.opacity = on ? 1 : 0;
    if (on) el.style.transform = `translateY(${Math.pow(1 - Math.min(1, (t - p.t0) / .3), 3) * 30}px)`;
    p.words.forEach((w, j) => ws[j].classList.toggle('lit', p.lit0 || t >= w.s));
  }
}

function renderAt(t) {
  const [S, u] = shotAt(t), push = 1 - ez(u) * .06;
  camera.position.set(S.ax, S.y + .25, S.d * push); camera.lookAt(S.ax, S.y, 0);
  const m = mouthAt(t), accent = WORDS.filter((w) => w.acc && w.host).reduce((a, w) => Math.max(a, pulse(t, w.s - .04)), 0);
  const wave = act(t, 'wave'), point = act(t, 'point'), hop = act(t, 'hop');
  if (CARD) {
    const x = ramp(t, CARD.at, .45) - 1, pop = 1 + 2.70158 * x * x * x + 1.70158 * x * x, gone = CARD.out != null ? ramp(t, CARD.out, .25) : 0;
    card.visible = t >= CARD.at && gone < 1; card.scale.setScalar(Math.max(.001, pop * (1 - gone))); card.position.y = C.focus + .05 + Math.sin(t * 1.8) * .03;
    drawCard(t);
  }
  C.update({ t, mouth: m, squash: m * .6 - accent * .4, blink: blinkAt(t), happy: act(t, 'happy') ? 1 : 0, nod: -accent * .6,
    hop: (wave ? pulse(t, wave[0], .45) * .9 : 0) + (hop ? pulse(t, hop[0], .45) : 0) + accent * .25,
    look: point ? .38 : Math.sin(t * .8) * .06, tilt: Math.sin(t * 1.1) * .04,
    armR: Math.max(wave ? ramp(t, wave[0], .3) : 0, point ? .55 : 0), point: point ? 1 : 0, wave: wave ? (t - wave[0]) * 2.4 : 0 });
  captions(t);
  renderer.render(scene, camera);
}
window.addEventListener('hf-seek', (e) => renderAt(e.detail.time));
document.fonts.ready.then(() => { renderAt(window.__hfThreeTime || 0); window.__sceneReady?.(); });
