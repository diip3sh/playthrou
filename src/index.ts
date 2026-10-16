/**
 * playthru: scripted product demos on your real UI.
 * A cursor that glides, clicks and types, and a camera that zooms in on what matters.
 * Zero dependencies. Every timing is decided for you.
 */

export type Target = string | Element;

export interface PlaythruOptions {
  /** Replay forever. Default `true`. */
  loop?: boolean;
  /** Start on its own the first time the stage scrolls into view. Default `true`. */
  autoplay?: boolean;
  /** Pause and hide the cursor while a real pointer is over the stage. Default `true`. */
  pauseOnHover?: boolean;
}

export interface Playthru {
  /** Glide the cursor to an element. */
  move(target: Target): Playthru;
  /** Click an element (glides there first), or the last target. Fires real pointer and click events. */
  click(target?: Target): Playthru;
  /** Type into the last target. */
  type(text: string): Playthru;
  /** Click a field, then type into it. */
  type(target: Target, text: string): Playthru;
  /** Press a key on the last target, e.g. `"Enter"`. Fires keydown and keyup. */
  key(key: string): Playthru;
  /** Push the camera in on an element, or the last target. */
  zoom(target?: Target): Playthru;
  /** Pull the camera back out. */
  zoomOut(): Playthru;
  /** Hold for a moment. */
  wait(ms: number): Playthru;
  /** Run your own code as a step, e.g. to flip app state. */
  run(fn: () => void | Promise<void>): Playthru;
  /** Restore your app before every pass. Typed fields are restored for you. */
  reset(fn: () => void): Playthru;
  play(): Playthru;
  pause(): Playthru;
  destroy(): void;
  readonly playing: boolean;
}

/* ------------------------------------------------------------------ */
/* The numbers. These are the product. See README for why.            */
/* ------------------------------------------------------------------ */

const N = {
  glideMin: 420, // ms, shortest glide
  glidePerPx: 0.34, // ms added per px travelled
  glideMax: 980, // ms, longest glide
  arc: 0.1, // control-point offset as a share of distance
  settle: 180, // ms the cursor rests on a target before acting
  press: 90, // ms button held down
  ripple: 560, // ms click ring
  keyBase: 48, // ms per keystroke
  keyJitter: 42, // ms of human unevenness
  keyAfterSpace: 26,
  keyAfterPunct: 150,
  zoom: 1050, // ms camera move
  zoomFill: 0.5, // zoomed target fills half the stage
  zoomMin: 1.3,
  zoomMax: 2.2,
  zoomRoom: 0.95, // a zoomed target must fit in 95% of the stage, or the camera stays out
  edge: 0.08, // when zoomed, pan only if the cursor heads within 8% of an edge
  safe: 0.22, // ...and only far enough to bring it 22% in
  gap: 240, // ms between steps
  hold: 1900, // ms the finished state stays on screen
  fadeOut: 240,
  fadeIn: 380,
} as const;

const HOT_X = 4;
const HOT_Y = 2;

const CURSOR_SVG =
  '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 2v16.4l4-3.8 2.6 6 2.9-1.3-2.6-5.9H16.4z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

/** In a layer declared first, so any page style (layered or not) beats these defaults. */
const CSS = `@layer playthru{
[data-playthru]{position:relative;overflow:hidden}
[data-playthru-scene]{position:relative;transform-origin:0 0}
.playthru-cursor{position:absolute;left:0;top:0;z-index:2147483646;pointer-events:none;width:24px;height:24px;
transform-origin:${HOT_X}px ${HOT_Y}px;opacity:0;transition:opacity .2s ease;filter:drop-shadow(0 1px 1.5px rgb(0 0 0/.35))}
.playthru-cursor svg{display:block}
.playthru-ripple{position:absolute;z-index:2147483645;pointer-events:none;width:28px;height:28px;
border-radius:50%;background:rgb(128 128 128/.28);box-shadow:0 0 0 1.5px rgb(128 128 128/.45)}
:where([data-playthru-focus]){outline:2px solid rgb(59 130 246/.55);outline-offset:1px}
.playthru-caret{position:absolute;left:0;top:0;z-index:2147483645;pointer-events:none;width:1.5px;border-radius:1px;opacity:0}
.playthru-caret.on{opacity:1;animation:playthru-blink 1.06s steps(1) infinite}
@keyframes playthru-blink{50%{opacity:0}}
}`;

/* ------------------------------------------------------------------ */

