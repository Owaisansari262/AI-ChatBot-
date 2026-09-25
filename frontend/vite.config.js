import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During local dev, forward /api calls to the Express backend
      // so the frontend never needs to hardcode a backend URL.
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
