import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@/shared/types/error-codes";
import {
  requireMigrationFile,
  splitMigrationStatements,
} from "@/main/db/migration-runner";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { level: false, format: "" },
      file: { level: "info", resolvePathFn: vi.fn() },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

/** Former splitter (line `--` strip + BEGIN/END token split) for inventory parity. */
function splitMigrationStatementsLegacy(migrationSQL: string): string[] {
  const STATEMENT_BREAKPOINT_RE = /-->\s*statement-breakpoint\s*/i;

  const stripLineComments = (sqlChunk: string): string =>
    sqlChunk
      .split("\n")
      .map((line) => {
        const commentIdx = line.indexOf("--");
        if (commentIdx === -1) {
          return line;
        }
        return line.slice(0, commentIdx);
      })
      .join("\n");

  const splitSqlStatementsRespectingBeginEnd = (sql: string): string[] => {
    const statements: string[] = [];
    let current = "";
    let beginDepth = 0;
    const tokens = sql.split(/(\bBEGIN\b|\bEND\b|;)/i);

    for (const token of tokens) {
      if (token.length === 0) {
        continue;
      }
      const upper = token.toUpperCase();
      if (upper === "BEGIN") {
        beginDepth += 1;
        current += token;
        continue;
      }
      if (upper === "END") {
        beginDepth = Math.max(0, beginDepth - 1);
        current += token;
        continue;
      }
      if (token === ";" && beginDepth === 0) {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        current = "";
        continue;
      }
      current += token;
    }

    const trailing = current.trim();
    if (trailing.length > 0) {
      statements.push(trailing);
    }
    return statements;
  };

  const normalized = migrationSQL.replace(/\r\n/g, "\n");
  const chunks = STATEMENT_BREAKPOINT_RE.test(normalized)
    ? normalized.split(STATEMENT_BREAKPOINT_RE)
    : [normalized];

  const statements: string[] = [];
  for (const chunk of chunks) {
    const withoutComments = stripLineComments(chunk);
    statements.push(...splitSqlStatementsRespectingBeginEnd(withoutComments));
  }
  return statements;
}

describe("splitMigrationStatements", () => {
  it("does not split on semicolons inside single- or double-quoted strings", () => {
    const sql = `
      INSERT INTO t(v) VALUES ('a;b');
      INSERT INTO t(v) VALUES ("c;d");
      INSERT INTO t(v) VALUES ('it''s;ok');
    `;
    const statements = splitMigrationStatements(sql);
    expect(statements).toHaveLength(3);
    expect(statements[0]).toContain("'a;b'");
    expect(statements[1]).toContain('"c;d"');
    expect(statements[2]).toContain("'it''s;ok'");
  });

  it("ignores semicolons inside -- and block comments", () => {
    const sql = `
      SELECT 1; -- note; ignored
      SELECT 2; /* also; ignored */ SELECT 3;
    `;
    expect(splitMigrationStatements(sql)).toEqual([
      "SELECT 1",
      "SELECT 2",
      "SELECT 3",
    ]);
  });

  it("keeps BEGIN…END trigger bodies as one statement", () => {
    const sql = `
      CREATE TRIGGER t AFTER INSERT ON posts BEGIN
        INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
      END;
      INSERT INTO posts_fts(posts_fts) VALUES('rebuild');
    `;
    const statements = splitMigrationStatements(sql);
    expect(statements).toHaveLength(2);
    expect(statements[0]).toMatch(/CREATE TRIGGER[\s\S]*END$/i);
    expect(statements[1]).toContain("VALUES('rebuild')");
  });

  it("inventory: every drizzle/*.sql yields the same statement list as the legacy splitter", () => {
    const drizzleDir = path.resolve(process.cwd(), "drizzle");
    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((name) => name.endsWith(".sql"))
      .sort();

    expect(sqlFiles.length).toBeGreaterThan(0);

    const mismatches: string[] = [];
    for (const name of sqlFiles) {
      const sql = fs.readFileSync(path.join(drizzleDir, name), "utf-8");
      const next = splitMigrationStatements(sql);
      const legacy = splitMigrationStatementsLegacy(sql);
      if (JSON.stringify(next) !== JSON.stringify(legacy)) {
        mismatches.push(
          `${name}: new=${next.length} legacy=${legacy.length}`
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe("requireMigrationFile", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("throws a DATABASE_ERROR coded error when the SQL file is missing", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ruledesk-mig-miss-"));
    tempDirs.push(tempDir);
    const missingPath = path.join(tempDir, "0000_missing.sql");

    let thrown: unknown;
    try {
      requireMigrationFile(missingPath);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).toMatchObject({
      message: expect.stringContaining("Migration file not found"),
      code: ErrorCode.DATABASE_ERROR,
    });
  });

  it("returns when the SQL file exists", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ruledesk-mig-ok-"));
    tempDirs.push(tempDir);
    const presentPath = path.join(tempDir, "0000_ok.sql");
    fs.writeFileSync(presentPath, "SELECT 1;", "utf-8");
    expect(() => requireMigrationFile(presentPath)).not.toThrow();
  });
});

describe("fatal dialog ownership (source contract)", () => {
  it("client.ts has no showErrorBox; main.ts has exactly one", () => {
    const clientSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/main/db/client.ts"),
      "utf-8"
    );
    const mainSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/main/main.ts"),
      "utf-8"
    );

    expect(clientSrc).not.toContain("showErrorBox");
    expect(clientSrc).not.toMatch(/dialog\.showErrorBox/);
    expect(mainSrc.match(/showErrorBox/g)?.length).toBe(1);
  });

  it("main.ts does not append ignore-gpu-blacklist", () => {
    const mainSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/main/main.ts"),
      "utf-8"
    );
    expect(mainSrc).not.toContain("ignore-gpu-blacklist");
  });
});
