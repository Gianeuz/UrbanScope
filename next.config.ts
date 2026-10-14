import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Linting is not part of this project's toolchain (no ESLint installed).
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Property photos and inquiry documents are uploaded through Server Actions.
    // Documents are capped at 5 MB each by the app; allow headroom for multi-file forms.
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
