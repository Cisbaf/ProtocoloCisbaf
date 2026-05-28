import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.78', 'http://192.168.1.78:3000'],

  experimental: {
    optimizePackageImports: [
      '@chakra-ui/react',
      'lucide-react',
      'react-icons'
    ],
    webpackBuildWorker: true,
  },
};

export default nextConfig;