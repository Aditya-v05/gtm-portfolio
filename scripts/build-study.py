# Builds the About section's study as a 3D scene and renders it as pixel art.
#   blender -b -P scripts/build-study.py
# Writes public/art/study.png (low resolution, shown at 3x with crisp pixels)
# and components/study-anchors.json (where things stand, in image pixels).
#
# The look: an orthographic 2:1 isometric camera, the Workbench engine with
# no anti-aliasing, object outlines and cast shadows, then every pixel is
# snapped to the site's palette. Geometry is seeded, so it never changes.
import bpy, bmesh, json, math, random, os
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

random.seed(7)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 300, 250          # render size in pixels
PPU = math.sqrt(2)       # pixels per world unit: a 16-unit tile is 16px wide, 8px tall

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

def hexc(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # materials are linear; convert from sRGB so the render lands on the hex
    lin = [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c]
    return (*lin, 1)

MATS = {}
def mat(h):
    if h not in MATS:
        m = bpy.data.materials.new(h)
        m.diffuse_color = hexc(h)
        m.roughness = 1
        MATS[h] = m
    return MATS[h]

def add(mesh_op, name, colour, **kw):
    bm = bmesh.new()
    mesh_op(bm, **kw)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    ob.data.materials.append(mat(colour))
    return ob

def box(x, y, z, w, d, h, colour, rz=0.0, name="box"):
    ob = add(lambda bm: bmesh.ops.create_cube(bm, size=1), name, colour)
    ob.scale = (w, d, h)
    ob.location = (x + w / 2, y + d / 2, z + h / 2)
    ob.rotation_euler[2] = rz
    return ob

def cyl(x, y, z, r, h, colour, seg=12, r2=None, rot=None, name="cyl"):
    ob = add(lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h), name, colour)
    ob.location = (x, y, z + h / 2)
    if rot: ob.rotation_euler = rot
    return ob

def ball(x, y, z, r, colour, sx=1, sy=1, sz=1):
    ob = add(lambda bm: bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r), "ball", colour)
    ob.location = (x, y, z)
    ob.scale = (sx, sy, sz)
    return ob

IVORY, LITE, MID, STONE = "#f6eed8", "#fffbe6", "#e9dfc8", "#ded6c4"
PERI, BLUE, NAVY, DEEP, CLAY, LEAF = "#a9b0d6", "#6f8ed4", "#3f5cab", "#1b2b5a", "#c8673a", "#6b9a4a"
POT = "#d8b49a"  # weathered terracotta, for the amphora and the plant pot
R = 96  # the room is 96 x 96 units; the back corner is the origin

# ---- floor: individual stone tiles on a bed, a few missing, a few sunk ----
box(1, 1, -5, R - 2, R - 2, 3, STONE, name="bed")
gone = {(5, 5), (5, 4), (4, 5), (5, 0), (0, 5)}
for i in range(6):
    for j in range(6):
        if (i, j) in gone: continue
        sink = -0.9 if random.random() < 0.15 else 0
        t = box(i * 16 + 0.5, j * 16 + 0.5, -2 + sink, 15, 15, 2, LITE if (i + j) % 2 else IVORY, name="tile")
        if sink: t.rotation_euler = (random.uniform(-.03, .03), random.uniform(-.03, .03), 0)
box(70, 84, -2, 9, 6, 2, IVORY, rz=0.4)          # a tile that came loose

# ---- walls: real blocks in staggered courses, crumbling toward their ends ----
def wall(along_x, length, top, window=None):
    bh, bw = 9, 18
    for k in range(int(100 / bh)):
        z = k * bh
        a = -6 + (bw / 2 if k % 2 else 0)
        while a < length:
            lo, hi = max(a, -6 if True else 0), min(a + bw, length)
            a += bw
            if hi - lo < 3: continue
            mid = (lo + hi) / 2
            if z + bh > top(mid) + random.uniform(-4, 4): continue
            if window and window(mid, z): continue
            c = random.choice([IVORY, IVORY, IVORY, MID, LITE])
            g = 0.35
            if along_x: box(lo + g, -6, z + g, hi - lo - 2 * g, 6, bh - 2 * g, c, name="block")
            else: box(-6, lo + g, z + g, 6, hi - lo - 2 * g, bh - 2 * g, c, name="block")

# the wall along x (drawn on the left): tall at the corner, low at its far end
wall(True, R, lambda a: 84 - max(0, a - 44) * 0.95)
# the wall along y (on the right): an arched window onto the sea
def win(a, z):
    return 40 < a < 66 and 30 < z < 68 - (abs(a - 53) > 7) * 9
