# Product Strategy

> This document describes long-term strategy. For current implementation state see `README.md`.

## Positioning

RuleDesk is an open-core desktop product focused on safe, maintainable media workflow tooling with a strong local-first architecture.

## Strategic Feature Pillars

### 1) Intelligent Curation

- **Smart Collections AI** — **RESEARCH** (not release-ready).
  - Requires CLIP/ResNet-class model assets (`~100MB+`).
  - Requires GPU acceleration via ONNX inference.
  - Requires substantial engineering and QA effort (`3-6 months` expected).
  - Current status: exploration only; no ship claim.

## Go-to-Market Constraints

- Marketing messaging must only reference implemented capabilities documented in `README.md`.
- Planned and research initiatives must be clearly labeled to avoid release-state ambiguity.

## Release Communication Rules

- Use **Implemented** only for features available in stable builds.
- Use **PLANNED (version)** for committed roadmap items.
- Use **RESEARCH** for ideas that still require technical validation.
