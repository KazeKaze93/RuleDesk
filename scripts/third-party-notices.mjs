/**
 * The built userscript carries the code of other people's packages, and their
 * licences (MIT) ask that their copyright notice and the licence text go with
 * every copy. The bundler drops the comments that held them, minified or not
 * (seen on 0.74.3 built without minification), so they are put
 * back here, after the build:
 *
 * - into THIRD_PARTY_LICENSES.md at the root of the repository;
 * - at the end of dist/ruledesk-web.user.js, as one comment.
 *
 * Run by `npm run build`. A package named here whose licence file is missing
 * fails the build: a file without the notices must not be released.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * What is inside the built file: preact and zod, imported by src/. SystemJS,
 * which loads the parts of the script, is not inside it since 0.75.0: the
 * header names it by @require and the script manager fetches it, so no copy
 * of it is given out with this file. A package added to the bundle is added here.
 */
const BUNDLED = [
  { name: "preact", why: "the interface of the script" },
  { name: "zod", why: "checking of stored and imported data" },
];

const DIST_FILE = resolve(root, "dist", "ruledesk-web.user.js");
const NOTICES_FILE = resolve(root, "THIRD_PARTY_LICENSES.md");
const BLOCK_START = "/*! Third-party notices: RuleDesk Web includes the following packages.";
const COMMENT_END = "*/";

function read(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n").trim();
}

const packages = BUNDLED.map((entry) => {
  const dir = resolve(root, "node_modules", entry.name);
  const manifest = JSON.parse(read(resolve(dir, "package.json")));
  const text = read(resolve(dir, "LICENSE"));
  if (text.includes(COMMENT_END)) {
    throw new Error(`${entry.name}: the licence text would end the comment it is put in`);
  }
  return { ...entry, version: manifest.version, license: manifest.license, text };
});

const markdown = [
  "# Third-party licences",
  "",
  "RuleDesk Web is licensed under GPL-3.0-or-later (see `LICENSE`). The built file,",
  "`dist/ruledesk-web.user.js`, also contains the code of the packages below, each under",
  "its own licence. The same notices are at the end of the built file.",
  "",
  "This file is written by `scripts/third-party-notices.mjs` on every build; do not edit it by hand.",
  "",
  ...packages.flatMap((entry) => [
    `## ${entry.name} ${entry.version}`,
    "",
    `Licence: ${entry.license}. Used for: ${entry.why}.`,
    "",
    "```",
    entry.text,
    "```",
    "",
  ]),
].join("\n");
writeFileSync(NOTICES_FILE, markdown);

const block = [
  BLOCK_START,
  ...packages.flatMap((entry) => [
    "",
    `${entry.name} ${entry.version} (${entry.license})`,
    "",
    entry.text,
  ]),
  COMMENT_END,
  "",
].join("\n");

const built = readFileSync(DIST_FILE, "utf8");
const from = built.indexOf(BLOCK_START);
const code = (from === -1 ? built : built.slice(0, from)).trimEnd();
writeFileSync(DIST_FILE, `${code}\n\n${block}`);

process.stdout.write(
  `third-party notices: ${packages.map((entry) => `${entry.name} ${entry.version}`).join(", ")}\n`,
);
