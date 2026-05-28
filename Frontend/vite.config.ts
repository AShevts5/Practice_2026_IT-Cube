import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
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
