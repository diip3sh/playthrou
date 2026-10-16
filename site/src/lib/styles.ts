/**
 * Class strings shared by every component, so the page has one visual vocabulary.
 * Colors come from Kumo's semantic tokens, which follow `data-mode` on their own.
 */

export const paragraph = "w-full text-kumo-default";

export const figure = "my-8 flex w-full flex-col items-center gap-4";
export const caption = "text-center text-sm text-pretty text-kumo-subtle";

/** Matches the concentric site's cards: white (#191919 dark) with a hairline shadow in place of a border. */
export const card =
  "flex w-full flex-col items-center rounded-2xl bg-kumo-base shadow-[0_0_0_1px_#0000000f,0_1px_2px_-1px_#0000000f,0_2px_4px_0_#0000000a] dark:shadow-[0_0_0_1px_#ffffff14]";

/** Inset toolbar at the top or bottom of a card. Its 12px radius is the card's 16px, 4px in. */
export const panel = {
  base: "mx-1 flex items-center self-stretch rounded-xl border border-kumo-hairline bg-kumo-elevated",
  top: "mt-1",
  bottom: "mb-1",
};

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
// `size-full` matters: an SVG with no size of its own would otherwise render at 300x150 and overflow the button.
const swap = "absolute inset-0 size-full transition-[opacity,scale,filter] duration-200 ease-out";
export const copySwap = {
  copy: `${swap} scale-100 opacity-100 blur-[0px] group-data-copied:scale-50 group-data-copied:opacity-0 group-data-copied:blur-[2px]`,
  check: `${swap} scale-50 opacity-0 blur-[2px] group-data-copied:scale-100 group-data-copied:opacity-100 group-data-copied:blur-[0px]`,
};

export const codeCard = {
  header: "justify-between gap-2 py-1.5 pr-1.5 pl-3",
  title: "truncate font-mono text-sm font-normal text-kumo-subtle",
  /** Focusable so long lines can be scrolled with the keyboard; the ring sits inside because the card clips. */
  pre: "overflow-x-auto overscroll-x-contain p-3 font-mono text-[13px] leading-[1.625] text-kumo-strong focus-visible:-outline-offset-2",
};

/**
 * `y` is each label's baseline, set so its ink (not its em box) is centered on the 16px square:
 * `<>` sits low on the baseline and needs lifting more than letters do. Measured in bold system-ui.
 */
export const fileBadges = {
  css: { fill: "#2563eb", text: "#", y: 11.2 },
  html: { fill: "#e34f26", text: "<>", y: 10 },
  jsx: { fill: "#087ea4", text: "JS", y: 10.5 },
  ts: { fill: "#3178c6", text: "TS", y: 10.5 },
};
