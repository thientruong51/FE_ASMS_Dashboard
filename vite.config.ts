import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/", 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@app": path.resolve(__dirname, "src/app"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@theme": path.resolve(__dirname, "src/theme"),
    },
  },
});

