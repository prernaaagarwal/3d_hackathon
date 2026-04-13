"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "98%", label: "ROI Accuracy" },
  { value: "15K+", label: "Properties Analyzed" },
  { value: "3D", label: "Immersive Tours" },
  { value: "AI", label: "Powered Insights" },
];

export const HeroSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950" />
        {/* Radial gold glow */}
        <div className="absolute right-[-20%] top-[-10%] h-[800px] w-[800px] rounded-full bg-gold-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-gold-500/3 blur-[100px]" />
        {/* Geometric lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(201, 168, 76, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(201, 168, 76, 0.3) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left: Text */}
          <div className="flex flex-col justify-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 w-fit"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-2 text-sm font-medium text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                AI-Native Real Estate Intelligence
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-alabaster md:text-6xl lg:text-7xl"
            >
              Invest Smarter.{" "}
              <span className="text-gold-gradient">
                See Every Detail.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-pearl/60"
            >
              AI-driven ROI analytics, photorealistic 3D property tours, and
              real-time market intelligence — all in one platform built for Dubai
              investors.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link href="/roi-wizard">
                <Button size="lg" className="group">
                  Calculate ROI
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/prop-pulse">
                <Button variant="outline" size="lg" className="group">
                  <Play className="h-4 w-4" />
                  Explore Properties
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-16 grid grid-cols-4 gap-6"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="font-display text-2xl font-bold text-gold-400 md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-pearl/40">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative hidden lg:flex lg:items-center lg:justify-center"
          >
            <HeroDashboardMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-pearl/30">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-6 w-4 rounded-full border border-gold-500/30"
          >
            <div className="mx-auto mt-1 h-1.5 w-0.5 rounded-full bg-gold-400" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

/* === Dashboard Mockup Illustration === */
const HeroDashboardMockup = () => (
  <div className="relative w-full max-w-lg">
    {/* Glow behind */}
    <div className="absolute -inset-4 rounded-3xl bg-gold-500/10 blur-3xl" />

    {/* Main card */}
    <div className="relative rounded-2xl border border-gold-500/15 bg-navy-900/80 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold-500/10 pb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-alabaster">
            Downtown Dubai
          </h3>
          <p className="text-sm text-pearl/40">2BR Apartment · Burj Khalifa View</p>
        </div>
        <div className="rounded-lg bg-gold-500/10 px-3 py-1.5 text-sm font-semibold text-gold-400">
          AED 2.8M
        </div>
      </div>

      {/* Metrics row */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {[
          { label: "Gross Yield", value: "7.2%" },
          { label: "Net ROI", value: "5.8%" },
          { label: "IRR (5yr)", value: "12.4%" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-navy-800/60 p-3 text-center">
            <div className="font-display text-xl font-bold text-gold-400">
              {m.value}
            </div>
            <div className="mt-1 text-[11px] text-pearl/40">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="mt-4 flex h-32 items-end gap-1 rounded-xl bg-navy-800/40 p-4">
        {[40, 55, 35, 70, 60, 85, 75, 90, 65, 80, 95, 88].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: 1.0 + i * 0.05 }}
            className="flex-1 rounded-t bg-gradient-to-t from-gold-500/60 to-gold-400/30"
          />
        ))}
      </div>

      {/* 3D badge */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-gold-500/10 bg-navy-800/40 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
          <span className="text-lg">🏠</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-alabaster">3D Tour Ready</div>
          <div className="text-xs text-pearl/40">Gaussian Splat · Photorealistic</div>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </div>

    {/* Floating accent cards */}
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="absolute -right-6 -top-6 rounded-xl border border-gold-500/20 bg-navy-800/90 p-3 backdrop-blur-lg"
    >
      <div className="text-xs text-pearl/40">Monthly Cashflow</div>
      <div className="font-display text-lg font-bold text-emerald-400">+AED 8,450</div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 5, repeat: Infinity }}
      className="absolute -bottom-4 -left-6 rounded-xl border border-gold-500/20 bg-navy-800/90 p-3 backdrop-blur-lg"
    >
      <div className="text-xs text-pearl/40">AI Confidence</div>
      <div className="font-display text-lg font-bold text-gold-400">96.7%</div>
    </motion.div>
  </div>
);

