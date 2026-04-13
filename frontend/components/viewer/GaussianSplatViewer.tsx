"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

export interface ViewerControls {
  startCinematicTour: (durationSeconds: number) => void;
  stopCinematicTour: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface GaussianSplatViewerProps {
  spzUrl: string;
  onViewerReady?: (controls: ViewerControls) => void;
}

export function GaussianSplatViewer({ spzUrl, onViewerReady }: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Store callback in ref to avoid dependency in useEffect
  const onViewerReadyRef = useRef(onViewerReady);
  onViewerReadyRef.current = onViewerReady;

  const stopCinematicTour = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startCinematicTour = useCallback((durationSeconds: number) => {
    const viewer = viewerRef.current as {
      camera?: THREE.PerspectiveCamera;
      update?: () => void;
      render?: () => void;
    } | null;
    if (!viewer?.camera) return;

    const camera = viewer.camera;
    const radius = 5;
    const height = 2;
    const center = new THREE.Vector3(0, 0, 0);
    const totalFrames = durationSeconds * 30;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / (durationSeconds * 1000), 1);
      const frame = Math.floor(progress * totalFrames);

      const angle = progress * Math.PI * 2;
      const verticalOffset = Math.sin(progress * Math.PI * 4) * 0.5;

      camera.position.set(
        center.x + radius * Math.cos(angle),
        center.y + height + verticalOffset,
        center.z + radius * Math.sin(angle)
      );
      camera.lookAt(center);

      if (viewer.update) viewer.update();
      if (viewer.render) viewer.render();

      if (frame < totalFrames) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;
    const container = containerRef.current;

    const initViewer = async () => {
      try {
        setLoadProgress(5);
        const GaussianSplats3D = await import("@mkkellogg/gaussian-splats-3d");

        if (!mounted) return;
        setLoadProgress(10);

        console.log("[SplatViewer] Initializing viewer...");
        console.log("[SplatViewer] Container size:", container.clientWidth, "x", container.clientHeight);
        console.log("[SplatViewer] SPZ URL:", spzUrl);

        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, -1, -0.6],
          initialCameraPosition: [-1, -4, 6],
          initialCameraLookAt: [0, 4, 0],
          rootElement: container,
          selfDrivenMode: true,
          gpuAcceleratedSort: false,
          sharedMemoryForWorkers: false,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          sphericalHarmonicsDegree: 0,
          antialiased: false,
          logLevel: GaussianSplats3D.LogLevel.Debug,
        });

        viewerRef.current = viewer;

        const canvas = container.querySelector("canvas");
        if (canvas) {
          canvasRef.current = canvas as HTMLCanvasElement;
          console.log("[SplatViewer] Canvas found:", canvas.width, "x", canvas.height);
        } else {
          console.warn("[SplatViewer] No canvas found after viewer init");
        }

        setLoadProgress(20);
        console.log("[SplatViewer] Loading splat scene from:", spzUrl);

        await viewer.addSplatScene(spzUrl, {
          splatAlphaRemovalThreshold: 5,
          showLoadingUI: true,
          progressiveLoad: false,
        });

        if (!mounted) return;

        console.log("[SplatViewer] Splat scene loaded, starting viewer...");
        viewer.start();
        setIsLoading(false);
        setLoadProgress(100);

        const updatedCanvas = container.querySelector("canvas");
        if (updatedCanvas) canvasRef.current = updatedCanvas as HTMLCanvasElement;

        console.log("[SplatViewer] Viewer started successfully");

        // Call the callback via ref (stable reference, no re-render loop)
        onViewerReadyRef.current?.({
          startCinematicTour,
          stopCinematicTour,
          getCanvas: () => canvasRef.current,
        });
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load 3D scene";
        console.error("[SplatViewer] Failed to initialize:", err);
        setError(msg);
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      mounted = false;
      stopCinematicTour();
      const v = viewerRef.current as { dispose?: () => void } | null;
      if (v?.dispose) {
        try { v.dispose(); } catch { /* ignore cleanup errors */ }
      }
      viewerRef.current = null;
    };
  // Only re-run when the URL changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spzUrl]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-navy-950">
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <p className="text-pearl/30 text-xs mt-2">
            This may be caused by CORS restrictions on the 3D asset CDN.
            Try opening the Marble viewer instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-950">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
            <p className="mt-4 font-display text-lg text-pearl/50">Loading 3D Scene...</p>
            <p className="mt-1 text-xs text-pearl/30">Downloading & decompressing splat data</p>
            <div className="mt-3 h-1 w-48 mx-auto bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 transition-all duration-500"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-pearl/20">{loadProgress}%</p>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

