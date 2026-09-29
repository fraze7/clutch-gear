import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: data is cached explicitly with 'use cache'; anything request-specific
  // (like the catalogue's search params) streams in inside <Suspense>
  cacheComponents: true,
  images: {
    // GitHub profile pictures on the account page
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
