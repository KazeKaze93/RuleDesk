import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";
import monkey from "vite-plugin-monkey";

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
        version: "0.75.0",
        license: "GPL-3.0-or-later",
        match: ["https://rule34.xxx/*"],
        "run-at": "document-start",
        // GM_xmlhttpRequest and the one host it may reach are for the site API
        // of the download manager only (src/site/api.ts): its address carries
        // the user's key, and a request made by the page would show it to the page.
        grant: ["GM_getValue", "GM_setValue", "GM_download", "GM_xmlhttpRequest"],
        connect: ["api.rule34.xxx"],
        // No updateURL and no downloadURL (0.75.0): the catalogue the script is
        // published in does not allow a header that sends updates past it. A
        // script manager then asks the address the script was installed from.
      },
      build: {
        fileName: "ruledesk-web.user.js",
        // Dynamic import("./boot/app") stays one userscript file (SystemJS inlined).
        systemjs: "inline",
      },
    }),
  ],
  // The built file is not minified (0.75.0): the catalogue the script is
  // published in asks for code that can be read, with its spaces and names.
  // It was minified from 0.72.1 to 0.74.3. Measured on 0.74.3: first paint
  // 4 ms later on a mock page, about 12 ms on the site (docs/development.md).
  build: {
    minify: false,
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
