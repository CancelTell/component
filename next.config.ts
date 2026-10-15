import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shake the icon set so only used icons end up in the bundle
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
