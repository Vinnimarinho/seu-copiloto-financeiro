import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
            "@radix-ui/react-accordion",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-menubar",
            "@radix-ui/react-context-menu",
          ],
          "charts": ["recharts"],
          "motion": ["framer-motion"],
          "exceljs": ["exceljs"],
          "supabase": ["@supabase/supabase-js"],
          "query": ["@tanstack/react-query"],
          "i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
          "markdown": ["react-markdown"],
          "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
}));
