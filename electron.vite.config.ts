import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
      },
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: isDevelopment,
      watch: isDevelopment
        ? {
            include: "src/main/**",
          }
        : undefined,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "src/main/main.ts"),
          "workers/downloadWorker": resolve(__dirname, "src/main/workers/downloadWorker.ts"),
          "workers/vacuumWorker": resolve(__dirname, "src/main/workers/vacuumWorker.ts"),
        },
        output: {
          dir: "out/main",
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
      },
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: isDevelopment,
      watch: isDevelopment ? {} : undefined,
      lib: {
        entry: "src/main/bridge.ts",
        formats: ["cjs"],
      },
      rollupOptions: {
        output: {
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    root: "src/renderer",
    resolve: {
      alias: {
        "@": resolve(__dirname, "src/renderer"),
        "@shared": resolve("src/shared"),
      },
    },
    build: {
      sourcemap: isDevelopment,
      rollupOptions: {
        input: "src/renderer/index.html",
      },
    },
    plugins: [react()],
  },
});
