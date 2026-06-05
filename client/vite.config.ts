import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inspectAttr } from "kimi-plugin-inspect-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [inspectAttr(), react()],
  server: {
    port: 4678,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "../server/contracts"),
      "@db": path.resolve(__dirname, "../server/db"),
      db: path.resolve(__dirname, "../server/db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "../server/dist/public"),
    emptyOutDir: true,
  },
});
