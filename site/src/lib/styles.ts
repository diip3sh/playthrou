/**
 * Class strings shared by every component, so the page has one visual vocabulary.
 * Colors come from Kumo's semantic tokens, which follow `data-mode` on their own.
 */

export const paragraph = "w-full text-kumo-default";

export const figure = "my-8 flex w-full flex-col items-center gap-4";
export const caption = "text-center text-sm text-pretty text-kumo-subtle";

export const status = {
  ring: "flex size-7 items-center justify-center rounded-full",
  ringOk: "bg-kumo-info-tint",
  ringNo: "bg-kumo-recessed",
  dot: "flex size-[18px] items-center justify-center rounded-full",
  dotOk: "bg-kumo-brand text-white",
  dotNo: "bg-kumo-fill text-kumo-subtle",
};

/**
 * Copy buttons carry `data-copy` and are handled by
 * scripts/copy.ts, which sets `data-copied` for a moment after a copy. Kumo's
 * Button is a `group`, so its icons swap without any component state.
 */
// `size-full` matters: Phosphor icons default to 1em, which would pin a smaller glyph to the top-left corner.
const swap = "absolute inset-0 size-full transition-[opacity,scale,filter] duration-200 ease-out";
export const copySwap = {
  copy: `${swap} scale-100 opacity-100 blur-[0px] group-data-copied:scale-50 group-data-copied:opacity-0 group-data-copied:blur-[2px]`,
  check: `${swap} scale-50 opacity-0 blur-[2px] group-data-copied:scale-100 group-data-copied:opacity-100 group-data-copied:blur-[0px]`,
};

export const codeCard = {
  /** Kumo tucks this strip 8px under the body, so the vertical padding reads as 6px. */
  header: "justify-between py-3.5 pr-2 pl-3",
  title: "truncate font-mono text-sm font-normal text-kumo-subtle",
  /** Focusable so long lines can be scrolled with the keyboard; the ring sits inside because the card clips. */
  pre: "overflow-x-auto overscroll-x-contain p-3 font-mono text-[13px] leading-[1.625] text-kumo-strong focus-visible:-outline-offset-2",
};

export const fileBadges = {
  css: { fill: "#2563eb", text: "#" },
  html: { fill: "#e34f26", text: "<>" },
  jsx: { fill: "#087ea4", text: "JS" },
  ts: { fill: "#3178c6", text: "TS" },
};
