import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { useState } from "react";

interface Props {
  /** The element that owns the demo. It gets `data-camera="off"` and a `camera-change` event. */
  target: string;
}

/**
 * Kumo's checkbox is a React island, so it reports to the plain demo script
 * through the DOM: a data attribute for styling and an event for rebuilding.
 */
export default function CameraCheckbox({ target }: Props) {
  const [on, setOn] = useState(true);
  return (
    <Checkbox
      label="Camera"
      checked={on}
      onCheckedChange={(checked) => {
        setOn(checked);
        const el = document.getElementById(target);
        if (!el) return;
        if (checked) delete el.dataset.camera;
        else el.dataset.camera = "off";
        el.dispatchEvent(new CustomEvent("camera-change"));
      }}
    />
  );
}
