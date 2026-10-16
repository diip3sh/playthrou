import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import type { ReactNode } from "react";

interface Props {
  /** Astro passes named slots as props: `<div slot="header">` lands here. */
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  role?: string;
  "aria-labelledby"?: string;
  id?: string;
}

/**
 * Kumo's layered card: an elevated frame with an optional strip above and below
 * a raised body. LayerCard only switches to its layered look when Primary and
 * Secondary are its direct React children, so the layers are composed here
 * rather than in Astro, where slot content arrives as static HTML.
 *
 * Secondary tucks under Primary with `-my-2`. The footer strip has nothing below
 * it to tuck under, so it resets that margin or its bottom edge gets clipped.
 */
export default function LayeredCard({
  header,
  footer,
  children,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  ...rest
}: Props) {
  return (
    <LayerCard className={className} {...rest}>
      {header ? <LayerCard.Secondary className={headerClassName}>{header}</LayerCard.Secondary> : null}
      <LayerCard.Primary className={bodyClassName}>{children}</LayerCard.Primary>
      {footer ? (
        <LayerCard.Secondary className={footerClassName ? `my-0 ${footerClassName}` : "my-0"}>{footer}</LayerCard.Secondary>
      ) : null}
    </LayerCard>
  );
}
