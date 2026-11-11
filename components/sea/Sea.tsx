"use client";

import { useEffect, useRef } from "react";
import { SEA_FRAG } from "./shader";

// The closing scene's sea: a small WebGL canvas behind the contact text, drawn at one art pixel per four
// screen pixels and scaled up hard. It only runs while it is on screen, steps at twelve frames a second like
// the rest of the pixel world, and every so often the kraken comes for the boat. With reduced motion it is a
// single still frame; without WebGL the section keeps its plain background.

const PX = 4; // screen pixels per art pixel; finer on narrow screens, so the boat and the kraken still fit
const FPS = 12;
const ATTACK = 14; // seconds the kraken takes

export default function Sea() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
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
    const uR = u("R"), uT = u("T"), uK = u("KR"), uP = u("PITCH"), uB = u("BX"), uN = u("NIGHT");
    canvas.dataset.ready = "1";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = new URLSearchParams(location.search);
    // every visit starts somewhere else in the water's life; ?sea=<seconds>&kraken=<0..1> pins a frame for checking
    const start = q.has("sea") ? Number(q.get("sea")) : Math.random() * 5000;
    const pinned = q.has("sea");

    const size = () => {
      const px = canvas.clientWidth < 700 ? 2.5 : PX;
      const w = Math.max(40, Math.round(canvas.clientWidth / px)), h = Math.max(40, Math.round(canvas.clientHeight / px));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uR, w, h);
      gl.uniform1f(uP, 0.03); // the horizon a little below the middle, under the contact text
      // keep the boat in view on narrow screens: it sits 88 metres out, so this is how wide the view is there
      const half = (88 * (w / h)) / 2 / 1.778;
      // on a wide screen it sits right of centre; on a narrow one left of centre, to leave room for what comes up beside it
      gl.uniform1f(uB, w / h < 1 ? -half * 0.45 : Math.min(30, half * 0.42));
    };

    let clock = 0, attackAt = -1, nextAttack = 16 + Math.random() * 22, last = -1, raf = 0, visible = false;
    const draw = (t: number, kr: number) => {
      gl.uniform1f(uT, t);
      gl.uniform1f(uK, kr);
      gl.uniform1f(uN, document.documentElement.dataset.theme === "dark" ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const still = () => draw(start, q.has("kraken") ? Number(q.get("kraken")) : -1);
    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      const f = Math.floor((ms / 1000) * FPS);
      if (f === last) return;
      // the sea's own clock only runs while it is being watched
      clock += last < 0 ? 0 : Math.min(0.25, (f - last) / FPS);
      last = f;
      if (attackAt >= 0 && clock - attackAt > ATTACK) attackAt = -1;
      if (attackAt < 0 && clock > nextAttack) {
        attackAt = clock;
        nextAttack = clock + ATTACK + 45 + Math.random() * 60;
      }
      draw(start + clock, attackAt < 0 ? -1 : (clock - attackAt) / ATTACK);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      last = -1;
      if (visible && !reduced && !pinned && !document.hidden) raf = requestAnimationFrame(tick);
    };

    size();
    still();
    const ro = new ResizeObserver(() => {
      size();
      still();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(canvas);
    const onTheme = () => {
      if (!visible || reduced || pinned) still();
    };
    window.addEventListener("themechange", onTheme);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("themechange", onTheme);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);

  return <canvas ref={ref} className="sea" aria-hidden="true" />;
}
