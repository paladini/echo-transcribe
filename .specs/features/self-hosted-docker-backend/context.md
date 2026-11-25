# Self-hosted Docker Backend Context

**Gathered:** 2026-11-24
**Spec:** `.specs/features/self-hosted-docker-backend/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Ship a CPU Dockerfile + Compose path for the existing FastAPI/faster-whisper API. Keep Tauri as the primary product. Bind HOST/PORT from env. Read multipart `model`/`language`. Document EN+PT. Optionally publish the CPU image to GHCR (always on tags) and Docker Hub (when Hub secrets exist).

---

## Implementation Decisions

### Product

- Desktop remains primary. Docker is API-only.
- No Tauri UI in the image (PR #3).

### Runtime

- CPU image default. GPU compose override is documented, not CI, not published.
- Container: `HOST=0.0.0.0`, `PORT=8000`. Host publish: `ECHO_PORT` -> container 8000.
- Desktop: bind `127.0.0.1`, scan 8000-8004 when PORT unset.

### API contract

- `model` and `language` are `Form` fields so curl and desktop FormData work.
- No authentication. README warns about LAN exposure.

### Registry

- GHCR: `ghcr.io/paladini/echo-transcribe` on tags `v*`.
- Docker Hub: `paladini/echo-transcribe` only if `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are set.
- Platforms: `linux/amd64`.
- Compose `image:` is `paladini/echo-transcribe:cpu`.

### Agent's Discretion

- Extract vs keep helpers in `main.py`: keep them in `main.py` unless tests cannot import cleanly.
- GitHub Actions versions: current Docker-maintained tags (`login-action`, `build-push-action`, `metadata-action`).

### Declined / Undiscussed Gray Areas → Assumptions

Issue #5 already decided bind, volumes, CORS, GPU-as-override, and "do not touch release.yml". Interactive discuss was skipped. Those defaults are in the spec Assumptions table.

---

## Specific References

Issue https://github.com/paladini/echo-transcribe/issues/5 and PR https://github.com/paladini/echo-transcribe/pull/6. User asked to implement this path and publish to Docker Hub if planned; Hub is gated because #5 did not require a registry.

---

## Deferred Ideas

- First-class CUDA base image and DGX Spark (issue #4)
- linux/arm64 image
- Auth / API keys
- Frontend-in-Docker (PR #3)
