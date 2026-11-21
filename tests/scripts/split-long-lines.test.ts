import { describe, expect, it } from "vitest";

import {
  CATALOGUE_MAX_LENGTH,
  linesTakenForMinified,
  splitLongLines,
} from "../../scripts/split-long-lines.mjs";

/**
 * The first line of a part of the built file, in the shape the bundler writes
 * it (taken from the build of 0.75.1: the names, the setters, the exports and
 * then the code of the part on the same line), with enough names to be longer
 * than the catalogue allows.
 */

const NAMES = 420;
/** Text the code of a part may hold: it has every mark the step looks for. */
const TRAP =
  "'use strict';var a,b;function(module){a=module.b;c=module.d;}execute:(function(){exports({k:a,m:b});";

function names(): string[] {
  const list = ["useState", "A$1", "$", "_private"];
  for (let index = 0; index < NAMES; index += 1) {
    list.push(`importedName${String(index)}`);
  }
  return list;
}

function moduleText(): string {
  const all = names();
  const half = Math.floor(all.length / 2);
  const setter = (part: string[], offset: number): string =>
    `function(module){${part.map((name, index) => `${name}=module.k${String(offset + index)};`).join("")}}`;
  const pairs = all.map((name, index) => `e${String(index)}:${name}`).join(",");
  const first =
    `System.register("./part-AbC1-dEf2.js", ['./dep-one.js','./dep,two.js'],(function(exports,module){` +
    `'use strict';var ${all.join(",")};return{setters:[${setter(all.slice(0, half), 0)},` +
    `${setter(all.slice(half), half)}],execute:(function(){exports({${pairs}});` +
    `var TRAP = ${JSON.stringify(TRAP)};exports("trap",TRAP);exports("sum",function sum(a,b){return a+b;});`;
  return `${first}\nexports("last", importedName${String(NAMES - 1)});\n})}}));\n`;
}

type Registered = {
  name: string;
  deps: string[];
  exported: Record<string, unknown>;
};

/** Runs the text the way the loader would and tells what the part gave out. */
function run(text: string): Registered {
  const all = names();
  let result: Registered | null = null;
  const system = {
    register(
      name: string,
      deps: string[],
      declare: (exports: (key: unknown, value?: unknown) => void) => {
        setters: Array<(module: Record<string, unknown>) => void>;
        execute: () => void;
      },
    ): void {
      const exported: Record<string, unknown> = {};
      const give = (key: unknown, value?: unknown): void => {
        if (typeof key === "string") {
          exported[key] = value;
        } else if (typeof key === "object" && key !== null) {
          Object.assign(exported, key);
        }
      };
      const declared = declare(give);
      const half = Math.floor(all.length / 2);
      const moduleOf = (from: number, to: number): Record<string, unknown> => {
        const values: Record<string, unknown> = {};
        for (let index = from; index < to; index += 1) {
          values[`k${String(index)}`] = `value of ${all[index] ?? ""}`;
        }
        return values;
      };
      declared.setters[0]?.(moduleOf(0, half));
      declared.setters[1]?.(moduleOf(half, all.length));
      declared.execute();
      result = { name, deps, exported };
    },
  };
  // The text is this test's own; compiling it is also the syntax check.
  new Function("System", text)(system);
  if (result === null) {
    throw new Error("the part did not register");
  }
  return result;
}

describe("split-long-lines", () => {
  it("starts from a line the catalogue would take for minified code", () => {
    const text = moduleText();
    expect(text.split("\n")[0]?.length ?? 0).toBeGreaterThan(CATALOGUE_MAX_LENGTH);
    expect(linesTakenForMinified(text)).toEqual([1]);
  });

  it("leaves no line the catalogue would take for minified code", () => {
    const split = splitLongLines(moduleText());
    expect(linesTakenForMinified(split)).toEqual([]);
    expect(Math.max(...split.split("\n").map((line) => line.length))).toBeLessThan(600);
  });

  it("gives code that compiles and means the same", () => {
    const before = run(moduleText());
    const after = run(splitLongLines(moduleText()));
    expect(after.name).toBe(before.name);
    expect(after.deps).toEqual(before.deps);
    expect(Object.keys(after.exported)).toEqual(Object.keys(before.exported));
    for (const [key, value] of Object.entries(before.exported)) {
      if (typeof value !== "function") {
        expect(after.exported[key]).toEqual(value);
      }
    }
    expect(after.exported.e0).toBe("value of useState");
    expect(after.exported.e2).toBe("value of $");
    expect(after.exported.last).toBe(`value of importedName${String(NAMES - 1)}`);
  });

  it("does not touch a string of the code that looks like the lists", () => {
    const split = splitLongLines(moduleText());
    expect(run(split).exported.trap).toBe(TRAP);
    expect(split).toContain(JSON.stringify(TRAP));
  });

  it("only adds line breaks", () => {
    const text = moduleText();
    expect(splitLongLines(text).replaceAll("\n", "")).toBe(text.replaceAll("\n", ""));
  });

  it("leaves short lines and other long lines as they are", () => {
    const short = `System.register("./a.js", [],(function(exports){'use strict';var a,b;return{}}));`;
    const other = `var MASK = "${"a,b;".repeat(200)}";`;
    expect(splitLongLines(`${short}\n${other}`)).toBe(`${short}\n${other}`);
  });
});
