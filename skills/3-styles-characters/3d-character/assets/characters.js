// Characters built from shapes in code: no model file, no Blender. Each returns { root, update(state), focus, top, width }.
// state: { t, mouth 0..1, blink 0..1, happy 0..1, squash -1..1, hop 0..1, look, tilt, armR 0..1, wave (phase), point 0..1 }
import * as THREE from 'three';

const soft = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: o.r ?? .55, clearcoat: o.c ?? .25, clearcoatRoughness: .35, sheen: o.s ?? .1 });
const shade = (m) => { m.traverse?.((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; };
function ball(r, mat, sx = 1, sy = 1, sz = 1, seg = 64) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat); m.scale.set(sx, sy, sz); return shade(m); }

// ---------------------------------------------------------------- Kid: a generic chibi boy or girl
// makeKid({ look: 'boy'|'girl', skin, hair, top, bottom, shoes }) — big head, dot eyes, blush, simple hair, stubby limbs.
export function makeKid(o = {}) {
  const girl = (o.look ?? 'boy') === 'girl';
  const C = { skin: o.skin ?? '#F6C9A8', hair: o.hair ?? (girl ? '#4A2E2A' : '#3B2A24'), top: o.top ?? (girl ? '#FF8FAB' : '#5B8DEF'),
    bottom: o.bottom ?? (girl ? '#B9A6F5' : '#2F3A5C'), shoes: o.shoes ?? '#FFFFFF', ink: '#24181C' };
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(); root.add(body);
  const skin = soft(C.skin, { r: .6, c: .1, s: .2 }), hair = soft(C.hair, { r: .45, c: .35 }), top = soft(C.top, { r: .6, c: .15, s: .3 }), bottom = soft(C.bottom, { r: .6 }), shoe = soft(C.shoes, { c: .4 });

  // legs and shoes
  [-1, 1].forEach(s => {
    const leg = shade(new THREE.Mesh(new THREE.CapsuleGeometry(.075, .16, 8, 20), girl ? skin : bottom)); leg.position.set(s * .12, .25, 0); body.add(leg);
    const sh = ball(.1, shoe, 1, .62, 1.45); sh.position.set(s * .12, .07, .04); body.add(sh);
  });
  // torso: a hoodie (boy) or a top with a little skirt (girl)
  const torso = ball(.3, top, 1, 1.08, .86); torso.position.y = .58; body.add(torso);
  if (girl) { const skirt = shade(new THREE.Mesh(new THREE.CylinderGeometry(.22, .36, .26, 48), bottom)); skirt.position.y = .38; body.add(skirt); }
  else { const shorts = ball(.27, bottom, 1.05, .55, .85); shorts.position.y = .36; body.add(shorts);
    [-1, 1].forEach(s => { const str = shade(new THREE.Mesh(new THREE.CapsuleGeometry(.012, .1, 4, 8), soft('#FFFFFF'))); str.position.set(s * .06, .7, .25); body.add(str); }); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.13, .035, 16, 40), girl ? soft('#FFFFFF') : top); collar.rotation.x = Math.PI / 2; collar.position.y = .86; body.add(collar);

  const arms = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * .27, .76, 0); body.add(p);
    const sl = shade(new THREE.Mesh(new THREE.CapsuleGeometry(.07, .16, 8, 20), top)); sl.position.set(s * .03, -.13, 0); p.add(sl);
    const h = ball(.065, skin); h.position.set(s * .04, -.27, 0); p.add(h); return { p, s };
  });

  // head
  head.position.y = 1.3; body.add(head);
  const skull = ball(.47, skin, 1.04, 1, .98); head.add(skull);
  [-1, 1].forEach(s => { const ear = ball(.085, skin, .55, 1, .8); ear.position.set(s * .48, -.03, 0); head.add(ear); });
  // hair: a cap over the top and back, a fringe, and buns (girl) or a tuft (boy)
  const cap = shade(new THREE.Mesh(new THREE.SphereGeometry(.5, 64, 32, 0, Math.PI * 2, 0, Math.PI * .56), hair)); cap.rotation.x = -.22; cap.position.set(0, .02, -.01); head.add(cap);
  const back = ball(.49, hair, 1.04, girl ? 1.0 : .9, .9); back.position.set(0, girl ? -.06 : .02, -.1); head.add(back);
  const fringe = ball(.3, hair, 1.45, .5, .62); fringe.position.set(girl ? 0 : .05, .27, .27); fringe.rotation.set(-.35, 0, girl ? 0 : -.16); head.add(fringe);   // one smooth swoop
  if (girl) [-1, 1].forEach(s => { const bun = ball(.15, hair); bun.position.set(s * .36, .36, -.08); head.add(bun);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(.08, .025, 12, 32), soft('#FFD166')); tie.position.set(s * .3, .3, -.06); tie.rotation.set(Math.PI / 2, 0, s * .7); head.add(tie); });
  else { const tuft = ball(.09, hair, .6, 1.4, .6); tuft.position.set(.06, .5, -.02); tuft.rotation.z = -.4; head.add(tuft); }

  const eyes = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .17, -.02, .43); head.add(g);
    const e = ball(.068, new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: .12, clearcoat: 1 }), .85, 1.2, .45, 40); g.add(e);
    const hi = ball(.022, new THREE.MeshBasicMaterial({ color: '#fff' }), 1, 1, 1, 16); hi.position.set(-.022, .035, .03); g.add(hi);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.05, .013, 10, 24, Math.PI), new THREE.MeshBasicMaterial({ color: C.ink })); arc.visible = false; g.add(arc);
    const brow = shade(new THREE.Mesh(new THREE.CapsuleGeometry(.014, .06, 4, 12), hair)); brow.rotation.z = Math.PI / 2 - s * .1; brow.position.set(0, .13, .01); g.add(brow);
    return { g, e, hi, arc, brow };
  });
  [-1, 1].forEach(s => { const c = ball(.065, soft('#FF9DAE', { c: 0, s: 0 }), 1.35, .7, .3, 32); c.position.set(s * .27, -.13, .38); head.add(c); });
  const nose = ball(.03, soft(C.skin, { r: .5 }), 1.2, .9, .9, 24); nose.position.set(0, -.11, .47); head.add(nose);
  const mouth = ball(.04, new THREE.MeshStandardMaterial({ color: '#6E2433', roughness: .6 }), 1, 1, .5, 32); mouth.position.set(0, -.21, .44); head.add(mouth);
  const tongue = ball(.026, soft('#FF7C98', { c: 0, s: 0 }), 1.2, .7, .5, 24); tongue.position.set(0, -.23, .45); head.add(tongue);

  function update(st) {
    const t = st.t ?? 0, sq = st.squash ?? 0;
    body.position.y = (st.hop ?? 0) * .28; body.scale.set(1 + sq * .04, 1 - sq * .05, 1 + sq * .04);
    head.rotation.set((st.nod ?? 0) * .15, st.look ?? 0, (st.tilt ?? 0) + Math.sin(t * 1.3) * .02);
    const open = Math.max(0, Math.min(1, st.mouth ?? 0)); mouth.scale.set(1.05 - open * .15, .22 + open * 1.3, .5); tongue.visible = open > .4;
    const b = Math.min(1, st.blink ?? 0), happy = (st.happy ?? 0) > .5;
    for (const e of eyes) { e.e.visible = e.hi.visible = !happy; e.arc.visible = happy; e.g.scale.y = happy ? 1 : 1 - b * .88; e.brow.position.y = .13 + (st.nod ? -st.nod * .03 : 0); }
    for (const a of arms) {
      const raise = a.s > 0 ? (st.armR ?? 0) : (st.armL ?? 0);
      a.p.rotation.z = a.s * (.12 + raise * 1.5 + Math.sin((st.wave ?? 0) * Math.PI * 2) * .3 * raise);   // up and out, clear of the big head
      a.p.rotation.x = a.s > 0 ? -(st.point ?? 0) * 1.1 - raise * .45 : 0;
    }
  }
  update({});
  return { root, update, focus: 1.3, top: 1.86, width: 1.0, name: girl ? 'Kid (girl)' : 'Kid (boy)' };
}
