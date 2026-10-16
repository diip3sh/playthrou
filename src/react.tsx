import { useEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { playthru, type Playthru as Demo, type PlaythruOptions } from "./index.js";

export type { Playthru as PlaythruDemo, PlaythruOptions, Target } from "./index.js";

/** Attach a demo script to an element you already render. The script runs once per mount. */
export function usePlaythru(
  ref: RefObject<HTMLElement | null>,
  script: (demo: Demo) => unknown,
  options?: PlaythruOptions,
) {
  const scriptRef = useRef(script);
  scriptRef.current = script;
  const { loop, autoplay, pauseOnHover } = options ?? {};
  useEffect(() => {
    if (!ref.current) return;
    const demo = playthru(ref.current, { loop, autoplay, pauseOnHover });
    scriptRef.current(demo);
    return () => demo.destroy();
  }, [ref, loop, autoplay, pauseOnHover]);
}

export interface PlaythruProps extends Omit<HTMLAttributes<HTMLDivElement>, "children">, PlaythruOptions {
  script: (demo: Demo) => unknown;
  children: ReactNode;
}

/** A stage with your real UI inside it. */
export function Playthru({ script, loop, autoplay, pauseOnHover, children, ...rest }: PlaythruProps) {
  const ref = useRef<HTMLDivElement>(null);
  usePlaythru(ref, script, { loop, autoplay, pauseOnHover });
  return (
    <div ref={ref} {...rest}>
      <div>{children}</div>
    </div>
  );
}
