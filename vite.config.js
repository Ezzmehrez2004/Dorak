import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite setup, same tool as the course workshops (npm run dev).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
