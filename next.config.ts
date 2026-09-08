import type { NextConfig } from "next";
import path from "node:path";
import { legacyDashboardRedirects } from "./src/shared/navigation/legacy-dashboard-redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return legacyDashboardRedirects.map((redirect) => ({ ...redirect }));
  },
  /**
   * Dossier de build isolable.
   *
   * `next dev` occupe `.next` en permanence : y lancer un `next build` corrompt
   * le cache et renvoie des 404 sur toutes les routes. Les mesures de
   * performance construisent donc dans `.next-perf` sans arrêter le serveur de
   * développement.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
