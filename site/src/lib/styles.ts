/** Class strings shared by every component, so the page has one visual vocabulary. Accent: orange. */

export const paragraph = "w-full text-paragraph";

export const figure = "my-8 flex w-full flex-col items-center gap-4";
export const caption = "text-center text-[13px] text-pretty text-gray-1100";
export const card = "flex w-full flex-col items-center rounded-2xl bg-preview-bg shadow-custom";

/** Inset toolbar at the top or bottom of a card: 4px in from a 16px card, so 12px corners. */
export const panel = {
  base: "mx-1 flex min-h-12 items-center justify-center self-stretch rounded-xl border border-gray-400 bg-gray-100 px-4 py-3",
  top: "mt-1",
  bottom: "mb-1",
};

export const chip = {
  base: "inline-flex h-7 items-center rounded-full border border-dashed px-2 font-mono text-[13px] whitespace-nowrap select-none",
  neutral: "border-gray-600 bg-gray-100 text-gray-1100",
  accent:
    "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-500/60 dark:bg-orange-950/60 dark:text-orange-400",
};

export const status = {
  ring: "flex size-7 items-center justify-center rounded-full",
  ringOk: "bg-orange-100 dark:bg-orange-950",
  ringNo: "bg-gray-300",
  dot: "flex size-[18px] items-center justify-center rounded-full text-white dark:text-gray-100",
  dotOk: "bg-orange-500",
  dotNo: "bg-gray-1000",
};

/** The label is a `group`, so the check mark follows the input's `:checked` state without component state. */
export const checkbox = {
  label: "group flex cursor-pointer items-center gap-2 select-none",
  input: "peer sr-only",
  box: "interactive flex size-5 shrink-0 items-center justify-center rounded-md border border-gray-400 bg-preview-bg text-white group-active:scale-[0.97] peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gray-1100",
  icon: "size-3.5 scale-50 opacity-0 transition-[opacity,scale] duration-200 ease-out group-has-checked:scale-100 group-has-checked:opacity-100",
  text: "text-sm font-medium",
};

/** Pair with a radius class, usually `rounded-full`. */
export const button =
  "interactive pressable inline-flex h-9 shrink-0 select-none items-center justify-center gap-1.5 bg-preview-bg px-3 text-sm font-medium text-gray-1200 shadow-custom hover:bg-gray-200";

export const iconButton =
  "interactive pressable flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-1000 hover:bg-gray-400 hover:text-gray-1200";

/**
 * Copy buttons carry `data-copy` (or `data-copy-url`) and are handled by
 * scripts/copy.ts, which sets `data-copied` for a moment after a copy. The
 * button is a `group`, so its icons swap without any component state.
 */
export const copyButton =
  "group interactive pressable flex shrink-0 items-center justify-center rounded-lg text-gray-1000 hover:bg-gray-200 hover:text-gray-1200";

const swap = "absolute inset-0 transition-[opacity,scale,filter] duration-200 ease-out";
export const copySwap = {
  copy: `${swap} scale-100 opacity-100 blur-[0px] group-data-copied:scale-50 group-data-copied:opacity-0 group-data-copied:blur-[2px]`,
  check: `${swap} scale-50 opacity-0 blur-[2px] group-data-copied:scale-100 group-data-copied:opacity-100 group-data-copied:blur-[0px]`,
};

const codeHeader =
  "mx-1 mt-1 flex items-center justify-between gap-2 rounded-xl border border-preview-border bg-gray-100 py-1.5 pr-1.5";

export const codeCard = {
  root: "my-8 w-full overflow-hidden rounded-2xl bg-preview-bg shadow-custom",
  header: `${codeHeader} pl-3`,
  title: "truncate font-mono text-sm text-gray-1100",
  /** Focusable so long lines can be scrolled with the keyboard; the ring sits inside because the card clips. */
  pre: "overflow-x-auto overscroll-x-contain p-3 font-mono text-[13px] leading-[1.625] text-gray-1200 focus-visible:-outline-offset-2",
};

export const fileBadges = {
  css: { fill: "#2563eb", text: "#" },
  html: { fill: "#e34f26", text: "<>" },
  jsx: { fill: "#087ea4", text: "JS" },
  ts: { fill: "#3178c6", text: "TS" },
};

/** Two-column reference table: mono term on the left, explanation on the right. */
export const table = {
  root: "my-8 w-full overflow-hidden rounded-2xl bg-preview-bg shadow-custom",
  list: "divide-y divide-gray-400",
  row: "grid gap-1.5 px-4 py-3.5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-4",
  term: "flex flex-col gap-0.5 font-mono text-[13px] leading-[22px] text-gray-1200",
  desc: "text-sm leading-[22px] text-pretty text-gray-1100",
};
