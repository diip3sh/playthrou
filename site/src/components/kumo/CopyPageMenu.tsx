import { Button } from "@cloudflare/kumo/components/button";
import { ButtonGroup } from "@cloudflare/kumo/components/button-group";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { CaretDownIcon, CheckIcon, CopyIcon, SparkleIcon, TrayArrowDownIcon } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { writeClipboard } from "../../lib/clipboard";
import { pageMarkdown } from "../../lib/page-markdown";

interface Props {
  /** Canonical URL of this page: the Markdown cites it and the assistant is pointed at it. */
  pageUrl: string;
}

const RESET_MS = 1600;

function Action({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-kumo-base text-kumo-subtle ring ring-kumo-line [&>svg]:size-[18px]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-base font-medium text-kumo-strong">{title}</span>
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

  return (
    <ButtonGroup aria-label="Page actions">
      <Button variant="secondary" className="rounded-full" onClick={copyPage}>
        {copied ? <CheckIcon weight="bold" className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? "Copied" : "Copy page"}
        <span className="sr-only" aria-live="polite">
          {copied ? "Page copied as Markdown" : ""}
        </span>
      </Button>
      {/* Base UI adds focus guards beside the open trigger; the wrapper keeps them out of ButtonGroup's
          first/last-child corner rules, which would otherwise square off the trigger while the menu is open. */}
      <span className="inline-flex">
        <DropdownMenu>
          <DropdownMenu.Trigger
            render={
              <Button
                variant="secondary"
                shape="square"
                className="rounded-full [&_svg]:transition-transform [&_svg]:duration-200 data-popup-open:[&_svg]:rotate-180"
                aria-label="More page actions"
              >
                <CaretDownIcon className="size-3.5" />
              </Button>
            }
          />
          <DropdownMenu.Content align="end" className="w-80 max-w-[calc(100vw-2rem)] rounded-xl p-1.5">
            <DropdownMenu.Item className="px-2 py-2" onClick={copyPage}>
              <Action icon={<CopyIcon />} title="Copy page" description="Copy page as Markdown for LLMs" />
            </DropdownMenu.Item>
            <DropdownMenu.LinkItem className="px-2 py-2" href={ask} target="_blank" rel="noopener noreferrer">
              <Action icon={<SparkleIcon />} title="Ask Assistant" description="Ask ChatGPT questions about this page" />
            </DropdownMenu.LinkItem>
            <DropdownMenu.Item className="px-2 py-2" onClick={downloadPdf}>
              <Action icon={<TrayArrowDownIcon />} title="Download PDF" description="Download this page as a PDF" />
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </span>
    </ButtonGroup>
  );
}
