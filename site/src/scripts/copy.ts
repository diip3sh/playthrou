/**
 * One delegated handler for every copy button, including the ones React
 * islands render after hydration. A button copies `data-copy`, or the page URL
 * when it has `data-copy-url`. An empty `data-copy-url` copies the URL without
 * its hash; a value such as `?r=48#lab` replaces the query and the hash.
 */
const RESET_MS = 1600;
const timers = new WeakMap<HTMLElement, number>();

function pageUrl(ref: string): string {
  const url = new URL(location.href);
  url.hash = "";
  if (ref) {
    const [search = "", hash = ""] = ref.split("#");
    url.search = search;
    url.hash = hash;
  }
  return url.href;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

document.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLElement>("[data-copy], [data-copy-url]");
  if (!button) return;
  const text = button.hasAttribute("data-copy-url")
    ? pageUrl(button.dataset.copyUrl ?? "")
    : (button.dataset.copy ?? "");
  if (!(await writeClipboard(text))) return;

  const status = button.querySelector("[data-copy-status]");
  button.dataset.copied = "";
  if (status) status.textContent = button.dataset.copiedLabel ?? "Copied";
  window.clearTimeout(timers.get(button));
  timers.set(
    button,
    window.setTimeout(() => {
      delete button.dataset.copied;
      if (status) status.textContent = "";
    }, RESET_MS),
  );
});
