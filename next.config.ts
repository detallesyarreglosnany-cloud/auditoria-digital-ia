import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // PWA de pedidos (public/pedidos): Next no sirve índices de directorio
  async redirects() {
    return [{ source: '/pedidos', destination: '/pedidos/index.html', permanent: false }];
  },
};

export default nextConfig;
