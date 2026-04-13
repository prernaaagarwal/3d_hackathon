"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative py-32">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800 p-12 text-center md:p-20"
        >
          {/* Glow effects */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-gold-500/10 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-gold-500/10 blur-[80px]" />

          {/* Geometric accent */}
          <div className="absolute right-8 top-8 h-20 w-20 rotate-45 border border-gold-500/10 rounded-xl" />
          <div className="absolute bottom-8 left-8 h-16 w-16 rotate-12 border border-gold-500/10 rounded-xl" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl font-bold text-alabaster md:text-5xl">
              Ready to Transform Your{" "}
              <span className="text-gold-gradient">Investment Strategy?</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-pearl/50">
              Join investors using PropIntel to make smarter, data-driven
              property decisions in Dubai&apos;s dynamic market.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/roi-wizard">
                <Button size="lg" className="group">
                  Calculate ROI
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/prop-pulse">
                <Button variant="outline" size="lg">
                  Explore Properties
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-pearl/30">
              Broker?{" "}
              <Link href="/login" className="text-gold-400 hover:text-gold-300 transition-colors underline">
                Sign in to your dashboard
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

