import os from "node:os";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  // кеш залежностей поза iCloud: інакше iCloud вивантажує його й dev-сервер зависає
  cacheDir: path.join(os.tmpdir(), "creative-work-vite"),
});
