"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize, Building2,
  TrendingUp, Globe, Trash2, Calculator, ExternalLink,
  Loader2, Eye, EyeOff, Sparkles, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { UploadDropzone } from "@/lib/uploadthing";
import type { Property, Tour } from "@/lib/types";

export default function PropertyDetailPage() {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [togglingTourId, setTogglingTourId] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removingImageIdx, setRemovingImageIdx] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const [prop, allTours] = await Promise.all([
          apiFetch<Property>(`/api/properties/${id}`, { token }),
          apiFetch<Tour[]>("/api/tours", { token }),
        ]);

        setProperty(prop);
        setTours(
          Array.isArray(allTours)
            ? allTours.filter((t) => t.property_id === id)
            : []
        );
      } catch {
        router.push("/dashboard/properties");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, authLoading, getToken, router, id]);

  // Poll a processing tour for status updates
  const startPolling = useCallback((tourId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const status = await apiFetch<{ status: string; world_id?: string }>(`/api/jobs/${tourId}/status`, { token });
        if (status.status === "complete" || status.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          // Reload tours
          const allTours = await apiFetch<Tour[]>("/api/tours", { token });
          setTours(Array.isArray(allTours) ? allTours.filter((t) => t.property_id === id) : []);
          if (status.status === "complete") {
            setProperty((prev) => prev ? { ...prev, has_3d_tour: true } : prev);
          }
        }
      } catch { /* keep polling */ }
    }, 8000);
  }, [getToken, id]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // Auto-start polling for any processing tours
  useEffect(() => {
    const processingTour = tours.find((t) => t.status === "processing");
    if (processingTour) startPolling(processingTour.id);
  }, [tours, startPolling]);

  const handleGenerateTour = async () => {
    if (!property) return;
    if (!property.images || property.images.length < 2) {
      setGenerateError("At least 2 property photos are required to generate a 3D tour. Upload photos first.");
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const token = await getToken();
      if (!token) return;

      // Step 1: Create tour record
      const tour = await apiFetch<Tour>("/api/tours", {
        token,
        method: "POST",
        body: JSON.stringify({
          property_id: property.id,
          quality: "standard",
          photo_count: property.images.length,
        }),
      });

      // Step 2: Submit photos for 3D generation
      await apiFetch(`/api/jobs/${tour.id}/submit`, {
        token,
        method: "POST",
        body: JSON.stringify({ photo_urls: property.images }),
      });

      // Step 3: Add to local state and start polling
      setTours((prev) => [tour, ...prev]);
      startPolling(tour.id);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate 3D tour");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleVisibility = async (tourId: string, isPublic: boolean) => {
    setTogglingTourId(tourId);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await apiFetch<Tour>(`/api/tours/${tourId}/visibility`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ is_public: !isPublic }),
      });
      setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, is_public: updated.is_public } : t)));
    } catch { /* silently fail */ } finally {
      setTogglingTourId(null);
    }
  };

  const handleImagesUploaded = async (uploadThingUrls: string[]) => {
    if (!property) return;
    setUploadError(null);
    setIsUploadingImages(true);
    try {
      const token = await getToken();
      if (!token) return;

      // Save UploadThing URLs directly to property
      const updatedImages = [...(property.images ?? []), ...uploadThingUrls];
      const updated = await apiFetch<Property>(`/api/properties/${id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ images: updatedImages }),
      });
      setProperty(updated);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to save images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!property) return;
    setRemovingImageIdx(index);
    try {
      const token = await getToken();
      if (!token) return;
      const updatedImages = property.images.filter((_, i) => i !== index);
      const updated = await apiFetch<Property>(`/api/properties/${id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ images: updatedImages }),
      });
      setProperty(updated);
    } catch { /* silently fail */ } finally {
      setRemovingImageIdx(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await apiFetch(`/api/properties/${id}`, { method: "DELETE", token });
      router.push("/dashboard/properties");
    } catch {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  if (!property) return null;

  const grossYield = property.annual_rent_aed
    ? ((property.annual_rent_aed / property.price_aed) * 100).toFixed(1)
    : null;

  return (
    <div>
      <Link href="/dashboard/properties" className="mb-6 inline-flex items-center gap-2 text-sm text-pearl/40 hover:text-gold-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Properties
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-lg bg-gold-500/10 px-3 py-1 text-xs font-medium capitalize text-gold-400">
                {property.property_type}
              </span>
              {property.has_3d_tour && (
                <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  <Globe className="h-3 w-3" /> 3D Tour
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-alabaster">{property.address}</h1>
            <div className="mt-2 flex items-center gap-1 text-pearl/40">
              <MapPin className="h-4 w-4" /> {property.area}
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/roi-wizard?property=${property.id}&price=${property.price_aed}&rent=${property.annual_rent_aed ?? ""}&service=${property.service_charge_aed ?? ""}&address=${encodeURIComponent(property.address)}&area=${encodeURIComponent(property.area)}&type=${encodeURIComponent(property.property_type)}&beds=${property.bedrooms}`}>
              <Button variant="outline" size="sm"><Calculator className="h-4 w-4" /> ROI</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleDelete} isLoading={isDeleting} className="text-red-400 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TrendingUp, label: "Price", value: formatCurrency(property.price_aed), color: "text-gold-400" },
            { icon: Building2, label: "Annual Rent", value: property.annual_rent_aed ? formatCurrency(property.annual_rent_aed) : "—", color: "text-emerald-400" },
            { icon: TrendingUp, label: "Gross Yield", value: grossYield ? `${grossYield}%` : "—", color: "text-blue-400" },
            { icon: Building2, label: "Service Charge", value: property.service_charge_aed ? formatCurrency(property.service_charge_aed) : "—", color: "text-purple-400" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-5">
              <div className="flex items-center gap-2 text-sm text-pearl/40">
                <m.icon className={`h-4 w-4 ${m.color}`} /> {m.label}
              </div>
              <div className="mt-2 font-display text-xl font-bold text-alabaster">{m.value}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-alabaster">Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Bed className="mx-auto h-5 w-5 text-pearl/30" />
                <div className="mt-1 font-display text-lg font-bold text-alabaster">{property.bedrooms}</div>
                <div className="text-xs text-pearl/30">Bedrooms</div>
              </div>
              <div className="text-center">
                <Bath className="mx-auto h-5 w-5 text-pearl/30" />
                <div className="mt-1 font-display text-lg font-bold text-alabaster">{property.bathrooms}</div>
                <div className="text-xs text-pearl/30">Bathrooms</div>
              </div>
              <div className="text-center">
                <Maximize className="mx-auto h-5 w-5 text-pearl/30" />
                <div className="mt-1 font-display text-lg font-bold text-alabaster">{property.sqft.toLocaleString()}</div>
                <div className="text-xs text-pearl/30">Sqft</div>
              </div>
            </div>
            {property.description && (
              <p className="mt-6 border-t border-gold-500/10 pt-4 text-sm leading-relaxed text-pearl/50">{property.description}</p>
            )}
          </div>

          {/* 3D Tours */}
          <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-alabaster">3D Tours</h2>
              {property.images && property.images.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTour}
                  isLoading={isGenerating}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generate 3D Tour
                </Button>
              )}
            </div>

            {generateError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {generateError}
              </div>
            )}

            {tours.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gold-500/15 bg-navy-800/30 p-8 text-center">
                <Globe className="mx-auto h-8 w-8 text-pearl/20" />
                <p className="mt-3 text-sm text-pearl/40">No 3D tours yet</p>
                <p className="mt-1 text-xs text-pearl/30">
                  {property.images && property.images.length >= 2
                    ? "Click \"Generate 3D Tour\" to create an immersive property tour"
                    : "Upload at least 2 property photos to generate a 3D tour"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-xl border border-gold-500/10 bg-navy-800/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              tour.status === "complete"
                                ? "bg-emerald-400"
                                : tour.status === "processing"
                                ? "bg-yellow-400 animate-pulse"
                                : tour.status === "failed"
                                ? "bg-red-400"
                                : "bg-pearl/30"
                            }`}
                          />
                          <span className="text-sm font-medium capitalize text-alabaster">
                            {tour.status}
                          </span>
                          <span className="text-xs text-pearl/30">
                            · {tour.quality} quality
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-pearl/30">
                          {tour.photo_count} photos · Created{" "}
                          {new Date(tour.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Visibility toggle */}
                      {tour.status === "complete" && (
                        <button
                          onClick={() => handleToggleVisibility(tour.id, tour.is_public)}
                          disabled={togglingTourId === tour.id}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            tour.is_public
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-navy-700/50 text-pearl/40 hover:bg-navy-700/80"
                          }`}
                        >
                          {togglingTourId === tour.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : tour.is_public ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {tour.is_public ? "Public" : "Private"}
                        </button>
                      )}
                    </div>

                    {/* Processing indicator */}
                    {tour.status === "processing" && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 px-3 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-400" />
                        <span className="text-xs text-yellow-400">Generating 3D tour… this may take a few minutes</span>
                      </div>
                    )}

                    {tour.status === "failed" && tour.error_message && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-xs text-red-400">{tour.error_message}</span>
                      </div>
                    )}

                    {/* Action buttons for completed tours */}
                    {tour.status === "complete" && tour.world_id && (
                      <div className="mt-3 flex items-center gap-2">
                        <Link href={`/tour/${tour.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Globe className="h-3.5 w-3.5" /> View Tour
                          </Button>
                        </Link>
                        <a
                          href={`https://marble.worldlabs.ai/world/${tour.world_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-3.5 w-3.5" /> Open in Marble
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Property Images */}
        <div className="mt-8 rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-alabaster">
            Property Photos
            {property.images && property.images.length > 0 && (
              <span className="ml-2 text-sm font-normal text-pearl/40">
                ({property.images.length} photo{property.images.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>

          {uploadError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Existing images grid */}
          {property.images && property.images.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {property.images.map((url, idx) => (
                <div key={idx} className="group relative aspect-4/3 overflow-hidden rounded-xl border border-gold-500/10 bg-navy-800/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Property photo ${idx + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    disabled={removingImageIdx === idx}
                    className="absolute right-2 top-2 rounded-lg bg-navy-950/80 p-1.5 text-pearl/60 opacity-0 transition-all hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
                  >
                    {removingImageIdx === idx ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload dropzone */}
          <UploadDropzone
            endpoint="propertyImage"
            onUploadBegin={() => {
              setIsUploadingImages(true);
              setUploadError(null);
            }}
            onClientUploadComplete={(res) => {
              setIsUploadingImages(false);
              if (res && res.length > 0) {
                const urls = res.map((f) => f.ufsUrl);
                handleImagesUploaded(urls);
              }
            }}
            onUploadError={(err) => {
              setIsUploadingImages(false);
              setUploadError(err.message || "Upload failed");
            }}
            config={{ mode: "auto" }}
            appearance={{
              container: "border-dashed border-gold-500/15 bg-navy-800/30 rounded-xl p-6 ut-uploading:border-gold-500/30",
              label: "text-pearl/40 hover:text-gold-400 ut-uploading:text-gold-400",
              allowedContent: "text-pearl/30 text-xs",
              button: "bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 rounded-xl ut-uploading:bg-gold-500/20",
              uploadIcon: "text-pearl/20",
            }}
          />

          {isUploadingImages && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gold-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading images…
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
