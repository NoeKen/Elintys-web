import type { NextConfig } from "next";
import path from "node:path";
import { legacyDashboardRedirects } from "./src/shared/navigation/legacy-dashboard-redirects";
import { resolveElintysEnvironment, shouldBlockIndexing } from "./src/shared/config/environment";

// Évalué au build : une valeur NEXT_PUBLIC_ELINTYS_ENV invalide fait échouer
// le déploiement au lieu de produire un site mal étiqueté.
const elintysEnvironment = resolveElintysEnvironment();

const nextConfig: NextConfig = {
  /**
   * dev.elintys.com / uat.elintys.com : en-tête X-Robots-Tag sur TOUTES les
   * réponses. Contrairement aux métadonnées, une page ne peut pas le
   * surcharger (les fiches événement déclarent leur propre `robots`).
   */
  async headers() {
    if (!shouldBlockIndexing(elintysEnvironment)) return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
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
