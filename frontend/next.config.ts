import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir HMR desde IP local
  // @ts-ignore
  allowedDevOrigins: ['192.168.100.6', 'localhost'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3005'}/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
