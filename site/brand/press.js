/**
 * Press: playthru's cursor, built as a thick arrow-shaped plate with its rim,
 * stands over a single keycap on a rounded plinth. The pointer's height on the
 * stage sets how far the cursor presses: it hovers, touches, then pushes the
 * key down into its well, and rings of dots open around the key as it sinks.
 * When the key bottoms out, the click lands and the bright stroke moves from
 * the cursor to the key. The slider is the key's travel, in world units.
 *
 * The pattern: one continuous value. A spring on the press, a hit test on the
 * stage's own height (which never moves), and a rest pose mid-press.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run,
  prism, spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const L = 100, PB = 7, KEY_H = 16, HOVER = 11, SC = 3, TK = 5, RIM = 2.3, LEAN = 22, YAW = 18;
const REST_D = 0.5, Y_UP = 70, Y_DOWN = 250, RINGS = [[31, 14], [38, 18], [45, 22]];

/** playthru's cursor, tip at the origin, in icon units with y running away from the tip. */
const ARROW = [[0, 0], [0, 15.6], [3.9, 11.9], [6.4, 17.7], [9.2, 16.5], [6.7, 10.8], [12.1, 10.8]];
const ARROW_R = [0.6, 0.9, 0.7, 0.9, 0.9, 0.7, 0.9];

/** The polygon moved inward by d along each edge's normal, mitred at the corners. */
function inset(pts, d) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n]; area += x0 * y1 - x1 * y0; }
  const s = area > 0 ? 1 : -1;
  const line = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = (-dy / l) * s, ny = (dx / l) * s;
    return [[a[0] + nx * d, a[1] + ny * d], [dx, dy]];
  };
  return pts.map((_, i) => {
    const [p, u] = line(pts[(i + n - 1) % n], pts[i]), [q, v] = line(pts[i], pts[(i + 1) % n]);
    const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / (u[0] * v[1] - u[1] * v[0]);
    return [p[0] + u[0] * t, p[1] + u[1] * t];
  });
}

// The cursor's plane: `ea` runs across it, `eb` from the tip up its body, leaning back; `away` is its thickness.
const g0 = rad(-45 + YAW), lean = rad(LEAN);
const ea = [Math.cos(g0), Math.sin(g0), 0];
const bk = [Math.cos(g0 - Math.PI / 2), Math.sin(g0 - Math.PI / 2), 0];
const eb = [bk[0] * Math.sin(lean), bk[1] * Math.sin(lean), Math.cos(lean)];
const away = [ea[1] * eb[2] - ea[2] * eb[1], ea[2] * eb[0] - ea[0] * eb[2], ea[0] * eb[1] - ea[1] * eb[0]];
const SHAPE = fillet(ARROW.map(([a, b]) => [a * SC, b * SC]), ARROW_R, 3);
const RIM_SHAPE = fillet(inset(ARROW.map(([a, b]) => [a * SC, b * SC]), RIM), ARROW_R.map((r) => r * 0.6), 3);
// The back plate's lowest point would dip into the key; lift the tip so the plate rests on it.
const SEAT = TK * Math.max(0, -away[2]) + 0.3;

