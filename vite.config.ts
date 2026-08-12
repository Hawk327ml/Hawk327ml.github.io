import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  build: {
    chunkSizeWarningLimit: 700,
    // Disable Vite's modulepreload helper: on flaky networks it hard-fails the
    // whole play entry when the ~0.5MB three chunk preload times out.
    modulePreload: false,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        play: resolve(root, "play/index.html"),
        pulse: resolve(root, "pulse/index.html"),
      },
    },
  },
});
