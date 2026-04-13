"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  MapPin, Bed, Bath, Maximize,
  Share2, Calculator, ChevronRight, Globe,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Tour, Property } from "@/lib/types";

interface PublicTourData extends Tour {
  properties?: Property;
}

export default function TourViewerPage() {
  const params = useParams();
  const tourId = params.id as string;

  const [tour, setTour] = useState<PublicTourData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<PublicTourData>(`/api/tours/public/${tourId}`);
        setTour(data);
      } catch {
        setError("Tour not found or is not publicly available.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tourId]);

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

  if (error || !tour) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950">
        <div className="text-center">
          <Globe className="mx-auto h-16 w-16 text-pearl/20" />
          <h1 className="mt-4 font-display text-2xl font-bold text-alabaster">Tour Unavailable</h1>
          <p className="mt-2 text-pearl/40">{error || "This tour could not be loaded."}</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const property = tour.properties;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = property
    ? `Check out this property: ${property.address}, ${property.area}`
    : "Check out this 3D property tour";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const marbleUrl = tour.world_id
    ? `https://marble.worldlabs.ai/world/${tour.world_id}`
    : null;

  const grossYield = property?.annual_rent_aed && property?.price_aed
    ? ((property.annual_rent_aed / property.price_aed) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
            <span className="font-display text-sm font-bold text-navy-950">P</span>
          </div>
          <span className="font-display text-lg font-bold text-alabaster">
            Prop<span className="text-gold-400">Intel</span>
          </span>
        </Link>
        <Link href="/prop-pulse" className="text-sm text-pearl/40 hover:text-pearl/70 transition-colors">
          ← Back to Properties
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Property Header */}
        {property && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Badges */}
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-gold-500/10 px-3 py-1 text-xs font-medium capitalize text-gold-400">
                {property.property_type}
              </span>
              {tour.quality === "high" && (
                <span className="rounded-lg bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
                  HD Quality
                </span>
              )}
              <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                <Globe className="h-3 w-3" /> 3D Tour
              </span>
            </div>

            {/* Address */}
            <div>
              <h1 className="font-display text-3xl font-bold text-alabaster">
                {property.address}
              </h1>
              <div className="mt-2 flex items-center gap-1 text-sm text-pearl/40">
                <MapPin className="h-4 w-4" /> {property.area}
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gold-500/10 bg-navy-800/50 p-4 text-center">
                <Bed className="mx-auto h-5 w-5 text-pearl/30" />
                <div className="mt-1 font-display text-xl font-bold text-alabaster">{property.bedrooms ?? "—"}</div>
                <div className="text-xs text-pearl/30">Beds</div>
              </div>
              <div className="rounded-xl border border-gold-500/10 bg-navy-800/50 p-4 text-center">
                <Bath className="mx-auto h-5 w-5 text-pearl/30" />
                <div className="mt-1 font-display text-xl font-bold text-alabaster">{property.bathrooms ?? "—"}</div>
                <div className="text-xs text-pearl/30">Baths</div>
              </div>
              <div className="rounded-xl border border-gold-500/10 bg-navy-800/50 p-4 text-center">
                <Maximize className="mx-auto h-5 w-5 text-pearl/30" />
                <div className="mt-1 font-display text-xl font-bold text-alabaster">{property.sqft?.toLocaleString() ?? "—"}</div>
                <div className="text-xs text-pearl/30">Sqft</div>
              </div>
            </div>

            {/* Price & Yield */}
            <div className="space-y-3">
              {property.price_aed && (
                <div className="flex items-center justify-between rounded-xl border border-gold-500/10 bg-navy-800/50 px-5 py-4">
                  <span className="text-sm text-pearl/40">Price</span>
                  <span className="font-display text-lg font-bold text-gold-400">
                    {formatCurrency(property.price_aed)}
                  </span>
                </div>
              )}
              {property.annual_rent_aed && (
                <div className="flex items-center justify-between rounded-xl border border-gold-500/10 bg-navy-800/50 px-5 py-4">
                  <span className="text-sm text-pearl/40">Annual Rent</span>
                  <span className="font-display text-lg font-bold text-emerald-400">
                    {formatCurrency(property.annual_rent_aed)}
                  </span>
                </div>
              )}
              {grossYield && (
                <div className="flex items-center justify-between rounded-xl border border-gold-500/10 bg-navy-800/50 px-5 py-4">
                  <span className="text-sm text-pearl/40">Gross Yield</span>
                  <span className="font-display text-lg font-bold text-blue-400">
                    {grossYield}%
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {tour.status === "complete" && tour.world_id && (
                <Link
                  href={`/viewer/${tourId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-3.5 text-sm font-semibold text-navy-950 hover:from-gold-400 hover:to-gold-300 transition-all"
                >
                  <Globe className="h-4 w-4" /> Open 3D Viewer & Record Tour
                </Link>
              )}
              {marbleUrl && (
                <a
                  href={marbleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-500/20 px-4 py-3.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/10 transition-all"
                >
                  <ExternalLink className="h-4 w-4" /> Open Marble Viewer
                </a>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <Share2 className="h-4 w-4" /> Share on WhatsApp
              </a>
              <Link
                href={`/roi-wizard?price=${property.price_aed}&rent=${property.annual_rent_aed ?? ""}&service=${property.service_charge_aed ?? ""}&address=${encodeURIComponent(property.address)}&area=${encodeURIComponent(property.area)}&type=${encodeURIComponent(property.property_type)}&beds=${property.bedrooms}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-500/20 px-4 py-3.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/10 transition-all"
              >
                <Calculator className="h-4 w-4" /> Calculate ROI
              </Link>
            </div>
          </motion.div>
        )}

        {!property && (
          <div className="text-center py-20">
            <Globe className="mx-auto h-16 w-16 text-gold-500/20" />
            <p className="mt-4 font-display text-xl text-pearl/30">3D Tour</p>
            <p className="mt-2 text-sm text-pearl/20">Status: {tour.status}</p>
            {marbleUrl && (
              <a
                href={marbleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-3 text-sm font-semibold text-navy-950 hover:from-gold-400 hover:to-gold-300 transition-all"
              >
                <ExternalLink className="h-4 w-4" /> Open Full Screen 3D Tour
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

