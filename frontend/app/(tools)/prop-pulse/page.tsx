"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  BarChart3, MapPin, Building2, TrendingUp,
  Search, Filter, ChevronRight, Globe, Calculator,
  Bed, Bath, Maximize, Loader2,
} from "lucide-react";
import Link from "next/link";

interface AreaStat {
  area: string;
  property_count: number;
  avg_price_per_sqft: number;
  avg_price: number;
  avg_gross_yield: number | null;
}

interface MarketProperty {
  id: string;
  address: string;
  area: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price_aed: number;
  annual_rent_aed: number | null;
  images: string[];
  has_3d_tour: boolean;
  tour_id: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PropPulsePage() {
  const [areas, setAreas] = useState<string[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStat[]>([]);
  const [properties, setProperties] = useState<MarketProperty[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [minBedrooms, setMinBedrooms] = useState<string>("");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Load areas and stats on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [areasData, statsData] = await Promise.all([
          apiFetch<string[]>("/api/market/areas"),
          apiFetch<AreaStat[]>("/api/market/stats"),
        ]);
        setAreas(areasData);
        setAreaStats(statsData);
      } catch {
        // Silently handle — empty state shown
      } finally {
        setIsLoadingStats(false);
      }
    };
    load();
  }, []);

  // Load properties when filters change
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      try {
        const params = new URLSearchParams();
        if (selectedArea) params.set("area", selectedArea);
        if (propertyType) params.set("property_type", propertyType);
        if (minBedrooms) params.set("min_bedrooms", minBedrooms);
        params.set("page", String(currentPage));
        params.set("limit", "12");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/market/properties?${params}`
        );
        const json = await res.json();
        setProperties(json.data ?? []);
        setPagination(json.pagination ?? null);
      } catch {
        setProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    };
    loadProperties();
  }, [selectedArea, propertyType, minBedrooms, currentPage]);

  const inputCls =
    "w-full rounded-xl border border-gold-500/15 bg-navy-800/60 px-4 py-3 text-alabaster placeholder:text-pearl/30 focus:border-gold-500/40 focus:outline-none focus:ring-1 focus:ring-gold-500/20 text-sm";

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10">
            <BarChart3 className="h-5 w-5 text-gold-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-alabaster">Prop Pulse</h1>
        </div>
        <p className="text-pearl/40 ml-[52px]">
          Dubai real estate market intelligence — area statistics, property browsing, and developer insights
        </p>
      </motion.div>

      {/* Area Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8"
      >
        <h2 className="mb-4 font-display text-xl font-semibold text-alabaster">Area Statistics</h2>

        {isLoadingStats ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
          </div>
        ) : areaStats.length > 0 ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {areaStats.slice(0, 4).map((stat) => (
                <button
                  key={stat.area}
                  onClick={() => setSelectedArea(stat.area)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    selectedArea === stat.area
                      ? "border-gold-500/40 bg-gold-500/5"
                      : "border-gold-500/10 bg-navy-900/50 hover:border-gold-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm text-pearl/40">
                    <MapPin className="h-3.5 w-3.5" /> {stat.area}
                  </div>
                  <div className="mt-2 font-display text-xl font-bold text-alabaster">
                    {formatCurrency(stat.avg_price)}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-pearl/30">
                    <span>{stat.property_count} properties</span>
                    {stat.avg_gross_yield !== null && (
                      <span className="text-emerald-400">{stat.avg_gross_yield}% yield</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Area Chart */}
            <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-alabaster">
                Average Price per Sqft by Area
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                    <XAxis dataKey="area" stroke="rgba(234,234,234,0.3)" fontSize={11} angle={-35} textAnchor="end" height={80} />
                    <YAxis stroke="rgba(234,234,234,0.3)" fontSize={12} tickFormatter={(v) => `${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0A1628", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", color: "#F5F5F5" }}
                      formatter={(value) => [`AED ${formatNumber(Number(value))}/sqft`, "Avg Price"]}
                    />
                    <Bar dataKey="avg_price_per_sqft" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gold-500/15 bg-navy-900/30 p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-pearl/15" />
            <p className="mt-3 text-pearl/30">No area statistics available yet</p>
            <p className="mt-1 text-xs text-pearl/20">Add properties to see market data</p>
          </div>
        )}
      </motion.div>

      {/* Filters + Property Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10"
      >
        <h2 className="mb-4 font-display text-xl font-semibold text-alabaster">Browse Properties</h2>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-pearl/40">
            <Filter className="h-4 w-4" /> Filters:
          </div>
          <select
            value={selectedArea}
            onChange={(e) => { setSelectedArea(e.target.value); setCurrentPage(1); }}
            className={`${inputCls} w-48`}
          >
            <option value="">All Areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={propertyType}
            onChange={(e) => { setPropertyType(e.target.value); setCurrentPage(1); }}
            className={`${inputCls} w-40`}
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="townhouse">Townhouse</option>
            <option value="commercial">Commercial</option>
          </select>
          <select
            value={minBedrooms}
            onChange={(e) => { setMinBedrooms(e.target.value); setCurrentPage(1); }}
            className={`${inputCls} w-32`}
          >
            <option value="">Beds</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          {(selectedArea || propertyType || minBedrooms) && (
            <button
              onClick={() => { setSelectedArea(""); setPropertyType(""); setMinBedrooms(""); setCurrentPage(1); }}
              className="text-sm text-gold-400 hover:text-gold-300"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Property Grid */}
        {isLoadingProperties ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-gold-500/10 bg-navy-900/50 p-5 hover:border-gold-500/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-gold-500/10 px-2 py-0.5 text-xs font-medium capitalize text-gold-400">
                        {p.property_type}
                      </span>
                      {p.has_3d_tour && (
                        <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          <Globe className="h-3 w-3" /> 3D
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-base font-semibold text-alabaster line-clamp-1">
                    {p.address}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-pearl/40">
                    <MapPin className="h-3 w-3" /> {p.area}
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-pearl/40">
                    <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {p.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {p.bathrooms}</span>
                    <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {p.sqft.toLocaleString()}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-gold-400">
                      {formatCurrency(p.price_aed)}
                    </span>
                    {p.annual_rent_aed && (
                      <span className="text-xs text-emerald-400">
                        {((p.annual_rent_aed / p.price_aed) * 100).toFixed(1)}% yield
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/roi-wizard?price=${p.price_aed}&rent=${p.annual_rent_aed ?? ""}&address=${encodeURIComponent(p.address)}&area=${encodeURIComponent(p.area)}&type=${encodeURIComponent(p.property_type)}&beds=${p.bedrooms}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gold-500/20 py-2 text-xs font-medium text-gold-400 hover:bg-gold-500/10 transition-all"
                    >
                      <Calculator className="h-3.5 w-3.5" /> ROI
                    </Link>
                    {p.has_3d_tour && p.tour_id && (
                      <Link
                        href={`/tour/${p.tour_id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        <Globe className="h-3.5 w-3.5" /> View 3D
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-gold-500/20 px-4 py-2 text-sm text-pearl/50 hover:bg-navy-800 disabled:opacity-30 transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-pearl/40">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} properties)
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="rounded-xl border border-gold-500/20 px-4 py-2 text-sm text-pearl/50 hover:bg-navy-800 disabled:opacity-30 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gold-500/15 bg-navy-900/30 p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-pearl/15" />
            <p className="mt-3 text-pearl/30">No properties found</p>
            <p className="mt-1 text-xs text-pearl/20">Try adjusting your filters or add properties to see listings</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}