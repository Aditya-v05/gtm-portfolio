// The sea of the closing scene, as one fragment shader. It is drawn fresh every frame at a low resolution and
// scaled up with hard pixels: travelling wave trains on big random swells, foam, glitter, a boat that rides
// them, and now and then a kraken. Nothing is recorded, so it never repeats.
export const SEA_FRAG = /* glsl */ `precision highp float;
uniform vec2 R;        // size of the picture in art pixels
uniform float T;       // seconds
uniform float KR;      // the kraken: -1 away, else 0..1 through its attack
uniform float PITCH;   // camera tilt: positive looks up, which lowers the horizon in the frame
uniform float BX;      // how far right of centre the boat sits, in metres
uniform float NIGHT;   // 0 day, 1 night
const float GL = 1.0;
float hash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
// One wave train: long parallel crests of length L travelling along heading d, at the speed real deep water
// gives a wave of that length. pk > 1 peaks the crests and widens the troughs. Returns 0..1, 1 at the crest.
float train(vec2 p, vec2 d, float L, float ph, float pk) {
  float k = 6.2832 / L, w = sqrt(9.8 * k) * 0.62;
  return pow(0.5 + 0.5 * sin(k * dot(p, d) - w * T + ph), pk);
}
const vec2 D0 = vec2(0.287, -0.958);    // the swell comes toward the viewer and a little to the right
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
// sets: the swell arrives in groups, which drift at half the speed of the waves in them
float sets(vec2 p) { return 0.35 + 1.05 * vn((p - D0 * T * 3.0) / 130.0 + 7.3); }
// crests are never ruler straight: bend the phase gently along their length
float bend(vec2 p) { return 2.6 * vn(p / 85.0 + vec2(0.013, -0.02) * T + 2.1) + 1.1 * vn(p / 31.0 + vec2(-0.02, 0.011) * T + 9.4); }
float H(vec2 p) {
  float b = bend(p), e = sets(p);
  float h = 2.1 * e * (2.0 * train(p, D0, 62.0, b, 1.8) - 1.0);
  h += 1.15 * e * (2.0 * train(p, rot(D0, 0.16), 39.0, b * 0.8 + 1.7, 1.6) - 1.0);
  h += 0.62 * (2.0 * train(p, rot(D0, -0.21), 25.0, b * 0.6 + 4.1, 1.4) - 1.0);
  h += 0.42 * (2.0 * train(p, rot(D0, 0.30), 15.5, 2.9, 1.0) - 1.0);
  h += 0.23 * (2.0 * train(p, rot(D0, -0.11), 9.3, 0.4, 1.0) - 1.0);
  h += 0.11 * (2.0 * train(p, rot(D0, 0.42), 5.6, 5.2, 1.0) - 1.0);
  // big slow swells, with no fixed hill under them. How big they are is itself random from place to place
  // and drifts over time: some stretches of sea heave, others lie nearly calm, so no height is ever "the" skyline.
  float big = 0.12 + 1.5 * pow(vn(p / 230.0 + vec2(-0.012, 0.007) * T + 21.3), 1.6);
  float mid = 0.2 + 1.3 * vn(p / 140.0 + vec2(0.009, -0.014) * T + 4.9);
  h += 9.5 * big * (2.0 * vn(p / 66.0 + vec2(-0.045, 0.012) * T + 3.7) - 1.0);
  h += 4.6 * mid * (2.0 * vn(p / 37.0 + vec2(-0.075, -0.02) * T + 11.1) - 1.0);
  // waves settle right under the camera so none can rise in front of the lens
  return h * mix(0.25, 1.0, smoothstep(-104.0, -46.0, p.y));
}
// foam: a thin broken line along the very top of the big swell, only inside a strong set, with a short
// paler wash on the back of the wave behind it. Returns 2 for the line, 1 for the wash, 0 for none.
float foam(vec2 p) {
  float b = bend(p), e = sets(p);
  float k = 6.2832 / 62.0, ph = k * dot(p, D0) - sqrt(9.8 * k) * 0.62 * T + b;
  float d = mod(ph - 1.5708 + 3.14159, 6.2832) - 3.14159;                 // signed distance from the crest, in phase
  float along = dot(p, vec2(-D0.y, D0.x));
  float br = vn(vec2(along / 5.0, floor(ph / 6.2832 + 0.25) * 3.7 + T * 0.07));    // broken along the crest, slowly changing
  float strong = smoothstep(0.80, 1.05, e), body = smoothstep(0.42, 0.62, br);      // each patch tapers to a point at its ends
  if (strong > 0.5 && abs(d) < 0.045 * body) return 2.0;
  if (strong > 0.5 && d < 0.0 && d > -0.15 * body * br) return 1.0;
  return 0.0;
}
const vec3 RO = vec3(0.0, -96.0, 11.0);
vec3 ray(vec2 frag) {
  vec3 f = normalize(vec3(0.0, 1.0, PITCH)), r = normalize(cross(f, vec3(0, 0, 1))), u = cross(r, f);
  vec2 uv = (frag - 0.5 * R) / R.y;
  return normalize(f * 1.778 + r * uv.x + u * uv.y);
}
// first hit on the water. -1 is sky. The sea has no far edge: a ray that runs out of range heading down
// lands on distant water, one heading up is sky.
float hit(vec3 rd) {
  float t = 8.0, d = 0.0;
  for (int i = 0; i < 260; i++) {
    vec3 p = RO + rd * t; d = p.z - H(p.xy);
    if (d < 0.0005 * t) break;
    if (rd.z > 0.0 && p.z > 30.0) return -1.0;
    t += clamp(d * 0.3, 0.25, 3.0 + t * 0.025);
    if (t > 1100.0) return rd.z < -0.0008 ? min(RO.z / -rd.z, 4000.0) : -1.0;
  }
  if (d > 0.5) return t;
  float a = t - (3.0 + t * 0.025), b = t;
  for (int i = 0; i < 6; i++) { float m = 0.5 * (a + b); vec3 p = RO + rd * m; if (p.z - H(p.xy) < 0.0) b = m; else a = m; }
  return b;
}
vec3 pal(float i) {
  if (NIGHT > 0.5) {
    if (i < 0.5) return vec3(0.043, 0.071, 0.188); if (i < 1.5) return vec3(0.071, 0.114, 0.278); if (i < 2.5) return vec3(0.106, 0.173, 0.388);
    if (i < 3.5) return vec3(0.157, 0.255, 0.525); if (i < 4.5) return vec3(0.290, 0.424, 0.769); return vec3(0.863, 0.894, 0.961);
  }
  if (i < 0.5) return vec3(0.184, 0.310, 0.620); if (i < 1.5) return vec3(0.290, 0.424, 0.769); if (i < 2.5) return vec3(0.435, 0.561, 0.839);
  if (i < 3.5) return vec3(0.624, 0.710, 0.902); if (i < 4.5) return vec3(0.863, 0.894, 0.961); return vec3(1.0, 0.973, 0.847);
}
float bayer(vec2 p) { vec2 q = mod(floor(p), 4.0); float i = q.x + q.y * 4.0; float v = 0.0;
  if (i < 0.5) v = 0.0; else if (i < 1.5) v = 8.0; else if (i < 2.5) v = 2.0; else if (i < 3.5) v = 10.0; else if (i < 4.5) v = 12.0; else if (i < 5.5) v = 4.0; else if (i < 6.5) v = 14.0; else if (i < 7.5) v = 6.0;
  else if (i < 8.5) v = 3.0; else if (i < 9.5) v = 11.0; else if (i < 10.5) v = 1.0; else if (i < 11.5) v = 9.0; else if (i < 12.5) v = 15.0; else if (i < 13.5) v = 7.0; else if (i < 14.5) v = 13.0; else v = 5.0;
  return (v + 0.5) / 16.0; }
// where a point of the world lands on screen: pixel x, pixel y, and its distance from the eye
vec3 proj(vec3 w) {
  vec3 f = normalize(vec3(0.0, 1.0, PITCH)), r = normalize(cross(f, vec3(0, 0, 1))), u = cross(r, f);
  vec3 b = w - RO; return vec3(vec2(dot(b, r), dot(b, u)) / dot(b, f) * 1.778 * R.y + 0.5 * R, length(b));
}
const vec3 INK = vec3(0.122, 0.169, 0.302), CREAM = vec3(1.0, 0.973, 0.847), PALE = vec3(0.863, 0.894, 0.961);
const vec3 CLAY = vec3(0.776, 0.384, 0.235), CLAYL = vec3(0.898, 0.557, 0.380), CLAYD = vec3(0.580, 0.251, 0.149), CLAYE = vec3(0.337, 0.133, 0.094);
#define BOAT vec2(BX, -8.0)
// The kraken, from KR running 0..1:
//   0.00 the water churns   0.08 the head and three arms come up   0.24 the arms rear back
//   0.30 they slam down across the hull and round the mast   0.36 it thrashes the boat, and the mast snaps
//   0.50 it wrenches the boat under   0.58 foam and nothing else   0.84 the boat bobs back up
float kOn() { return KR < 0.0 ? 0.0 : 1.0; }
float kBack() { return kOn() * smoothstep(0.22, 0.29, KR) * (1.0 - smoothstep(0.29, 0.32, KR)); }
float kHeld() { return kOn() * smoothstep(0.33, 0.35, KR) * step(KR, 0.62); }
float kThrash() { return kOn() * smoothstep(0.35, 0.37, KR) * (1.0 - smoothstep(0.49, 0.51, KR)); }
float kSink() { float y = smoothstep(0.50, 0.57, KR); return kOn() * (3.0 * smoothstep(0.33, 0.345, KR) + 31.0 * y * y) * (1.0 - smoothstep(0.84, 0.93, KR)) - kOn() * 2.0 * smoothstep(0.93, 0.955, KR) * (1.0 - smoothstep(0.955, 1.0, KR)); }
vec2 kShake() { float th = kThrash(); return th * vec2(floor(2.4 * sin(T * 21.0) + 0.5), floor(1.2 * sin(T * 33.0 + 1.0) + 0.5)); }
float kHeel() { return kThrash() * 0.62 * sign(sin(T * 10.5)) + kOn() * 0.9 * smoothstep(0.50, 0.56, KR) * step(KR, 0.7); }
// a sailing boat, 25 pixels tall, drawn in screen pixels at a spot on the water so it rides whatever passes under it
vec4 boat(vec2 frag, float tWater) {
  vec3 P = proj(vec3(BOAT, H(BOAT)));
  if (tWater < P.z - 3.0) return vec4(0.0);                       // a nearer wave is in the way
  float sink = kSink(), held = kHeld();
  float tilt = clamp((H(BOAT + vec2(2.5, 0)) - H(BOAT - vec2(2.5, 0))) * 0.5 * (1.0 - held), -1.0, 1.0) * 0.4 + kHeel();
  tilt = floor(tilt * 5.0 + 0.5) / 5.0;
  vec2 q = floor(frag) - floor(P.xy); if (q.y < -3.0) return vec4(0.0);          // nothing shows below the waterline
  q += vec2(-kShake().x, floor(sink) - kShake().y);
  q.x = floor(q.x - tilt * (q.y + 3.0) + 0.5);
  // the mast snaps partway up, and the top hangs over to one side
  float snap = kOn() * smoothstep(0.42, 0.44, KR) * step(KR, 0.7);
  if (snap > 0.0 && q.y > 12.0) { q.x = floor(q.x - (q.y - 12.0) * 1.1 * snap + 0.5); q.y = floor(12.0 + (q.y - 12.0) / mix(1.0, 0.75, snap)); }
  if (q.y >= -3.0 && q.y <= 0.0 && abs(q.x) <= 9.0 + q.y) return vec4(q.y == 0.0 ? vec3(0.337, 0.365, 0.490) : INK, 1.0);   // hull, with a paler rail
  if (q.y >= 1.0 && q.y <= 22.0 && q.x == 0.0) return vec4(INK, 1.0);                         // mast
  if (q.y >= 3.0 && q.y <= 21.0 && q.x >= 1.0 && q.x <= floor((22.0 - q.y) * 0.55)) return vec4(CREAM, 1.0);   // mainsail
  if (q.y >= 3.0 && q.y <= 16.0 && q.x <= -1.0 && q.x >= -floor((17.0 - q.y) * 0.45)) return vec4(PALE, 1.0); // jib
  return vec4(0.0);
}
// one arm. It has two poses and whips from the first to the second, thick end first.
//   raised: straight out of the water from base, at angle a0, length L
//   holding: (optionally a straight run to p1 for the first k0 of its length, then) an arc round c from angle
//            f0 to f1 while its radius goes r0 to r1
// Returns how far inside the limb this pixel is (negative inside), and which segment is nearest.
float limb(vec2 fp, vec2 base, float a0, float L, float k0, vec2 p1, vec2 c, float r0, float r1, float f0, float f1,
           float w0, float w1, float grab, float rise, float sink, out float seg) {
  float best = 1e3; seg = 0.0;
  for (int i = 0; i < 26; i++) {
    float sI = float(i) / 25.0; if (sI > rise) break;
    vec2 up = base + L * sI * vec2(cos(a0 + 0.14 * sin(T * 3.4 + sI * 4.0 + a0 * 7.0) * sI), sin(a0));
    float w = clamp((sI - k0) / (1.0 - k0), 0.0, 1.0), rad = mix(r0, r1, w), an = mix(f0, f1, w);
    vec2 hold = sI < k0 ? mix(base, p1, sI / max(k0, 0.001)) : c + rad * vec2(cos(an), sin(an));
    vec2 pt = mix(up, hold, smoothstep(0.0, 1.0, grab * 1.7 - sI * 0.7)) - vec2(0.0, sink);
    float d = length(fp - pt) - mix(w0, w1, sI);
    if (d < best) { best = d; seg = float(i); }
  }
  return best;
}
vec4 flesh(float d, float seg) {
  if (d > 0.0) return vec4(0.0);
  if (d > -1.0) return vec4(CLAYE, 1.0);
  if (d < -1.5 && mod(seg, 3.0) < 0.5) return vec4(CREAM, 1.0);                  // suckers
  return vec4(d < -2.7 ? CLAYL : (d < -1.7 ? CLAY : CLAYD), 1.0);
}
// white water: a ragged half dome of spray on the surface, densest at its middle
float spray(vec2 c, float rx, float ry, float dens) {
  if (dens <= 0.0 || c.y < 0.0) return 0.0;
  float r = length(c / vec2(rx, ry)); if (r > 1.0) return 0.0;
  return step(1.0 - dens * (1.0 - r * r), hash(floor(c) + floor(T * 11.0) * 7.0));
}
vec4 kraken(vec2 frag, float tWater) {
  if (KR < 0.0) return vec4(0.0);
  vec3 P = proj(vec3(BOAT, H(BOAT))); if (tWater < P.z - 3.0) return vec4(0.0);
  vec2 O = floor(P.xy) + vec2(0.0, -3.0), fp = floor(frag), c = fp - O;          // O: the boat's waterline
  if (c.y < 0.0 || abs(c.x) > 74.0 || c.y > 84.0) return vec4(0.0);
  float sink = kSink(); vec2 sh = kShake();
  // spray, in front of everything: churn, the slam, the thrashing, the plunge, and the boat coming back
  float sp = spray(c, 24.0, 4.0, 0.4 * smoothstep(0.0, 0.06, KR) * (1.0 - smoothstep(0.58, 0.8, KR)));
  sp = max(sp, spray(c, 34.0, 24.0, 0.2 * smoothstep(0.325, 0.335, KR) * (1.0 - smoothstep(0.36, 0.44, KR))));
  sp = max(sp, spray(c - vec2(sh.x * 3.0, 0.0), 28.0, 9.0, 0.17 * kThrash()));
  sp = max(sp, spray(c, 30.0 - 14.0 * smoothstep(0.56, 0.7, KR), 14.0 + 30.0 * smoothstep(0.51, 0.58, KR), 0.5 * smoothstep(0.51, 0.55, KR) * (1.0 - smoothstep(0.6, 0.74, KR))));
  sp = max(sp, spray(c, 18.0, 9.0, 0.45 * smoothstep(0.84, 0.87, KR) * (1.0 - smoothstep(0.9, 0.97, KR))));
  if (sp > 0.5) return vec4(hash(fp) > 0.3 ? CREAM : PALE, 1.0);
  float up = step(KR, 0.62), back = kBack(), seg, d;
  vec2 mid = O + sh;
  // arm over the hull from the right, pinning it
  d = limb(fp, O + vec2(15.0, 0.0), 1.38 - 0.5 * back, 44.0, 0.0, O, mid + vec2(0.0, -2.0), 15.0, 12.0, 0.0, 3.35, 4.8, 2.0,
           smoothstep(0.30, 0.345, KR), smoothstep(0.07, 0.19, KR) * up, sink, seg);
  if (d <= 0.0) return flesh(d, seg);
  // arm over the sails from the left, coming down on the far side
  d = limb(fp, O + vec2(-17.0, 0.0), 1.80 + 0.5 * back, 50.0, 0.0, O, mid + vec2(-1.0, 1.0), 16.0, 8.0, 3.14159, -0.9, 4.6, 1.8,
           smoothstep(0.31, 0.355, KR), smoothstep(0.10, 0.22, KR) * up, sink, seg);
  if (d <= 0.0) return flesh(d, seg);
  // a thinner arm up the mast, coiled round its top; it is what breaks it
  float snap = smoothstep(0.42, 0.44, KR);
  d = limb(fp, O + vec2(5.0, 0.0), 1.5708 + 0.25 * back, 34.0, 0.5, mid + vec2(3.0, 15.0), mid + vec2(1.0 + 4.0 * snap, 18.0 - 4.0 * snap), 3.4, 2.2, -0.6, 7.6, 3.2, 1.3,
           smoothstep(0.29, 0.335, KR), smoothstep(0.13, 0.24, KR) * up, sink, seg);
  if (d <= 0.0) return flesh(d, seg);
  vec4 bt = boat(frag, tWater); if (bt.a > 0.0) return bt;
  // The head, behind the boat and leaning over it: a swollen mantle on a thicker trunk, heavy brows drawn down
  // over pale slit eyes, lit from the upper left so its underside and far side go dark.
  float hr = smoothstep(0.08, 0.22, KR) * (1.0 - smoothstep(0.52, 0.62, KR)), th = kThrash();
  vec2 h = c - vec2(34.0 - 4.0 * th + floor(1.5 * sin(T * 2.3)), 0.0) - sh * 0.6;
  float full = floor(h.y + (1.0 - hr) * 40.0), lx = floor(h.x + full * 0.30);     // leans toward the boat as it rises
  float e1 = length(vec2(lx, full - 24.0) / vec2(20.0, 15.0)), e2 = length(vec2(lx, full - 8.0) / vec2(15.0, 14.0));
  if (hr > 0.02 && min(e1, e2) < 1.0) {
    if (e1 > 0.915 && e2 > 0.89) return vec4(CLAYE, 1.0);
    for (int k = 0; k < 2; k++) {
      float sgn = k == 0 ? -1.0 : 1.0; vec2 d = vec2(lx - (k == 0 ? -9.0 : 1.0), full - 10.0);
      float brow = floor(3.0 + sgn * d.x * 0.55 + 0.5);                          // each brow slopes down toward the middle
      if (abs(d.x) <= 5.0 && d.y >= brow && d.y <= brow + 2.0) return vec4(CLAYE, 1.0);
      if (abs(d.x) <= 3.0 && abs(d.y) <= 1.0 && d.y < brow) return vec4(d.y == 0.0 && abs(d.x) <= 2.0 ? INK : CREAM, 1.0);   // a slit pupil in a pale eye
      if (abs(d.x) <= 5.0 && d.y >= -3.0 && d.y < brow) return vec4(CLAYD, 1.0);  // the socket, in the brow's shadow
    }
    if (abs(lx + 4.0) <= 1.0 && full >= 13.0 && full <= 17.0 && mod(full, 2.0) < 1.0) return vec4(CLAYD, 1.0);   // a furrow between the brows
    float lit = (-lx * 0.55 + (full - 16.0) * 0.6) / 20.0;
    if (full < 3.0) return vec4(CLAYD, 1.0);
    if (hash(floor(vec2(lx, full) * 0.5) + 3.0) > 0.88 && lit > -0.2) return vec4(CLAYL, 1.0);            // mottling
    return vec4(lit > 0.42 ? CLAYL : (lit > -0.22 ? CLAY : CLAYD), 1.0);
  }
  return vec4(0.0);
}
void main() {
  vec2 frag = gl_FragCoord.xy; vec3 rd = ray(frag);
  vec3 sky = NIGHT > 0.5 ? vec3(0.059, 0.086, 0.188) : vec3(0.984, 0.945, 0.769);   // the page colour, so the sea has no top edge
  float t = hit(rd);
  if (t < 0.0) {
    vec4 c = kraken(frag, 1e6); if (c.a == 0.0) c = boat(frag, 1e6);
    gl_FragColor = vec4(mix(sky, c.rgb, c.a), 1.0); return;
  }
  vec3 p = RO + rd * t;
  // is this pixel the top of a swell, with sky or much farther water right above it?
  float t2 = hit(ray(frag + vec2(0.0, 1.0)));
  float crest = (t2 < 0.0 || t2 - t > 0.1 * t + 4.0) ? 1.0 : 0.0;
  vec4 bt = kraken(frag, t); if (bt.a == 0.0) bt = boat(frag, t);
  if (bt.a > 0.0) { gl_FragColor = bt; return; }
  float e = 0.25 + t * 0.006;
  vec3 n = normalize(vec3(H(p.xy - vec2(e, 0)) - H(p.xy + vec2(e, 0)), H(p.xy - vec2(0, e)) - H(p.xy + vec2(0, e)), 2.0 * e));
  // light from beyond and to the left: the face of a wave coming at you is dark, its back and its crest are bright
  vec3 L = normalize(vec3(-0.42, 0.62, 0.50));
  float away = smoothstep(60.0, 760.0, t);                         // 0 near, 1 at the horizon
  float tone = 2.6 + (dot(n, L) - L.z) * mix(4.4, 2.4, away) + away * (NIGHT > 0.5 ? -2.3 : 1.1) + crest * 1.0;
  // foam on the breaking tops, and a thinner lace of it trailing behind
  float fo = (t < 420.0 && t > 42.0) ? foam(p.xy) : 0.0;
  if (fo > 1.5) tone = 5.0; else if (fo > 0.5) tone = max(tone, 4.0);
  // glitter: tiny mirror flashes where a facet throws the sun at the eye, densest in a path toward the sun
  if (GL > 0.0) {
    vec3 S = normalize(vec3(0.30, 1.0, 0.26));
    float sp = pow(max(dot(reflect(rd, n), S), 0.0), 140.0);
    if (sp * (0.6 + 0.8 * hash(floor(p.xy * vec2(0.5, 1.4)) + floor(T * 5.0))) > 1.0 - 0.36 * GL) tone = 5.0;
  }
  tone = clamp(tone, 0.0, 5.0);
  // flat bands: only a thin dithered seam where two tones meet
  float a = floor(tone), fr = tone - a;
  float idx = min(5.0, a + (fr > 0.5 + (bayer(vec2(frag.x, R.y - frag.y)) - 0.5) * 0.28 ? 1.0 : 0.0));
  gl_FragColor = vec4(pal(idx), 1.0);
}
`;
