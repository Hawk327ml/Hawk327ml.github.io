import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const assistDocs = ["DESIGN.md", "SPEC.md", "GATE.md", "README.md"] as const;

export default defineConfig({
  base: "/",
  plugins: [
    {
      name: "copy-assist-docs",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split("?")[0] ?? "";
          const match = assistDocs.find((doc) => url === `/assist/${doc}`);
          if (!match) {
            next();
            return;
          }
          try {
            const body = readFileSync(resolve(root, "assist", match), "utf8");
            res.setHeader("Content-Type", "text/markdown; charset=utf-8");
            res.end(body);
          } catch {
            next();
          }
        });
      },
      writeBundle() {
        const outDir = resolve(root, "dist/assist");
        mkdirSync(outDir, { recursive: true });
        for (const doc of assistDocs) {
          copyFileSync(resolve(root, "assist", doc), resolve(outDir, doc));
        }
      },
    },
  ],
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
        assist: resolve(root, "assist/index.html"),
      },
    },
  },
});
