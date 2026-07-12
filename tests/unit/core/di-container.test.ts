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

  it("throws after clear() removed all registrations", () => {
    const token = new Token<string>("Database");
    container.register(token, "value");
    container.clear();

    expect(() => container.resolve(token)).toThrow(/not found/i);
  });

  it("rejects null/undefined registration", () => {
    const token = new Token<string>("Database");
    expect(() => {
      // @ts-expect-error intentional invalid registration
      container.register(token, null);
    }).toThrow(/null\/undefined/i);
  });
});
