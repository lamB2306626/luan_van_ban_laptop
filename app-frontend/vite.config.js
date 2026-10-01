import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3001, // Chạy Frontend ở port 3001
    proxy: {
      "/api": {
        target: "http://localhost:5000/", // Địa chỉ port Backend của bạn
        changeOrigin: true,
      },
    },
  },
});
