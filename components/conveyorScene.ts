// The hero machine, v4: a working plant. A forklift shuttles boxes in from
// off-frame and sets them on belt A; scanner 1 washes them in teal; the mid
// arm loads each box onto the LIFT TOWER, whose chain-driven carriage hauls
// it up to the elevated belt B; scanner 2 checks it again; the end arm packs
// it into the crate, where a mechanical counter ticks up. Gears mesh, the
// drive motor spins, stack lights pulse with activity, and a ghost of a
// second line runs in the background.
//
// Vector style throughout: bg-colored fills occlude ink edge lines (hidden-
// line technical drawing), orthographic camera with adaptive fit, and the
// NEVER touch gsap.globalTimeline here (it once froze the whole site).

import * as THREE from "three";
import { gsap } from "gsap";

// ---- layout (x runs along the line) ----
const TOP_A = 1.0; // belt A surface
const TOP_B = 2.7; // belt B surface (elevated)
const A_X0 = -6.9, A_X1 = -2.3;
const B_X0 = 1.6, B_X1 = 5.7;
const SCAN_A = -5.2, SCAN_B = 3.4;
const PICK_A = -2.75, PICK_B = 5.25;
const MID_BASE = new THREE.Vector3(-1.55, 0, 1.72); // front of the line: reaching from behind speared the lift mast
const MID_RISER = 0.55;
const END_BASE = new THREE.Vector3(6.6, 0, 1.72); // front of the line: loads through the cargo body's open side
const END_RISER = 1.6;
const TRUCK_X = 9.1; // parked at the loading dock
const BED_TOP = 1.15; // cargo floor height
const GX = 9.1 - 0.5; // gantry centreline (straddles the truck bay)
const PALLET_Z = 1.02; // pallet station: offset from the near gantry leg (z 1.9)
const TRUCK_DROP_Z = 0.15; // where the hoist sets the pallet into the cargo
const HOIST_Y = 6.48; // trolley height on the girder
const HOIST_REST_Z = -0.85; // parks clear of both the pallet and the cargo
const PALLET_PER_TRUCK = 1;
const BOXES_PER_PALLET = 3;
const LIFT_X = 0.35;
const LIFT_TOP_Y = 2.62; // carriage platform top at its highest
const LIFT_LOW_Y = 0.62; // carriage platform top at rest
const L1 = 2.05, L2 = 1.85;
const SHOULDER_Y = 1.18; // above each arm's riser top
const GRIP_DROP = 0.66;
const BELT_SPEED = 1.15;
const ITEM_H = 0.56;

// world bounds the camera must always contain
// span for the drawn ground line / survey ticks only; the camera envelope
// is measured from the built geometry at mount
const FIT = { minX: -9.1, maxX: 12.6, minY: -0.15, maxY: 4.9 };

type Palette = { ink: string; accent: string; bg: string; teal: string };

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    ink: cs.getPropertyValue("--ink").trim() || "#14283C",
    accent: cs.getPropertyValue("--accent").trim() || "#2464A4",
    bg: cs.getPropertyValue("--bg").trim() || "#EDF2F8",
    teal: dark ? "#3fe0cf" : "#1fb5a3",
  };
}

