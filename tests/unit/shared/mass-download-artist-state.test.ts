import { describe, expect, it } from "vitest";
import {
  advanceArtistCursor,
  applyArtistItemCompleted,
  planArtistChunk,
  shouldAdvanceArtistCursorAfterChunk,
} from "../../../src/main/lib/mass-download-artist-state";
import { artistQueueInitial } from "../../../src/main/lib/download-queue-file";

const chunk = [
  { id: 10, url: "https://example.com/a.jpg", filename: "1_10.jpg" },
  { id: 11, url: "https://example.com/b.jpg", filename: "1_11.jpg" },
  { id: 12, url: "https://example.com/c.jpg", filename: "1_12.jpg" },
];

function baseState() {
  return artistQueueInitial({
    artistId: 1,
    filters: undefined,
    upperBoundId: 100,
    total: 3,
    folder: "/tmp/dl",
  });
}

describe("planArtistChunk / resume crash windows", () => {
  it("crash after file on disk, before chunkCompletedIds → remaining still includes that filename (skip on retry)", () => {
    // File 1_10.jpg exists on disk but queue was not updated yet.
    const state = baseState();
    const plan = planArtistChunk(state, chunk);
    expect(plan?.type).toBe("download");
    if (plan?.type !== "download") {
      return;
    }
    expect(plan.remaining.map((r) => r.filename)).toEqual([
      "1_10.jpg",
      "1_11.jpg",
      "1_12.jpg",
    ]);
  });

  it("crash after last item recorded, before cursor advance → resume advances without re-download", () => {
    let state = baseState();
    state = applyArtistItemCompleted(state, "1_10.jpg");
    state = applyArtistItemCompleted(state, "1_11.jpg");
    state = applyArtistItemCompleted(state, "1_12.jpg");
    expect(state.cursorId).toBe(0);
    expect(state.chunkCompletedIds).toHaveLength(3);

    const plan = planArtistChunk(state, chunk);
    expect(plan?.type).toBe("advance");
    if (plan?.type !== "advance") {
      return;
    }
    expect(plan.lastId).toBe(12);
    expect(plan.state.cursorId).toBe(12);
    expect(plan.state.chunkCompletedIds).toEqual([]);
  });

  it("does not skip the next chunk after advance-from-completed-ids resume", () => {
    let state = baseState();
    for (const row of chunk) {
      state = applyArtistItemCompleted(state, row.filename);
    }
    const plan = planArtistChunk(state, chunk);
    expect(plan?.type).toBe("advance");
    if (plan?.type !== "advance") {
      return;
    }
    state = plan.state;

    const nextChunk = [
      { id: 13, url: "https://example.com/d.jpg", filename: "1_13.jpg" },
      { id: 14, url: "https://example.com/e.jpg", filename: "1_14.jpg" },
    ];
    const nextPlan = planArtistChunk(state, nextChunk);
    expect(nextPlan?.type).toBe("download");
    if (nextPlan?.type !== "download") {
      return;
    }
    expect(nextPlan.remaining.map((r) => r.filename)).toEqual([
      "1_13.jpg",
      "1_14.jpg",
    ]);
  });

  it("advances cursor after chunk with permanent failures; failed filenames stay retryable on a new run", () => {
    // Worker finished: one success, one 404 — only success is in chunkCompletedIds.
    let state = applyArtistItemCompleted(baseState(), "1_10.jpg");
    expect(shouldAdvanceArtistCursorAfterChunk(false)).toBe(true);
    expect(shouldAdvanceArtistCursorAfterChunk(true)).toBe(false);

    state = advanceArtistCursor(state, 12);
    expect(state.cursorId).toBe(12);
    expect(state.chunkCompletedIds).toEqual([]);
    // Failed 1_11.jpg / 1_12.jpg were never recorded → a new queue at cursor 0 would see them again.
    const fresh = baseState();
    const freshPlan = planArtistChunk(fresh, chunk);
    expect(freshPlan?.type).toBe("download");
    if (freshPlan?.type !== "download") {
      return;
    }
    expect(freshPlan.remaining.some((r) => r.filename === "1_11.jpg")).toBe(
      true
    );
  });
});
