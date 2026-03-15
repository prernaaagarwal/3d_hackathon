import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ucarecdn.com" },
      { protocol: "https", hostname: "cdn.marble.worldlabs.ai" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
  // Proxy .spz file requests to World Labs CDN to avoid CORS issues
  async rewrites() {
    return [
      {
        source: "/api/splat-proxy/:path*",
        destination: "https://cdn.marble.worldlabs.ai/:path*",
      },
    ];
  },
  // Add headers needed for SharedArrayBuffer (optional, improves perf)
  async headers() {
    return [
      {
        source: "/viewer/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
