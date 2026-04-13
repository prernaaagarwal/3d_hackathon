"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calculator, BarChart3, ArrowLeft } from "lucide-react";

const toolLinks = [
  { href: "/roi-wizard", icon: Calculator, label: "ROI Wizard" },
  { href: "/prop-pulse", icon: BarChart3, label: "Prop Pulse" },
];

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-gold-500/10 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
                <span className="font-display text-sm font-bold text-navy-950">P</span>
              </div>
              <span className="font-display text-lg font-bold text-alabaster">
                Prop<span className="text-gold-400">Intel</span>
              </span>
            </Link>

            {/* Tool Links */}
            <div className="hidden items-center gap-1 md:flex">
              {toolLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gold-500/10 text-gold-400"
                        : "text-pearl/50 hover:bg-navy-800/60 hover:text-pearl/80"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-pearl/40 hover:text-gold-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-gold-500/30 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-gold-500/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

