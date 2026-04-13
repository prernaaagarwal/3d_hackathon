"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Building2, TrendingUp, Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Property } from "@/lib/types";

interface DashboardStats {
  totalProperties: number;
  totalValue: number;
  avgYield: number;
  activeTours: number;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalValue: 0,
    avgYield: 0,
    activeTours: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const data = await apiFetch<Property[]>("/api/properties", { token });
        const propList = Array.isArray(data) ? data : [];
        setProperties(propList);

        const totalValue = propList.reduce((sum, p) => sum + p.price_aed, 0);
        const rents = propList.filter((p) => p.annual_rent_aed);
        const avgYield =
          rents.length > 0
            ? rents.reduce(
                (sum, p) => sum + ((p.annual_rent_aed ?? 0) / p.price_aed) * 100,
                0
              ) / rents.length
            : 0;
        const activeTours = propList.filter((p) => p.has_3d_tour).length;

        setStats({
          totalProperties: propList.length,
          totalValue,
          avgYield,
          activeTours,
        });
      } catch {
        // silently handle - empty state will show
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, authLoading, getToken, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { icon: Building2, label: "Properties", value: stats.totalProperties.toString(), color: "text-blue-400" },
    { icon: TrendingUp, label: "Portfolio Value", value: formatCurrency(stats.totalValue), color: "text-gold-400" },
    { icon: BarChart3, label: "Avg Gross Yield", value: `${stats.avgYield.toFixed(1)}%`, color: "text-emerald-400" },
    { icon: Globe, label: "3D Tours", value: stats.activeTours.toString(), color: "text-purple-400" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-alabaster">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
          </h1>
          <p className="mt-1 text-pearl/40">Your investment dashboard overview</p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>Add Property</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-navy-800/60 p-2.5">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-sm text-pearl/40">{stat.label}</span>
            </div>
            <div className="mt-4 font-display text-2xl font-bold text-alabaster">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Properties */}
      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-alabaster">
          Recent Properties
        </h2>
        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold-500/15 bg-navy-900/30 p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-pearl/20" />
            <p className="mt-4 text-pearl/40">No properties yet</p>
            <Link href="/dashboard/properties/new" className="mt-4 inline-block">
              <Button size="sm">Add Your First Property</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((prop) => (
              <Link key={prop.id} href={`/dashboard/properties/${prop.id}`}>
                <div className="group rounded-2xl border border-gold-500/10 bg-navy-900/50 p-5 transition-all hover:border-gold-500/25">
                  <h3 className="font-display text-base font-semibold text-alabaster group-hover:text-gold-400 transition-colors">
                    {prop.address}
                  </h3>
                  <p className="mt-1 text-sm text-pearl/40">{prop.area}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-gold-400">
                      {formatCurrency(prop.price_aed)}
                    </span>
                    <span className="text-xs text-pearl/30">
                      {prop.bedrooms}BR · {prop.sqft} sqft
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

