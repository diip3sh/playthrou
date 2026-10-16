/**
 * The site's icon set, drawn on a 16px grid with 1.5px strokes (the same set as the concentric site).
 * Shared by the Astro components, through Icon.astro, and the React islands.
 */
import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true } as const;
const round = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <path d="M5 11 11 5M6 5h5v5" {...round} />
    </svg>
  );
}

export function CaretDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <path d="m4.5 6.25 3.5 3.5 3.5-3.5" {...round} />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} strokeWidth={2} {...props}>
      <path d="m3.5 8.5 3 3 6-7" {...round} />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <rect x="5.25" y="5.25" width="8.5" height="8.5" rx="2" />
      <path d="M10.75 5.25V3.75a1.5 1.5 0 0 0-1.5-1.5h-5.5a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h1.5" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <path d="M8 2.25v7.5m-3.25-3 3.25 3.25 3.25-3.25M2.25 10.25v1.5a2 2 0 0 0 2 2h7.5a2 2 0 0 0 2-2v-1.5" {...round} />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <path
        d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2.1-2.1a2.75 2.75 0 0 0-3.9-3.9l-.6.6M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2.1 2.1a2.75 2.75 0 0 0 3.9 3.9l.6-.6"
        {...round}
      />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" {...line} {...props}>
      <path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3Z" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} strokeWidth={2} {...props}>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <path
        d="M9.25 4.25c.45 2.75 2.25 4.55 5 5-2.75.45-4.55 2.25-5 5-.45-2.75-2.25-4.55-5-5 2.75-.45 4.55-2.25 5-5Z"
        strokeLinejoin="round"
      />
      <path d="M3.75 1.75v4m-2-2h4" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" {...line} {...props}>
      <circle cx="10" cy="10" r="3.25" />
      <path
        d="M10 2.5v1.5M10 16v1.5M2.5 10H4M16 10h1.5M4.7 4.7l1.06 1.06M14.24 14.24l1.06 1.06M4.7 15.3l1.06-1.06M14.24 5.76l1.06-1.06"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...line} {...props}>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2.5" />
      <path d="m4.75 6.25 1.75 1.75-1.75 1.75M8.25 10h3" {...round} />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 10 10" {...line} strokeWidth={1.75} {...props}>
      <path d="m2 2 6 6M8 2 2 8" strokeLinecap="round" />
    </svg>
  );
}
