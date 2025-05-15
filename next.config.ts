import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: false, // Socket.io bağlantı sorunlarını önlemek için
  webpack: (config) => {
    // socket.io-client için polyfill
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
    };
    
    return config;
  },
};

export default nextConfig;