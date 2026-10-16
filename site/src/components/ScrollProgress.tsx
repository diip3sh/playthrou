import { AnimatePresence, animate, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import * as React from "react";
import { cx } from "../lib/cx";

export type ScrollProgressSection = { id: string; label: string };

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const SIZE_SPRING = { type: "spring", bounce: 0.16, duration: 0.5 } as const;
const LABEL_CROSSFADE = { duration: 0.22, ease: EASE_OUT } as const;
const LAYER_FADE = { duration: 0.24, ease: EASE_IN_OUT } as const;

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type Size = { width: number; height: number };

export type ScrollProgressProps = React.ComponentProps<"div"> & {
  sections?: ScrollProgressSection[];
  containerRef?: React.RefObject<HTMLElement | null>;
  offset?: number;
};

const ScrollProgress = ({ className, sections = [], containerRef, offset = 120, ...props }: ScrollProgressProps) => {
  const layoutId = React.useId();
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll(containerRef ? { container: containerRef } : undefined);
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  const [activeId, setActiveId] = React.useState(sections[0]?.id);
  const [open, setOpen] = React.useState(false);

  // While a jump is animating, the active section is the target, not whatever the page passes on the way.
  const scrollLock = React.useRef(false);
  const scrollAnim = React.useRef<ReturnType<typeof animate>>(undefined);

  React.useEffect(() => {
    const scroller = containerRef?.current ?? window;

    const update = () => {
      if (scrollLock.current) return;
      const anchor = (containerRef?.current?.getBoundingClientRect().top ?? 0) + offset;
      const active = sections.findLast(({ id }) => {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        return top !== undefined && top <= anchor;
      });
      setActiveId(active?.id ?? sections[0]?.id);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections, containerRef, offset]);

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const label = sections[activeIndex]?.label;

  const labelVersion = React.useRef(0);
  const prevLabel = React.useRef(label);
  if (label !== prevLabel.current) {
    prevLabel.current = label;
    labelVersion.current += 1;
  }

  const collapsedRef = React.useRef<HTMLDivElement>(null);
  const openRef = React.useRef<HTMLDivElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [collapsedSize, setCollapsedSize] = React.useState<Size>();
  const [openSize, setOpenSize] = React.useState<Size>();
  const [labelWidth, setLabelWidth] = React.useState<number>();

  useIsoLayoutEffect(() => {
    const measure = () => {
      if (labelRef.current) setLabelWidth(labelRef.current.offsetWidth);
      if (collapsedRef.current) {
        setCollapsedSize({
          width: collapsedRef.current.offsetWidth,
          height: collapsedRef.current.offsetHeight,
        });
      }
      if (openRef.current) {
        setOpenSize({
          width: openRef.current.offsetWidth,
          height: openRef.current.offsetHeight,
        });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (labelRef.current) ro.observe(labelRef.current);
    if (collapsedRef.current) ro.observe(collapsedRef.current);
    if (openRef.current) ro.observe(openRef.current);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [sections]);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      // The hero demo dispatches synthetic pointer events; only a real one outside should close the list.
      if (e.isTrusted && !rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const endJump = React.useCallback(() => {
    scrollAnim.current?.stop();
    scrollAnim.current = undefined;
    scrollLock.current = false;
  }, []);

  // A wheel, touch or key press mid-jump hands the scroll back to the reader.
  React.useEffect(() => {
    const interrupt = () => scrollAnim.current && endJump();
    const events = ["wheel", "touchstart", "keydown"] as const;
    for (const e of events) window.addEventListener(e, interrupt, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, interrupt);
      endJump();
    };
  }, [endJump]);

  const selectSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActiveId(id);
    setOpen(false);

    const box = containerRef?.current;
    const scroller = box ?? window;
    const from = box ? box.scrollTop : window.scrollY;
    const max = box ? box.scrollHeight - box.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    const top =
      target.getBoundingClientRect().top -
      (box?.getBoundingClientRect().top ?? 0) +
      from -
      (Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
    const to = Math.min(Math.max(top, 0), max);
    // "instant" so a page-wide `scroll-behavior: smooth` doesn't smooth every frame of the tween.
    const scrollTo = (y: number) => scroller.scrollTo({ top: y, behavior: "instant" });

    endJump();
    if (reduceMotion) return scrollTo(to);
    scrollLock.current = true;
    scrollAnim.current = animate(from, to, {
      duration: Math.min(0.5 + Math.abs(to - from) / 5000, 1),
      ease: EASE_IN_OUT,
      onUpdate: scrollTo,
      onComplete: endJump,
    });
  };

  const size = open ? openSize : collapsedSize;
  const radius = open ? 26 : (collapsedSize?.height ?? 32) / 2;
  const squircle = "[corner-shape:squircle]";

  return (
    <div
      ref={rootRef}
      data-slot="scroll-progress"
      className={cx("fixed bottom-6 left-1/2 z-50 -translate-x-1/2", className)}
      {...props}
    >
      <div className="pointer-events-none invisible absolute" aria-hidden>
        <div ref={collapsedRef} className="inline-flex items-center gap-2.5 py-1.5 pr-4 pl-2">
          <span className="h-5 w-5" />
          <span ref={labelRef} className="text-sm leading-none font-medium whitespace-nowrap">
            {label}
          </span>
        </div>
        <div ref={openRef} className="w-max p-1.5">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm leading-none font-medium">
              <span className="h-1.5 w-1.5" />
              <span className="whitespace-nowrap">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {size && (
        <motion.div
          data-slot="scroll-progress-surface"
          className={cx(
            "absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden border border-kumo-line bg-kumo-elevated/70 shadow-lg backdrop-blur-md",
            squircle,
          )}
          initial={false}
          animate={{
            width: size.width,
            height: size.height,
            borderRadius: radius,
          }}
          transition={reduceMotion ? { duration: 0 } : SIZE_SPRING}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {open ? (
              <motion.ul
                key="list"
                className="absolute inset-0 flex flex-col p-1.5"
                initial={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                transition={LAYER_FADE}
              >
                {sections.map((s, i) => {
                  const isActive = s.id === activeId;
                  const isPassed = i <= activeIndex;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => selectSection(s.id)}
                        className={cx(
                          "relative flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left text-sm leading-none font-medium transition-colors",
                          squircle,
                          isActive ? "text-kumo-strong" : "text-kumo-subtle hover:text-kumo-default",
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`${layoutId}-active`}
                            className={cx("absolute inset-0 rounded-[14px] bg-kumo-contrast/10", squircle)}
                            transition={reduceMotion ? { duration: 0 } : SIZE_SPRING}
                          />
                        )}
                        {i > 0 && (
                          // Joins this dot to the one above, 2px clear of each, once the reader has reached it.
                          <span
                            aria-hidden
                            className={cx(
                              "absolute bottom-[calc(50%+5px)] left-[14.5px] h-[calc(100%-10px)] w-px origin-top bg-kumo-contrast/30 transition-transform duration-300 ease-(--ease-smooth) motion-reduce:transition-none",
                              isPassed ? "scale-y-100" : "scale-y-0",
                            )}
                          />
                        )}
                        <motion.span
                          className={cx(
                            "relative h-1.5 w-1.5 shrink-0 rounded-full",
                            isActive ? "bg-kumo-contrast" : "bg-kumo-contrast/30",
                          )}
                          initial={reduceMotion ? undefined : { opacity: 0, y: 4, filter: "blur(3px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_IN_OUT,
                            delay: reduceMotion ? 0 : 0.04 + i * 0.03,
                          }}
                        />
                        <motion.span
                          className="relative whitespace-nowrap"
                          initial={reduceMotion ? undefined : { opacity: 0, y: 4, filter: "blur(3px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_IN_OUT,
                            delay: reduceMotion ? 0 : 0.04 + i * 0.03,
                          }}
                        >
                          {s.label}
                        </motion.span>
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            ) : (
              <motion.button
                key="pill"
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Show sections"
                className="absolute inset-0 flex items-center gap-2.5 py-1.5 pr-4 pl-2"
                initial={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                transition={LAYER_FADE}
              >
                <span className="shrink-0">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 -rotate-90" aria-hidden>
                    <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" className="stroke-kumo-contrast/15" />
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="stroke-kumo-contrast"
                      style={{ pathLength: progress }}
                    />
                  </svg>
                </span>

                <span className="relative h-5 shrink-0" style={{ width: labelWidth }}>
                  <AnimatePresence initial={false}>
                    {label && (
                      <motion.span
                        key={labelVersion.current}
                        data-slot="scroll-progress-label"
                        className="absolute inset-y-0 left-0 flex items-center text-sm leading-none font-medium whitespace-nowrap text-kumo-strong"
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(1.5px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(1.5px)" }}
                        transition={LABEL_CROSSFADE}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export { ScrollProgress };
export default ScrollProgress;
