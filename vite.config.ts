import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";
import monkey from "vite-plugin-monkey";

const USERSCRIPT_RAW_URL =
  "https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js";

export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "RuleDesk Web",
        namespace: "https://github.com/kazekaze93/ruledesk-web",
        description:
          "Collections, playlists, favorites, artist updates, and page tweaks for rule34.xxx",
        version: "0.16.6",
        match: ["https://rule34.xxx/*"],
        "run-at": "document-start",
        grant: ["GM_getValue", "GM_setValue"],
        updateURL: USERSCRIPT_RAW_URL,
        downloadURL: USERSCRIPT_RAW_URL,
      },
      build: {
        fileName: "ruledesk-web.user.js",
        // Dynamic import("./boot/app") stays one userscript file (SystemJS inlined).
        systemjs: "inline",
      },
    }),
  ],
  resolve: {
    dedupe: ["preact"],
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
