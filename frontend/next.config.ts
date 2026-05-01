import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir HMR desde IP local
  // @ts-ignore
  allowedDevOrigins: ['192.168.100.6', 'localhost'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3005/:path*',
      },
    ];
  },
};

export default nextConfig;
