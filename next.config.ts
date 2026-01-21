import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
    // Disable Turbopack if causing CSS issues
    // turbo: {},
  },
};

export default nextConfig;