const CANCEL = Symbol("playthru.cancel");
type Gen = number;
/** `instant` steps (like `run`) are bookkeeping, so they get no beat after them. */
type Step = ((gen: Gen) => Promise<void>) & { instant?: boolean };
type Cam = { s: number; x: number; y: number };
type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let styled = false;
function injectStyle() {
  if (styled || typeof document === "undefined") return;
  styled = true;
  const el = document.createElement("style");
  el.dataset.playthru = "";
  el.textContent = CSS;
  document.head.prepend(el);
}

const isField = (el: Element): el is HTMLInputElement | HTMLTextAreaElement =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

function writeValue(el: Element, value: string, data: string | null) {
  if (isField(el)) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value); // React-safe
  } else {
    el.textContent = value;
  }
  const Ctor = typeof InputEvent === "function" ? InputEvent : Event;
  el.dispatchEvent(new Ctor("input", { bubbles: true, data, inputType: data === null ? "deleteContent" : "insertText" } as InputEventInit));
}

const readValue = (el: Element) => (isField(el) ? el.value : el.textContent ?? "");

/** Open menus, listboxes and popovers, found by the ARIA state every popup library sets on its trigger. */
const OPEN_POPUP = '[aria-expanded="true"]:is([aria-haspopup]:not([aria-haspopup="false"]),[role="combobox"])';
let popupQuery: string | undefined;
function openPopups(): Element[] {
  popupQuery ??= globalThis.CSS?.supports?.("selector(:popover-open)") ? `${OPEN_POPUP},:popover-open` : OPEN_POPUP;
  return Array.from(document.querySelectorAll(popupQuery));
}

/* ------------------------------------------------------------------ */

class Engine implements Playthru {
  private steps: Step[] = [];
  private resets: Array<() => void> = [];
  private gen = 0;
  private running = false;
  private holds = new Set<string>();
  private cam: Cam = { s: 1, x: 0, y: 0 };
  private pos: Pt = { x: 0, y: 0 };
  private last: Element | null = null;
  private hovered: Element | null = null;
  private focused: Element | null = null;
  private typed = new Map<Element, string>();
  private rand = rng(7);
  private scene: HTMLElement;
  private cursor: HTMLElement;
  private caret: HTMLElement;
  private measure?: CanvasRenderingContext2D | null;
  private wrapped = false;
  private io?: IntersectionObserver;
  private reduced: boolean;
  private opts: Required<PlaythruOptions>;
  private onEnter = (e: PointerEvent) => e.isTrusted && this.hold("hover");
  private onLeave = (e: PointerEvent) => e.isTrusted && this.release("hover");

  constructor(private stage: HTMLElement, options: PlaythruOptions = {}) {
    injectStyle();
    const { loop = true, autoplay = true, pauseOnHover = true } = options;
    this.opts = { loop, autoplay, pauseOnHover };
    this.reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    stage.setAttribute("data-playthru", "");
    const kids = stage.children;
    if (kids.length === 1 && kids[0] instanceof HTMLElement) {
      this.scene = kids[0];
    } else {
      this.scene = document.createElement("div");
      this.scene.append(...Array.from(stage.childNodes));
      stage.append(this.scene);
      this.wrapped = true;
    }
    this.scene.setAttribute("data-playthru-scene", "");

    this.cursor = document.createElement("div");
    this.cursor.className = "playthru-cursor";
    this.cursor.setAttribute("aria-hidden", "true");
    this.cursor.innerHTML = CURSOR_SVG;
    this.caret = document.createElement("div");
    this.caret.className = "playthru-caret";
    this.caret.setAttribute("aria-hidden", "true");
    this.scene.append(this.cursor, this.caret);

    if (this.opts.pauseOnHover) {
      stage.addEventListener("pointerenter", this.onEnter);
      stage.addEventListener("pointerleave", this.onLeave);
    }

    if (this.opts.autoplay) {
      // Let the chained script finish building first.
      queueMicrotask(() => this.gen === 0 && this.play());
    }
  }

  /* ---------- public script API ---------- */

  move(target: Target) {
    this.steps.push((g) => this.glideTo(target, g));
    return this;
  }

  click(target?: Target) {
    this.steps.push(async (g) => {
      if (target !== undefined) await this.glideTo(target, g);
      await this.press(this.need(), g);
    });
    return this;
  }

