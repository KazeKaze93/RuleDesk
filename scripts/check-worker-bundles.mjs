/**
 * After `npm run build`, walk each `out/main/workers/*.cjs` and its relative
 * requires. Fail if any module in the graph does `require("electron")`,
 * `require("electron-log")`, or a subpath of either.
 *
 * Worker threads must not pull Electron APIs; packaged apps have no
 * `node_modules/electron` for the worker to resolve.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKERS_DIR = path.join(ROOT, "out", "main", "workers");
const FORBIDDEN_MODULE_PREFIXES = ["electron", "electron-log"];

function fail(message) {
  console.error(`check:worker-bundles failed: ${message}`);
  process.exit(1);
}

/**
 * @param {string} request
 * @returns {boolean}
 */
function isForbiddenRequire(request) {
  return FORBIDDEN_MODULE_PREFIXES.some(
    (prefix) => request === prefix || request.startsWith(`${prefix}/`)
  );
}

/**
 * Collect string literal require("…") / require('…') targets.
 * @param {string} source
 * @returns {string[]}
 */
function collectRequireRequests(source) {
  const requests = [];
  const re = /require\s*\(\s*(["'])([^"']+)\1\s*\)/g;
  let match = re.exec(source);
  while (match !== null) {
    requests.push(match[2]);
    match = re.exec(source);
  }
  return requests;
}

/**
 * Resolve a relative require from `fromFile` under out/main.
 * @param {string} fromFile
 * @param {string} request
 * @returns {string | null}
 */
function resolveRelativeRequire(fromFile, request) {
  if (!request.startsWith(".")) {
    return null;
  }
  const base = path.resolve(path.dirname(fromFile), request);
  const candidates = [
    base,
    `${base}.cjs`,
    `${base}.js`,
    path.join(base, "index.cjs"),
    path.join(base, "index.js"),
  ];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * @param {string} entryFile
 * @returns {{ ok: true } | { ok: false, file: string, chain: string[], request: string }}
 */
function walkWorkerGraph(entryFile) {
  /** @type {Map<string, string[]>} */
  const visiting = new Map();
  const queue = [{ file: entryFile, chain: [entryFile] }];

  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined) {
      break;
    }
    const { file, chain } = current;
    if (visiting.has(file)) {
      continue;
    }
    visiting.set(file, chain);

    let source;
    try {
      source = readFileSync(file, "utf8");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      fail(`cannot read ${path.relative(ROOT, file)}: ${message}`);
    }

    for (const request of collectRequireRequests(source)) {
      if (isForbiddenRequire(request)) {
        return { ok: false, file, chain, request };
      }
      const resolved = resolveRelativeRequire(file, request);
      if (resolved === null) {
        continue;
      }
      queue.push({
        file: resolved,
        chain: [...chain, resolved],
      });
    }
  }

  return { ok: true };
}

function main() {
  let entries;
  try {
    entries = readdirSync(WORKERS_DIR)
      .filter((name) => name.endsWith(".cjs"))
      .map((name) => path.join(WORKERS_DIR, name))
      .sort();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fail(
      `workers directory missing at ${path.relative(ROOT, WORKERS_DIR)} (${message}). Run npm run build first.`
    );
    return;
  }

  if (entries.length === 0) {
    fail(`no *.cjs workers under ${path.relative(ROOT, WORKERS_DIR)}`);
  }

  let failed = false;
  for (const entry of entries) {
    const result = walkWorkerGraph(entry);
    if (result.ok) {
      console.log(`OK  ${path.relative(ROOT, entry)}`);
      continue;
    }
    failed = true;
    const chainText = result.chain
      .map((file) => path.relative(ROOT, file))
      .join(" -> ");
    console.error(
      `FAIL ${path.relative(ROOT, entry)}: require("${result.request}") via ${chainText}`
    );
  }

  if (failed) {
    process.exit(1);
  }
  console.log(`check:worker-bundles: ${entries.length} worker(s) clean`);
}

main();
