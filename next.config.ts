import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB; avatar uploads are validated up to 4MB (see
    // src/lib/avatar.ts). Kept under Vercel's ~4.5MB hard platform limit for
    // serverless function request bodies -- anything over that gets dropped
    // at the edge as a raw connection failure, before this config (or our
    // own validation) ever runs.
    serverActions: {
      bodySizeLimit: "4.4mb",
    },
  },
};

export default nextConfig;
