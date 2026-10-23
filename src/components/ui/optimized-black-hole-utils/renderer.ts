export interface BlackHoleRendererOptions {
  canvas: HTMLCanvasElement;
  /** false (default) = look original en color (rampa térmica). true = escala de grises (legacy v0.9.0). */
  monochrome?: boolean;
  maxDpr?: number;
}

export interface BlackHoleRenderer {
  ready: Promise<void>;
  dispose: () => void;
}

const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uMono;

out vec4 outColor;

const float SHADOW  = 0.118;
const float DISK_IN = 0.168;
const float DISK_OUT = 0.52;
const float TILT = 3.1;
const float LENS_K = 0.42;

// Rampa termica del look original (restaurada 2026-10-23, decision operador):
// brasa profunda -> ambar -> blanco calido en el nucleo. Colores del pipeline
// canonico del autor (vercel-labs/vgpu, black-hole.wgsl).
// Tints estelares por estrella del pipeline original (constantes exactas del WGSL).
const vec3 STAR_WARM = vec3(1.1741, 0.9745, 0.7397);
const vec3 STAR_COOL = vec3(0.8954, 1.0131, 1.1781);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = p * 2.03 + 17.1;
    amp *= 0.5;
  }
  return v;
}

vec2 rot(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime;

  vec2 p = uv - vec2(0.0, 0.04);
  float b = max(length(p), 1e-4);

  // Curvatura: el punto de muestreo se aparta del centro cuando el rayo pasa
  // cerca del horizonte de eventos.
  vec2 q = p + (p / b) * (LENS_K * SHADOW * SHADOW / b);

  vec2 suv = floor(q * 6.0);
  float starSeed = hash21(suv);
  float star = pow(starSeed, 220.0);
  float twinkle = 0.6 + 0.4 * sin(t * 1.7 + starSeed * 40.0);
  // Tint por estrella: mezcla calido/frio (constantes originales del WGSL).
  float starPick = hash21(suv + vec2(17.17, 3.31));
  vec3 starTint = mix(vec3(1.0), mix(STAR_WARM, STAR_COOL, starPick), 0.55);
  vec3 col = starTint * (star * 2.2 * twinkle);

  col += vec3(0.048, 0.052, 0.066) * fbm(q * 2.3 + vec2(t * 0.006, 0.0));

  // Disco de acretion: achatado + rotacion diferencial (mas rapido cerca del borde).
  vec2 dp = vec2(q.x, q.y * TILT);
  float r = max(length(dp), 0.08);
  float ang = atan(dp.y, dp.x);
  vec2 dt = rot(dp, ang + t * (0.45 / r));
  float turb = fbm(dt * 7.0 + vec2(0.0, -t * 0.25));
  float band = fbm(dt * 3.2 + vec2(t * 0.05, 0.0));

  float disk = smoothstep(DISK_OUT, DISK_OUT - 0.09, r) * smoothstep(DISK_IN, DISK_IN + 0.05, r);
  float heat = pow(1.0 - smoothstep(DISK_IN, DISK_OUT, r), 1.7);
  float density = disk * (0.45 + 0.75 * turb) * (0.6 + 0.6 * band);

  // Rampa termica en COLOR — estructura exacta del original (el mono v0.9.0 era
  // esta misma rampa colapsada a luminancia): brasa -> ambar -> blanco calido.
  vec3 thermal = mix(vec3(0.55, 0.14, 0.03), vec3(1.00, 0.55, 0.16), smoothstep(0.03, 0.5, heat));
  thermal = mix(thermal, vec3(1.00, 0.94, 0.82), pow(heat, 2.2));

  // Doppler beaming relativista (exponente 1.5 * doppler 1.21 del original):
  // el lado que se acerca brilla mas; el que se aleja se atenua. Sin tint de
  // color — en el original el beaming es solo brillo (estilo Interstellar).
  float orbSpeed = min(0.64, 0.94 / sqrt(max(r - SHADOW, 0.25)));
  float towardObs = cos(ang);
  float beaming = pow(clamp(1.0 / (1.0 - orbSpeed * towardObs), 0.72, 1.55), 1.5 * 1.21);

  // Redshift gravitacional: el borde interno se apaga hacia el horizonte.
  float redshift = sqrt(max(1.0 - SHADOW / max(r, SHADOW * 1.05), 0.025));

  col += thermal * beaming * redshift * (density * 2.6);

  // Anillo de fotones: filo brillante del borde interior del disco (blanco calido).
  col += vec3(1.0, 0.94, 0.82) * exp(-abs(b - SHADOW * 1.32) * 62.0) * 0.55;

  col *= smoothstep(SHADOW * 0.86, SHADOW * 1.02, b);

  col = col / (1.0 + col);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));

  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  outColor = vec4(mix(col, vec3(lum), uMono), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[black-hole] shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createRenderer(options: BlackHoleRendererOptions): BlackHoleRenderer {
  const { canvas, monochrome = false, maxDpr = 2 } = options;

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    canvas.style.display = "none";
    return { ready: Promise.resolve(), dispose: () => {} };
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) {
    canvas.style.display = "none";
    return { ready: Promise.resolve(), dispose: () => {} };
  }

  const program = gl.createProgram();
  if (!program) {
    canvas.style.display = "none";
    return { ready: Promise.resolve(), dispose: () => {} };
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[black-hole] link:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    canvas.style.display = "none";
    return { ready: Promise.resolve(), dispose: () => {} };
  }

  const vao = gl.createVertexArray();
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uMono = gl.getUniformLocation(program, "uMono");

  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.uniform1f(uMono, monochrome ? 1 : 0);

  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let frame = 0;
  let running = true;
  let visible = true;
  let startedAt = 0;
  let disposed = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  };

  const draw = (time: number) => {
    resize();
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, (time - startedAt) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (time: number) => {
    if (disposed || !running || !visible) return;
    draw(time);
    if (!reduceMotion) frame = requestAnimationFrame(loop);
  };

  const play = (time: number) => {
    if (disposed || frame) return;
    if (!startedAt) startedAt = time;
    frame = requestAnimationFrame(loop);
  };

  const playIfPossible = (time: number) => {
    if (running && visible) play(time);
  };

  const resume = () => {
    if (reduceMotion) {
      draw(performance.now());
      return;
    }
    running = true;
    frame = requestAnimationFrame(playIfPossible);
  };

  const pause = () => {
    running = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const onVisibility = () => {
    if (document.hidden) pause();
    else resume();
  };

  const ro = new ResizeObserver(() => {
    if (reduceMotion) draw(performance.now());
  });
  ro.observe(canvas);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) resume();
      else pause();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  document.addEventListener("visibilitychange", onVisibility);

  const ready = new Promise<void>((resolve) => {
    requestAnimationFrame((time) => {
      if (!startedAt) startedAt = time;
      if (disposed) return resolve();
      draw(time);
      if (!reduceMotion) frame = requestAnimationFrame(playIfPossible);
      resolve();
    });
  });

  return {
    ready,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    },
  };
}