import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: { "/api": "http://localhost:5004", "/uploads": "http://localhost:5004", "/socket.io": { target: "http://localhost:5004", ws: true } } }
});
