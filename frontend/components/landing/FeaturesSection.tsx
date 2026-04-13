"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { GoldDivider } from "@/components/ui/GoldDivider";
import Link from "next/link";
import {
  TrendingUp,
  Globe,
  BarChart3,
  Brain,
  Layers3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "ROI Wizard",
    description:
      "Calculate gross yield, net yield, IRR, and monthly cashflow projections with mortgage modeling and appreciation scenarios.",
    accent: "from-emerald-400 to-emerald-600",
    href: "/roi-wizard",
  },
  {
    icon: Globe,
    title: "3D Property Tours",
    description:
      "Upload photos and get AI-generated photorealistic 3D Gaussian Splat tours. Walk through properties from anywhere in the world.",
    accent: "from-gold-400 to-gold-600",
    href: "/prop-pulse",
  },
  {
    icon: BarChart3,
    title: "Market Pulse",
    description:
      "Real-time area statistics, price trends, and comparative analytics across all major Dubai districts.",
    accent: "from-blue-400 to-blue-600",
    href: "/prop-pulse",
  },
  {
    icon: Brain,
    title: "AI Narratives",
    description:
      "Gemini-powered property descriptions and investment reports that translate complex data into actionable insights.",
    accent: "from-purple-400 to-purple-600",
  },
  {
    icon: Layers3,
    title: "Developer Intelligence",
    description:
      "Deep-dive reports on property developers — funding, headcount, hiring velocity, and risk analysis powered by Crustdata.",
    accent: "from-orange-400 to-orange-600",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Row-level security on all data. Your investments, calculations, and tours are encrypted and accessible only by you.",
    accent: "from-cyan-400 to-cyan-600",
  },
];

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="features" ref={ref} className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-gold-400">
            Platform Capabilities
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-alabaster md:text-5xl">
            Everything You Need to{" "}
            <span className="text-gold-gradient">Invest with Confidence</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-pearl/50">
            From data-driven analytics to immersive 3D experiences — one platform
            that transforms how you evaluate Dubai properties.
          </p>
        </motion.div>

        <GoldDivider className="mx-auto my-16 max-w-xs" />

        {/* Feature grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="group relative rounded-2xl border border-gold-500/10 bg-navy-900/50 p-8 transition-all duration-500 hover:border-gold-500/25 hover:bg-navy-800/50"
            >
              {feature.href ? (
                <Link href={feature.href} className="absolute inset-0 z-10" aria-label={`Go to ${feature.title}`} />
              ) : null}

              {/* Icon */}
              <div
                className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.accent} p-3 shadow-lg`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="font-display text-xl font-semibold text-alabaster">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-pearl/50">
                {feature.description}
              </p>

              {feature.href && (
                <span className="mt-4 inline-flex items-center text-sm font-medium text-gold-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Try it →
                </span>
              )}

              {/* Hover glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-gold-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

