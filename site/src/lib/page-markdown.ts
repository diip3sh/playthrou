/**
 * Turns the rendered docs page into Markdown, so "Copy page" always matches
 * what is on screen. It knows only the handful of blocks this site uses.
 *
 * Markup can steer it with `data-md`: "skip" drops an element, and any other
 * value is emitted verbatim in its place. Code blocks read `data-lang` and
 * `data-title` from their `<pre>`, and reference tables mark their term cells
 * with `data-md-label` and `data-md-code`.
 */

const FENCE_LANG: Record<string, string> = { sh: "bash", text: "" };

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

function inline(node: Node): string {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
      continue;
    }
    if (!(child instanceof HTMLElement) || child.dataset.md === "skip") continue;
    switch (child.tagName) {
      case "CODE":
        out += `\`${child.textContent ?? ""}\``;
        break;
      case "A":
        out += `[${squash(inline(child))}](${(child as HTMLAnchorElement).href})`;
        break;
      case "STRONG":
      case "B":
        out += `**${squash(inline(child))}**`;
        break;
      case "EM":
      case "I":
        out += `_${squash(inline(child))}_`;
        break;
      case "BR":
        out += "\n";
        break;
      default:
        out += inline(child);
    }
  }
  return out;
}

const cell = (s: string) => s.replace(/\|/g, "\\|");

function tableCell(td: Element): string {
  const codes = [...td.querySelectorAll("[data-md-code]")].map((c) => `\`${c.textContent ?? ""}\``);
  if (!codes.length) return cell(squash(inline(td)));
  const label = td.querySelector("[data-md-label]")?.textContent;
  return cell(label ? `${label}: ${codes.join(", ")}` : codes.join(", "));
}

function table(el: HTMLTableElement): string {
  const head = [...el.querySelectorAll("thead th")].map((th) => cell(squash(th.textContent ?? "")));
  const rows = [...el.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map(tableCell));
  return [head, head.map(() => "---"), ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
}

function block(el: Element, out: string[]) {
  if (!(el instanceof HTMLElement)) return;
  const md = el.dataset.md;
  if (md === "skip") return;
  if (md) {
    out.push(md);
    return;
  }
  switch (el.tagName) {
    case "H1":
    case "H2":
    case "H3": {
      out.push(`${"#".repeat(Number(el.tagName[1]))} ${squash(el.textContent ?? "")}`);
      return;
    }
    case "P":
      out.push(squash(inline(el)));
      return;
    case "UL":
    case "OL": {
      const ordered = el.tagName === "OL";
      const items = [...el.children].map((li, i) => `${ordered ? `${i + 1}.` : "-"} ${squash(inline(li))}`);
      out.push(items.join("\n"));
      return;
    }
    case "PRE": {
      const lang = el.dataset.lang ?? "";
      const title = el.dataset.title;
      const fence = `\`\`\`${FENCE_LANG[lang] ?? lang}\n${(el.textContent ?? "").replace(/\n$/, "")}\n\`\`\``;
      out.push(title ? `${title}:\n\n${fence}` : fence);
      return;
    }
    case "TABLE":
      out.push(table(el as HTMLTableElement));
      return;
  }
  for (const child of el.children) block(child, out);
}

export function pageMarkdown(root: Element, url: string): string {
  const out: string[] = [];
  block(root, out);
  return `${out.filter(Boolean).join("\n\n")}\n\nSource: ${url}\n`;
}
