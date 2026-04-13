import Link from "next/link";
import { GoldDivider } from "@/components/ui/GoldDivider";

const footerLinks = {
  Product: [
    { label: "ROI Wizard", href: "/roi-wizard" },
    { label: "Market Pulse", href: "/prop-pulse" },
    { label: "3D Tours", href: "#3d-tours" },
    { label: "AI Reports", href: "#features" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export const Footer = () => {
  return (
    <footer className="border-t border-gold-500/10 bg-navy-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
                <span className="font-display text-lg font-bold text-navy-950">
                  P
                </span>
              </div>
              <span className="font-display text-xl font-bold text-alabaster">
                Prop<span className="text-gold-400">Intel</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-pearl/40">
              AI-native real estate intelligence for Dubai&apos;s premium property
              market.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
                {category}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-pearl/50 transition-colors hover:text-gold-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <GoldDivider className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-pearl/30">
            © {new Date().getFullYear()} PropIntel. All rights reserved.
          </p>
          <p className="text-xs text-pearl/30">
            Built for Dubai investors · Powered by AI
          </p>
        </div>
      </div>
    </footer>
  );
};

