"use client";

import { useEffect, useState } from "react";
import ScrollVelocity from "./ScrollVelocity";

function Row() {
  return (
    <span>
      Brex<span className="sep">✺</span>Rho<span className="sep">✺</span>
      Peec&nbsp;AI<span className="sep">✺</span>Warp
      <span className="sep">✺</span>Hyperbound<span className="sep">✺</span>
      Qashio<span className="sep">✺</span>
    </span>
  );
}

export default function ClientMarquee() {
  // default to the CSS marquee — it animates on the compositor thread, so it
  // stays smooth on phones where the JS-driven version drops frames. Mouse
  // machines upgrade to the scroll-velocity version after mount.
  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  if (fine) {
    return (
      <ScrollVelocity
        texts={[<Row key="clients" />]}
        velocity={45}
        numCopies={8}
      />
    );
  }

  return (
    <div className="parallax">
      <div className="scroller cssm">
        <span className="cssm__half">
          <Row />
          <Row />
        </span>
        <span className="cssm__half" aria-hidden="true">
          <Row />
          <Row />
        </span>
      </div>
    </div>
  );
}
