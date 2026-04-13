"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Building2, Plus, MapPin, Bed, Maximize, Eye } from "lucide-react";
import Link from "next/link";
import type { Property } from "@/lib/types";

export default function PropertiesPage() {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<Property[]>("/api/properties", { token });
        setProperties(Array.isArray(data) ? data : []);
      } catch { /* empty state */ } finally { setIsLoading(false); }
    };
    load();
  }, [user, authLoading, getToken, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-alabaster">Properties</h1>
          <p className="mt-1 text-pearl/40">Manage your real estate portfolio</p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button><Plus className="h-4 w-4" /> Add Property</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gold-500/15 bg-navy-900/30 p-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-pearl/20" />
          <h3 className="mt-4 font-display text-lg font-semibold text-alabaster">No properties yet</h3>
          <p className="mt-2 text-pearl/40">Add your first property to start analyzing ROI</p>
          <Link href="/dashboard/properties/new" className="mt-6 inline-block">
            <Button>Add Property</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/dashboard/properties/${prop.id}`}>
                <div className="group rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6 transition-all duration-300 hover:border-gold-500/25 hover:bg-navy-800/50">
                  {/* Type badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg bg-gold-500/10 px-3 py-1 text-xs font-medium capitalize text-gold-400">
                      {prop.property_type}
                    </span>
                    {prop.has_3d_tour && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Eye className="h-3 w-3" /> 3D Tour
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-semibold text-alabaster transition-colors group-hover:text-gold-400">
                    {prop.address}
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-sm text-pearl/40">
                    <MapPin className="h-3.5 w-3.5" /> {prop.area}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-display text-xl font-bold text-gold-400">
                      {formatCurrency(prop.price_aed)}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-4 border-t border-gold-500/10 pt-4 text-xs text-pearl/40">
                    <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {prop.bedrooms} BR</span>
                    <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {prop.sqft} sqft</span>
                    {prop.annual_rent_aed && (
                      <span className="ml-auto text-emerald-400">
                        {((prop.annual_rent_aed / prop.price_aed) * 100).toFixed(1)}% yield
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

