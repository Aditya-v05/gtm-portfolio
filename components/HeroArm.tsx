"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Blueprint robot arm working the hero: every ~11s it reaches to the intake
// queue, picks a lead plate, swings it across, and drops it in the outbound
// bin. Drawn in the site's ink (currentColor), ghosted like the old dial.
// FK chain: shoulder > elbow > wrist groups, each rotating around its drawn
// joint (svgOrigin in the original drawing space survives parent rotation).
// prefers-reduced-motion: the arm holds its neutral pose, fully drawn.

const S = "330 372"; // shoulder joint (svg coords)
const E = "266 262"; // elbow joint
const W = "398 226"; // wrist joint

export default function HeroArm() {
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const q = (sel: string) => svg.querySelector(sel) as SVGGElement;
    const shoulder = q("#arm-shoulder");
    const elbow = q("#arm-elbow");
    const wrist = q("#arm-wrist");
    const fingerL = q("#arm-finger-l");
    const fingerR = q("#arm-finger-r");
    const carried = q("#arm-carried");
    const queueTop = q("#arm-queue-top");
    const binPlate = q("#arm-bin-plate");

    gsap.set(carried, { autoAlpha: 0 });
    gsap.set(binPlate, { autoAlpha: 0 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2, defaults: { ease: "power2.inOut" } });

    // idle breath
    tl.to(shoulder, { rotation: 2, svgOrigin: S, duration: 1.4, yoyo: true, repeat: 1 });
    // reach down-right to the queue
    tl.to(shoulder, { rotation: 34, svgOrigin: S, duration: 1.3 }, "reach");
    tl.to(elbow, { rotation: -50, svgOrigin: E, duration: 1.3 }, "reach");
    tl.to(wrist, { rotation: 18, svgOrigin: W, duration: 1.3 }, "reach");
    // grip: fingers close, plate leaves the queue and joins the wrist
    tl.to([fingerL, fingerR], { x: (i) => (i === 0 ? 3.5 : -3.5), duration: 0.28 }, "grip");
    tl.set(queueTop, { autoAlpha: 0 }, "grip+=0.28");
    tl.set(carried, { autoAlpha: 1 }, "grip+=0.28");
    // carry: lift and swing left over the bin
    tl.to(shoulder, { rotation: -38, svgOrigin: S, duration: 1.7 }, "carry");
    tl.to(elbow, { rotation: -14, svgOrigin: E, duration: 1.7 }, "carry");
    tl.to(wrist, { rotation: -30, svgOrigin: W, duration: 1.7 }, "carry");
    // release into the bin
    tl.to([fingerL, fingerR], { x: 0, duration: 0.26 }, "drop");
    tl.set(carried, { autoAlpha: 0 }, "drop+=0.2");
    tl.fromTo(binPlate, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.in" }, "drop+=0.22");
    tl.to(binPlate, { autoAlpha: 0, duration: 0.4 }, "drop+=1.1");
    // home
    tl.to(shoulder, { rotation: 0, svgOrigin: S, duration: 1.3 }, "home");
    tl.to(elbow, { rotation: 0, svgOrigin: E, duration: 1.3 }, "home");
    tl.to(wrist, { rotation: 0, svgOrigin: W, duration: 1.3 }, "home");
    // queue replenishes while the arm returns
    tl.fromTo(queueTop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, "home+=0.6");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <svg ref={root} className="hero__arm" viewBox="0 0 600 600" aria-hidden="true">
      {/* ground line + registration ticks */}
      <line x1="70" y1="470" x2="560" y2="470" stroke="currentColor" strokeWidth="1" opacity=".55" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={86 + i * 42} y1="470" x2={80 + i * 42} y2="478" stroke="currentColor" strokeWidth="1" opacity=".3" />
      ))}

      {/* outbound bin (left) */}
      <path d="M118 430 h84 v40 h-84 z" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".7" />
      <path d="M118 430 l-10 -14 M202 430 l10 -14" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <g id="arm-bin-plate">
        <rect x="134" y="444" width="52" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="142" y1="451" x2="170" y2="451" stroke="currentColor" strokeWidth="2" opacity=".5" />
      </g>

      {/* intake queue (right) */}
      <g id="arm-queue-top">
        <rect x="458" y="440" width="52" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="466" y1="447" x2="494" y2="447" stroke="currentColor" strokeWidth="2" opacity=".5" />
      </g>
      <rect x="470" y="458" width="52" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
      <rect x="530" y="452" width="26" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1" opacity=".35" />

      {/* pedestal */}
      <path d="M292 470 l10 -68 h56 l10 68 z" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".85" />
      <circle cx="316" cy="452" r="3" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <circle cx="344" cy="452" r="3" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <line x1="300" y1="428" x2="360" y2="428" stroke="currentColor" strokeWidth="1" opacity=".4" />

      {/* FK chain */}
      <g id="arm-shoulder">
        {/* upper arm: shoulder (330,372) -> elbow (266,262) */}
        <path d="M318 364 L252 256 L280 268 L342 366 z" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".9" />
        <circle cx="330" cy="372" r="14" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="330" cy="372" r="4" fill="currentColor" opacity=".8" />

        <g id="arm-elbow">
          {/* forearm: elbow (266,262) -> wrist (398,226) */}
          <path d="M270 250 L402 216 L400 238 L272 274 z" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".9" />
          <circle cx="266" cy="262" r="11" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="266" cy="262" r="3.5" fill="currentColor" opacity=".8" />

          <g id="arm-wrist">
            <circle cx="398" cy="226" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="398" cy="226" r="2.5" fill="currentColor" opacity=".8" />
            {/* gripper bracket hanging from the wrist */}
            <path d="M398 234 v16 M384 250 h28" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <g id="arm-finger-l">
              <path d="M386 250 v20 l6 6" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </g>
            <g id="arm-finger-r">
              <path d="M410 250 v20 l-6 6" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </g>
            {/* the carried lead plate (hidden until gripped) */}
            <g id="arm-carried">
              <rect x="372" y="272" width="52" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <line x1="380" y1="279" x2="408" y2="279" stroke="currentColor" strokeWidth="2" opacity=".5" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