wall(False, R, lambda a: 80 - max(0, a - 62) * 1.3, window=win)
box(-5.6, 38, 26, 6.6, 30, 3, LITE, name="sill")
box(-9, 30, 6, 1, 46, 70, "#8aa5e0", name="sea")           # the sea, seen through the window
box(-9.5, 30, 44, 1, 46, 40, "#fbf1c4", name="sky")

# ---- furniture ----
# a stone desk against the left wall
box(34, 2, 0, 7, 18, 19, IVORY); box(70, 2, 0, 7, 18, 19, IVORY)
box(28, 0.5, 19, 54, 22, 3.5, LITE, name="desk")
cyl(64, 8, 23.6, 1.5, 13, LITE, seg=8, rot=(0, math.pi / 2, 0.5), name="scroll")
box(54, 12, 22.5, 9, 6.5, 0.4, LITE, rz=0.25, name="sheet")
cyl(74, 14, 22.5, 2, 3.2, DEEP, seg=8, name="inkpot")
box(73.6, 13.6, 25, 0.6, 0.6, 7, IVORY, rz=0.3).rotation_euler[0] = 0.5   # a quill
cyl(48, 16, 22.5, 1.6, 2.6, PERI, seg=8, r2=2.1, name="cup")
# an inscription tablet on the wall above it
box(52, -0.2, 40, 34, 1.2, 24, LITE, name="tablet")
# a shelf on the right wall, on brackets
box(0, 8, 46, 7.5, 24, 2.2, LITE, name="shelf")
box(0, 11, 41, 5, 2, 5, MID); box(0, 27, 41, 5, 2, 5, MID)
# a rug, slightly askew
rug = box(26, 40, 0.05, 38, 42, 0.5, PERI, rz=0.06, name="rug")
box(30, 44, 0.3, 30, 34, 0.5, "#b9c0e2", rz=0.06, name="rug-in")
# a broken fluted column, with a drum of it lying on the floor
cyl(84, 82, 0, 7.5, 3, LITE, seg=12)
cyl(84, 82, 3, 6, 26, IVORY, seg=10, name="column")
cyl(84, 82, 29, 6.3, 2, LITE, seg=10)
cyl(60, 88, 5.2, 5.2, 11, IVORY, seg=10, rot=(math.pi / 2, 0, 0.5), name="drum")
# a whole column standing at the far end of the left wall
cyl(90, 6, 0, 6.5, 3, LITE, seg=12); cyl(90, 6, 3, 5, 78, IVORY, seg=10, r2=4.4); box(83, -1, 81, 14, 14, 3.5, LITE)
# books: a crooked stack, and one left open
bx, by = 24, 40
for k, (c, w, d, h, r) in enumerate([(NAVY, 15, 11, 3.6, 0.1), (CLAY, 13, 10, 3, -0.25), (PERI, 15, 11, 3.6, 0.3), (LITE, 12, 9, 2.6, -0.1)]):
    z = sum(v[3] for v in [(0,0,0,3.6),(0,0,0,3),(0,0,0,3.6),(0,0,0,2.6)][:k])
    box(bx - w / 2 + 7, by - d / 2 + 5, z, w, d, h, c, rz=r, name="book")
box(40, 72, 0.6, 7, 10, 1.2, BLUE, rz=0.5); box(47, 72, 0.6, 7, 10, 1.2, BLUE, rz=0.5)
# an amphora in the corner, and a potted plant
cyl(10, 10, 0, 3, 2, POT, seg=10); ball(10, 10, 9, 6.5, POT, sz=1.25); cyl(10, 10, 16, 2.6, 5, POT, seg=10, r2=3.6)
cyl(30, 90, 0, 4, 6, POT, seg=10, r2=5)
for (dx, dy, dz, r) in [(0, 0, 10, 5), (3, 2, 13, 3.6), (-3, -1, 13, 3.4), (1, -3, 15, 3)]:
    ball(30 + dx, 90 + dy, dz, r, LEAF)
# ivy spilling over the corner of the walls
for k in range(26):
    onx = random.random() < 0.5
    a, z = random.uniform(2, 34), random.uniform(52, 84)
    ball(a if onx else 0.8, 0.8 if onx else a, z, random.uniform(1.2, 2.2), random.choice([LEAF, "#4f7a3a", "#8fb35a"]))
# water from the city: a stone trough comes in past the end of the right
# wall and empties into a small basin
box(8, 70, 0, 8, 62, 5, IVORY, name="trough")
box(9.5, 71, 5, 5, 62, 0.4, "#8aa5e0", name="trough-water")
box(6, 56, 0, 12, 14, 6.5, LITE, name="basin")
box(8, 58, 6.5, 8, 10, 0.4, "#8aa5e0", name="basin-water")
# a low ledge that runs out of the room toward the words
box(96, 30, -5, 46, 22, 5, STONE, name="ledge")
box(98, 32, 0, 13, 9, 3, NAVY, rz=0.3, name="ledge-book")
# a small stool to sit on
cyl(52, 34, 0, 5, 9, IVORY, seg=10); cyl(52, 34, 9, 6, 2, LITE, seg=10)