export function mountConveyorScene(host: HTMLElement): () => void {
  const section = host.closest(".hero") as HTMLElement | null;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const CAM_BASE = new THREE.Vector3(0.1, 6.15, 15);
  const LOOK_AT = new THREE.Vector3(1.75, 2.25, 0);
  camera.position.copy(CAM_BASE);
  camera.lookAt(LOOK_AT);

  let vertShift = 0; // how far to raise the view so the machine sits low
  const camUp = new THREE.Vector3();
  const lookNow = new THREE.Vector3();
  const par = { tx: 0, ty: 0, x: 0, y: 0, on: matchMedia("(hover: hover) and (pointer: fine)").matches };
  const onPointer = (e: MouseEvent) => {
    par.tx = (e.clientX / innerWidth) * 2 - 1;
    par.ty = (e.clientY / innerHeight) * 2 - 1;
  };
  if (par.on) window.addEventListener("mousemove", onPointer, { passive: true });

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 800 ? 1.5 : 2));
    renderer.setSize(w, h);
    // FRUSTUM is measured from the real geometry in camera space (see mount).
    // The canvas now spans the whole hero, so it is far taller than the
    // machine: stay width-bound (the machine keeps its size) and park the
    // machine at the bottom, leaving the upper band for overhead structure.
    const halfW = Math.max(FRUSTUM.halfW, (FRUSTUM.halfH * w) / h);
    const halfH = (halfW * h) / w;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    vertShift = Math.max(0, halfH - FRUSTUM.halfH - 0.15);
  }

  // ---- materials ----
  const pal = readPalette();
  const fillMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pal.bg),
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const inkMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 1 });
  const faintMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.62 });
  const ghostMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.22 });
  const tealLine = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.teal), transparent: true, opacity: 0.95 });
  const tealCurtain = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pal.teal),
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const tapeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.16 });
  const lampIdle = 0.22;
  const lampMats: THREE.MeshBasicMaterial[] = [];
  function makeLampMat() {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.accent), transparent: true, opacity: lampIdle });
    lampMats.push(m);
    return m;
  }

  const themeObserver = new MutationObserver(() => {
    const p = readPalette();
    fillMat.color.set(p.bg);
    inkMat.color.set(p.ink);
    faintMat.color.set(p.ink);
    ghostMat.color.set(p.ink);
    tealLine.color.set(p.teal);
    tealCurtain.color.set(p.teal);
    tapeMat.color.set(p.ink);
    for (const m of lampMats) m.color.set(p.accent);
    for (const sc of scanners) (sc.curtain.material as THREE.MeshBasicMaterial).color.set(p.teal);
    counter.redraw();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function part(geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial = inkMat, withFill = true): THREE.Group {
    const g = new THREE.Group();
    if (withFill) g.add(new THREE.Mesh(geo, fillMat));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), mat));
    return g;
  }

  // rotating parts registry
  const spinners: { obj: THREE.Object3D; speed: number; active: () => boolean }[] = [];
  // objects that must never leave frame (measured at rest to derive the
  // camera envelope - hand-tuned bounds kept drifting out of date)
  const mustFit: THREE.Object3D[] = [];

  // ---- ground line + survey ticks ----
  {
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(FIT.minX + 0.1, 0, 0.9),
          new THREE.Vector3(FIT.maxX - 0.1, 0, 0.9),
        ]),
        faintMat
      )
    );
    const ticks: THREE.Vector3[] = [];
    for (let tx = Math.ceil(FIT.minX); tx < FIT.maxX; tx += 1.5) {
      ticks.push(new THREE.Vector3(tx, 0, 0.9), new THREE.Vector3(tx - 0.18, -0.14, 0.9));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), ghostMat));
  }

  // ---- background ghost line (a second production line, implied) ----
  {
    const g = new THREE.Group();
    const body = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 0.16, 1.2)), ghostMat);
    body.position.set(-2.2, 1.5, 0);
    g.add(body);
    for (const lx of [-5.8, -2.2, 1.4]) {
      const leg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.12, 1.4, 0.12)), ghostMat);
      leg.position.set(lx, 0.72, 0);
      g.add(leg);
    }
    for (const bx of [-4.5, -0.6]) {
      const bo = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.8, 0.5, 0.6)), ghostMat);
      bo.position.set(bx, 1.85, 0);
      g.add(bo);
    }
    g.position.z = -5.2;
    scene.add(g);
  }

  // ---- belts ----
  const lays: ((s: number) => void)[] = [];
  function buildBelt(x0: number, x1: number, top: number) {
    const len = x1 - x0;
    const mid = (x0 + x1) / 2;
    const body = part(new THREE.BoxGeometry(len, 0.18, 1.7));
    body.position.set(mid, top - 0.1, 0);
    scene.add(body);
    mustFit.push(body);
    for (const zs of [-0.92, 0.92]) {
      const rail = part(new THREE.BoxGeometry(len, 0.32, 0.1));
      rail.position.set(mid, top - 0.12, zs);
      scene.add(rail);
    }
    for (const xe of [x0, x1]) {
      const drum = part(new THREE.CylinderGeometry(0.2, 0.2, 1.7, 14).rotateX(Math.PI / 2), faintMat);
      drum.position.set(xe, top - 0.1, 0);
      scene.add(drum);
    }
    for (let lx = x0 + 0.8; lx < x1 - 0.4; lx += 3.2) {
      for (const zs of [-0.78, 0.78]) {
        const col = part(new THREE.BoxGeometry(0.16, top - 0.26, 0.16), faintMat);
        col.position.set(lx, (top - 0.26) / 2, zs);
        scene.add(col);
      }
      if (top > 2) {
        const brace = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(lx - 0.55, 0.15, 0.78),
          new THREE.Vector3(lx + 0.55, top - 0.5, 0.78),
        ]);
        scene.add(new THREE.Line(brace, faintMat));
      }
    }
    const N = Math.round(len / 0.55);
    const posArr = new Float32Array(N * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    scene.add(new THREE.LineSegments(geo, faintMat));
    const offsets = Array.from({ length: N }, (_, i) => (i / N) * len);
    lays.push((shift: number) => {
      for (let i = 0; i < N; i++) {
        const x = x0 + ((offsets[i] + shift) % len);
        posArr[i * 6 + 0] = x;
        posArr[i * 6 + 1] = top + 0.005;
        posArr[i * 6 + 2] = -0.85;
        posArr[i * 6 + 3] = x;
        posArr[i * 6 + 4] = top + 0.005;
        posArr[i * 6 + 5] = 0.85;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }
  buildBelt(A_X0, A_X1, TOP_A);
  buildBelt(B_X0, B_X1, TOP_B);
  // belts/scanners/lift/arms/dock are added to mustFit as they're built below

  // ---- stack lights ----
  function buildStackLight(x: number, y: number, z: number): THREE.MeshBasicMaterial {
    const g = new THREE.Group();
    const pole = part(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), faintMat);
    pole.position.set(x, y + 0.21, z);
    g.add(pole);
    const lampMat = makeLampMat();
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lampMat);
    lamp.position.set(x, y + 0.5, z);
    g.add(lamp);
    const cap = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 10)), faintMat);
    cap.position.set(x, y + 0.5, z);
    g.add(cap);
    scene.add(g);
    return lampMat;
  }
  function pulseLamp(m: THREE.MeshBasicMaterial) {
    gsap.killTweensOf(m);
    gsap.fromTo(m, { opacity: 1 }, { opacity: lampIdle, duration: 1.1, ease: "power2.out" });
  }

  // ---- scanners ----
  type Scanner = { curtain: THREE.Mesh; sweep: THREE.Group; pulse: () => void; beamY: number };
  function buildScanner(x: number, top: number): Scanner {
    const g = new THREE.Group();
    const beamY = top + 1.28;
    for (const zs of [-1.2, 1.2]) {
      const post = part(new THREE.BoxGeometry(0.22, beamY + 0.17, 0.3));
      post.position.set(x, (beamY + 0.17) / 2, zs);
      g.add(post);
      const foot = part(new THREE.BoxGeometry(0.5, 0.12, 0.55), faintMat);
      foot.position.set(x, 0.06, zs * 1.05);
      g.add(foot);
    }
    const beam = part(new THREE.BoxGeometry(0.5, 0.34, 2.9));
    beam.position.set(x, beamY, 0);
    g.add(beam);
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.32).rotateY(Math.PI / 2), tealCurtain.clone());
    curtain.position.set(x, top + 0.66, 0);
    g.add(curtain);
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.2, 1.32).rotateY(Math.PI / 2)),
      tealLine
    );
    frame.position.copy(curtain.position);
    g.add(frame);
    const sweep = new THREE.Group();
    sweep.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.02, 0.02, 2.1)), tealLine));
    sweep.position.set(x, top + 0.2, 0);
    g.add(sweep);
    scene.add(g);
    mustFit.push(g);
    const mat = curtain.material as THREE.MeshBasicMaterial;
    const lamp = buildStackLight(x, beamY + 0.17, -1.2);
    const pulse = () => {
      gsap.killTweensOf(mat);
      gsap.fromTo(mat, { opacity: 0.5 }, { opacity: 0.2, duration: 0.8, ease: "power2.out" });
      pulseLamp(lamp);
    };
    return { curtain, sweep, pulse, beamY };
  }
  const scanners = [buildScanner(SCAN_A, TOP_A), buildScanner(SCAN_B, TOP_B)];

  // ---- the lift tower ----
  let liftMoving = false;
  let liftBusy = false;
  const lift = (() => {
    const g = new THREE.Group();
    const railTop = 3.62;
    for (const dx of [-0.34, 0.34]) {
      const rail = part(new THREE.BoxGeometry(0.14, railTop, 0.3));
      rail.position.set(LIFT_X + dx, railTop / 2, -0.2);
      g.add(rail);
    }
    for (let y = 0.7; y < railTop - 0.4; y += 0.85) {
      const cross = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(LIFT_X - 0.34, y, -0.2),
        new THREE.Vector3(LIFT_X + 0.34, y + 0.4, -0.2),
      ]);
      g.add(new THREE.Line(cross, faintMat));
    }
    const sprockets: THREE.Group[] = [];
    for (const sy of [railTop - 0.25, 0.45]) {
      const sp = part(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10).rotateX(Math.PI / 2), faintMat);
      sp.position.set(LIFT_X, sy, -0.2);
      const spoke = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(0.2, 0, 0),
          new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 0.2, 0),
        ]),
        faintMat
      );
      spoke.position.z = 0.06;
      sp.add(spoke);
      g.add(sp);
      sprockets.push(sp);
      spinners.push({ obj: sp, speed: 2.4, active: () => liftMoving });
    }
    for (const dx of [-0.22, 0.22]) {
      const chain = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(LIFT_X + dx, 0.45, -0.2),
        new THREE.Vector3(LIFT_X + dx, railTop - 0.25, -0.2),
      ]);
      g.add(new THREE.Line(chain, ghostMat));
    }
    const carriage = new THREE.Group();
    const plat = part(new THREE.BoxGeometry(0.95, 0.1, 1.05));
    plat.position.y = -0.05;
    carriage.add(plat);
    const back = part(new THREE.BoxGeometry(0.7, 0.5, 0.1));
    back.position.set(0, 0.2, -0.52);
    carriage.add(back);
    carriage.position.set(LIFT_X, LIFT_LOW_Y, 0);
    g.add(carriage);
    const bridge = part(new THREE.BoxGeometry(1.15, 0.08, 1.0), faintMat);
    bridge.position.set((LIFT_X + B_X0) / 2 + 0.08, TOP_B - 0.06, 0);
    g.add(bridge);
    scene.add(g);
    mustFit.push(g);
    const lamp = buildStackLight(LIFT_X, railTop, -0.2); // on the tower head, not behind it
    return { carriage, lamp };
  })();

  // ---- drive motor + belt drive + meshing gears ----
  {
    const motor = part(new THREE.BoxGeometry(0.55, 0.42, 0.5));
    motor.position.set(1.25, 0.31, -0.2);
    scene.add(motor);
    const pulleyM = part(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10).rotateX(Math.PI / 2), faintMat);
    pulleyM.position.set(1.25, 0.31, 0.08);
    scene.add(pulleyM);
    spinners.push({ obj: pulleyM, speed: 5, active: () => true });
    for (const off of [0.12, -0.12]) {
      const band = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(1.25, 0.31 + off, 0.08),
        new THREE.Vector3(LIFT_X, 0.45 + off, 0.02),
      ]);
      scene.add(new THREE.Line(band, ghostMat));
    }
    function gear(r: number, teeth: number): THREE.Group {
      const g2 = new THREE.Group();
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      g2.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), inkMat));
      const tpts: THREE.Vector3[] = [];
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        tpts.push(
          new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0),
          new THREE.Vector3(Math.cos(a) * (r + 0.07), Math.sin(a) * (r + 0.07), 0)
        );
      }
      g2.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tpts), inkMat));
      g2.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-r * 0.5, 0, 0), new THREE.Vector3(r * 0.5, 0, 0),
            new THREE.Vector3(0, -r * 0.5, 0), new THREE.Vector3(0, r * 0.5, 0),
          ]),
          faintMat
        )
      );
      return g2;
    }
    const g1 = gear(0.3, 12);
    g1.position.set(-0.55, 0.36, 0.4);
    scene.add(g1);
    const g2 = gear(0.2, 8);
    g2.position.set(-0.02, 0.36, 0.4);
    scene.add(g2);
    spinners.push({ obj: g1, speed: 1.6, active: () => true });
    spinners.push({ obj: g2, speed: -2.4, active: () => true });
  }

  // ---- the truck ----
  // box truck, cab facing right (its exit). Tall cargo body drawn open on
  // the camera side so the load shows; the arm drops boxes through the open
  // top of the rear section. Boxes attach to the bed and ride along.
  const truck = (() => {
    const root = new THREE.Group();
    const bed = new THREE.Group();
    root.add(bed);
    // cargo floor
    const deck = part(new THREE.BoxGeometry(2.75, 0.16, 1.5));
    deck.position.set(-0.32, BED_TOP - 0.08, 0);
    bed.add(deck);
    // cargo body: far wall, back wall, front wall, roof over the front half
    const farWall = part(new THREE.BoxGeometry(2.75, 2.3, 0.08));
    farWall.position.set(-0.32, BED_TOP + 1.15, -0.71);
    bed.add(farWall);
    const backWall = part(new THREE.BoxGeometry(0.08, 2.3, 1.5));
    backWall.position.set(-1.66, BED_TOP + 1.15, 0);
    bed.add(backWall);
    const frontWall = part(new THREE.BoxGeometry(0.08, 2.3, 1.5));
    frontWall.position.set(0.99, BED_TOP + 1.15, 0);
    bed.add(frontWall);
    const roof = part(new THREE.BoxGeometry(1.05, 0.09, 1.5));
    roof.position.set(0.5, BED_TOP + 2.3, 0);
    bed.add(roof);
    // low lip on the open (camera) side so boxes read contained
    const lip = part(new THREE.BoxGeometry(2.75, 0.3, 0.07), faintMat);
    lip.position.set(-0.32, BED_TOP + 0.15, 0.72);
    bed.add(lip);
    // chassis, cab, hood
    const frame = part(new THREE.BoxGeometry(4.4, 0.2, 0.9), faintMat);
    frame.position.set(0.35, 0.72, 0);
    root.add(frame);
    const cab = part(new THREE.BoxGeometry(1.15, 1.6, 1.4));
    cab.position.set(1.68, 1.62, 0);
    root.add(cab);
    const hood = part(new THREE.BoxGeometry(0.55, 0.72, 1.3));
    hood.position.set(2.5, 1.18, 0);
    root.add(hood);
    // windshield slant + grille + mirror
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(2.26, 2.42, -0.65),
      new THREE.Vector3(2.26, 2.42, 0.65),
    ]), faintMat));
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(2.26, 2.42, 0.65),
      new THREE.Vector3(2.55, 1.54, 0.65),
    ]), inkMat));
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(2.26, 2.42, -0.65),
      new THREE.Vector3(2.55, 1.54, -0.65),
    ]), inkMat));
    for (const gy of [0.95, 1.1, 1.25]) {
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(2.78, gy, -0.45),
        new THREE.Vector3(2.78, gy, 0.45),
      ]), faintMat));
    }
    const mirror = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(2.28, 2.1, 0.7),
      new THREE.Vector3(2.42, 2.1, 0.86),
    ]);
    root.add(new THREE.Line(mirror, faintMat));
    // wheels: rear duals + front
    const wheels: THREE.Group[] = [];
    for (const wx of [-1.15, -0.28, 2.15]) {
      const r = 0.42;
      const w = part(new THREE.CylinderGeometry(r, r, 0.2, 14).rotateX(Math.PI / 2), inkMat);
      const spoke = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-r * 0.7, 0, 0),
          new THREE.Vector3(r * 0.7, 0, 0),
        ]),
        faintMat
      );
      spoke.position.z = 0.11;
      w.add(spoke);
      w.position.set(wx, r, 0);
      root.add(w);
      wheels.push(w);
    }
    root.position.set(TRUCK_X, 0, 0.15);
    scene.add(root);
    mustFit.push(root); // measured here, at the dock (departure leaves frame by design)
    return { root, bed, wheels };
  })();
  const truckPallets: THREE.Group[] = [];
  let truckReady = true;
  let truckMoving = false;
  let truckTl: gsap.core.Timeline | null = null;

  function departTruck() {
    truckReady = false;
    const tl = gsap.timeline({
      onComplete: () => {
        truckTl = null;
      },
    });
    truckTl = tl;
    tl.add(() => {
      truckMoving = true;
      pulseLamp(endLamp);
    });
    tl.to(truck.root.position, { x: TRUCK_X + 18, duration: 2.6, ease: "power2.in" });
    tl.add(() => {
      truckMoving = false;
      // the load shipped out with the truck: retire its pallets and recycle
      // their boxes back into the pool
      for (const pal of truckPallets) {
        for (const it of items) {
          if (it.state === "boxed" && pal.getObjectById(it.group.id)) {
            settleItem(it);
            scene.attach(it.group);
            it.group.visible = false;
            it.state = "idle";
          }
        }
        pal.parent?.remove(pal);
      }
      truckPallets.length = 0;
      palletsOnTruck = 0;
    });
    // a fresh truck backs in after a beat
    tl.to(truck.root.position, {
      x: TRUCK_X,
      duration: 2.8,
      ease: "power2.out",
      delay: 1.2,
      onStart: () => {
        truckMoving = true;
      },
    });
    tl.add(() => {
      truckMoving = false;
      truckReady = true;
    });
  }

  // ---- arms ----
  type Arm = {
    turret: THREE.Group;
    shoulder: THREE.Group;
    elbow: THREE.Group;
    wrist: THREE.Group;
    fingerL: THREE.Group;
    fingerR: THREE.Group;
    joints: { yaw: number; S: number; E: number; grip: number };
    base: THREE.Vector3;
    shoulderWorldY: number;
    homeYaw: number;
    busy: boolean;
    timeline: gsap.core.Timeline | null;
  };
  function buildArm(base: THREE.Vector3, riser: number): Arm {
    const root = new THREE.Group();
    root.position.copy(base);
    scene.add(root);
    if (riser > 0.05) {
      const r = part(new THREE.BoxGeometry(1.7, riser, 1.7));
      r.position.y = riser / 2;
      root.add(r);
    }
    const basePlate = part(new THREE.BoxGeometry(1.6, 0.18, 1.6));
    basePlate.position.y = riser + 0.09;
    root.add(basePlate);
    const turret = new THREE.Group();
    turret.position.y = riser + 0.18;
    root.add(turret);
    const tb = part(new THREE.CylinderGeometry(0.46, 0.54, 0.62, 12));
    tb.position.y = 0.31;
    turret.add(tb);
    const shoulder = new THREE.Group();
    shoulder.position.set(0, SHOULDER_Y - 0.18, 0);
    turret.add(shoulder);
    shoulder.add(part(new THREE.CylinderGeometry(0.32, 0.32, 0.54, 12).rotateX(Math.PI / 2), faintMat));
    const ua = part(new THREE.BoxGeometry(L1, 0.36, 0.32));
    ua.position.x = L1 / 2;
    shoulder.add(ua);
    const elbow = new THREE.Group();
    elbow.position.x = L1;
    shoulder.add(elbow);
    elbow.add(part(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 12).rotateX(Math.PI / 2), faintMat));
    const fa = part(new THREE.BoxGeometry(L2, 0.28, 0.26));
    fa.position.x = L2 / 2;
    elbow.add(fa);
    const wrist = new THREE.Group();
    wrist.position.x = L2;
    elbow.add(wrist);
    const palm = part(new THREE.BoxGeometry(0.46, 0.18, 0.56));
    palm.position.y = -0.14;
    wrist.add(palm);
    const fingerL = part(new THREE.BoxGeometry(0.09, 0.55, 0.16));
    const fingerR = part(new THREE.BoxGeometry(0.09, 0.55, 0.16));
    fingerL.position.set(-0.24, -0.46, 0);
    fingerR.position.set(0.24, -0.46, 0);
    wrist.add(fingerL, fingerR);
    return {
      turret,
      shoulder,
      elbow,
      wrist,
      fingerL,
      fingerR,
      joints: { yaw: 0, S: 0.72, E: -1.62, grip: 1 },
      base: base.clone(),
      shoulderWorldY: riser + SHOULDER_Y,
      homeYaw: 0,
      busy: false,
      timeline: null,
    };
  }
  const midArm = buildArm(MID_BASE, MID_RISER);
  const endArm = buildArm(END_BASE, END_RISER);
  mustFit.push(midArm.turret.parent!, endArm.turret.parent!);

  function solveFor(arm: Arm, target: THREE.Vector3) {
    const dx = target.x - arm.base.x;
    const dz = target.z - arm.base.z;
    const yaw = Math.atan2(-dz, dx);
    const d = Math.hypot(dx, dz);
    const py = target.y + GRIP_DROP - arm.shoulderWorldY;
    const D = Math.min(Math.hypot(d, py), L1 + L2 - 0.01);
    const a = Math.atan2(py, d);
    const cosS = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D);
    const S = a + Math.acos(THREE.MathUtils.clamp(cosS, -1, 1));
    const cosE = (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2);
    const E = -(Math.PI - Math.acos(THREE.MathUtils.clamp(cosE, -1, 1)));
    return { yaw, S, E };
  }
  function syncArm(arm: Arm) {
    arm.turret.rotation.y = arm.joints.yaw;
    arm.shoulder.rotation.z = arm.joints.S;
    arm.elbow.rotation.z = arm.joints.E;
    arm.wrist.rotation.z = -(arm.joints.S + arm.joints.E);
    const spread = 0.19 * arm.joints.grip + 0.1;
    arm.fingerL.position.x = -spread;
    arm.fingerR.position.x = spread;
  }
  const HOME = { S: 0.72, E: -1.62 };
  // Three states: pick, REST, drop. Rest is the neutral bearing halfway
  // between the pick and drop points - which lands in the empty gap between
  // stations. Parking over the pick point instead left the folded gripper
  // hanging through the belt deck.
  function restYaw(arm: Arm, pick: THREE.Vector3, drop: THREE.Vector3) {
    return solveFor(arm, pick.clone().add(drop).multiplyScalar(0.5)).yaw;
  }
  midArm.homeYaw = restYaw(
    midArm,
    new THREE.Vector3(PICK_A, TOP_A, 0),
    new THREE.Vector3(LIFT_X, LIFT_LOW_Y + ITEM_H / 2, 0)
  );
  endArm.homeYaw = restYaw(
    endArm,
    new THREE.Vector3(PICK_B, TOP_B, 0),
    new THREE.Vector3(TRUCK_X - 0.78, BED_TOP + 0.9, 0.15)
  );
  midArm.joints.yaw = midArm.homeYaw;
  endArm.joints.yaw = endArm.homeYaw;

  // ---- items ----
  type ItemState = "beltA" | "beltB" | "held" | "liftWait" | "lifting" | "boxed" | "forklift" | "idle";
  type Item = { group: THREE.Group; state: ItemState };
  const items: Item[] = [];
  function makeItem(i: number): Item {
    const s = 0.85 + (i % 4) * 0.09;
    const group = new THREE.Group();
    group.add(part(new THREE.BoxGeometry(0.95 * s, ITEM_H, 0.78 * s)));
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.96 * s, 0.012, 0.16), tapeMat);
    tape.position.y = ITEM_H / 2 + 0.006;
    group.add(tape);
    group.visible = false;
    scene.add(group);
    const item: Item = { group, state: "idle" };
    items.push(item);
    return item;
  }
  for (let i = 0; i < 14; i++) makeItem(i);

  // kill any in-flight position/rotation tweens before reparenting an item -
  // stale tweens writing into a NEW parent's local space made boxes float
  function settleItem(item: Item) {
    gsap.killTweensOf(item.group.position);
    gsap.killTweensOf(item.group.rotation);
    gsap.killTweensOf(item.group.scale);
  }

  function takeIdle(): Item | null {
    return items.find((p) => p.state === "idle") ?? null;
  }
  function placeOnBeltA(item: Item, atX: number) {
    scene.attach(item.group);
    item.group.position.set(atX, TOP_A + ITEM_H / 2, 0);
    item.group.rotation.set(0, (Math.random() - 0.5) * 0.15, 0);
    item.group.scale.setScalar(1);
    item.state = "beltA";
  }
  // pre-warm the line so it starts mid-production
  for (const px of [-3.4, -5.4]) {
    const it = takeIdle()!;
    it.group.position.set(px, TOP_A + ITEM_H / 2, 0);
    it.group.visible = true;
    it.state = "beltA";
  }
  {
    const it = takeIdle()!;
    it.group.position.set(4.0, TOP_B + ITEM_H / 2, 0);
    it.group.visible = true;
    it.state = "beltB";
  }

  // ---- forklift ----
  const forklift = (() => {
    const root = new THREE.Group();
    const chassis = part(new THREE.BoxGeometry(1.35, 0.5, 0.95));
    chassis.position.set(0, 0.52, 0);
    root.add(chassis);
    const cw = part(new THREE.BoxGeometry(0.5, 0.38, 0.85), faintMat);
    cw.position.set(-0.8, 0.62, 0);
    root.add(cw);
    for (const [px, pz] of [
      [-0.45, -0.38],
      [-0.45, 0.38],
      [0.45, -0.38],
      [0.45, 0.38],
    ] as const) {
      const post = part(new THREE.BoxGeometry(0.07, 0.95, 0.07), faintMat);
      post.position.set(px as number, 1.25, pz as number);
      root.add(post);
    }
    const roof = part(new THREE.BoxGeometry(1.1, 0.07, 0.9), faintMat);
    roof.position.set(0, 1.76, 0);
    root.add(roof);
    for (const mz of [-0.3, 0.3]) {
      const rail = part(new THREE.BoxGeometry(0.09, 1.9, 0.09));
      rail.position.set(0.78, 0.98, mz);
      root.add(rail);
    }
    const forks = new THREE.Group();
    const backPlate = part(new THREE.BoxGeometry(0.08, 0.42, 0.75));
    forks.add(backPlate);
    for (const fz of [-0.22, 0.22]) {
      const fork = part(new THREE.BoxGeometry(0.85, 0.06, 0.12));
      fork.position.set(0.48, -0.18, fz);
      forks.add(fork);
    }
    forks.position.set(0.82, 0.55, 0);
    root.add(forks);
    const wheels: THREE.Group[] = [];
    for (const [wx, r] of [
      [0.55, 0.3],
      [-0.62, 0.24],
    ] as const) {
      const w = part(new THREE.CylinderGeometry(r as number, r as number, 0.16, 12).rotateX(Math.PI / 2), inkMat);
      const spoke = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-(r as number) * 0.7, 0, 0),
          new THREE.Vector3((r as number) * 0.7, 0, 0),
        ]),
        faintMat
      );
      spoke.position.z = 0.09;
      w.add(spoke);
      w.position.set(wx as number, r as number, 0);
      root.add(w);
      wheels.push(w);
    }
    root.position.set(-11.8, 0, 0.15);
    scene.add(root);
    return { root, forks, wheels, driving: false };
  })();
  let forkliftTl: gsap.core.Timeline | null = null;

  function forkliftCycle() {
    if (disposed) return;
    const item = takeIdle();
    if (!item) {
      gsap.delayedCall(2, forkliftCycle);
      return;
    }
    settleItem(item);
    item.group.rotation.set(0, 0, 0);
    item.group.scale.setScalar(1);
    item.group.visible = true;
    item.state = "forklift";
    forklift.forks.add(item.group);
    // centered on the fork blades: blades top is local y -0.15
    item.group.position.set(0.48, -0.15 + ITEM_H / 2, 0);

    const dropX = A_X0 + 0.45;
    const tl = gsap.timeline();
    forkliftTl = tl;
    forklift.driving = true;
    // raise to a high carry on the way in - the box rides ABOVE deck height,
    // never under the conveyor
    tl.to(forklift.root.position, { x: dropX - 1.65, duration: 2.0, ease: "power1.inOut" });
    tl.to(forklift.forks.position, { y: TOP_A + 0.32, duration: 0.9, ease: "power1.inOut" }, "<0.3");
    tl.add(() => {
      forklift.driving = false;
    });
    tl.to(forklift.forks.position, { y: TOP_A + 0.12, duration: 0.3, ease: "power1.inOut" });
    tl.add(() => {
      tl.pause();
      const tryDrop = () => {
        if (disposed) return;
        const blocked = items.some(
          (o) => o.state === "beltA" && Math.abs(o.group.position.x - dropX) < 1.5
        );
        if (blocked) {
          gsap.delayedCall(0.4, tryDrop);
          return;
        }
        // smooth handoff: slide off the blades onto the belt, then it's live
        settleItem(item);
        scene.attach(item.group);
        gsap.to(item.group.position, {
          x: dropX,
          y: TOP_A + ITEM_H / 2,
          z: 0,
          duration: 0.3,
          ease: "power1.out",
          onComplete: () => {
            item.group.rotation.set(0, (Math.random() - 0.5) * 0.15, 0);
            item.state = "beltA";
          },
        });
        tl.resume();
      };
      tryDrop();
    });
    tl.to(forklift.forks.position, { y: 0.55, duration: 0.6, ease: "power1.inOut" }, "+=0.15");
    tl.add(() => {
      forklift.driving = true;
    });
    tl.to(forklift.root.position, { x: -11.8, duration: 2.2, ease: "power1.inOut" });
    tl.add(() => {
      forklift.driving = false;
      forkliftTl = null;
      gsap.delayedCall(0.8, forkliftCycle);
    });
  }

  // ---- pick-and-place ----
  function runTransfer(arm: Arm, item: Item, place: THREE.Vector3, after: (item: Item) => void) {
    arm.busy = true;
    const pickAt = item.group.position.clone();
    const gripY = pickAt.y + ITEM_H / 2 - 0.18;
    const hoverPick = solveFor(arm, new THREE.Vector3(pickAt.x, gripY + 0.55, pickAt.z));
    const atPick = solveFor(arm, new THREE.Vector3(pickAt.x, gripY, pickAt.z));
    const hoverPlace = solveFor(arm, new THREE.Vector3(place.x, place.y + 0.6, place.z));
    const atPlace = solveFor(arm, new THREE.Vector3(place.x, place.y + ITEM_H / 2 - 0.18, place.z));
    const j = arm.joints;
    const tl = gsap.timeline({
      onComplete: () => {
        arm.busy = false;
        arm.timeline = null;
      },
    });
    arm.timeline = tl;
    tl.to(j, { yaw: hoverPick.yaw, S: hoverPick.S, E: hoverPick.E, duration: 0.8, ease: "power2.inOut" });
    tl.to(j, { S: atPick.S, E: atPick.E, duration: 0.38, ease: "power2.in" });
    tl.to(j, { grip: 0.16, duration: 0.18 });
    tl.add(() => {
      settleItem(item);
      arm.wrist.attach(item.group);
      item.state = "held";
      gsap.to(item.group.position, { x: 0, y: -GRIP_DROP + ITEM_H / 2 - 0.03, z: 0, duration: 0.12 });
      gsap.to(item.group.rotation, { x: 0, y: 0, z: 0, duration: 0.12 });
    });
    tl.to(j, { S: hoverPick.S, E: hoverPick.E, duration: 0.4, ease: "power2.out" }, "+=0.06");
    tl.to(j, { yaw: hoverPlace.yaw, S: hoverPlace.S, E: hoverPlace.E, duration: 0.95, ease: "power2.inOut" });
    tl.to(j, { S: atPlace.S, E: atPlace.E, duration: 0.38, ease: "power2.in" });
    tl.to(j, { grip: 1, duration: 0.18 });
    tl.add(() => {
      // Seat the item on its target SYNCHRONOUSLY. This used to tween into
      // place, but after() immediately calls settleItem(), which killed that
      // tween - so the item got parented wherever the gripper released it and
      // ended up floating off its pallet/carriage.
      settleItem(item);
      scene.attach(item.group);
      item.group.position.copy(place);
      item.group.rotation.set(0, 0, 0);
      after(item);
    });
    tl.to(j, { S: hoverPlace.S, E: hoverPlace.E, duration: 0.35, ease: "power2.out" }, "+=0.05");
    // fold up AND swing back to the resting bearing - it used to stay slewed
    // toward the drop until the next box arrived
    tl.to(
      j,
      { yaw: arm.homeYaw, S: HOME.S, E: HOME.E, duration: 0.85, ease: "power2.inOut" },
      "-=0.1"
    );
  }

  // ---- gantry cycle: hoist the loaded pallet into the truck ----
  let gantryBusy = false;
  let gantryTl: gsap.core.Timeline | null = null;
  const palletBoxes: Item[] = [];
  let palletsOnTruck = 0;

  function runGantry() {
    gantryBusy = true;
    const pal = dockPallet;
    const st = hoist.state;
    const tl = gsap.timeline({
      onComplete: () => {
        gantryBusy = false;
        gantryTl = null;
      },
    });
    gantryTl = tl;
    const upd = { onUpdate: hoist.applyDrop };
    // over the pallet, lower, take the load
    tl.to(hoist.trolley.position, { z: PALLET_Z, duration: 0.9, ease: "power2.inOut" });
    tl.to(st, { drop: HOIST_Y - 0.62, duration: 0.75, ease: "power2.in", ...upd });
    tl.add(() => {
      pulseLamp(hoist.lamp);
      hoist.hookG.attach(pal);
    });
    // lift clear, traverse over the cargo, set it down
    tl.to(st, { drop: 1.15, duration: 0.95, ease: "power2.out", ...upd });
    tl.to(hoist.trolley.position, { z: TRUCK_DROP_Z, duration: 1.25, ease: "power2.inOut" });
    tl.to(st, { drop: HOIST_Y - BED_TOP - 0.62, duration: 0.8, ease: "power2.in", ...upd });
    tl.add(() => {
      truck.bed.attach(pal);
      truckPallets.push(pal);
      palletsOnTruck++;
      // the boxes rode in on the pallet; hand them back to the pool on departure
      palletBoxes.length = 0;
      counter.tick();
      pulseLamp(hoist.lamp);
    });
    // hook up, trolley home, fresh pallet on the dock
    tl.to(st, { drop: 0.6, duration: 0.7, ease: "power2.out", ...upd });
    tl.to(hoist.trolley.position, { z: HOIST_REST_Z, duration: 1.0, ease: "power2.inOut" });
    tl.add(() => {
      dockPallet = makePallet();
      dockPallet.position.set(GX, 0, PALLET_Z);
    });
  }

  // ---- lift cycle ----
  let liftTl: gsap.core.Timeline | null = null;
  function runLift(item: Item) {
    liftBusy = true;
    item.state = "lifting";
    const tl = gsap.timeline({
      onComplete: () => {
        liftBusy = false;
        liftTl = null;
      },
    });
    liftTl = tl;
    tl.add(() => {
      liftMoving = true;
      pulseLamp(lift.lamp);
      settleItem(item);
      lift.carriage.add(item.group);
      // seated square on the platform (platform top is local y 0)
      item.group.position.set(0, ITEM_H / 2, 0);
      item.group.rotation.set(0, 0, 0);
    });
    tl.to(lift.carriage.position, { y: LIFT_TOP_Y, duration: 1.6, ease: "power1.inOut" });
    tl.add(() => {
      liftMoving = false;
      settleItem(item);
      scene.attach(item.group);
      // exact belt-B rest height before the push across the bridge
      item.group.position.y = TOP_B + ITEM_H / 2;
      item.group.position.z = 0;
    });
    tl.to(item.group.position, { x: B_X0 + 0.6, duration: 0.55, ease: "power1.inOut" });
    tl.add(() => {
      item.state = "beltB";
      liftMoving = true;
    });
    tl.to(lift.carriage.position, { y: LIFT_LOW_Y, duration: 1.2, ease: "power1.inOut" });
    tl.add(() => {
      liftMoving = false;
    });
  }

  // ---- loop ----
  const clock = new THREE.Clock();
  let shiftA = 0;
  let shiftB = 0;
  let raf = 0;
  let running = false;
  let markedReady = false;
  let disposed = false;

  function nearestAhead(item: Item, state: ItemState, stopX: number): number {
    let x = stopX;
    for (const o of items) {
      if (o !== item && o.state === state && o.group.position.x > item.group.position.x) {
        x = Math.min(x, o.group.position.x - 1.35);
      }
    }
    return x;
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);

    {
      if (par.on) {
        par.x += (par.tx - par.x) * 0.05;
        par.y += (par.ty - par.y) * 0.05;
      }
      camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      camera.position
        .copy(CAM_BASE)
        .addScaledVector(camUp, vertShift)
        .add(new THREE.Vector3(par.x * 0.55, -par.y * 0.35, 0));
      lookNow.copy(LOOK_AT).addScaledVector(camUp, vertShift);
      camera.lookAt(lookNow);
    }

    shiftA = (shiftA + BELT_SPEED * dt) % (A_X1 - A_X0);
    shiftB = (shiftB + BELT_SPEED * dt) % (B_X1 - B_X0);
    lays[0](shiftA);
    lays[1](shiftB);

    for (const s of spinners) {
      if (s.active()) s.obj.rotation.z -= s.speed * dt;
    }
    if (forklift.driving) {
      for (const w of forklift.wheels) w.rotation.z -= 3.4 * dt;
    }
    if (truckMoving) {
      for (const w of truck.wheels) w.rotation.z -= 4.2 * dt;
    }

    const sw = (clock.elapsedTime % 2.4) / 2.4;
    scanners[0].sweep.position.y = TOP_A + 0.15 + Math.abs(Math.sin(sw * Math.PI * 2)) * 1.05;
    scanners[1].sweep.position.y = TOP_B + 0.15 + Math.abs(Math.cos(sw * Math.PI * 2)) * 1.05;

    let waitA: Item | null = null;
    let waitB: Item | null = null;
    for (const it of items) {
      if (it.state === "beltA") {
        const prev = it.group.position.x;
        it.group.position.x = Math.min(prev + BELT_SPEED * dt, nearestAhead(it, "beltA", PICK_A));
        if (prev < SCAN_A && it.group.position.x >= SCAN_A) scanners[0].pulse();
        if (it.group.position.x >= PICK_A - 0.001 && !waitA) waitA = it;
      } else if (it.state === "beltB") {
        const prev = it.group.position.x;
        it.group.position.x = Math.min(prev + BELT_SPEED * dt, nearestAhead(it, "beltB", PICK_B));
        if (prev < SCAN_B && it.group.position.x >= SCAN_B) scanners[1].pulse();
        if (it.group.position.x >= PICK_B - 0.001 && !waitB) waitB = it;
      }
    }

    // a box seated on the carriage only rides once the arm is fully clear -
    // starting the lift from the release callback drove the carriage up
    // through the still-lowered gripper
    const seated = items.find((it) => it.state === "liftWait") ?? null;
    if (seated && !liftBusy && !midArm.busy) runLift(seated);

    // mid arm feeds the lift (carriage down, empty, and nothing already seated)
    if (waitA && !midArm.busy && !liftBusy && !seated) {
      runTransfer(midArm, waitA, new THREE.Vector3(LIFT_X, LIFT_LOW_Y + ITEM_H / 2, 0), (item) => {
        item.state = "liftWait";
      });
    }
    // a full pallet gets hoisted, once the arm is clear of it
    if (!gantryBusy && !endArm.busy && truckReady && !truckMoving && palletBoxes.length >= BOXES_PER_PALLET) {
      runGantry();
    }
    // loaded truck leaves (decided here, never mid-cycle)
    if (truckReady && !gantryBusy && !endArm.busy && palletsOnTruck >= PALLET_PER_TRUCK) {
      departTruck();
    }
    // packing arm stacks the dock pallet (never while the hoist is over it)
    if (
      waitB &&
      !endArm.busy &&
      !gantryBusy &&
      truckReady &&
      !truckMoving &&
      palletBoxes.length < BOXES_PER_PALLET
    ) {
      const level = palletBoxes.length;
      runTransfer(
        endArm,
        waitB,
        new THREE.Vector3(
          GX + (Math.random() - 0.5) * 0.1,
          PALLET_DECK + ITEM_H / 2 + level * (ITEM_H + 0.04),
          PALLET_Z + (Math.random() - 0.5) * 0.1
        ),
        (item) => {
          item.state = "boxed";
          settleItem(item);
          dockPallet.attach(item.group);
          palletBoxes.push(item);
          pulseLamp(endLamp);
        }
      );
    }

    syncArm(midArm);
    syncArm(endArm);
    renderer.render(scene, camera);

    // state probe for tests/debugging (read-only snapshot)
    (window as unknown as Record<string, unknown>).__plant = {
      truckX: Math.round(truck.root.position.x * 100) / 100,
      truckReady,
      truckMoving,
      endBusy: endArm.busy,
      midBusy: midArm.busy,
      liftBusy,
      liftY: Math.round(lift.carriage.position.y * 100) / 100,
      seated: items.some((it) => it.state === "liftWait"),
      gantryBusy,
      pallet: palletBoxes.length,
      onTruck: palletsOnTruck,
      stack: palletBoxes.length,
    };

    if (!markedReady) {
      markedReady = true;
      section?.classList.add("hero--3d");
    }
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    midArm.timeline?.play();
    endArm.timeline?.play();
    liftTl?.play();
    forkliftTl?.play();
    truckTl?.play();
    gantryTl?.play();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    midArm.timeline?.pause();
    endArm.timeline?.pause();
    liftTl?.pause();
    forkliftTl?.pause();
    truckTl?.pause();
    gantryTl?.pause();
  }

  const vis = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
      else stop();
    },
    { rootMargin: "10% 0px" }
  );
  vis.observe(host);

  // Derive the camera envelope from the parts themselves, measured in CAMERA
  // space: the view has a slight yaw, so depth shears screen-x and a
  // world-space X/Y fit leaves the long ends grazing the frame edge.
  const FRUSTUM = { halfW: 10, halfH: 3 };
  {
    // pose the arms first: they're built lying along +x, and the resting pose
    // folds them upright - measuring before this understated the height
    syncArm(midArm);
    syncArm(endArm);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    const inv = camera.matrixWorldInverse.clone();
    const v = new THREE.Vector3();
    const bb = new THREE.Box3();
    const tmp = new THREE.Box3();
    for (const o of mustFit) bb.union(tmp.setFromObject(o));
    // include the forklift at its delivery stop so it is fully in frame when
    // it sets a box down - it was bleeding off the left edge. This widens the
    // envelope, which is what steps the whole machine down a little.
    const forkDeliverX = A_X0 + 0.45 - 1.65;
    bb.expandByPoint(new THREE.Vector3(forkDeliverX - 1.15, 0.4, 0.15));
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    const corners: THREE.Vector3[] = [];
    for (const cx of [bb.min.x, bb.max.x])
      for (const cy of [bb.min.y, bb.max.y])
        for (const cz of [bb.min.z, bb.max.z]) corners.push(new THREE.Vector3(cx, cy, cz));
    for (const c of corners) {
      v.copy(c).applyMatrix4(inv);
      minU = Math.min(minU, v.x); maxU = Math.max(maxU, v.x);
      minV = Math.min(minV, v.y); maxV = Math.max(maxV, v.y);
    }
    // recentre the camera on the machine by sliding along its own right/up axes
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const cu = (minU + maxU) / 2;
    const cv = (minV + maxV) / 2;
    CAM_BASE.addScaledVector(right, cu).addScaledVector(up, cv);
    LOOK_AT.addScaledVector(right, cu).addScaledVector(up, cv);
    camera.position.copy(CAM_BASE);
    camera.lookAt(LOOK_AT);
    FRUSTUM.halfW = (maxU - minU) / 2 + 0.1;
    // headroom: the arms sweep above their resting pose while transferring
    FRUSTUM.halfH = (maxV - minV) / 2 + 0.34;
    (window as unknown as Record<string, unknown>).__fit = { ...FRUSTUM };
  }

  // ---- the gantry crane: it LOADS the truck ----
  // The packing arm stacks boxes on a pallet at the dock; the hoist then
  // traverses over it, lowers, lifts the whole pallet, carries it across and
  // sets it in the cargo body. Ceiling runs are scenery; the crane is not.
  // Deliberately outside mustFit: it rises past the top of the frame the way
  // real plant structure does.
  const hoist = (() => {
    // A-frame legs. Straight legs sat at the same world x as the load and,
    // in this near-orthographic side view, drew straight through the pallet
    // stack. Splaying the feet clears the load and converges at the girder.
    const legTop = 7.1;
    const SPLAY = 1.25;
    const legLen = Math.hypot(SPLAY, legTop);
    const legAng = Math.atan2(SPLAY, legTop);
    for (const gz of [-1.4, 1.9]) {
      for (const sx of [-1, 1]) {
        const leg = part(new THREE.BoxGeometry(0.22, legLen, 0.24));
        leg.position.set(GX + (sx * SPLAY) / 2, legTop / 2, gz);
        leg.rotation.z = sx * legAng; // feet splayed out, apex at the girder
        scene.add(leg);
        const foot = part(new THREE.BoxGeometry(0.66, 0.14, 0.7), faintMat);
        foot.position.set(GX + sx * SPLAY, 0.07, gz);
        scene.add(foot);
      }
      // cross-bracing between the splayed legs
      const br: THREE.Vector3[] = [];
      for (let y = 1.1; y < legTop - 1.0; y += 1.5) {
        const w0 = SPLAY * (1 - y / legTop);
        const w1 = SPLAY * (1 - (y + 1.5) / legTop);
        br.push(new THREE.Vector3(GX - w0, y, gz), new THREE.Vector3(GX + w1, y + 1.5, gz));
        br.push(new THREE.Vector3(GX + w0, y, gz), new THREE.Vector3(GX - w1, y + 1.5, gz));
        br.push(new THREE.Vector3(GX - w0, y, gz), new THREE.Vector3(GX + w0, y, gz));
      }
      scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(br), ghostMat));
    }
    const girder = part(new THREE.BoxGeometry(0.5, 0.62, 3.9));
    girder.position.set(GX, legTop - 0.3, 0.25);
    scene.add(girder);

    // trolley rides the girder in z; the hook hangs from it on cables
    const trolley = new THREE.Group();
    trolley.position.set(GX, HOIST_Y, HOIST_REST_Z);
    scene.add(trolley);
    const body = part(new THREE.BoxGeometry(0.62, 0.34, 0.78));
    trolley.add(body);
    const cables: THREE.Group[] = [];
    for (const cz of [-0.2, 0.2]) {
      const c = part(new THREE.BoxGeometry(0.035, 1, 0.035), faintMat, false);
      c.position.set(0, -0.5, cz);
      trolley.add(c);
      cables.push(c);
    }
    const hookG = new THREE.Group();
    const block = part(new THREE.BoxGeometry(0.56, 0.3, 0.62), faintMat);
    hookG.add(block);
    const hookLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.15, 0),
      new THREE.Vector3(0, -0.42, 0),
    ]);
    hookG.add(new THREE.Line(hookLine, faintMat));
    trolley.add(hookG);

    const state = { drop: 0.6 };
    function applyDrop() {
      hookG.position.y = -state.drop;
      for (const c of cables) {
        c.scale.y = Math.max(0.001, state.drop - 0.15);
        c.position.y = -(state.drop - 0.15) / 2 - 0.15;
      }
    }
    applyDrop();
    const lamp = buildStackLight(GX, legTop, 1.9);
    return { trolley, hookG, state, applyDrop, lamp };
  })();

  // counter mounted on the gantry's front leg
  const counter = (() => {
    let n = 0;
    const cv = document.createElement("canvas");
    cv.width = 192;
    cv.height = 96;
    const tex = new THREE.CanvasTexture(cv);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.36),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    plane.position.set(GX, 2.75, 2.06);
    scene.add(plane);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.78, 0.42)), inkMat);
    frame.position.copy(plane.position);
    scene.add(frame);
    function redraw() {
      const p = readPalette();
      const ctx = cv.getContext("2d")!;
      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-m") || "monospace";
      ctx.clearRect(0, 0, 192, 96);
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, 192, 96);
      ctx.fillStyle = p.accent;
      ctx.font = `500 58px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n).padStart(4, "0"), 96, 52);
      tex.needsUpdate = true;
    }
    redraw();
    return { redraw, tick() { n++; redraw(); } };
  })();
  const endLamp = hoist.lamp;

  // ---- pallets ----
  function makePallet(): THREE.Group {
    const g = new THREE.Group();
    for (const dz of [-0.42, -0.14, 0.14, 0.42]) {
      const slat = part(new THREE.BoxGeometry(1.45, 0.07, 0.22));
      slat.position.set(0, 0.16, dz);
      g.add(slat);
    }
    for (const dz of [-0.5, 0, 0.5]) {
      const str = part(new THREE.BoxGeometry(1.45, 0.12, 0.1), faintMat);
      str.position.set(0, 0.06, dz);
      g.add(str);
    }
    scene.add(g);
    return g;
  }
  const PALLET_DECK = 0.2;
  let dockPallet = makePallet();
  dockPallet.position.set(GX, 0, PALLET_Z);

  // ---- ceiling runs (scenery) ----
  {
    const runZ = -1.1;
    const runY = 6.9;
    const x0 = 0.4;
    const x1 = FIT.maxX + 2.2;
    const tray = part(new THREE.BoxGeometry(x1 - x0, 0.2, 0.62), ghostMat, false);
    tray.position.set((x0 + x1) / 2, runY, runZ);
    scene.add(tray);
    const rungs: THREE.Vector3[] = [];
    for (let x = x0 + 0.4; x < x1; x += 0.62) {
      rungs.push(new THREE.Vector3(x, runY + 0.1, runZ - 0.31), new THREE.Vector3(x, runY + 0.1, runZ + 0.31));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rungs), ghostMat));
    for (const py of [runY - 0.55, runY - 0.9]) {
      const pipe = part(new THREE.CylinderGeometry(0.13, 0.13, x1 - x0, 10).rotateZ(Math.PI / 2), ghostMat, false);
      pipe.position.set((x0 + x1) / 2, py, runZ - 0.75);
      scene.add(pipe);
    }
    const hangers: THREE.Vector3[] = [];
    for (let x = x0 + 2.2; x < x1; x += 4.4) {
      hangers.push(new THREE.Vector3(x, runY + 0.1, runZ), new THREE.Vector3(x, runY + 1.9, runZ));
      hangers.push(new THREE.Vector3(x - 0.5, runY + 1.9, runZ), new THREE.Vector3(x + 0.5, runY + 1.9, runZ));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(hangers), ghostMat));
  }

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  start();
  forkliftCycle();

  return () => {
    disposed = true;
    stop();
    forkliftTl?.kill();
    liftTl?.kill();
    truckTl?.kill();
    gantryTl?.kill();
    vis.disconnect();
    ro.disconnect();
    themeObserver.disconnect();
    if (par.on) window.removeEventListener("mousemove", onPointer);
    section?.classList.remove("hero--3d");
    renderer.dispose();
    scene.traverse((o) => {
      const any = o as THREE.Mesh;
      if (any.geometry) any.geometry.dispose();
    });
    host.innerHTML = "";
  };
}
