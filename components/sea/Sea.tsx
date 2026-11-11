"use client";

import { useEffect, useRef } from "react";
import { SEA_FRAG } from "./shader";
import { seaHorizon } from "@/lib/horizon";

// The closing scene's sea: a WebGL canvas across the whole section, clear above the horizon so the page and the
// big name show through, drawn at one art pixel per four screen pixels and scaled up hard. It only runs while it
// is on screen and steps at twelve frames a second like the rest of the pixel world. A few seconds after it comes
// into view the kraken takes the boat, and again every minute or two; five quick clicks on the sea or the boat
// call it at once. With
// reduced motion it is a single still frame; without WebGL the section keeps its plain background.

const FPS = 12;
const ATTACK = 14; // seconds the kraken takes
const OUT = 46; // how far out the boat sits, in metres; the camera is 96 metres back from the origin, 11 up
const CAM = { y: -96, z: 11, f: 1.778 };

export default function Sea() {
  const ref = useRef<HTMLCanvasElement>(null);
  const boatBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const canvas = ref.current, btn = boatBtn.current, section = canvas?.parentElement;
    if (!canvas || !btn || !section) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }");
    const fs = sh(gl.FRAGMENT_SHADER, SEA_FRAG);
    if (!vs || !fs) return;
    const pr = gl.createProgram()!;
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(pr, n);
    const uR = u("R"), uT = u("T"), uK = u("KR"), uP = u("PITCH"), uBX = u("BX"), uBY = u("BY"), uN = u("NIGHT");
    gl.clearColor(0, 0, 0, 0);
    canvas.dataset.ready = "1";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = new URLSearchParams(location.search);
    // every visit starts somewhere else in the water's life; ?sea=<seconds>&kraken=<0..1> pins one still frame for checking
    const start = q.has("sea") ? Number(q.get("sea")) : Math.random() * 5000;
    const pinned = q.has("sea");

    let waterline = 0, taps = 0, lastTap = 0;
    const size = () => {
      const px = canvas.clientWidth < 700 ? 2.5 : 4; // screen pixels per art pixel; finer on narrow screens, so everything still fits
      const w = Math.max(40, Math.round(canvas.clientWidth / px)), h = Math.max(40, Math.round(canvas.clientHeight / px));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uR, w, h);
      // tilt the camera so the horizon lands where the layout wants it
      const horizon = seaHorizon(section), pitch = (horizon / section.offsetHeight - 0.5) / CAM.f;
      section.style.setProperty("--horizon", `${horizon}px`);
      waterline = horizon;
      gl.uniform1f(uP, pitch);
      // the boat: right of centre on a wide screen, left of centre on a narrow one to leave room for what comes up beside it
      const half = ((OUT - CAM.y) * (w / h)) / 2 / CAM.f, bx = w / h < 1 ? -half * 0.45 : Math.min(34, half * 0.34);
      gl.uniform1f(uBX, bx);
      gl.uniform1f(uBY, OUT);
      // and an unseen button over it. Same projection as the shader: forward is (0, 1, pitch), up is (0, -pitch, 1).
      const n = Math.hypot(1, pitch), by = OUT - CAM.y, bz = -CAM.z, dz = (by + bz * pitch) / n, up = (-by * pitch + bz) / n;
      const ax = (bx / dz) * CAM.f * h + w / 2, ay = h / 2 - (up / dz) * CAM.f * h;
      btn.style.left = `${ax * px - 36}px`;
      btn.style.top = `${ay * px - 76}px`;
    };

    let clock = 0, attackAt = -1, nextAttack = 5 + Math.random() * 4, last = -1, raf = 0, visible = false;
    const draw = (t: number, kr: number) => {
      gl.uniform1f(uT, t);
      gl.uniform1f(uK, kr);
      gl.uniform1f(uN, document.documentElement.dataset.theme === "dark" ? 1 : 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const still = () => draw(start + clock, q.has("kraken") ? Number(q.get("kraken")) : attackAt < 0 ? -1 : (clock - attackAt) / ATTACK);
    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      const f = Math.floor((ms / 1000) * FPS);
      if (f === last) return;
      clock += last < 0 ? 0 : Math.min(0.25, (f - last) / FPS); // the sea's own clock only runs while it is being watched
      last = f;
      if (attackAt >= 0 && clock - attackAt > ATTACK) attackAt = -1;
      if (attackAt < 0 && clock > nextAttack) {
        attackAt = clock;
        nextAttack = clock + ATTACK + 50 + Math.random() * 60;
      }
      still();
    };
    const run = () => {
      cancelAnimationFrame(raf);
      last = -1;
      if (visible && !reduced && !pinned && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (attackAt < 0 && !reduced && !pinned) attackAt = clock;
    };
    // five clicks on the water or the boat, each within a couple of seconds of the last, bring it up
    const tap = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest("a")) return;
      if (t !== btn && e.clientY - section.getBoundingClientRect().top < waterline) return;
      const now = performance.now();
      taps = now - lastTap > 2500 ? 1 : taps + 1;
      lastTap = now;
      if (taps >= 5) {
        taps = 0;
        wake();
      }
    };

    size();
    still();
    const ro = new ResizeObserver(() => {
      size();
      still();
    });
    ro.observe(section);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(canvas);
    const onTheme = () => still();
    window.addEventListener("themechange", onTheme);
    document.addEventListener("visibilitychange", run);
    section.addEventListener("click", tap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("themechange", onTheme);
      document.removeEventListener("visibilitychange", run);
      section.removeEventListener("click", tap);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="sea" aria-hidden="true" />
      <button ref={boatBtn} className="sea__boat" aria-label="The boat. Click it five times." tabIndex={-1} />
    </>
  );
}