  type(a: Target, b?: string) {
    const target = b === undefined ? undefined : a;
    const text = b === undefined ? (a as string) : b;
    this.steps.push(async (g) => {
      if (target !== undefined) {
        await this.glideTo(target, g);
        await this.press(this.need(), g);
      }
      await this.typeInto(this.need(), text, g);
    });
    return this;
  }

  key(key: string) {
    this.steps.push(async (g) => {
      const el = this.need();
      await this.yieldToPage(g);
      for (const t of ["keydown", "keyup"]) {
        el.dispatchEvent(new KeyboardEvent(t, { key, bubbles: true, cancelable: true }));
      }
      await this.sleep(N.press, g);
    });
    return this;
  }

  zoom(target?: Target) {
    this.steps.push(async (g) => {
      if (this.reduced) return;
      const el = target === undefined ? this.need() : this.find(target);
      await this.camTo(this.fit(this.rect(el)), N.zoom, g);
    });
    return this;
  }

  zoomOut() {
    this.steps.push((g) => (this.reduced ? Promise.resolve() : this.camTo({ s: 1, x: 0, y: 0 }, N.zoom, g)));
    return this;
  }

  wait(ms: number) {
    this.steps.push((g) => this.sleep(ms, g));
    return this;
  }

  run(fn: () => void | Promise<void>) {
    const step: Step = async () => {
      await fn();
    };
    step.instant = true;
    this.steps.push(step);
    return this;
  }

  reset(fn: () => void) {
    this.resets.push(fn);
    return this;
  }

  get playing() {
    return this.running && this.holds.size === 0;
  }

