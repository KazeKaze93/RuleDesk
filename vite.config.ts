import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import monkey from "vite-plugin-monkey";

/**
 * Preact is built from its sources, which the package carries beside its
 * published build (0.75.0). The published build is minified: its names are one
 * letter long, and the catalogue the script is published in takes no minified
 * code inside a script. Every way the code and the tests name Preact is turned
 * to the sources here, so that there is one Preact in the file and not two.
 */
function preactSource(path: string): string {
  return fileURLToPath(new URL(`./node_modules/preact/${path}`, import.meta.url));
}

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
        version: "0.75.1",
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
        // The parts of the script (dynamic import("./boot/app")) are loaded by
        // SystemJS, put inside the file: one file, nothing fetched from
        // elsewhere, no @require in the header. The plugin puts the minified
        // build of SystemJS in; scripts/readable-systemjs.mjs, run by
        // `npm run build`, puts the readable build of the same package in its
        // place (the catalogue the script is published in takes no minified
        // code inside a script: sleazyfork.org/en/help/code-rules).
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
    alias: [
      { find: /^preact$/, replacement: preactSource("src/index.js") },
      { find: /^preact\/hooks$/, replacement: preactSource("hooks/src/index.js") },
      {
        find: /^(?:preact\/compat|react|react-dom)$/,
        replacement: preactSource("compat/src/index.js"),
      },
      {
        find: /^(?:preact|react)\/jsx-(?:dev-)?runtime$/,
        replacement: preactSource("jsx-runtime/src/index.js"),
      },
      { find: /^preact\/test-utils$/, replacement: preactSource("test-utils/src/index.js") },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
