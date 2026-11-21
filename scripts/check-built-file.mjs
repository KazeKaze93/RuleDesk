/**
 * The last step of `npm run build`: the built userscript is checked against
 * what the catalogue it is published in asks of a script
 * (sleazyfork.org/en/help/code-rules, /help/external-scripts). A build that
 * breaks one of these fails, so that such a file is not committed.
 *
 * - No @require in the header: nothing is fetched from elsewhere. The plugin
 *   writes a `data:` @require of its own when SystemJS is taken from a CDN.
 * - No minified SystemJS: scripts/readable-systemjs.mjs has put the readable
 *   build in.
 * - No Preact from the package's published build. That build is minified, and
 *   its mark is the property `__k`: the name its minifier gives to what the
 *   sources call `_children`. Nothing else in the file has it. Its absence
 *   also tells that there is one Preact in the file, the one built from the
 *   sources (vite.config.ts, resolve.alias), and not a second copy beside it.
 * - Under the catalogue's limit of 2 MB.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_FILE = resolve(root, "dist", "ruledesk-web.user.js");
const HEADER_END = "// ==/UserScript==";
const MAX_BYTES = 2 * 1024 * 1024;
const PREACT_PUBLISHED_BUILD_MARK = "__k";
const PREACT_SOURCES_MARK = "_children";
const SYSTEMJS_MINIFIED_FILES = ["dist/system.min.js", "dist/extras/named-register.min.js"];
/** A piece of a minified file long enough to be found nowhere else. */
const PROBE_LENGTH = 200;

const bytes = readFileSync(DIST_FILE);
const built = bytes.toString("utf8").replace(/\r\n/g, "\n");
const problems = [];

const headerEnd = built.indexOf(HEADER_END);
if (headerEnd === -1) {
  problems.push("the userscript header is not found");
} else if (/^\/\/\s*@require\b/m.test(built.slice(0, headerEnd))) {
  problems.push("the header has an @require: nothing may be fetched from elsewhere");
}

for (const file of SYSTEMJS_MINIFIED_FILES) {
  const text = readFileSync(resolve(root, "node_modules", "systemjs", file), "utf8").trim();
  const middle = Math.floor(text.length / 2);
  if (built.includes(text.slice(middle, middle + PROBE_LENGTH))) {
    problems.push(`the minified ${file} of systemjs is in the file`);
  }
}

if (built.includes(PREACT_PUBLISHED_BUILD_MARK)) {
  problems.push(
    `"${PREACT_PUBLISHED_BUILD_MARK}" is in the file: Preact's published (minified) build got in`,
  );
}
if (!built.includes(PREACT_SOURCES_MARK)) {
  problems.push(`"${PREACT_SOURCES_MARK}" is not in the file: Preact is not built from its sources`);
}

if (bytes.length >= MAX_BYTES) {
  problems.push(`the file is ${String(bytes.length)} bytes, over the limit of ${String(MAX_BYTES)}`);
}

if (problems.length > 0) {
  throw new Error(`check-built-file:\n- ${problems.join("\n- ")}`);
}
process.stdout.write(`built file checked: ${String(bytes.length)} bytes, no @require, nothing minified\n`);
