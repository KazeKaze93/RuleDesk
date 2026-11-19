import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * What is imported, file by file, from src/main.ts without the `import()` of
 * boot/app: this is the code that runs before the first paint on every page.
 * The list of features got into it once through one helper, and 915 KB of
 * 1265 ran before the theme was put on (the audit of 19.11.2026).
 */

const ROOT = resolve(__dirname, "..", "src");
const STATIC_IMPORT = /^\s*(?:import|export)\s+(?!type\b)[^;]*?\bfrom\s+"(\.[^"]+)"/gm;
const EXTENSIONS = [".ts", ".tsx", "/index.ts"];

function resolveModule(from: string, spec: string): string | null {
  const base = resolve(dirname(from), spec);
  for (const extension of EXTENSIONS) {
    if (existsSync(base + extension)) {
      return base + extension;
    }
  }
  return null;
}

function reachableFrom(entry: string): Set<string> {
  const seen = new Set<string>([entry]);
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(STATIC_IMPORT)) {
      const spec = match[1];
      const next = spec === undefined ? null : resolveModule(file, spec);
      if (next !== null && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

function names(files: Set<string>): string[] {
  return [...files].map((file) => file.slice(ROOT.length + 1).replace(/\\/g, "/"));
}

describe("the code run before the first paint", () => {
  const early = names(reachableFrom(resolve(ROOT, "main.ts")));

  it("starts from the three boot modules", () => {
    expect(early).toContain("boot/early.ts");
    expect(early).toContain("boot/layout.ts");
    expect(early).toContain("features/chrome.ts");
  });

  it("does not hold the list of features, the pages of the script or the user interface library", () => {
    expect(early).not.toContain("features/registry.ts");
    expect(early).not.toContain("features/runtime.ts");
    expect(early).not.toContain("boot/app.ts");
    expect(early.filter((file) => file.startsWith("pages/") && file.endsWith(".tsx"))).toEqual([]);
    expect(early.filter((file) => file.startsWith("ui/kit/"))).toEqual([]);
  });

  it("is a small part of the files", () => {
    // 136 of 170 before the list of features was taken off this path.
    expect(early.length).toBeLessThan(60);
  });
});
