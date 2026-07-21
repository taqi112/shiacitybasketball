import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB; avatar uploads are validated up to 5MB (see
    // src/lib/avatar.ts), so Server Actions need enough room for the file
    // plus the rest of the form's fields.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
