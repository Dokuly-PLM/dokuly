import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "dokuly/frontend");

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    root: frontendRoot,
    base: isDev ? "/" : "/static/frontend/",
    plugins: [
      react({
        include: [/\.jsx?$/, /\.tsx?$/], // make .js eligible
      }),
      nodePolyfills(),
      ...(isDev ? [] : [cssInjectedByJsPlugin()]),
    ],
    resolve: {
      alias: { "@": path.resolve(frontendRoot, "src") },
      extensions: [".js", ".jsx"],
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": "http://localhost:8000",
        "/admin": "http://localhost:8000",
        "/static": "http://localhost:8000",
      },
      // If running through Docker/reverse proxy, these are the knobs:
      // hmr: { host: "localhost", clientPort: 3000 },
    },
    build: {
      outDir: path.resolve(frontendRoot, "static/frontend"),
      emptyOutDir: false,
      rollupOptions: {
        // We keep JS input, but the “Vite-native” approach is input: index.html.
        input: path.resolve(frontendRoot, "src/index.js"),
        output: { entryFileNames: "main.js" },
      },
    },
    esbuild: {
      // Treat .js like JSX so Vite can parse it during import analysis
      loader: "jsx",
      include: /src\/.*\.js$/,
      exclude: [], // important: don't exclude node_modules by default patterns
      jsx: "automatic",
    },
    optimizeDeps: {
      // For dependency pre-bundling (and some edge cases), also force .js -> jsx
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
  };
});
