import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: [
      'world.openfoodfacts.org',
      'images.openfoodfacts.org',
      'static.openfoodfacts.org',
      'supabase.co',
      'supabase.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
