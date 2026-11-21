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
 * What is inside the built file, and where each comes from. preact and zod are
 * imported by src/; preact is built from the sources the package carries
 * (vite.config.ts, resolve.alias). SystemJS loads the parts of the script: the
 * plugin puts it in and scripts/readable-systemjs.mjs swaps in its readable
 * build. A package added to the bundle is added here.
 */
const BUNDLED = [
  {
    name: "preact",
    why: "the interface of the script",
    form: "built from the sources in the package (src, hooks/src, compat/src, jsx-runtime/src)",
    source: "https://github.com/preactjs/preact",
  },
  {
    name: "zod",
    why: "checking of stored and imported data",
    form: "the modules of the package, as published",
    source: "https://github.com/colinhacks/zod",
  },
  {
    name: "systemjs",
    why: "the loader of the parts of the script",
    form: "dist/system.js and dist/extras/named-register.js of the package, as published",
    source: "https://github.com/systemjs/systemjs",
  },
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
    `Source: ${entry.source} (npm package \`${entry.name}@${entry.version}\`). In the built file: ${entry.form}.`,
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
    `Source: ${entry.source} (npm package ${entry.name}@${entry.version})`,
    `In this file: ${entry.form}`,
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
