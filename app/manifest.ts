import { MetadataRoute } from 'next'
import { getBasePath } from '@/lib/basePath'

export default function manifest(): MetadataRoute.Manifest {
  const basePath = getBasePath()

  return {
    name: 'VoidHunter - Hand Tracking Game',
    short_name: 'VoidHunter',
    description: 'Un juego de defensa donde TÚ eres el arma. 100% Hand Tracking sin controles.',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'landscape',
    icons: [
      {
        src: `${basePath}/icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: `${basePath}/icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
