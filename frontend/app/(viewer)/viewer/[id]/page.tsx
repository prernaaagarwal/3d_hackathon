"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { ViewerControls } from "@/components/viewer/GaussianSplatViewer";
import type { Tour, Property } from "@/lib/types";
import {
  Video, Square, Download, ChevronRight, Globe,
  Clock, Camera, ExternalLink, Loader2,
} from "lucide-react";

const GaussianSplatViewer = dynamic(
  () => import("@/components/viewer/GaussianSplatViewer").then((m) => m.GaussianSplatViewer),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

function ViewerSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-navy-950">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
        <p className="mt-4 font-display text-lg text-pearl/50">Initializing 3D Viewer...</p>
      </div>
    </div>
  );
}

interface TourAssets {
  spzUrls: { full_res?: string; "500k"?: string; "100k"?: string };
  thumbnailUrl?: string;
  caption?: string;
  marbleUrl?: string;
}

interface PublicTourData extends Tour {
  properties?: Property;
}

type RecordingState = "idle" | "recording" | "processing" | "done";

export default function SplatViewerPage() {
  const params = useParams();
  const tourId = params.id as string;

  const [tour, setTour] = useState<PublicTourData | null>(null);
  const [assets, setAssets] = useState<TourAssets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerControlsRef = useRef<ViewerControls | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(15);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showControls, setShowControls] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [tourData, assetsData] = await Promise.all([
          apiFetch<PublicTourData>(`/api/tours/public/${tourId}`),
          apiFetch<TourAssets>(`/api/tours/public/${tourId}/assets`),
        ]);
        setTour(tourData);
        setAssets(assetsData);
      } catch {
        setError("Tour not found or 3D assets are not available.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tourId]);

  const handleViewerReady = useCallback((controls: ViewerControls) => {
    viewerControlsRef.current = controls;
    setViewerReady(true);
  }, []);

  const startRecording = useCallback(() => {
    const controls = viewerControlsRef.current;
    if (!controls) return;
    const canvas = controls.getCanvas();
    if (!canvas) return;

    chunksRef.current = [];
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setRecordingState("done");
    };

    recorder.start(100);
    setRecordingState("recording");
    setShowControls(false);
    controls.startCinematicTour(duration);

    // Auto-stop after duration
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        controls.stopCinematicTour();
        setRecordingState("processing");
      }
    }, duration * 1000 + 500);
  }, [duration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    viewerControlsRef.current?.stopCinematicTour();
    setRecordingState("processing");
  }, []);

  const downloadVideo = useCallback(() => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tour-${tourId}-cinematic.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedBlob, tourId]);

  const resetRecording = useCallback(() => {
    setRecordingState("idle");
    setRecordedBlob(null);
    setShowControls(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
          <p className="mt-4 font-display text-lg text-pearl/50">Loading 3D Tour...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tour || !assets) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950">
        <div className="text-center">
          <Globe className="mx-auto h-16 w-16 text-pearl/20" />
          <h1 className="mt-4 font-display text-2xl font-bold text-alabaster">3D Viewer Unavailable</h1>
          <p className="mt-2 text-pearl/40">{error || "Could not load 3D assets."}</p>
          <Link href={`/tour/${tourId}`} className="mt-6 inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to Tour Info
          </Link>
        </div>
      </div>
    );
  }

  // Pick the best available .spz URL (prefer 500k for performance, fallback to full_res)
  const rawSpzUrl = assets.spzUrls["500k"] || assets.spzUrls.full_res || assets.spzUrls["100k"];

  // Proxy through Next.js rewrites to avoid CORS issues with the CDN
  const spzUrl = rawSpzUrl
    ? rawSpzUrl.replace("https://cdn.marble.worldlabs.ai/", "/api/splat-proxy/")
    : undefined;

  if (!spzUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950">
        <div className="text-center">
          <Globe className="mx-auto h-16 w-16 text-pearl/20" />
          <h1 className="mt-4 font-display text-2xl font-bold text-alabaster">No 3D Assets Found</h1>
          <p className="mt-2 text-pearl/40">The 3D scene files are not available yet.</p>
        </div>
      </div>
    );
  }

  const property = tour.properties;
  const marbleUrl = tour.world_id
    ? `https://marble.worldlabs.ai/world/${tour.world_id}`
    : null;

  return (
    <div className="relative h-screen w-screen bg-navy-950">
      {/* 3D Viewer - Full screen */}
      <GaussianSplatViewer spzUrl={spzUrl} onViewerReady={handleViewerReady} />


      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-navy-950/80 to-transparent">
        <Link href={`/tour/${tourId}`} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
            <span className="font-display text-xs font-bold text-navy-950">P</span>
          </div>
          <span className="font-display text-sm font-bold text-alabaster">
            Prop<span className="text-gold-400">Intel</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {property && (
            <span className="text-xs text-pearl/50 hidden sm:inline">{property.address}</span>
          )}
          {marbleUrl && (
            <a
              href={marbleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-navy-800/80 px-3 py-1.5 text-xs text-pearl/60 hover:text-pearl transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Marble
            </a>
          )}
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-1 rounded-lg bg-navy-800/80 px-3 py-1.5 text-xs text-pearl/60 hover:text-pearl transition-colors"
          >
            <Camera className="h-3 w-3" /> {showControls ? "Hide" : "Show"} Controls
          </button>
        </div>
      </div>

      {/* Recording indicator */}
      {recordingState === "recording" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-2 text-white text-sm font-medium animate-pulse">
          <div className="h-2 w-2 rounded-full bg-white" />
          Recording Cinematic Tour...
          <button onClick={stopRecording} className="ml-2 rounded bg-white/20 p-1 hover:bg-white/30">
            <Square className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Control panel */}
      {showControls && recordingState !== "recording" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90vw] max-w-md">
          <div className="rounded-2xl border border-gold-500/20 bg-navy-900/95 backdrop-blur-xl p-5 shadow-2xl">
            {recordingState === "idle" && (
              <>
                <h3 className="font-display text-sm font-semibold text-alabaster mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4 text-gold-400" />
                  Generate Cinematic Tour Video
                </h3>

                {/* Duration selector */}
                <div className="mb-4">
                  <label className="text-xs text-pearl/40 mb-1.5 block">Tour Duration</label>
                  <div className="flex gap-2">
                    {[10, 15, 30, 60].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          duration === d
                            ? "bg-gold-500 text-navy-950"
                            : "bg-navy-800/80 text-pearl/50 hover:text-pearl/80"
                        }`}
                      >
                        <Clock className="h-3 w-3 mx-auto mb-0.5" />
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Record button */}
                <button
                  onClick={startRecording}
                  disabled={!viewerReady}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-semibold text-white hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {viewerReady ? (
                    <>
                      <Video className="h-4 w-4" /> Start Recording
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading viewer...
                    </>
                  )}
                </button>

                <p className="mt-2 text-[10px] text-pearl/30 text-center">
                  Camera will auto-orbit the scene. Video saved as WebM.
                </p>
              </>
            )}

            {recordingState === "processing" && (
              <div className="text-center py-4">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-400" />
                <p className="mt-2 text-sm text-pearl/50">Processing video...</p>
              </div>
            )}

            {recordingState === "done" && recordedBlob && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                  <Video className="h-5 w-5" />
                  <span className="font-display text-sm font-semibold">Video Ready!</span>
                </div>
                <p className="text-xs text-pearl/40 mb-4">
                  {(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB • WebM format
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={downloadVideo}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-3 text-sm font-semibold text-navy-950 hover:from-gold-400 hover:to-gold-300 transition-all"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={resetRecording}
                    className="rounded-xl border border-gold-500/20 px-4 py-3 text-sm text-pearl/60 hover:text-pearl hover:bg-navy-800/50 transition-all"
                  >
                    New
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

