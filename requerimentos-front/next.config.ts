import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
