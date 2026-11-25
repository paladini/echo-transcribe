# STATE

## Decisions

### AD-001
- **Decision**: The Tauri desktop app remains the primary product. Docker ships only the FastAPI/faster-whisper API as an optional self-hosted path.
- **Reason**: Homelab and headless users need transcription without Node, Rust, or GTK, but the project's identity is the desktop app.
- **Trade-off**: Two runtimes to document. The container does not include the Tauri UI.
- **Scope**: packaging, README, CI, release
- **Date**: 2026-11-24
- **Status**: active

### AD-002
- **Decision**: The supported default image is CPU PyTorch. GPU is an optional Compose override, not the CI or registry default.
- **Reason**: Most self-hosted hosts have no NVIDIA toolkit. A CUDA default would fail on those machines and bloat CI.
- **Trade-off**: CPU transcription is slower for `small` and `medium`. DGX Spark and a first-class CUDA image stay follow-ups.
- **Scope**: Dockerfile, compose, publish tags
- **Date**: 2026-11-24
- **Status**: active

## Handoff

- **Feature**: self-hosted-docker-backend / `.specs/features/self-hosted-docker-backend`
- **Phase / Task**: Execute complete, Verifier next
- **Completed**: T1, T2, T3, T4, T5, T6, T7
- **In-progress** (file:line): none
- **Next step**: Independent Verifier, then push PR #6 and pre-merge audit
- **Blockers**: GATE-MERGE and GATE-RELEASE still need explicit user OK
- **Uncommitted files**: harness-report.json, .agents/issues (unrelated to product)
- **Branch**: cursor/self-hosted-docker-backend-b034
