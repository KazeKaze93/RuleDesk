import { describe, expect, it } from "vitest";
import {
  DISPLAY_ENV,
  WAYLAND_DISPLAY_ENV,
  isHeadlessEnvironment,
} from "@/main/db/headless-env";

describe("isHeadlessEnvironment (platform matrix)", () => {
  it("exports named DISPLAY / WAYLAND_DISPLAY env keys", () => {
    expect(DISPLAY_ENV).toBe("DISPLAY");
    expect(WAYLAND_DISPLAY_ENV).toBe("WAYLAND_DISPLAY");
  });

  it.each([
    {
      name: "linux, neither display",
      platform: "linux" as const,
      env: {},
      expected: true,
    },
    {
      name: "linux, DISPLAY set",
      platform: "linux" as const,
      env: { [DISPLAY_ENV]: ":0" },
      expected: false,
    },
    {
      name: "linux, WAYLAND_DISPLAY set",
      platform: "linux" as const,
      env: { [WAYLAND_DISPLAY_ENV]: "wayland-0" },
      expected: false,
    },
    {
      name: "linux, both displays set",
      platform: "linux" as const,
      env: { [DISPLAY_ENV]: ":0", [WAYLAND_DISPLAY_ENV]: "wayland-0" },
      expected: false,
    },
    {
      name: "linux, empty DISPLAY string is absent",
      platform: "linux" as const,
      env: { [DISPLAY_ENV]: "" },
      expected: true,
    },
    {
      name: "win32, DISPLAY unset",
      platform: "win32" as const,
      env: {},
      expected: false,
    },
    {
      name: "win32, DISPLAY set (ignored)",
      platform: "win32" as const,
      env: { [DISPLAY_ENV]: ":0" },
      expected: false,
    },
    {
      name: "darwin, DISPLAY unset",
      platform: "darwin" as const,
      env: {},
      expected: false,
    },
    {
      name: "darwin, WAYLAND_DISPLAY set (ignored)",
      platform: "darwin" as const,
      env: { [WAYLAND_DISPLAY_ENV]: "wayland-0" },
      expected: false,
    },
  ])("$name → $expected", ({ platform, env, expected }) => {
    expect(isHeadlessEnvironment(platform, env)).toBe(expected);
  });
});
