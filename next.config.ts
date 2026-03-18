import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [{ source: "/settings", destination: "/profile", permanent: false }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
    // Disable Turbopack if causing CSS issues
    // turbo: {},
  },
};

export default nextConfig;