# ---- camera: orthographic, 2:1 isometric, looking at the middle of the room ----
target = Vector((R / 2 + 18, R / 2 + 12, 24))
cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = max(W, H) / PPU
cam_data.clip_end = 2000
cam = bpy.data.objects.new("cam", cam_data)
col.objects.link(cam)
cam.rotation_euler = (math.radians(60), 0, math.radians(135))
cam.location = target + Vector((1, 1, math.tan(math.radians(30)) * math.sqrt(2))) * 400
scene.camera = cam

# ---- render: Workbench, hard pixels, outlines and shadows ----
scene.render.engine = "BLENDER_WORKBENCH"
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = W, H, 100
scene.render.film_transparent = True
scene.render.filter_size = 0.01
scene.view_settings.view_transform = "Standard"
d = scene.display
d.render_aa = "OFF"
sh = d.shading
sh.color_type = "MATERIAL"
sh.show_object_outline = True
sh.object_outline_color = hexc("#3f5cab")[:3]
sh.show_cavity = False
sh.show_specular_highlight = False
d.light_direction = (0.55, -0.35, 0.75)
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

def shoot(name, light, shadows):
    sh.light = light
    sh.show_shadows = shadows
    sh.shadow_intensity = 0.5
    path = os.path.join(ROOT, "art-src", name)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(path)
    return im, np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)

# two passes: flat gives each pixel its exact material colour; studio gives
# how much light falls on it. Each pixel then takes one of four steps of its
# material's ramp, shading toward blue the way the site's other art does.
_, flat = shoot("study-flat.png", "FLAT", False)
img, lit = shoot("study-lit.png", "STUDIO", True)
lum = lambda a: (a[..., :3] * np.array([0.3, 0.59, 0.11])).sum(-1)
ratio = lum(lit) / np.maximum(lum(flat), 1e-4)
print("LIGHT", [round(float(v), 2) for v in np.percentile(ratio[flat[..., 3] > 0.5], [5, 25, 50, 75, 95])])
step = np.select([ratio > 0.5, ratio > 0.43, ratio > 0.33], [0.0, 0.12, 0.3], 0.5)
navy = np.array([0x3f, 0x5c, 0xab], dtype=np.float32) / 255
base = np.round(flat[..., :3] * 255) / 255
out = base * (1 - step[..., None]) + navy * step[..., None]
is_line = (np.abs(base - navy).sum(-1) < 0.03)
out[is_line] = navy
alpha = (flat[..., 3:] > 0.5).astype(np.float32)
# a clean one-pixel outline round the whole silhouette
a2 = alpha[..., 0]
edge = np.zeros_like(a2, dtype=bool)
edge[1:, :] |= a2[:-1, :] < 0.5; edge[:-1, :] |= a2[1:, :] < 0.5; edge[:, 1:] |= a2[:, :-1] < 0.5; edge[:, :-1] |= a2[:, 1:] < 0.5
out[edge & (a2 > 0.5)] = navy
res = np.concatenate([out * alpha, alpha], -1)
img.pixels = res.reshape(-1).tolist()
img.filepath_raw = os.path.join(ROOT, "public", "art", "study.png")
img.file_format = "PNG"
img.save()

# ---- where things stand, in image pixels (from the top left) ----
def anchor(x, y, z):
    v = world_to_camera_view(scene, cam, Vector((x, y, z)))
    return [round(v.x * W, 1), round((1 - v.y) * H, 1)]
A = {
    "bust": anchor(40, 12, 22.5), "watcher": anchor(3.5, 20, 48.2), "dragon": anchor(31, 45, 12.8), "phones": anchor(84, 82, 31),
    "tablet": anchor(86, 0, 64), "rug": [anchor(30, 44, 0.8), anchor(60, 44, 0.8), anchor(60, 78, 0.8), anchor(30, 78, 0.8)],
    "die": [45, 60], "note": anchor(60, 0, 50), "size": [W, H],
    "water": [anchor(12, 130, 5.6), anchor(12, 72, 5.6)], "origin": anchor(0, 0, 0), "ux": [anchor(1, 0, 0)[0] - anchor(0, 0, 0)[0], anchor(1, 0, 0)[1] - anchor(0, 0, 0)[1]],
    "uy": [anchor(0, 1, 0)[0] - anchor(0, 0, 0)[0], anchor(0, 1, 0)[1] - anchor(0, 0, 0)[1]],
}
json.dump(A, open(os.path.join(ROOT, "components", "study-anchors.json"), "w"), indent=1)
print("STUDY OK", A["origin"], A["ux"], A["uy"])
