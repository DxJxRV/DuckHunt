const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  scope: basePath ? `${basePath}/` : "/",
  fallbacks: {
    document: "/",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-data-cache",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "jsdelivr-cdn-cache",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "mediapipe-models-cache",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-images-cache",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-cache",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath,
  // Note: assetPrefix not needed for static export with basePath
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
};

module.exports = withPWA(nextConfig);
