/**
 * Breaks the long first line of each part of the built userscript into lines.
 *
 * Every part of the script is a module that begins with one line written by
 * the bundler: `System.register("name", [...],(function(exports,module){'use
 * strict';var <names>;return{setters:[function(module){<name>=module.<x>;...}],
 * execute:(function(){exports({<x>:<name>,...});`. For a large part that line
 * is thousands of characters long. Nothing in it is minified, but the
 * catalogue the script is published in takes any line over 5000 characters
 * with the word "function" in it for minified code (see check-built-file.mjs),
 * and such a line cannot be read anyway.
 *
 * Only three lists in that line are broken, each only when it is nothing but
 * what the bundler writes there:
 *
 * - the names after `'use strict';var`: a line after each comma;
 * - `<name>=module.<name>;` inside a `function(module){...}` of the setters: a
 *   line after each semicolon;
 * - the pairs of the `exports({...})` that begins the body: a line after each
 *   comma.
 *
 * A line break after a comma or a semicolon between two names changes nothing
 * for the language. Nothing else is touched: after these lists the same line
 * goes on with the code of the script, which has strings in it.
 *
 * Run by `npm run build`, after readable-systemjs and before the notices.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Lines shorter than this are left alone: they are read as they are. */
export const SPLIT_MIN_LENGTH = 400;
/** The catalogue's own limit for a line with "function" in it. */
export const CATALOGUE_MAX_LENGTH = 5000;
export const CATALOGUE_WORD = "function";

const MODULE_START = "System.register(";
const NAME = "[A-Za-z_$][\\w$]*";
/** `'use strict';var a,b,c;` with nothing but names and commas in the list. */
const NAMES_AFTER_STRICT = new RegExp(`('use strict';var )(${NAME}(?:,${NAME})*);`);
/** One setter whose body is nothing but `name=module.name;` repeated. */
const SETTER = new RegExp(`function\\(module\\)\\{((?:${NAME}=module\\.${NAME};)+)\\}`, "g");
/** Where the head of the module ends and its body begins. */
const BODY_START = "execute:(function(){";
/** The `exports({...});` that begins the body, with nothing but `key:name` pairs in it. */
const EXPORTS_AT_START = new RegExp(`^exports\\(\\{(${NAME}:${NAME}(?:,${NAME}:${NAME})*)\\}\\);`);

function splitModuleLine(line) {
  const bodyAt = line.indexOf(BODY_START);
  const head = bodyAt === -1 ? line : line.slice(0, bodyAt);
  const rest = bodyAt === -1 ? "" : line.slice(bodyAt);

  const newHead = head
    .replace(NAMES_AFTER_STRICT, (_match, start, names) => `${start}${names.replaceAll(",", ",\n")};`)
    .replace(SETTER, (_match, body) => `function(module){\n${body.replaceAll(";", ";\n")}}`);

  if (rest.length === 0) {
    return newHead;
  }
  const body = rest.slice(BODY_START.length);
  const newBody = body.replace(
    EXPORTS_AT_START,
    (_match, pairs) => `exports({\n${pairs.replaceAll(",", ",\n")}\n});`,
  );
  return `${newHead}${BODY_START}${newBody}`;
}

/** The text with the long first lines of its modules broken; everything else as it was. */
export function splitLongLines(text) {
  return text
    .split("\n")
    .map((line) =>
      line.length > SPLIT_MIN_LENGTH && line.startsWith(MODULE_START) ? splitModuleLine(line) : line,
    )
    .join("\n");
}

/** The numbers (from 1) of the lines the catalogue would take for minified code. */
export function linesTakenForMinified(text) {
  const found = [];
  text.split("\n").forEach((line, index) => {
    if (line.length > CATALOGUE_MAX_LENGTH && line.includes(CATALOGUE_WORD)) {
      found.push(index + 1);
    }
  });
  return found;
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const file = resolve(root, "dist", "ruledesk-web.user.js");
  const before = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const after = splitLongLines(before);
  const left = linesTakenForMinified(after);
  if (left.length > 0) {
    throw new Error(
      `split-long-lines: still over ${String(CATALOGUE_MAX_LENGTH)} characters with "${CATALOGUE_WORD}": line ${left.join(", ")}`,
    );
  }
  writeFileSync(file, after);
  const added = after.split("\n").length - before.split("\n").length;
  process.stdout.write(`long lines split: ${String(added)} line breaks added\n`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
