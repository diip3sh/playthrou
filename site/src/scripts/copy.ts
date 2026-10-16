/**
 * One delegated handler for every `data-copy` button, including the ones React
 * islands render after hydration.
 */
import { writeClipboard } from "../lib/clipboard";

const RESET_MS = 1600;
const timers = new WeakMap<HTMLElement, number>();

document.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLElement>("[data-copy]");
  if (!button || !(await writeClipboard(button.dataset.copy ?? ""))) return;

  const status = button.querySelector("[data-copy-status]");
  button.dataset.copied = "";
  if (status) status.textContent = "Copied";
  window.clearTimeout(timers.get(button));
  timers.set(
    button,
    window.setTimeout(() => {
      delete button.dataset.copied;
      if (status) status.textContent = "";
    }, RESET_MS),
  );
});