/** World points of a cursor outline whose tip sits at height z, `off` units back along its thickness. */
const cursorAt = (shape, z, off) =>
  shape.map(([a, b]) => [a * ea[0] + b * eb[0] + off * away[0], a * ea[1] + b * eb[1] + off * away[1], z + a * ea[2] + b * eb[2] + off * away[2]]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let T = value;

  // Fitted with the cursor at its highest, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.72);
  const H = L / 2;
  fit(C, [[-H, -H, -PB], [H, H, -PB], [H, -H, -PB], [-H, H, -PB], ...cursorAt(SHAPE, KEY_H + HOVER + SEAT, 0)], 200, 166);
  const P = proj(C), front = facing(C);
  const Pw = (w) => P(w[0], w[1], w[2]);

  const g = mk("g", {}, svg);
  // A round this large shows its facets at four steps a corner, so both rings get fourteen.
  const outer = rrect(-H, -H, H, H, 12, 14), crease = rrect(-H + 2.2, -H + 2.2, H - 2.2, H - 2.2, 9.8, 14);
  reflect(svg, g, P, front, outer, -PB, 14);
  put(solid(g), prism(P, front, outer, crease, -PB, 0));
  mk("path", { d: poly(ringAt(P, rrect(-23, -23, 23, 23, 8, 6), 0)), class: "nf lo" }, g);

  // The ripple: rings of dots round the key. Those behind it are painted before it, the rest after.
  const farDots = mk("g", {}, g), dots = [];
  const keyG = mk("g", {}, g), nearDots = mk("g", {}, g);
  RINGS.forEach(([r, n], k) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 0.4, x = Math.cos(a) * r, y = Math.sin(a) * r;
      const el = flatDot(x + y < 0 ? farDots : nearDots, C, 0.95, "dot off");
      place(el, P(x, y, 0));
      dots.push({ el, k });
    }
  });

  // The keycap: a foot wider than its top, a crease inside the top's front, a dish in the middle.
  const foot = rrect(-19, -19, 19, 19, 6, 5), top = rrect(-14.5, -14.5, 14.5, 14.5, 5, 5);
  const inner = rrect(-12.7, -12.7, 12.7, 12.7, 3.4, 5), dish = circ(7.5, 20);
  const key = solid(keyG), dishEl = mk("path", { class: "nf lo" }, keyG);

  const cur = mk("g", {}, g);
  const back = mk("path", { class: "lo" }, cur), face = mk("path", { class: "sil hi" }, cur);
  const rim = mk("path", { class: "nf lo" }, cur);

  const restP = () => (HOVER + REST_D * T) / (HOVER + T);
  const sp = spring(restP(), { eps: 0.002 });
  let drawn = NaN, clicked = null;

  function draw(p) {
    const tip = KEY_H + HOVER - p * (HOVER + T), h = Math.min(KEY_H, tip), d = (KEY_H - h) / T;
    put(key, { sil: poly(hull(ringAt(P, foot, 0).concat(ringAt(P, top, h)))), crease: open(ringAt(P, run(inner, front), h)) });
    dishEl.setAttribute("d", poly(ringAt(P, dish, h)));
    const z = tip + SEAT;
    back.setAttribute("d", poly(cursorAt(SHAPE, z, TK).map(Pw)));
    face.setAttribute("d", poly(cursorAt(SHAPE, z, 0).map(Pw)));
    rim.setAttribute("d", poly(cursorAt(RIM_SHAPE, z, 0).map(Pw)));
    for (const o of dots) o.el.setAttribute("class", d >= (o.k + 1) / 3 - 0.02 ? "dot m" : "dot off");
    const c = d > 0.97;
    if (c !== clicked) { clicked = c; key.sil.classList.toggle("hi", c); face.classList.toggle("hi", !c); }
  }

  const B = register(stage, (dt) => {
    const moving = stepS(sp, dt);
    const p = clamp(sp.x, 0, 1);
    if (p !== drawn) { drawn = p; draw(p); }
    return moving;
  });
  bag.add(B.unregister);

  let over = false;
  /** The read-out follows the target, never the spring, so it says where the press is going. */
  function caption() {
    if (!over) return "rest";
    const d = clamp((sp.t * (HOVER + T) - HOVER) / T, 0, 1);
    return d <= 0 ? "hover" : d > 0.97 ? "click" : `press ${Math.round(d * 100)}%`;
  }
  function aim(y) {
    over = y !== null;
    sp.t = over ? clamp((y - Y_UP) / (Y_DOWN - Y_UP), 0, 1) : restP();
    read.textContent = caption();
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => aim(p[1]), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { T = v; if (!over) sp.t = restP(); read.textContent = caption(); drawn = NaN; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "press",
  means: "playthru's cursor over a key: the pointer's height sets how far it presses, and the click lands when the key bottoms out.",
  rules: [1, 3, 5, 8],
  range: [4, 8, 12],
  tour: [[200, 95], [200, 250], [200, 205], null],
  mount,
});
