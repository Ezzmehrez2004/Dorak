import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite setup, same tool as the course workshops (npm run dev).
// VITE_BASE lets the same code run at the site root (local dev, Netlify)
// and under /Dorak/ on GitHub Pages; the Pages workflow sets it.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: { port: 5173, open: true },
});
