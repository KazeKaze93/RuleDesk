/**
 * Sum passed counts from main + isolated runs; fail below MIN_TESTS.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_TESTS } from "./vitest-min-counts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function readCount(name) {
  try {
    return Number(readFileSync(path.join(ROOT, name), "utf8").trim());
  } catch {
    return 0;
  }
}

const main = readCount(".vitest-main-passed");
const isolated = readCount(".vitest-isolated-passed");
const total = main + isolated;

console.log(
  `vitest totals: main=${main} isolated=${isolated} sum=${total} (min ${MIN_TESTS})`,
);

if (total < MIN_TESTS) {
  console.error(
    `FAIL: combined Vitest passed ${total}; pinned minimum is ${MIN_TESTS}.`,
  );
  process.exit(1);
}
