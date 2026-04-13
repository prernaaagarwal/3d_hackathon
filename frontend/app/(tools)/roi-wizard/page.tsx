"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Calculator, TrendingUp, DollarSign, Percent,
  Building2, Sparkles, ArrowRight, MapPin, Bed,
} from "lucide-react";
import type { RoiInput, RoiResult } from "@/lib/types";

export default function RoiWizardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-navy-950"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" /></div>}>
      <RoiWizardContent />
    </Suspense>
  );
}

function RoiWizardContent() {
  const searchParams = useSearchParams();

  // Property context from query params (when linked from a property card)
  const propertyContext = {
    address: searchParams.get("address") || null,
    area: searchParams.get("area") || null,
    type: searchParams.get("type") || null,
    beds: searchParams.get("beds") || null,
    propertyId: searchParams.get("property") || null,
  };
  const hasPropertyContext = Boolean(propertyContext.address || propertyContext.area);

  const [input, setInput] = useState<RoiInput>({
    purchase_price: Number(searchParams.get("price")) || 2000000,
    annual_rent: Number(searchParams.get("rent")) || 120000,
    service_charge: Number(searchParams.get("service")) || 25000,
    has_mortgage: false,
    down_payment_pct: 25,
    mortgage_rate_pct: 4.5,
    mortgage_term_years: 25,
    holding_period_years: 10,
    appreciation_rate_pct: 5,
    ...(propertyContext.propertyId ? { property_id: propertyContext.propertyId } : {}),
  });
  const [result, setResult] = useState<RoiResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);

  // Auto-calculate on mount if params provided
  useEffect(() => {
    if (searchParams.get("price")) {
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const data = await apiFetch<RoiResult>("/api/roi/calculate", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (!result) return;
    setIsGeneratingNarrative(true);
    setNarrativeError(null);
    try {
      const payload = {
        area: propertyContext.area || "Dubai",
        purchasePrice: input.purchase_price,
        annualRent: input.annual_rent,
        grossYield: result.gross_yield,
        netYield: result.net_yield,
        monthlyCashflow: result.monthly_cashflow,
        irr5yr: result.irr_5yr,
        irr10yr: result.irr_10yr,
        holdingPeriodYears: input.holding_period_years ?? 10,
        appreciationRatePct: input.appreciation_rate_pct ?? 5,
        hasMortgage: input.has_mortgage ?? false,
      };
      const data = await apiFetch<{ narrative: string }>("/api/ai/roi-narrative", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNarrative(data.narrative);
    } catch (err) {
      setNarrativeError(err instanceof Error ? err.message : "Failed to generate narrative");
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const updateInput = (key: keyof RoiInput, value: number | boolean) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const inputCls =
    "w-full rounded-xl border border-gold-500/15 bg-navy-800/60 px-4 py-3 text-alabaster placeholder:text-pearl/30 focus:border-gold-500/40 focus:outline-none focus:ring-1 focus:ring-gold-500/20";
  const labelCls = "mb-1.5 block text-sm font-medium text-pearl/60";

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10">
            <Calculator className="h-5 w-5 text-gold-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-alabaster">ROI Wizard</h1>
        </div>
        <p className="text-pearl/40 ml-[52px]">
          Calculate rental yield, IRR, and cashflow projections for Dubai properties
        </p>

        {/* Property Context Banner */}
        {hasPropertyContext && (
          <div className="mt-4 ml-[52px] flex items-center gap-3 rounded-xl border border-gold-500/20 bg-gold-500/5 px-4 py-3">
            <Building2 className="h-5 w-5 text-gold-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-alabaster truncate">
                {propertyContext.address}
              </p>
              <div className="flex items-center gap-3 text-sm text-pearl/50">
                {propertyContext.area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {propertyContext.area}
                  </span>
                )}
                {propertyContext.type && (
                  <span className="capitalize">{propertyContext.type}</span>
                )}
                {propertyContext.beds && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-3 w-3" /> {propertyContext.beds} bed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Input Form — left column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
            <h2 className="mb-5 font-display text-lg font-semibold text-alabaster">
              Property Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Purchase Price (AED)</label>
                <input
                  type="number"
                  value={input.purchase_price}
                  onChange={(e) => updateInput("purchase_price", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Annual Rent (AED)</label>
                <input
                  type="number"
                  value={input.annual_rent}
                  onChange={(e) => updateInput("annual_rent", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Annual Service Charge (AED)</label>
                <input
                  type="number"
                  value={input.service_charge ?? 0}
                  onChange={(e) => updateInput("service_charge", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Mortgage Section */}
          <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-alabaster">Mortgage</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.has_mortgage ?? false}
                  onChange={(e) => updateInput("has_mortgage", e.target.checked)}
                  className="h-4 w-4 rounded border-gold-500/30 bg-navy-800 text-gold-500 focus:ring-gold-500/20"
                />
                <span className="text-sm text-pearl/50">Include Mortgage</span>
              </label>
            </div>

            {input.has_mortgage && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Down Payment (%)</label>
                  <input
                    type="number"
                    value={input.down_payment_pct ?? 25}
                    onChange={(e) => updateInput("down_payment_pct", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={input.mortgage_rate_pct ?? 4.5}
                    onChange={(e) => updateInput("mortgage_rate_pct", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Term (Years)</label>
                  <input
                    type="number"
                    value={input.mortgage_term_years ?? 25}
                    onChange={(e) => updateInput("mortgage_term_years", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Assumptions */}
          <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
            <h2 className="mb-5 font-display text-lg font-semibold text-alabaster">Assumptions</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Holding Period (Years)</label>
                <input
                  type="number"
                  value={input.holding_period_years ?? 10}
                  onChange={(e) => updateInput("holding_period_years", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Appreciation Rate (%/yr)</label>
                <input
                  type="number"
                  step="0.5"
                  value={input.appreciation_rate_pct ?? 5}
                  onChange={(e) => updateInput("appreciation_rate_pct", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            isLoading={isCalculating}
            className="w-full"
            size="lg"
          >
            <Calculator className="h-5 w-5" /> Calculate ROI
          </Button>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </motion.div>

        {/* Results — right column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          {result ? (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { icon: Percent, label: "Gross Yield", value: formatPercent(result.gross_yield), color: "text-gold-400", bg: "bg-gold-500/10" },
                  { icon: TrendingUp, label: "Net Yield", value: formatPercent(result.net_yield), color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { icon: DollarSign, label: "Monthly Cash", value: formatCurrency(result.monthly_cashflow), color: "text-blue-400", bg: "bg-blue-500/10" },
                  { icon: TrendingUp, label: "5-Year IRR", value: formatPercent(result.irr_5yr), color: "text-purple-400", bg: "bg-purple-500/10" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-5">
                    <div className="flex items-center gap-2 text-sm text-pearl/40">
                      <div className={`rounded-lg ${kpi.bg} p-1.5`}>
                        <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                      </div>
                      {kpi.label}
                    </div>
                    <div className={`mt-2 font-display text-2xl font-bold ${kpi.color}`}>
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 10-Year IRR & Expenses Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-5">
                  <span className="text-sm text-pearl/40">10-Year IRR</span>
                  <div className="mt-1 font-display text-2xl font-bold text-gold-400">
                    {formatPercent(result.irr_10yr)}
                  </div>
                </div>
                <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-5">
                  <span className="text-sm text-pearl/40">Annual Expenses</span>
                  <div className="mt-1 font-display text-2xl font-bold text-red-400">
                    {formatCurrency(result.annual_expenses)}
                  </div>
                  {result.annual_mortgage_payment > 0 && (
                    <p className="mt-1 text-xs text-pearl/30">
                      incl. mortgage: {formatCurrency(result.annual_mortgage_payment)}/yr
                    </p>
                  )}
                </div>
              </div>

              {/* Cashflow Projection Chart */}
              {result.cashflow_projection.length > 0 && (
                <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-alabaster">
                    Cashflow Projection
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.cashflow_projection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                        <XAxis dataKey="year" stroke="rgba(234,234,234,0.3)" fontSize={12} tickFormatter={(v) => `Y${v}`} />
                        <YAxis stroke="rgba(234,234,234,0.3)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0A1628", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", color: "#F5F5F5" }}
                          formatter={(value) => [formatCurrency(Number(value)), ""]}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="cashflow" name="Net Cashflow" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Property Value & Equity Chart */}
              {result.cashflow_projection.length > 0 && (
                <div className="rounded-2xl border border-gold-500/10 bg-navy-900/50 p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-alabaster">
                    Property Value & Equity
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.cashflow_projection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                        <XAxis dataKey="year" stroke="rgba(234,234,234,0.3)" fontSize={12} tickFormatter={(v) => `Y${v}`} />
                        <YAxis stroke="rgba(234,234,234,0.3)" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0A1628", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", color: "#F5F5F5" }}
                          formatter={(value) => [formatCurrency(Number(value)), ""]}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="propertyValue" name="Property Value" stroke="#D4B85C" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="equity" name="Equity" stroke="#34D399" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* AI Narrative Section */}
              <div className="rounded-2xl border border-gold-500/10 bg-linear-to-r from-navy-900/80 to-navy-800/40 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 shrink-0">
                    <Sparkles className="h-5 w-5 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-alabaster">
                      AI Investment Narrative
                    </h3>
                    {narrative ? (
                      <div className="mt-3 rounded-xl border border-gold-500/10 bg-navy-950/50 p-4">
                        <p className="text-sm leading-relaxed text-pearl/70 whitespace-pre-line">{narrative}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-pearl/40">
                        Get an AI-generated analysis of this investment, including market context, risk assessment, and recommendations.
                      </p>
                    )}
                    {narrativeError && (
                      <p className="mt-2 text-sm text-red-400">{narrativeError}</p>
                    )}
                    {!narrative && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleGenerateNarrative}
                        isLoading={isGeneratingNarrative}
                      >
                        <Sparkles className="h-4 w-4" /> Generate AI Report
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    {narrative && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={handleGenerateNarrative}
                        isLoading={isGeneratingNarrative}
                      >
                        <Sparkles className="h-4 w-4" /> Regenerate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-gold-500/15 bg-navy-900/30">
              <div className="text-center">
                <Building2 className="mx-auto h-16 w-16 text-pearl/10" />
                <h3 className="mt-4 font-display text-xl font-semibold text-pearl/30">
                  Enter Property Details
                </h3>
                <p className="mt-2 max-w-sm text-sm text-pearl/20">
                  Fill in the property details on the left and click &quot;Calculate ROI&quot; to see your investment analysis
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

