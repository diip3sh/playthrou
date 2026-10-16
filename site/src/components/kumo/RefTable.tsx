import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Table } from "@cloudflare/kumo/components/table";

export interface RefRow {
  /** Plain-text label, such as "Glide". When present, the code lines under it are muted. */
  label?: string;
  /** Monospace lines: signatures, values or options. */
  code: string[];
  desc: string;
}

interface Props {
  columns: [string, string];
  rows: RefRow[];
  "aria-label"?: string;
}

/** Two-column reference table: mono term on the left, explanation on the right. */
export default function RefTable({ columns, rows, "aria-label": ariaLabel }: Props) {
  return (
    <LayerCard className="my-8 w-full overflow-x-auto">
      <Table aria-label={ariaLabel} className="text-sm [&_td]:align-top [&_th]:text-sm">
        <Table.Header variant="compact">
          <Table.Row>
            <Table.Head className="w-[42%] sm:w-60">{columns[0]}</Table.Head>
            <Table.Head>{columns[1]}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={`${row.label ?? ""}${row.code.join()}`}>
              <Table.Cell>
                <span className="flex flex-col gap-0.5 font-mono text-[13px] leading-[22px] text-kumo-strong">
                  {row.label ? <span className="font-sans text-sm font-medium">{row.label}</span> : null}
                  {row.code.map((line) => (
                    <span key={line} className={row.label ? "text-kumo-subtle" : undefined}>
                      {line}
                    </span>
                  ))}
                </span>
              </Table.Cell>
              <Table.Cell className="leading-[22px] text-pretty text-kumo-subtle">{row.desc}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </LayerCard>
  );
}
