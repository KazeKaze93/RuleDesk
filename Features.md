# Features Roadmap

This file tracks product feature priorities. It is a planning document, not an implementation checklist.

## 🚧 P1 In Progress (Core UX / Stability)

- **Filters:** keep panel focused on **AI / media / source** and polish Browse **source** UX/messages.
- **Nav / layout:** spec alignment (labels), masonry vs `Virtuoso` tradeoffs on very long feeds.
- Hardening: **user-configurable** backup retention; DX (main process reload in dev); video/GPU tuning if needed.

*Shipped recently (do not re-list as missing): viewer tag include/exclude + right-click, `PostCard` preview→sample, `ProviderThrottle` on Rule34+Gelbooru, **Statistics** page, backup rotation, sync schedulers.*

## 🔮 P2 Future (>6 months)

- **Smart Collections AI** — Deferred research initiative.
  - Requires local model pipeline (CLIP/ResNet class) with artifacts around `100MB+`.
  - Requires GPU-friendly inference path via ONNX runtime.
  - Estimated implementation window: `3-6 months` after research kickoff.
  - Not release-ready; depends on performance, packaging, and privacy trade-off validation.
