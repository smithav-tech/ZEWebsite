/** Slots for ripples and edge waves, recycled oldest first. */
export const IMPULSE_SLOTS = 10;

/** One triangle that covers the screen. */
export const VERTEX = /* glsl */ `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

/**
 * The milk: a thick, glossy surface of slow domain-warped swells. Lit like the
 * real thing: a bright, slightly cool white body, soft grey-ivory shadows that
 * glow warm where light scatters back out of the folds (milk is translucent),
 * a broad satin sheen with a small wet glint on the crests, and a faint
 * reflection on the steep slopes. Pointer moves and presses drop viscous
 * ripples; scrolling sends heavy waves in from the left edge.
 */
export const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec4 uImp[${IMPULSE_SLOTS}];   // xy = position (screen units), z = start time, w = strength; x < -50 means edge wave
uniform vec3 uPointer;       // xy = position, z = press

// milk palette: the body sits just under white so the gloss can rise above it
const vec3 MILK    = vec3(0.970, 0.966, 0.958);  // #F7F6F4 fresh milk, barely warm
const vec3 SHADOW  = vec3(0.884, 0.884, 0.890);  // #E1E1E3 cool, luminous shadow: milk never goes muddy
const vec3 CREAM   = vec3(0.968, 0.930, 0.880);  // #F7EDE0 the creamy band where light scatters out of a fold
const vec3 DEEP    = vec3(0.905, 0.902, 0.905);  // #E7E6E7 the hollows, a touch occluded
const vec3 SKY     = vec3(0.955, 0.962, 0.975);  // #F4F5F9 the room, reflected at grazing angles

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic: smooth normals, no grid in the sheen
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// height of the milk surface. p = world position (drifts with scroll), s = screen position
float height(vec2 p, vec2 s) {
  float t = uTime;
  // slow domain-warped swells: thick liquid folding over itself
  vec2 q = p * 0.62 + vec2(t * 0.014, -t * 0.009);
  vec2 w = vec2(noise(q + vec2(1.7, 9.2) + t * 0.012), noise(q + vec2(8.3, 2.8) - t * 0.014));
  float h = 0.48 * noise(q * 1.0 + w * 1.6);
  // soft rounded ridges where the thick milk folds over itself
  float v = noise(q * 1.7 + w * 1.3 - t * 0.018) * 2.0 - 1.0;
  float r = 1.0 - sqrt(v * v + 0.02); // rounded, never a hard crease
  h += 0.34 * r * r;
  h += 0.10 * noise(q * 3.4 + w * 0.6 + t * 0.03);

  for (int i = 0; i < ${IMPULSE_SLOTS}; i++) {
    vec4 im = uImp[i];
    float age = t - im.z;
    if (age < 0.0 || age > 9.0) continue;
    if (im.x < -50.0) {
      // heavy wave rolling in from the left edge, slightly skewed
      float d = s.x + (s.y - 0.5) * 0.25 * sin(im.y * 6.2831);
      float x = d - age * 0.85;
      float env = x > 0.0 ? exp(-x * x * 18.0) : exp(-x * x * 2.2);
      h += im.w * 0.55 * env * cos(x * 4.2) * exp(-age * 0.55);
    } else {
      // viscous ripple: one or two broad rings that settle fast
      float d = length(s - im.xy);
      float x = d - age * 0.42;
      float env = exp(-x * x * 26.0);
      h += im.w * env * cos(x * 13.0) * exp(-age * 1.35) / (1.0 + d * 3.0);
    }
  }
  vec2 dp = s - uPointer.xy;
  h -= uPointer.z * 0.22 * exp(-dot(dp, dp) * 40.0);
  return h;
}

void main() {
  vec2 s = gl_FragCoord.xy / uRes.y;           // screen units (1 = viewport height)
  s.y = 1.0 - s.y + 0.0;                        // y down, like the page
  vec2 p = s * 2.6 + vec2(0.0, uScroll * 0.9);  // the page drifts over the milk
  float e = 0.004;
  float h  = height(p, s);
  float hx = height(p + vec2(e * 2.6, 0.0), s + vec2(e, 0.0));
  float hy = height(p + vec2(0.0, e * 2.6), s + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h) / e * 0.24, -(hy - h) / e * 0.24, 1.0));

  // a soft window light from the top-left, viewer straight above
  vec3 L = normalize(vec3(-0.45, -0.55, 0.7));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float lit = dot(n, L) - L.z;                  // 0 on a flat surface, < 0 on slopes facing away

  // body: soft, wrapped falloff into cool shadow, the way light dies inside a translucent liquid
  float away = smoothstep(0.0, 0.45, -lit);
  vec3 col = mix(MILK, SHADOW, away);
  // subsurface: where the surface turns from the light, scattered light glows back out creamy
  float band = smoothstep(0.0, 0.1, -lit) * (1.0 - smoothstep(0.1, 0.3, -lit));
  col = mix(col, CREAM, band * 0.4);
  // the slopes facing the light lift toward pure white
  col = mix(col, vec3(1.0), smoothstep(0.0, 0.3, lit) * 0.6);

  // the hollows between swells catch less light
  float trough = smoothstep(0.42, 0.12, h);
  col = mix(col, DEEP, trough * 0.35 * (1.0 - away));

  // gloss: the window reflected in the wet surface, a broad sheen and a crisp core
  vec3 R = reflect(-V, n);
  float rl = max(dot(R, L), 0.0);
  float sheen = smoothstep(0.9, 0.995, rl);
  float gloss = sheen * sheen * 0.05 + pow(rl, 320.0) * 0.08;
  // the room at grazing angles (Fresnel), strongest on steep slopes
  float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.5);
  col = mix(col, SKY, clamp(fresnel * 3.0, 0.0, 0.4));
  col += gloss;

  // fine dither so the soft gradients never band
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;
