"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Upload, Cpu, Eye, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Property Photos",
    description:
      "Drag and drop property images. Our pipeline optimizes and hosts them on a global CDN.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Generates 3D Tour",
    description:
      "World Labs' Marble API creates a photorealistic Gaussian Splat 3D world from your photos in under 60 seconds.",
  },
  {
    icon: Eye,
    step: "03",
    title: "Explore in 3D",
    description:
      "Walk through the property in an immersive 3D experience. Share public links with clients.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Get AI-Powered ROI",
    description:
      "Instant yield calculations, cashflow projections, and Gemini-generated investment narratives.",
  },
];

export const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative overflow-hidden py-32"
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900/50 to-navy-950" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-gold-400">
            Simple Process
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-alabaster md:text-5xl">
            From Photos to{" "}
            <span className="text-gold-gradient">3D Intelligence</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-10 hidden h-px w-8 bg-gold-500/20 lg:block" style={{ right: "-2rem" }} />
              )}

              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Step number */}
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold-500/20 bg-navy-800/60">
                    <step.icon className="h-8 w-8 text-gold-400" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 font-display text-xs font-bold text-navy-950">
                    {step.step}
                  </span>
                </div>

                <h3 className="font-display text-lg font-semibold text-alabaster">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-pearl/50">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

