import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable standalone to test
  // output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;