  play() {
    this.release("manual");
    if (this.running) return this;
    this.running = true;
    if (typeof IntersectionObserver === "function" && !this.io) {
      this.io = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? this.release("offscreen") : this.hold("offscreen")),
        { threshold: 0.3 },
      );
      this.io.observe(this.stage);
    }
    void this.loop(++this.gen);
    return this;
  }

  pause() {
    this.hold("manual");
    return this;
  }

  destroy() {
    this.gen++;
    this.running = false;
    this.io?.disconnect();
    this.stage.removeEventListener("pointerenter", this.onEnter);
    this.stage.removeEventListener("pointerleave", this.onLeave);
    this.restoreFields();
    this.mark(null, "hover");
    this.mark(null, "focus");
    this.cursor.remove();
    this.caret.remove();
    this.scene.querySelectorAll(".playthru-ripple").forEach((r) => r.remove());
    this.scene.style.transform = "";
    this.scene.style.opacity = "";
    this.scene.removeAttribute("data-playthru-scene");
    this.stage.removeAttribute("data-playthru");
    if (this.wrapped) {
      this.scene.replaceWith(...Array.from(this.scene.childNodes));
    }
  }

  /* ---------- the loop ---------- */

  private async loop(g: Gen) {
    try {
      this.home();
      for (;;) {
        this.rand = rng(7); // every pass types the same way
        this.showCursor(true);
        for (const step of this.steps) {
          await step(g);
          if (!step.instant) await this.sleep(N.gap, g);
        }
        await this.sleep(N.hold, g);
        if (!this.opts.loop) break;
        await this.rewind(g);
      }
      this.running = false;
    } catch (e) {
      if (e !== CANCEL) {
        this.running = false;
        throw e;
      }
    }
  }

  private async rewind(g: Gen) {
    await this.yieldToPage(g);
    this.mark(null, "hover");
    this.mark(null, "focus");
    const back = this.reduced ? Promise.resolve() : this.camTo({ s: 1, x: 0, y: 0 }, N.zoom, g);
    await Promise.all([back, this.glide(this.homePoint(), g)]);
    await this.fade(1, 0, N.fadeOut, g);
    this.restoreFields();
    this.resets.forEach((fn) => fn());
    this.last = null;
    await this.fade(0, 1, N.fadeIn, g);
  }

  /* ---------- clock: everything runs on one pausable frame clock ---------- */

  private hold(reason: string) {
    this.holds.add(reason);
    if (reason === "hover") this.showCursor(false);
  }

  private release(reason: string) {
    this.holds.delete(reason);
    if (reason === "hover" && this.running) this.showCursor(true);
  }

  private frames(ms: number, onFrame: (t: number) => void, g: Gen) {
    return new Promise<void>((resolve, reject) => {
      if (g !== this.gen) return reject(CANCEL);
      if (ms <= 0) {
        onFrame(1);
        return resolve();
      }
      let elapsed = 0;
      let prev = performance.now();
      const tick = (now: number) => {
        if (g !== this.gen) return reject(CANCEL);
        if (this.holds.size === 0) elapsed += Math.min(64, now - prev);
        prev = now;
        const t = Math.min(1, elapsed / ms);
        onFrame(t);
        t >= 1 ? resolve() : requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  private sleep(ms: number, g: Gen) {
    return this.frames(ms, () => {}, g);
  }

  /**
   * Synthetic events reach the whole page, and outside-press handlers listen on the document in the
   * capture phase, before anything here could stop them. So while a popup outside the stage is open,
   * the demo holds instead of sending input that would dismiss it.
   */
  private async yieldToPage(g: Gen) {
    const blocked = () => openPopups().some((el) => !this.stage.contains(el));
    if (!blocked()) return;
    this.hold("popup");
    try {
      // Polled on a timer, not the frame clock, because the clock is frozen by the hold.
      while (blocked()) {
        await new Promise((r) => setTimeout(r, 150));
        if (g !== this.gen) throw CANCEL;
      }
    } finally {
      this.release("popup");
    }
  }

  /* ---------- geometry ---------- */

  private find(target: Target): Element {
    if (typeof target !== "string") return target;
    const el = this.scene.querySelector(target);
    if (!el) throw new Error(`playthru: nothing matches "${target}" inside the stage`);
    return el;
  }

  private need(): Element {
    if (!this.last) throw new Error("playthru: click(), type() and zoom() need a target first");
    return this.last;
  }

  /** Current visual scale of the scene, read from the DOM so it is right mid-zoom too. */
  private k() {
    return this.scene.getBoundingClientRect().width / (this.scene.offsetWidth || 1);
  }

  /** Element rect in unscaled scene coordinates. */
  private rect(el: Element): Rect {
    const r = el.getBoundingClientRect();
    const s = this.scene.getBoundingClientRect();
    const k = this.k();
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
  }

  /** Where a hand would land: the middle, or near the start of a text field. */
  private aim(el: Element): Pt {
    const r = this.rect(el);
    const x = isField(el) && r.w > 120 ? r.x + Math.min(r.w / 2, 44) : r.x + r.w / 2;
    return { x, y: r.y + r.h / 2 };
  }

  private toClient(p: Pt) {
    const s = this.scene.getBoundingClientRect();
    const k = this.k();
    return { x: s.left + p.x * k, y: s.top + p.y * k };
  }

  private homePoint(): Pt {
    return { x: this.stage.clientWidth * 0.78, y: this.stage.clientHeight * 0.84 };
  }

  private home() {
    this.cam = { s: 1, x: 0, y: 0 };
    this.applyCam();
    this.pos = this.homePoint();
    this.drawCursor(1);
  }

  private fit(r: Rect, s?: number): Cam {
    const W = this.stage.clientWidth;
    const H = this.stage.clientHeight;
    if (s === undefined) {
      const room = Math.min((W * N.zoomRoom) / r.w, (H * N.zoomRoom) / r.h);
      // Below the minimum a zoom looks like a mistake, and above `room` it crops the target: skip it.
      if (room < N.zoomMin) return { s: 1, x: 0, y: 0 };
      s = Math.min(clamp(Math.min((W * N.zoomFill) / r.w, (H * N.zoomFill) / r.h), N.zoomMin, N.zoomMax), room);
    }
    const SW = this.scene.offsetWidth;
    const SH = this.scene.offsetHeight;
    return {
      s,
      x: clamp(W / 2 - (r.x + r.w / 2) * s, Math.min(0, W - SW * s), 0),
      y: clamp(H / 2 - (r.y + r.h / 2) * s, Math.min(0, H - SH * s), 0),
    };
  }

  /* ---------- camera ---------- */

  private applyCam() {
    const { s, x, y } = this.cam;
    this.scene.style.transform = s === 1 && x === 0 && y === 0 ? "" : `translate3d(${x}px,${y}px,0) scale(${s})`;
  }

  private camTo(to: Cam, ms: number, g: Gen) {
    const from = { ...this.cam };
    return this.frames(
      ms,
      (t) => {
        const e = smooth(t);
        this.cam = { s: lerp(from.s, to.s, e), x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) };
        this.applyCam();
      },
      g,
    );
  }

  private fade(a: number, b: number, ms: number, g: Gen) {
    if (this.reduced) {
      this.scene.style.opacity = "";
      return Promise.resolve();
    }
    return this.frames(ms, (t) => (this.scene.style.opacity = t >= 1 && b === 1 ? "" : String(lerp(a, b, smooth(t)))), g);
  }

  /* ---------- cursor ---------- */

  private drawCursor(scale: number) {
    this.cursor.style.transform = `translate3d(${this.pos.x - HOT_X}px,${this.pos.y - HOT_Y}px,0) scale(${scale})`;
  }

  private showCursor(on: boolean) {
    this.cursor.style.opacity = on && !this.holds.has("hover") ? "1" : "0";
  }

  private async glideTo(target: Target, g: Gen) {
    const el = this.find(target);
    await this.yieldToPage(g);
    if (this.last !== el) this.mark(null, "hover");
    this.last = el;
    this.showCursor(true);
    const to = this.aim(el);

    // When zoomed, keep the action in frame: pan if the target sits near an edge.
    let pan: Promise<void> = Promise.resolve();
    if (this.cam.s > 1.001 && !this.reduced) {
      const W = this.stage.clientWidth;
      const H = this.stage.clientHeight;
      const vx = to.x * this.cam.s + this.cam.x;
      const vy = to.y * this.cam.s + this.cam.y;
      if (vx < W * N.edge || vx > W * (1 - N.edge) || vy < H * N.edge || vy > H * (1 - N.edge)) {
        // Nudge, don't recenter: move the camera just enough to bring the target into the safe area.
        const { s } = this.cam;
        const SW = this.scene.offsetWidth;
        const SH = this.scene.offsetHeight;
        const nx = clamp(vx, W * N.safe, W * (1 - N.safe)) - vx;
        const ny = clamp(vy, H * N.safe, H * (1 - N.safe)) - vy;
        const next = {
          s,
          x: clamp(this.cam.x + nx, Math.min(0, W - SW * s), 0),
          y: clamp(this.cam.y + ny, Math.min(0, H - SH * s), 0),
        };
        pan = this.camTo(next, Math.max(this.glideMs(to), 700), g);
      }
    }

    await Promise.all([this.glide(to, g), pan]);
    await this.yieldToPage(g);
    this.mark(el, "hover");
    const c = this.toClient(to);
    for (const t of ["pointerover", "pointerenter", "mouseover", "mouseenter", "pointermove", "mousemove"]) this.fire(el, t, c);
    await this.sleep(N.settle, g);
  }

  private glideMs(to: Pt) {
    const d = Math.hypot(to.x - this.pos.x, to.y - this.pos.y);
    return this.reduced ? 0 : clamp(N.glideMin + d * N.glidePerPx, N.glideMin, N.glideMax);
  }

  /** A slight arc, like a wrist, not a ruler. */
  private glide(to: Pt, g: Gen) {
    const from = { ...this.pos };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return Promise.resolve();
    const bend = (dx >= 0 ? -1 : 1) * d * N.arc;
    const cx = (from.x + to.x) / 2 + (-dy / d) * bend;
    const cy = (from.y + to.y) / 2 + (dx / d) * bend;
    return this.frames(
      this.glideMs(to),
      (t) => {
        const e = smooth(t);
        const u = 1 - e;
        this.pos = { x: u * u * from.x + 2 * u * e * cx + e * e * to.x, y: u * u * from.y + 2 * u * e * cy + e * e * to.y };
        this.drawCursor(1);
      },
      g,
    );
  }

  private async press(el: Element, g: Gen) {
    await this.yieldToPage(g);
    const c = this.toClient(this.pos);
    this.fire(el, "pointerdown", c);
    this.fire(el, "mousedown", c);
    this.drawCursor(0.84);
    this.ripple();
    await this.sleep(N.press, g);
    this.drawCursor(1);
    this.fire(el, "pointerup", c);
    this.fire(el, "mouseup", c);
    // A demo should never navigate away or submit a real form.
    const guard = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.('a[href],button[type="submit"],input[type="submit"],form button:not([type])')) e.preventDefault();
    };
    this.stage.addEventListener("click", guard, true);
    this.fire(el, "click", c);
    this.stage.removeEventListener("click", guard, true);
    if (isField(el) || (el as HTMLElement).isContentEditable) {
      this.mark(el, "focus");
      this.drawCaret(el);
    } else {
      this.mark(null, "focus");
    }
  }

  private ripple() {
    const r = document.createElement("div");
    r.className = "playthru-ripple";
    r.style.left = `${this.pos.x}px`;
    r.style.top = `${this.pos.y}px`;
    this.scene.append(r);
    const a = r.animate(
      [
        { transform: "translate(-50%,-50%) scale(.3)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(1.6)", opacity: 0 },
      ],
      { duration: N.ripple, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
    );
    a.onfinish = a.oncancel = () => r.remove();
  }

  /** The page keeps real focus; this draws where the caret would be. Single-line fields only. */
  private drawCaret(el: Element | null) {
    const c = this.caret;
    if (!(el instanceof HTMLInputElement)) {
      c.classList.remove("on");
      return;
    }
    const cs = getComputedStyle(el);
    this.measure ??= document.createElement("canvas").getContext("2d");
    let w = 0;
    if (this.measure) {
      this.measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      w = this.measure.measureText(el.value).width;
    }
    const r = this.rect(el);
    const k = r.w / (el.offsetWidth || r.w || 1); // element px to scene px
    const size = parseFloat(cs.fontSize) * 1.2 * k;
    const left = r.x + (parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) + Math.min(w, el.clientWidth - 4)) * k;
    c.style.height = `${size}px`;
    c.style.background = cs.caretColor && cs.caretColor !== "auto" ? cs.caretColor : cs.color;
    c.style.transform = `translate3d(${left + 1}px,${r.y + (r.h - size) / 2}px,0)`;
    c.classList.remove("on");
    void c.offsetWidth; // restart the blink so it stays solid while typing
    c.classList.add("on");
  }

  private async typeInto(el: Element, text: string, g: Gen) {
    this.mark(el, "focus");
    this.drawCaret(el);
    if (!this.typed.has(el)) this.typed.set(el, readValue(el));
    this.showCursor(false); // hands are on the keyboard
    let value = readValue(el);
    let prev = "";
    for (const ch of Array.from(text)) {
      let ms = N.keyBase + this.rand() * N.keyJitter;
      if (prev === " ") ms += N.keyAfterSpace;
      if (/[,.!?;:]/.test(prev)) ms += N.keyAfterPunct;
      await this.sleep(ms, g);
      await this.yieldToPage(g);
      el.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true, cancelable: true }));
      value += ch;
      writeValue(el, value, ch);
      this.drawCaret(el);
      el.dispatchEvent(new KeyboardEvent("keyup", { key: ch, bubbles: true }));
      prev = ch;
    }
  }

  private restoreFields() {
    this.typed.forEach((v, el) => writeValue(el, v, null));
    this.typed.clear();
  }

  /* ---------- DOM helpers ---------- */

  private mark(el: Element | null, kind: "hover" | "focus") {
    const key = kind === "hover" ? "hovered" : "focused";
    const attr = `data-playthru-${kind}`;
    const prev = this[key];
    if (prev === el) return;
    if (kind === "focus" && !el) this.caret?.classList.remove("on");
    if (prev) {
      prev.removeAttribute(attr);
      if (kind === "hover") {
        const c = this.toClient(this.pos);
        for (const t of ["pointerout", "pointerleave", "mouseout", "mouseleave"]) this.fire(prev, t, c);
      }
    }
    el?.setAttribute(attr, "");
    this[key] = el;
  }

  private fire(el: Element, type: string, c: Pt) {
    const pointer = type.startsWith("pointer");
    const Ctor = pointer && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
    const down = type.endsWith("down");
    el.dispatchEvent(
      new Ctor(type, {
        bubbles: !type.endsWith("enter") && !type.endsWith("leave"),
        cancelable: true,
        composed: true,
        clientX: c.x,
        clientY: c.y,
        button: 0,
        buttons: down ? 1 : 0,
        view: window,
        ...(pointer ? { pointerId: 1, pointerType: "mouse", isPrimary: true } : {}),
      } as PointerEventInit),
    );
  }
}

/**
 * Turn a stage element into a live, looping product demo.
 *
 * ```ts
 * playthru("#hero")
 *   .click("#new-issue")
 *   .type("#title", "Fix onboarding flicker")
 *   .click("#create")
 *   .zoom(".issue:first-child");
 * ```
 */
export function playthru(stage: string | HTMLElement, options?: PlaythruOptions): Playthru {
  const el = typeof stage === "string" ? document.querySelector<HTMLElement>(stage) : stage;
  if (!el) throw new Error(`playthru: no stage matches "${stage}"`);
  return new Engine(el, options);
}

export default playthru;
