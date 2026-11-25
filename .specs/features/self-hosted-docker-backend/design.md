# Self-hosted Docker Backend Design

**Spec**: `.specs/features/self-hosted-docker-backend/spec.md`
**Status**: Approved

---

## Architecture Overview

The desktop app keeps spawning `main.py` on localhost. The new path is the same process inside a CPU container, with env flipping bind address, data dirs, device, and CORS.

```
Host :ECHO_PORT (default 8000)
        |
        v
  docker compose service `api`
        |
        v
  python main.py   HOST=0.0.0.0 PORT=8000
        |
        +-- /health, /docs, /transcribe, /transcribe-batch
        +-- volumes: /data/models, /data/hf-cache, /data/temp
```

Desktop (unchanged default): `HOST` unset → `127.0.0.1`, port scan 8000-8004, write `backend_port.txt`.

---

## Code Reuse

- `src-tauri/backend/main.py` routes, Whisper load, temp cleanup
- `src-tauri/backend/requirements.txt` (fastapi, faster-whisper, torch)
- Existing `GET /health` used by the desktop and by Compose/Dockerfile healthchecks
- Desktop `FormData` in `src/App.tsx` already appends `model`; FastAPI must read it as `Form`

---

## Components

### Bind and path helpers (`src-tauri/backend/main.py`)

- `resolve_bind_host()`, `resolve_listen_port()`, `resolve_data_paths()`, `cors_settings()`
- Env aliases: `ECHO_HOST`/`HOST`, `ECHO_PORT`/`PORT`, `ECHO_DATA_DIR`/`ECHO_MODELS_DIR`/`ECHO_TEMP_DIR`
- Whisper: `WHISPER_DEVICE`, `WHISPER_COMPUTE_TYPE`

### CPU image (`src-tauri/backend/Dockerfile`)

- `python:3.11-slim-bookworm` + ffmpeg + curl
- Install torch from `TORCH_INDEX_URL` (default CPU wheel index) before `requirements.txt`
- Non-root `appuser` uid 1000, `/data/*` writable
- `CMD python main.py`

### Compose

- `docker-compose.yml`: service `api`, healthcheck `GET http://127.0.0.1:8000/health`, image `paladini/echo-transcribe:cpu`
- `docker-compose.gpu.yml`: override image tag, `TORCH_INDEX_URL` cu121, `WHISPER_DEVICE=cuda`, NVIDIA reservation. Not published.

### CI (`.github/workflows/docker.yml`)

- PR/push path filter: `docker compose config`, `docker buildx build --check`, `py_compile`, pytest for backend tests
- Tag `v*`: build CPU image, push GHCR; login/push Docker Hub only when username+token are present
- Do not edit `.github/workflows/release.yml`

---

## Data

No new schemas. `TranscriptionResponse` unchanged. Form fields: `model` default `base`, `language` optional, `auto_detect_language` default true.

---

## Tech Decisions

| Decision | Choice | Reason |
| -------- | ------ | ------ |
| Helpers live in `main.py` | no extra module | Single backend file already owns startup; tests import it with `ECHO_DATA_DIR` pointed at tmp |
| Registry | GHCR required on tags; Hub optional | Hub needs secrets the repo may lack; GHCR uses `GITHUB_TOKEN` |
| Platforms | linux/amd64 | Torch CPU image size; arm64 later |
| GPU | compose override only | Issue #5; AD-002 |

---

## Risks & Concerns

| Concern | Mitigation |
| ------- | ---------- |
| Importing `main.py` mkdir on the real home during tests | Tests set `ECHO_DATA_DIR` in `conftest.py` before import |
| Full image build is several GB | PR CI uses `--check` only; tag job builds once |
| Unauthenticated API on `0.0.0.0` | README warning; desktop default stays localhost |
| `av==10.0.0` sdist vs Cython 3 | Dockerfile pins Cython 0.29 and `--no-build-isolation` |
| Missing Hub secrets failing a required job | Hub login/push is a conditional step; GHCR is the required publish |

---

## Test Plan (design)

- Unit: bind host, PORT parse, CORS `*` vs defaults, data paths
- API: OpenAPI puts `model` in requestBody; TestClient 400 for bad model and bad extension; `/health` status `healthy`; mocked transcribe uses form `model=tiny`
- Config: `docker compose config` CPU and CPU+GPU; Compose `image` is `paladini/echo-transcribe:cpu`
- Docs: both READMEs; `release.yml` identical to main for the publish-tauri job
