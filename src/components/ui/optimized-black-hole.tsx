"use client";

import { useEffect, useRef, useState } from "react";
import { createRenderer as createWebglRenderer } from "./optimized-black-hole-utils/renderer";

type Renderer = { ready: Promise<void>; dispose: () => void };
type Backend = "pending" | "webgpu" | "webgl2";

/**
 * Host del fondo global — 21st.dev/vgpu "Optimized Black Hole".
 *
 * Pipeline ORIGINAL multi-pasada (WebGPU): raymarching de geodesicas nulas
 * (lente gravitacional real, el disco se curva sobre/bajo el horizonte),
 * bake a G-buffers, disco volumetrico 3D con ruido, anti-aliasing y cadena
 * de bloom HDR. Es la calidad de la pagina de 21st.dev. Se activa cuando
 * el navegador soporta WebGPU; vgpu entra por dynamic import, asi que el
 * chunk pesado solo lo descarga quien lo puede usar.
 *
 * Fallback WebGL2 (rampa termica en color, ~8KB): navegadores sin WebGPU,
 * fallo de init, o prefers-reduced-motion (ahi renderiza un frame estatico
 * para respetar la regla de accesibilidad del sitio).
 */
export function Example() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backend, setBackend] = useState<Backend>("pending");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderer: Renderer | undefined;

    const useFallback = (reason: string) => {
      if (cancelled) return;
      console.debug(`[black-hole] usando fallback WebGL2 (${reason})`);
      setBackend("webgl2");
    };

    const start = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const reduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        useFallback("prefers-reduced-motion");
        return;
      }
      if (typeof navigator === "undefined" || !("gpu" in navigator)) {
        useFallback("navegador sin WebGPU");
        return;
      }
      try {
        const { createRenderer: createGpuRenderer } = await import(
          "./optimized-black-hole-vgpu/optimized-black-hole-utils/renderer"
        );
        if (cancelled) return;
        renderer = createGpuRenderer({ canvas });
        setBackend("webgpu");
        await renderer.ready;
        if (!cancelled) setIsReady(true);
      } catch (error) {
        renderer?.dispose();
        renderer = undefined;
        useFallback(
          error instanceof Error ? error.message : "init WebGPU fallo",
        );
      }
    };

    void start();
    return () => {
      cancelled = true;
      renderer?.dispose();
    };
  }, []);

  useEffect(() => {
    if (backend !== "webgl2") return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createWebglRenderer({ canvas });
    void renderer.ready.then(() => {
      if (!cancelled) setIsReady(true);
    });
    return () => {
      cancelled = true;
      renderer.dispose();
    };
  }, [backend]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
      data-backend={backend}
    >
      <canvas
        key={backend === "webgl2" ? "fallback" : "primary"}
        ref={canvasRef}
        className={`block h-full w-full touch-none transition-opacity duration-500 ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default Example;
