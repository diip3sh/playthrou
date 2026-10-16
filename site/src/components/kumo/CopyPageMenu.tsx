import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { writeClipboard } from "../../lib/clipboard";
import { pageMarkdown } from "../../lib/page-markdown";
import { ArrowUpRightIcon, CaretDownIcon, CheckIcon, CopyIcon, DownloadIcon, SparkleIcon } from "../icons";

interface Props {
  /** Canonical URL of this page: the Markdown cites it and the assistant is pointed at it. */
  pageUrl: string;
}

const RESET_MS = 1600;

function Action({ icon, title, description }: { icon: ReactNode; title: ReactNode; description: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-kumo-base text-kumo-subtle ring ring-kumo-line [&>svg]:size-4">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1 text-base font-medium text-kumo-strong">{title}</span>
        <span className="text-sm text-kumo-subtle">{description}</span>
      </span>
    </span>
  );
}

export default function CopyPageMenu({ pageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyPage = async () => {
    const main = document.getElementById("main");
    if (!main || !(await writeClipboard(pageMarkdown(main, pageUrl)))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), RESET_MS);
  };

  // Let the menu finish closing so it isn't captured in the print preview.
  const downloadPdf = () => window.setTimeout(() => window.print(), 150);

  const ask = `https://chatgpt.com/?hints=search&q=${encodeURIComponent(
    `Read ${pageUrl} so I can ask questions about it.`,
  )}`;

  // Hover opens the menu for pointers; a click or Enter, Space or ArrowDown opens it for touch and keyboard.
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        openOnHover
        delay={80}
        closeDelay={200}
        render={
          <Button variant="secondary" className="rounded-full pr-2.5">
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
            {copied ? "Copied" : "Copy page"}
            <CaretDownIcon className="size-4 text-kumo-subtle transition-transform duration-200 ease-out in-data-popup-open:rotate-180" />
            <span className="sr-only" aria-live="polite">
              {copied ? "Page copied as Markdown" : ""}
            </span>
          </Button>
        }
      />
      <DropdownMenu.Content align="end" className="w-80 max-w-[calc(100vw-2rem)] rounded-xl p-1.5">
        <DropdownMenu.Item className="px-2 py-2" onClick={copyPage}>
          <Action icon={<CopyIcon />} title="Copy page" description="Copy page as Markdown for LLMs" />
        </DropdownMenu.Item>
        <DropdownMenu.LinkItem className="px-2 py-2" href={ask} target="_blank" rel="noopener noreferrer">
          <Action
            icon={<SparkleIcon />}
            title={
              <>
                Ask Assistant
                <ArrowUpRightIcon className="size-3.5 text-kumo-subtle" />
                <span className="sr-only">(opens in a new tab)</span>
              </>
            }
            description="Ask ChatGPT questions about this page"
          />
        </DropdownMenu.LinkItem>
        <DropdownMenu.Item className="px-2 py-2" onClick={downloadPdf}>
          <Action icon={<DownloadIcon />} title="Download PDF" description="Download this page as a PDF" />
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
