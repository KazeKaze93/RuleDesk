import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";
import monkey from "vite-plugin-monkey";

const USERSCRIPT_RAW_URL =
  "https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js";

export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "RuleDesk Web",
        // Name and namespace identify the script to the manager: changing either
        // makes it a different script with empty storage. They stay as they were
        // when the repository was still called ruledesk-web.
        namespace: "https://github.com/kazekaze93/ruledesk-web",
        description:
          "Collections, playlists, favorites, artist updates, and page tweaks for rule34.xxx",
        version: "0.73.0",
        match: ["https://rule34.xxx/*"],
        "run-at": "document-start",
        // GM_xmlhttpRequest and the one host it may reach are for the site API
        // of the download manager only (src/site/api.ts): its address carries
        // the user's key, and a request made by the page would show it to the page.
        grant: ["GM_getValue", "GM_setValue", "GM_download", "GM_xmlhttpRequest"],
        connect: ["api.rule34.xxx"],
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
  // The built file is minified (Kaze, 19.11.2026): it is parsed on every page
  // before the first paint. The readable code is src/, at the commit of the release.
  build: {
    minify: true,
  },
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
