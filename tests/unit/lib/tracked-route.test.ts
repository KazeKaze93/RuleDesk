import { describe, expect, it } from "vitest";
import {
  ADD_ARTIST_QUERY_PARAM,
  ADD_ARTIST_QUERY_VALUE,
  TRACKED_ADD_ARTIST_DEEPLINK,
  TRACKED_PATH,
} from "@/lib/tracked-route";

describe("tracked-route", () => {
  it("exports the tracked path and add-artist query contract", () => {
    expect(TRACKED_PATH).toBe("/tracked");
    expect(ADD_ARTIST_QUERY_PARAM).toBe("add");
    expect(ADD_ARTIST_QUERY_VALUE).toBe("1");
  });

  it("builds the add-artist deeplink from path and query", () => {
    expect(TRACKED_ADD_ARTIST_DEEPLINK).toBe("/tracked?add=1");
  });
});
