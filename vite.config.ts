import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  build: {
    chunkSizeWarningLimit: 700,
    // Avoid hard-failing when a separate three preload times out on flaky networks.
    modulePreload: {
      polyfill: true,
      resolveDependencies(filename, deps) {
        // Keep CSS/polyfill preloads; don't force-preload the heavy engine graph.
        if (filename.includes("play")) {
          return deps.filter((d) => d.endsWith(".css") || d.includes("modulepreload-polyfill"));
        }
        return deps;
      },
    },
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        play: resolve(root, "play/index.html"),
        pulse: resolve(root, "pulse/index.html"),
      },
    },
  },
});
