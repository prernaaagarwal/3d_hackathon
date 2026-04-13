"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const PROPERTY_TYPES = ["apartment", "villa", "townhouse", "commercial"] as const;
const AREAS = [
  "Downtown Dubai", "Dubai Marina", "Palm Jumeirah", "Business Bay",
  "JBR", "DIFC", "Dubai Hills", "Arabian Ranches", "JLT", "Dubai Creek Harbour",
  "Jumeirah Village Circle", "Dubai South", "Al Barsha", "Deira",
];

export default function NewPropertyPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      address: fd.get("address") as string,
      area: fd.get("area") as string,
      property_type: fd.get("property_type") as string,
      bedrooms: Number(fd.get("bedrooms")),
      bathrooms: Number(fd.get("bathrooms")),
      sqft: Number(fd.get("sqft")),
      price_aed: Number(fd.get("price_aed")),
      annual_rent_aed: fd.get("annual_rent_aed") ? Number(fd.get("annual_rent_aed")) : undefined,
      service_charge_aed: fd.get("service_charge_aed") ? Number(fd.get("service_charge_aed")) : undefined,
      description: (fd.get("description") as string) || undefined,
    };

    try {
      const token = await getToken();
      if (!token) { router.push("/login"); return; }
      await apiFetch("/api/properties", { method: "POST", token, body: JSON.stringify(body) });
      router.push("/dashboard/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-gold-500/15 bg-navy-800/60 px-4 py-3 text-alabaster placeholder:text-pearl/30 focus:border-gold-500/40 focus:outline-none focus:ring-1 focus:ring-gold-500/20";
  const labelCls = "mb-2 block text-sm font-medium text-pearl/60";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/properties" className="mb-6 inline-flex items-center gap-2 text-sm text-pearl/40 hover:text-gold-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Properties
      </Link>

      <h1 className="font-display text-3xl font-bold text-alabaster">Add Property</h1>
      <p className="mt-1 text-pearl/40">Enter your property details for ROI analysis</p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className={labelCls}>Address *</label>
          <input name="address" required placeholder="e.g. Marina Gate Tower 1, Unit 2301" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Area *</label>
            <select name="area" required className={inputCls}>
              <option value="">Select area</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Property Type *</label>
            <select name="property_type" required className={inputCls}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Bedrooms *</label>
            <input name="bedrooms" type="number" min="0" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Bathrooms *</label>
            <input name="bathrooms" type="number" min="0" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Sqft *</label>
            <input name="sqft" type="number" min="1" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Price (AED) *</label>
            <input name="price_aed" type="number" min="1" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Annual Rent (AED)</label>
            <input name="annual_rent_aed" type="number" min="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Service Charge (AED)</label>
            <input name="service_charge_aed" type="number" min="0" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" rows={3} placeholder="Property highlights..." className={inputCls} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Create Property
          </Button>
          <Link href="/dashboard/properties">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

