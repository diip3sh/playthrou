/**
 * Writes the machine-readable layer at build time: `/index.md`, the page as
 * Markdown, and `/llms.txt`, the index agents look for. The Markdown comes from
 * the same `pageMarkdown` that powers "Copy page", run on the built HTML, so
 * the two never drift apart.
 */
import { readFile, writeFile } from "node:fs/promises";
import type { AstroIntegration } from "astro";
import { parseHTML } from "linkedom";
import { pageMarkdown } from "../lib/page-markdown";
import { SKILL_MD } from "../lib/links";

export default function markdownLayer(): AstroIntegration {
  let site = "";
  return {
    name: "markdown-layer",
    hooks: {
      "astro:config:done": ({ config }) => {
        site = config.site ?? "";
      },
      "astro:build:done": async ({ dir }) => {
        const html = await readFile(new URL("index.html", dir), "utf8");
        const { window, document } = parseHTML(html);
        const main = document.getElementById("main");
        if (!main) throw new Error("markdown-layer: no #main in index.html");

        // A browser resolves link hrefs against the page; do the same so the Markdown carries absolute URLs.
        for (const a of document.querySelectorAll("a[href]")) a.setAttribute("href", new URL(a.getAttribute("href")!, site).href);

        // pageMarkdown leans on the DOM globals a browser provides.
        const g = globalThis as Record<string, unknown>;
        const saved = { Node: g.Node, HTMLElement: g.HTMLElement };
        Object.assign(g, { Node: window.Node, HTMLElement: window.HTMLElement });
        const body = pageMarkdown(main, new URL("/", site).href);
        Object.assign(g, saved);

        const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
        await writeFile(new URL("index.md", dir), body);
        await writeFile(
          new URL("llms.txt", dir),
          `# playthru\n\n> ${description}\n\n## Docs\n\n- [playthru docs](${new URL("/index.md", site).href}): the full page as Markdown\n- [Agent skill](${SKILL_MD}): how to write a playthru demo, for coding agents\n`,
        );
      },
    },
  };
}
