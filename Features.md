# Features Roadmap

This file tracks product feature priorities. It is a planning document, not an implementation checklist.

## 🚧 P1 In Progress (Core UX / Stability)

- **Viewer & gallery:** tag drawer interactions (include/exclude parity), progressive **preview → sample** in cards where still missing, overlay/layout polish.
- **Filters & top bar:** rating and date-range wiring on every list; one consistent filter story with global search.
- **Nav / spec parity:** sidebar labels, sync status placement, masonry vs. virtualization tradeoffs on huge feeds.
- Hardening: **provider**-level anti-bot parity, optional backup retention settings, DX (main process reload in dev).

## 🔮 P2 Future (>6 months)

- **Smart Collections AI** — Deferred research initiative.
  - Requires local model pipeline (CLIP/ResNet class) with artifacts around `100MB+`.
  - Requires GPU-friendly inference path via ONNX runtime.
  - Estimated implementation window: `3-6 months` after research kickoff.
  - Not release-ready; depends on performance, packaging, and privacy trade-off validation.
