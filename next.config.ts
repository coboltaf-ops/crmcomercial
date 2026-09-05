import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Igual que crmgtm: las páginas portadas de Ofertas tienen looseness de tipos.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  /* Force rebuild: FONDO BLANCO GLOBAL */
  // Anti-caché: el HTML de las páginas SIEMPRE se revalida con el servidor,
  // así el navegador nunca sirve una versión vieja en disco. Los archivos
  // estáticos hasheados (_next/static) quedan excluidos para no perder velocidad.
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
