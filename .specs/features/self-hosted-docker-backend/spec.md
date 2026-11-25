# Self-hosted Docker Backend Specification

## Problem Statement

EchoTranscribe's FastAPI/faster-whisper backend only binds `127.0.0.1` and scans ports 8000-8004, which is correct for the Tauri desktop app and unusable as a container. People who want local transcription on a homelab, NAS, or headless Linux box still have to install Node, Rust, and GTK. This feature adds a CPU Docker image and Compose path for that API without replacing the desktop product.

## Goals

- [ ] A user can start the existing transcription API with `docker compose up` and get `GET /health` = `healthy`
- [ ] Desktop bind default stays `127.0.0.1`; containers bind `0.0.0.0` via env
- [ ] `curl -F file= -F model=` selects the Whisper size (multipart form, not query)
- [ ] README.md and README_PT.md document the Docker path as optional, not a desktop replacement

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Tauri/React UI inside the container | Tracked by PR #3; this issue is API-only |
| Rewrite of `/transcribe` or faster-whisper | Existing routes stay; only bind, form fields, and env change |
| CUDA image as the default | CPU is the supported default; GPU is an optional override |
| NVIDIA DGX Spark support | Issue #4; not this delivery |
| Authentication / API keys | Local self-hosted trust model; network exposure is documented instead |
| Changing `.github/workflows/release.yml` | Tauri publish must stay intact |
| Publishing a GPU image to a registry | GPU stays a local override |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Product split | Desktop remains primary; Docker is an optional API path | Issue #5 and AD-001 | y |
| Image device | CPU PyTorch default (`WHISPER_DEVICE=cpu`, `WHISPER_COMPUTE_TYPE=int8`) | Runs without NVIDIA drivers; GPU override is documented | y |
| Bind address | Desktop `127.0.0.1`; container `HOST=0.0.0.0` | Desktop must not listen on the LAN unless the user opts in | y |
| Listen port in container | Fixed `PORT=8000` (no 8000-8004 scan). Host publish uses `ECHO_PORT` (default 8000) mapped to container 8000 | Scan would break Compose healthchecks and published ports | y |
| Model / language on `/transcribe` | Multipart `Form` fields | Desktop and curl send FormData; query params never received the size | y |
| CORS in Compose | `CORS_ALLOW_ORIGINS=*` with credentials disabled | Swagger from another origin; Starlette forbids `*` plus credentials | y |
| Auth | None | Local service; README warns that publishing port 8000 on a network-facing host exposes an unauthenticated API | y |
| Registry publish | CPU image on git tags `v*` to GHCR; Docker Hub only when `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` exist | Issue #5 did not require a registry. The user asked for Docker Hub when planned/possible. GHCR needs no extra secret. Hub is gated so missing secrets do not fail the tag workflow's required path | y |
| Publish platforms | `linux/amd64` only | CPU torch image is already several GB; multi-arch is a follow-up | y |
| Image name | `paladini/echo-transcribe` on Docker Hub and `ghcr.io/paladini/echo-transcribe` | Matches the GitHub owner; tag `cpu` is the supported variant, `latest` points at cpu | y |

**Open questions:** none - all resolved or logged above

---

## User Stories

### P1: Start the API with Compose ⭐ MVP

**User Story**: As a homelab operator, I want `docker compose up -d --build` so that I can transcribe audio without Node, Rust, or GTK.

**Why P1**: This is the whole reason for the issue.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN a user runs `docker compose up` from the repository root THEN the system SHALL publish the API on host port `8000` unless `ECHO_PORT` overrides the host mapping
2. WHEN the container is healthy THEN `GET /health` SHALL return JSON whose `status` field is `healthy`
3. WHEN the container starts THEN the process SHALL listen on `0.0.0.0:8000` inside the container
4. The Compose file SHALL mount named volumes `echo-models` at `/data/models`, `echo-hf-cache` at `/data/hf-cache`, and `echo-uploads` at `/data/temp`
5. The CPU image SHALL install PyTorch from `https://download.pytorch.org/whl/cpu` so the default image does not require CUDA

**Independent Test**: `docker compose config` is valid; `GET /health` returns `healthy` after `up`.

---

### P1: Desktop bind stays localhost ⭐ MVP

**User Story**: As a desktop user, I want the bundled backend to keep binding localhost so that Tauri does not start listening on the LAN.

**Why P1**: A container fix must not regress the primary product.

**Acceptance Criteria**:

1. WHEN `ECHO_HOST` and `HOST` are unset THEN `resolve_bind_host()` SHALL return `127.0.0.1`
2. WHEN `HOST` is `0.0.0.0` THEN `resolve_bind_host()` SHALL return `0.0.0.0`
3. WHEN `ECHO_PORT` and `PORT` are unset THEN `resolve_listen_port` SHALL scan ports 8000 through 8004 on the bind host
4. WHEN `PORT` is a valid integer THEN `resolve_listen_port` SHALL return that integer and SHALL NOT port-scan
5. IF `PORT` is not a valid integer THEN `resolve_listen_port` SHALL return `None`

**Independent Test**: unit tests of the bind helpers with env fixtures.

---

### P1: Multipart model selection ⭐ MVP

**User Story**: As an API client, I want `curl -F model=tiny` (and the desktop FormData) to select the Whisper size so that I am not stuck on the default `base` model.

