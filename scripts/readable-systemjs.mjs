/**
 * Puts the readable build of SystemJS into the built userscript in place of
 * the minified one.
 *
 * vite-plugin-monkey, told `systemjs: "inline"`, puts two files of the
 * systemjs package into the userscript: dist/system.min.js and
 * dist/extras/named-register.min.js. It has no way to be given other files.
 * The catalogue the script is published in takes no minified code inside a
 * script, so the two are swapped here for dist/system.js and
 * dist/extras/named-register.js of the same package: the same code as its
 * authors publish it, with its names, its spaces and its comments.
 *
 * Run by `npm run build`, after vite and before the notices. It fails when a
 * minified file is not found in the built file exactly as the plugin puts it
 * in: a plugin or a package that changed must be looked at, not passed by.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_FILE = resolve(root, "dist", "ruledesk-web.user.js");
const PACKAGE_DIR = resolve(root, "node_modules", "systemjs");
const SOURCE_URL = "https://github.com/systemjs/systemjs";

/** The minified file the plugin puts in, and the readable one that takes its place. */
const SWAPS = [
  { minified: "dist/system.min.js", readable: "dist/system.js" },
  { minified: "dist/extras/named-register.min.js", readable: "dist/extras/named-register.js" },
];

function read(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

/** What the plugin does to a file before putting it in (vite-plugin-monkey 8.1.1, getSystemjsTexts). */
function asThePluginPutsIt(text) {
  return text
    .trim()
    .replace(/^\/\*[\s\S]*?\*\//, "")
    .replace(/\/\/.*map$/, "")
    .trim();
}

const version = JSON.parse(read(resolve(PACKAGE_DIR, "package.json"))).version;
let built = read(DIST_FILE);

for (const swap of SWAPS) {
  const needle = asThePluginPutsIt(read(resolve(PACKAGE_DIR, swap.minified)));
  const first = built.indexOf(needle);
  if (needle.length === 0 || first === -1 || built.indexOf(needle, first + 1) !== -1) {
    throw new Error(
      `readable-systemjs: ${swap.minified} of systemjs ${version} is not in the built file exactly once`,
    );
  }
  const readable = read(resolve(PACKAGE_DIR, swap.readable)).trim();
  const note = `// systemjs ${version}, ${swap.readable} (MIT), ${SOURCE_URL}`;
  built = `${built.slice(0, first)}${note}\n${readable}\n${built.slice(first + needle.length)}`;
}

writeFileSync(DIST_FILE, built);
process.stdout.write(
  `readable systemjs ${version}: ${SWAPS.map((swap) => swap.readable).join(", ")}\n`,
);
