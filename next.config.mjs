import path from "node:path"
import nextEnv from "@next/env"
import createNextIntlPlugin from "next-intl/plugin"

const { loadEnvConfig } = nextEnv

/** When cwd is /app (Docker) or polyraspad-frontend (dev), monorepo root is one level up. */
const frontendDir = process.cwd()
const repoRoot = path.resolve(frontendDir, "..")

// Shared keys (e.g. AI_PROXY_API_KEY) in repo-root .env; frontend .env* overrides.
loadEnvConfig(repoRoot)
loadEnvConfig(frontendDir)

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
  },
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

export default withNextIntl(nextConfig)

