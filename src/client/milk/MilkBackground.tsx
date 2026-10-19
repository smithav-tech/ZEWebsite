import { useEffect, useRef } from "react";
import { whenRevealed } from "../reveal";
import { FRAGMENT, IMPULSE_SLOTS, VERTEX } from "./shaders";

/** the canvas renders at half the (capped) device resolution: the milk is soft anyway */
const RESOLUTION = 0.5;
/** scroll distance (px) that sends in another edge wave */
const SCROLL_PER_WAVE = 260;
/** and at most one every this many seconds */
const WAVE_GAP = 0.45;
/** the opening wave, this long after the page starts to open: it rolls in as the
 *  headline and nav come clear, at full strength */
const OPENING_WAVE_DELAY = 850;

/**
 * THE MILK. A fixed full-screen WebGL canvas behind the page: thick satin
 * milk that ripples under the pointer, dents where you press, and rolls a
 * wave in from the left as you scroll. Reduced motion renders one still frame
 * (redrawn on scroll, so the page still drifts over the folds).
 */
export function MilkBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!canvas || !gl) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uRes = uniform("uRes");
    const uTime = uniform("uTime");
    const uScroll = uniform("uScroll");
    const uImp = uniform("uImp");
    const uPointer = uniform("uPointer");

    // impulses: x, y (screen units), start time, strength. x < -50 marks an edge wave.
    const impulses = new Float32Array(IMPULSE_SLOTS * 4);
    for (let i = 0; i < IMPULSE_SLOTS; i++) impulses[i * 4 + 2] = -100; // long finished
    let nextSlot = 0;
    const t0 = performance.now();
    const seconds = () => (performance.now() - t0) / 1000;
    const impulse = (x: number, y: number, start: number, strength: number) => {
      impulses.set([x, y, start, strength], (nextSlot++ % IMPULSE_SLOTS) * 4);
    };
    const edgeWave = (strength: number) => impulse(-100, Math.random(), seconds(), strength);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr * RESOLUTION));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr * RESOLUTION));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (still) frame();
    };

    // positions in screen units: 1 = the viewport height
    const pointer = { x: 0.5, y: 0.5, press: 0, target: 0, lastX: 0, lastY: 0, lastT: 0 };
    const scroll = { y: window.scrollY, travelled: 0, lastWave: 0 };
    const toScreen = (e: PointerEvent) => [e.clientX / window.innerHeight, e.clientY / window.innerHeight];

    const onMove = (e: PointerEvent) => {
      const [x, y] = toScreen(e);
      pointer.x = x;
      pointer.y = y;
      const t = seconds();
      const dist = Math.hypot(x - pointer.lastX, y - pointer.lastY);
      if (!still && dist > 0.045 && t - pointer.lastT > 0.12) {
        impulse(x, y, t, 0.06 + Math.min(dist, 0.15) * 0.6);
        pointer.lastX = x;
        pointer.lastY = y;
        pointer.lastT = t;
      }
    };
    const onDown = (e: PointerEvent) => {
      const [x, y] = toScreen(e);
      pointer.x = x;
      pointer.y = y;
      pointer.target = 1;
      if (!still) impulse(x, y, seconds(), 0.28);
    };
    const onUp = () => (pointer.target = 0);

    let raf = 0;
    let lastT = seconds();
    function frame() {
      const t = still ? 3 : seconds();
      const dt = Math.min(0.05, t - lastT);
      lastT = t;
      pointer.press += (pointer.target - pointer.press) * Math.min(1, dt * 6);
      if (!still) {
        const y = window.scrollY;
        const moved = Math.abs(y - scroll.y);
        const speed = moved / Math.max(dt, 1 / 120);
        scroll.y = y;
        scroll.travelled += moved;
        if (scroll.travelled > SCROLL_PER_WAVE && t - scroll.lastWave > WAVE_GAP) {
          scroll.travelled = 0;
          scroll.lastWave = t;
          edgeWave(Math.min(0.85, 0.3 + speed / 5000));
        }
      }
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, t);
      gl!.uniform1f(uScroll, window.scrollY / window.innerHeight);
      gl!.uniform4fv(uImp, impulses);
      gl!.uniform3f(uPointer, pointer.x, pointer.y, pointer.press);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!still) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    let openingWave = 0;
    let stopWaiting = () => {};
    if (still) {
      window.addEventListener("scroll", frame, { passive: true });
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      // the opening wave rolls in as the loader's ripple opens onto the page
      stopWaiting = whenRevealed(() => {
        openingWave = window.setTimeout(() => edgeWave(0.75), OPENING_WAVE_DELAY);
      });
      raf = requestAnimationFrame(frame);
    }
    document.documentElement.classList.add("milk-on");

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(openingWave);
      stopWaiting();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", frame);
      document.documentElement.classList.remove("milk-on");
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={ref} className="milk-canvas" aria-hidden="true" />;
}
