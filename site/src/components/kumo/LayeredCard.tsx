import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { card, panel } from "../../lib/styles";

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
 * The concentric site's card: one flat surface, with an optional toolbar inset 4px
 * from its top and bottom edges. The toolbars bring no padding of their own, so
 * each caller sets it.
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
    <div className={cx(card, className)} {...rest}>
      {header ? <div className={cx(panel.base, panel.top, headerClassName)}>{header}</div> : null}
      <div className={cx("w-full", bodyClassName)}>{children}</div>
      {footer ? <div className={cx(panel.base, panel.bottom, footerClassName)}>{footer}</div> : null}
    </div>
  );
}
