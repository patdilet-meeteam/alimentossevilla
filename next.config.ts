import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta solo lo necesario para correr en producción (.next/standalone),
  // de modo que la imagen Docker no lleve node_modules completos.
  output: "standalone",
  // No anunciar el framework en cada respuesta.
  poweredByHeader: false,
};

export default nextConfig;
