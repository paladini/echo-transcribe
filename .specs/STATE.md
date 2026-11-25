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
- **Phase / Task**: Specify complete, Design + Tasks next then Execute
- **Completed**: none
- **In-progress** (file:line): none
- **Next step**: Validate spec, write design and tasks, then implement remaining tests and registry publish on PR branch
- **Blockers**: none
- **Uncommitted files**: harness-report.json (unrelated)
- **Branch**: cursor/self-hosted-docker-backend-b034
