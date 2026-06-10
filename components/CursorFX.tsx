"use client";

import { useEffect, useState } from "react";
import TargetCursor from "./TargetCursor";

// Render the custom cursor only for fine pointers (mouse/trackpad);
// touch devices keep native behavior.
export default function CursorFX() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  if (!fine) return null;
  return <TargetCursor spinDuration={3.5} hoverDuration={0.2} />;
}
