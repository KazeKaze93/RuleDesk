import { beforeEach, describe, expect, it, vi } from "vitest";
import { Token } from "@/main/core/di/Token";
import { container } from "@/main/core/di/Container";
import log from "electron-log";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Container", () => {
  beforeEach(() => {
    container.clear();
    vi.clearAllMocks();
  });

  it("registers and resolves a service", () => {
    const token = new Token<string>("Database");
    container.register(token, "db-value");

    expect(container.resolve(token)).toBe("db-value");
  });

  it("resolves by token.id when a different Token instance shares the same id", () => {
    const t1 = new Token<string>("Database");
    const t2 = new Token<string>("Database");

    container.register(t1, "shared-value");

    expect(container.resolve(t2)).toBe("shared-value");
    expect(container.has(t2)).toBe(true);
  });

  it("logs a warning when overwriting a registered service", () => {
    const token = new Token<string>("Database");
    container.register(token, "first");
    container.register(token, "second");

    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining("being overwritten")
    );
    expect(container.resolve(token)).toBe("second");
  });

  it("throws a readable error when resolving an unknown service", () => {
    const token = new Token<string>("MissingService");

    expect(() => container.resolve(token)).toThrow(
      /not found.*Did you forget to register/i
    );
  });

  it("throws on re-entrant resolve of the same token (resolutionStack)", () => {
    // Detects direct re-entry: resolve("A") while resolve("A") is still on the stack.
    // Does not catch lazy A→B→A getter cycles after the outer resolve returns.
    const token = new Token<string>("Circular");
    container.register(token, "value");

    const internal = container as unknown as { resolutionStack: Set<string> };
    internal.resolutionStack.add("Circular");

    expect(() => container.resolve(token)).toThrow(
      /Circular dependency detected/i
    );
  });

  it("throws after clear() removed all registrations", () => {
    const token = new Token<string>("Database");
    container.register(token, "value");
    container.clear();

    expect(() => container.resolve(token)).toThrow(/not found/i);
  });
});