**Why P1**: Without Form binding, Docker and the desktop both ignore the chosen size.

**Acceptance Criteria**:

1. WHEN `POST /transcribe` is declared THEN `model` and `language` SHALL be multipart form fields, not query parameters
2. WHEN `POST /transcribe` is sent with multipart `file` and `model=tiny` THEN the handler SHALL use model name `tiny`
3. IF `model` is not one of `tiny`, `base`, `small`, `medium` THEN the API SHALL respond HTTP 400
4. IF the upload extension is not one of `.mp3`, `.wav`, `.flac`, `.m4a`, `.ogg`, `.webm` THEN the API SHALL respond HTTP 400

**Independent Test**: OpenAPI schema plus TestClient with a mocked Whisper model.

---

### P1: Docs treat Docker as optional ⭐ MVP

**User Story**: As a reader of the README, I want a Self-hosted API (Docker) section in English and Portuguese so that I can start the container without thinking it replaces the desktop app.

**Why P1**: Issue #5 requires both README locales.

**Acceptance Criteria**:

1. WHEN README.md documents Docker THEN it SHALL state that the desktop app remains the primary product
2. WHEN README.md documents Docker THEN it SHALL include a `curl` example that posts `file` and `model` to `/transcribe`
3. The Portuguese README SHALL document the same Docker start command, health URL, volumes, and CPU-vs-GPU split as README.md
4. The Tauri publish workflow file `.github/workflows/release.yml` SHALL remain the mechanism for desktop releases

**Independent Test**: grep the two READMEs and diff `release.yml` against `origin/main`.

---

### P2: Publish the CPU image

**User Story**: As an operator, I want to pull a prebuilt CPU image so that I do not wait through a multi-GB local `docker compose build`.

**Why P2**: Issue #5 did not require a registry. Prebuilt images are the practical way to use this path. GHCR always; Docker Hub when Hub credentials exist.

**Acceptance Criteria**:

1. WHEN a git tag matching `v*` is pushed THEN CI SHALL build the CPU Dockerfile and push `ghcr.io/paladini/echo-transcribe` with tags `cpu` and the version
2. WHERE `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are configured, WHEN that same tag job runs THEN CI SHALL also push `paladini/echo-transcribe` with tags `cpu` and the version
3. IF Docker Hub credentials are missing THEN the tag job SHALL still succeed after GHCR publish
4. The default Compose `image:` SHALL be `paladini/echo-transcribe:cpu` so `docker compose pull` can use Hub after the first published tag
5. The Tauri workflow `.github/workflows/release.yml` SHALL NOT gain Docker publish steps

**Independent Test**: workflow YAML review plus `docker compose config` showing the image name. Live Hub/GHCR verification happens after an authorized tag.

---

## Edge Cases

- IF `PORT` is the string `abc` THEN `resolve_listen_port` SHALL return `None`
- IF `CORS_ALLOW_ORIGINS` is `*` THEN `cors_settings()` SHALL return origins `["*"]` and credentials `False`
- IF `CORS_ALLOW_ORIGINS` is unset THEN `cors_settings()` SHALL include `http://localhost:1420` and `tauri://localhost` and credentials `True`
- WHEN host `ECHO_PORT` is `9000` THEN Compose SHALL map `9000:8000` and the process inside the container SHALL still listen on `8000`
- IF the API is published on a network-facing interface THEN the README SHALL warn that the service is unauthenticated

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| DOCKER-01 | P1: Compose up + health | Tasks | Verified |
| DOCKER-02 | P1: Container binds 0.0.0.0:8000 | Tasks | Verified |
| DOCKER-03 | P1: Named volumes | Tasks | Verified |
| DOCKER-04 | P1: CPU torch index | Tasks | Verified |
| DOCKER-05 | P1: Default bind 127.0.0.1 | Tasks | Verified |
| DOCKER-06 | P1: HOST env override | Tasks | Verified |
| DOCKER-07 | P1: Port scan vs PORT env | Tasks | Verified |
| DOCKER-08 | P1: Invalid PORT | Tasks | Verified |
| DOCKER-09 | P1: Form fields for model/language | Tasks | Verified |
| DOCKER-10 | P1: Invalid model 400 | Tasks | Verified |
| DOCKER-11 | P1: Invalid extension 400 | Tasks | Verified |
| DOCKER-12 | P1: README EN + PT | Tasks | Pending |
| DOCKER-13 | P1: release.yml untouched | Tasks | Pending |
| DOCKER-14 | P2: GHCR publish on v* tags | Tasks | Pending |
| DOCKER-15 | P2: Docker Hub gated on secrets | Tasks | Pending |
| DOCKER-16 | P2: Compose image name | Tasks | Verified |
| DOCKER-17 | Edge: CORS * disables credentials | Tasks | Verified |

**ID format:** `DOCKER-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 17 total, 12 verified, 5 pending

---

## Success Criteria

How we know the feature is successful:

- [ ] `docker compose config` succeeds for the CPU file and for CPU+GPU override
- [ ] Unit tests prove desktop bind default, PORT handling, CORS, and Form field placement
- [ ] `GET /health` returns `status=healthy` against the FastAPI app
- [ ] README.md and README_PT.md both describe Docker as optional
- [ ] `.github/workflows/release.yml` is unchanged from the desktop publish workflow
- [ ] Tag workflow can publish GHCR; Docker Hub is optional and documented
