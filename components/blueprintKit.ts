// Shared helpers for the site's line-art 3D scenes: theme-aware palette,
// the hidden-line material set, and the part() builder that gives every solid
// a background-coloured fill (so it occludes) plus ink edges (so it reads as
// a drawing).
//
// NOTE: conveyorScene.ts predates this kit and keeps its own copies. It is
// heavily verified, so it was left alone rather than refactored underneath
// working animation code.

import * as THREE from "three";

export type Palette = { ink: string; accent: string; bg: string; teal: string };

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    ink: cs.getPropertyValue("--ink").trim() || "#14283C",
    accent: cs.getPropertyValue("--accent").trim() || "#2464A4",
    bg: cs.getPropertyValue("--bg").trim() || "#EDF2F8",
    teal: dark ? "#3fe0cf" : "#1fb5a3",
  };
}

export type Mats = {
  fill: THREE.MeshBasicMaterial;
  ink: THREE.LineBasicMaterial;
  faint: THREE.LineBasicMaterial;
  ghost: THREE.LineBasicMaterial;
  accent: THREE.LineBasicMaterial;
  retint: (p: Palette) => void;
};

export function createMats(pal: Palette): Mats {
  const fill = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pal.bg),
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const ink = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 1 });
  const faint = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.62 });
  const ghost = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.24 });
  const accent = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.accent), transparent: true, opacity: 0.95 });
  return {
    fill,
    ink,
    faint,
    ghost,
    accent,
    retint(p: Palette) {
      fill.color.set(p.bg);
      ink.color.set(p.ink);
      faint.color.set(p.ink);
      ghost.color.set(p.ink);
      accent.color.set(p.accent);
    },
  };
}

// A solid drawn the site's way: bg-coloured fill for hidden-line occlusion,
// plus edge lines. withFill:false gives outline-only (for ghosted scenery).
export function partFactory(mats: Mats) {
  return function part(
    geo: THREE.BufferGeometry,
    lineMat: THREE.LineBasicMaterial = mats.ink,
    withFill = true
  ): THREE.Group {
    const g = new THREE.Group();
    if (withFill) g.add(new THREE.Mesh(geo, mats.fill));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), lineMat));
    return g;
  };
}

// Fit an orthographic camera to a set of objects, measured in CAMERA space so
// a yawed view does not leave the long ends grazing the frame edge. Returns
// the half-extents; the caller applies them on resize.
export function fitToObjects(
  camera: THREE.OrthographicCamera,
  camBase: THREE.Vector3,
  lookAt: THREE.Vector3,
  objects: THREE.Object3D[],
  pad = 0.12
): { halfW: number; halfH: number } {
  camera.updateMatrixWorld();
  const inv = camera.matrixWorldInverse.clone();
  const bb = new THREE.Box3();
  const tmp = new THREE.Box3();
  for (const o of objects) bb.union(tmp.setFromObject(o));
  const v = new THREE.Vector3();
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const cx of [bb.min.x, bb.max.x])
    for (const cy of [bb.min.y, bb.max.y])
      for (const cz of [bb.min.z, bb.max.z]) {
        v.set(cx, cy, cz).applyMatrix4(inv);
        minU = Math.min(minU, v.x); maxU = Math.max(maxU, v.x);
        minV = Math.min(minV, v.y); maxV = Math.max(maxV, v.y);
      }
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const cu = (minU + maxU) / 2;
  const cv = (minV + maxV) / 2;
  camBase.addScaledVector(right, cu).addScaledVector(up, cv);
  lookAt.addScaledVector(right, cu).addScaledVector(up, cv);
  camera.position.copy(camBase);
  camera.lookAt(lookAt);
  return { halfW: (maxU - minU) / 2 + pad, halfH: (maxV - minV) / 2 + pad };
}
