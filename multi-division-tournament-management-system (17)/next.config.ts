import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Embarque les polices de pdfkit dans les fonctions serveur (Vercel)
  // pour la génération du PDF « Résultats & Classement ».
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
