import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Force rebuild: 2026-06-05T22:30:00Z */
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
