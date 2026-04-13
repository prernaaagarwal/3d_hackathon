"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  Calculator,
  BarChart3,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/properties", icon: Building2, label: "Properties" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

const toolLinks = [
  { href: "/roi-wizard", icon: Calculator, label: "ROI Wizard" },
  { href: "/prop-pulse", icon: BarChart3, label: "Prop Pulse" },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gold-500/10 bg-navy-950">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gold-500/10 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
          <span className="font-display text-sm font-bold text-navy-950">P</span>
        </div>
        <span className="font-display text-lg font-bold text-alabaster">
          Prop<span className="text-gold-400">Intel</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gold-500/10 text-gold-400"
                  : "text-pearl/50 hover:bg-navy-800/60 hover:text-pearl/80"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Public Tools Section */}
        <div className="mt-6 mb-2 px-4">
          <span className="text-xs font-medium uppercase tracking-wider text-pearl/25">Tools</span>
        </div>
        {toolLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-pearl/50 hover:bg-navy-800/60 hover:text-pearl/80 transition-all duration-200"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-pearl/20" />
          </Link>
        ))}
      </nav>

      {/* User & logout */}
      <div className="border-t border-gold-500/10 px-4 py-4">
        <div className="mb-3 truncate px-2 text-xs text-pearl/30">
          {user?.email}
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-pearl/50 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

