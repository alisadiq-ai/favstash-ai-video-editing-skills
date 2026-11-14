// Cartoon presenter performance for a HyperFrames (GSAP) timeline.
// addPresenter(tl, PRES): PRES = pres.json from scripts/presenter.py. Call it after the scene tweens, before
// window.__timelines[...] = tl. Seek-safe: initial states use gsap.set (two tl.set calls on one element at t=0
// get reverted when the renderer resets to 0 — never put the opening pose/mouth on the timeline at 0).
function addPresenter(tl, PRES) {
  const POSES = Array.from(document.querySelectorAll("#presenter .pr-pose")).map((el) => el.id.slice(3));
  // poses: hard swap with a squash-and-stretch pop
  PRES.poses.forEach(([t, p], i) => {
    if (i === 0) { gsap.set(`#pr-${p}`, { opacity: 1 }); return; }
    POSES.forEach((q) => { if (q !== p) tl.set(`#pr-${q}`, { opacity: 0 }, t); });
    tl.set(`#pr-${p}`, { opacity: 1 }, t);
    tl.to("#pr-body", { scaleX: 1.03, scaleY: 0.965, duration: 0.06, ease: "power1.out" }, Math.max(0, t - 0.06));
    tl.to("#pr-body", { scaleX: 1, scaleY: 1, duration: 0.22, ease: "back.out(3)" }, t);
  });
  // brows/eyes windows
  (PRES.upper || []).forEach(([a, b, n]) => {
    if (a <= 0.001) gsap.set(`#pr-u-${n}`, { opacity: 1 }); else tl.set(`#pr-u-${n}`, { opacity: 1 }, a);
    tl.set(`#pr-u-${n}`, { opacity: 0 }, b);
  });
  // lip-sync: talking shapes (eh/ah/oo) and resting mouths (grin/frown) are all m-* patches
  let prev = "none";
  PRES.mouth.forEach(([t, st]) => {
    if (prev !== "none") tl.set(`#pr-m-${prev}`, { opacity: 0 }, t);
    if (st !== "none") { if (t <= 0.001) gsap.set(`#pr-m-${st}`, { opacity: 1 }); else tl.set(`#pr-m-${st}`, { opacity: 1 }, t); }
    prev = st;
  });
  // blinks
  PRES.blinks.forEach((t) => { tl.set("#pr-e-closed", { opacity: 1 }, t); tl.set("#pr-e-closed", { opacity: 0 }, t + 0.11); });
  // sleep gag
  const s = PRES.sleep;
  if (s) {
    tl.set("#pr-e-closed", { opacity: 1 }, s[0]); tl.set("#pr-e-closed", { opacity: 0 }, s[1]);
    tl.to("#pr-glow", { rotation: -6, y: 12, duration: 0.3, ease: "sine.inOut" }, s[0]);
    tl.to("#pr-glow", { rotation: 0, y: 0, duration: 0.25, ease: "back.out(2)" }, s[1]);
    tl.set("#pr-zzz", { opacity: 1 }, s[0] + 0.05);
    tl.fromTo("#pr-zzz span", { opacity: 0, y: 30, x: 0 }, { opacity: 1, y: -60, x: 30, duration: 0.6, stagger: 0.12, ease: "power1.out" }, s[0] + 0.05);
    tl.set("#pr-zzz", { opacity: 0 }, s[1]);
  }
  // hops on key words (skipped inside the sleep window)
  (PRES.bounces || []).forEach((t) => {
    if (s && t > s[0] - 0.4 && t < s[1] + 0.3) return;
    tl.to("#pr-glow", { y: -14, duration: 0.11, ease: "power2.out" }, t);
    tl.to("#pr-glow", { y: 0, duration: 0.28, ease: "bounce.out" }, t + 0.11);
  });
  // idle sway, finite under the composition length
  const reps = Math.max(0, Math.floor(PRES.total / 3.3) - 1);
  tl.fromTo("#pr-body", { rotation: -1.2 }, { rotation: 1.2, duration: 3.3, yoyo: true, repeat: reps, ease: "sine.inOut" }, 0);
  // light: soft drop shadow on light pages; violet rim glow on dark ones (switch at PRES.night)
  const DAY = "drop-shadow(0px 18px 26px rgba(40,24,110,0.30)) drop-shadow(0px 0px 0px rgba(182,166,255,0))";
  const NIGHT = "drop-shadow(0px 0px 3px rgba(182,166,255,0.95)) drop-shadow(0px 0px 26px rgba(123,92,255,0.55))";
  if (PRES.night == null) gsap.set("#pr-glow", { filter: DAY });
  else if (PRES.night <= 0.001) gsap.set("#pr-glow", { filter: NIGHT });
  else tl.fromTo("#pr-glow", { filter: DAY }, { filter: NIGHT, duration: 0.6, ease: "power1.inOut" }, PRES.night);
}
