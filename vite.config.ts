import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/llm/silicon": {
        target: "https://api.siliconflow.cn",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/llm\/silicon/, ""),
      },
      "/llm/aiping": {
        target: "https://aiping.cn",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/llm\/aiping/, ""),
      },
      "/llm/qnaigc": {
        target: "https://api.qnaigc.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/llm\/qnaigc/, ""),
      },
    },
  },
});
