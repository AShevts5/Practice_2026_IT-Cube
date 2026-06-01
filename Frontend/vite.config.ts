import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "offline.html",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "screenshot-mobile.png",
        "screenshot-wide.png",
      ],
      manifest: {
        name: "EventsPlatform",
        short_name: "EventsPlatform",
        description: "Платформа регистрации команд на мероприятия",
        theme_color: "#6366f1",
        background_color: "#f5f6fa",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "ru",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshot-mobile.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Список мероприятий на телефоне",
          },
          {
            src: "screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "EventsPlatform на рабочем столе",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/v1/public/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "public-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/v1/"),
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      "/api/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules\/(react|react-dom|scheduler)\//,
            },
            {
              name: "router",
              test: /node_modules\/react-router/,
            },
            {
              name: "query",
              test: /node_modules\/@tanstack\//,
            },
            {
              name: "radix",
              test: /node_modules\/radix-ui\//,
            },
            {
              name: "forms",
              test: /node_modules\/(react-hook-form|@hookform|zod)\//,
            },
          ],
        },
      },
    },
  },
});
