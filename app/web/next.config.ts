import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // In production, use NEXT_PUBLIC_API_URL if set, otherwise use localhost for dev
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4021';
    
    // Only use rewrites in development (when API_URL is localhost)
    // In production, components will call the API directly using NEXT_PUBLIC_API_URL
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ];
    }
    
    // Production: no rewrites needed, components use NEXT_PUBLIC_API_URL directly
    return [];
  },
};

export default nextConfig;
