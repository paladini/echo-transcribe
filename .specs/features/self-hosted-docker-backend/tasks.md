# Self-hosted Docker Backend Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/self-hosted-docker-backend/design.md`
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: none (`AGENTS.md`, `CONTRIBUTING.md`, pytest.ini, coverage config all absent). `src-tauri/backend/requirements.txt` lists `pytest==7.4.3` and `pytest-asyncio==0.21.1` but the tree has no tests yet. Strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Bind / CORS / path helpers (domain) | unit | 1:1 to DOCKER-05..08, DOCKER-17 and listed env edge cases | `src-tauri/backend/tests/test_server_config.py` | `python -m pytest src-tauri/backend/tests/test_server_config.py -q` |
| FastAPI routes | unit | `/health` status, OpenAPI form fields, invalid model 400, invalid extension 400, form `model=tiny` used | `src-tauri/backend/tests/test_transcribe_form.py` | `python -m pytest src-tauri/backend/tests/test_transcribe_form.py -q` |
| Dockerfile / Compose / workflow | none | Build gate: compose config, Dockerfile `--check`, workflow keys | `src-tauri/backend/Dockerfile`, `docker-compose.yml`, `.github/workflows/docker.yml` | build gate |
| README locales | none | Build gate: required strings present | `README.md`, `README_PT.md` | build gate |

## Gate Check Commands

> Generated from codebase. No lint script in package.json for Python. Docker is installed locally.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `python -m pytest src-tauri/backend/tests -q` |
| Full | After tasks with compose/API integration claims | `python -m pytest src-tauri/backend/tests -q` && `docker compose -f docker-compose.yml config --quiet` && `docker compose -f docker-compose.yml -f docker-compose.gpu.yml config --quiet` |
| Build | After phase completion or config-only tasks | `python -m pytest src-tauri/backend/tests -q` && `docker compose -f docker-compose.yml config --quiet` && `docker compose -f docker-compose.yml -f docker-compose.gpu.yml config --quiet` && `docker buildx build --check -f src-tauri/backend/Dockerfile src-tauri/backend` && `python -m py_compile src-tauri/backend/main.py src-tauri/backend/start_backend.py` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Runtime config

```
T1
```

### Phase 2: API contract

```
T2
```

### Phase 3: Container and CI lint

```
T3 -> T4 -> T5
```

### Phase 4: Documentation

```
T6
```

### Phase 5: Registry publish

```
T7
```

---

## Task Breakdown

### Phase 1: Runtime config

#### T1: Bind, path, and CORS helpers with unit tests

**What**: Keep env helpers on `main.py` and add unit tests that lock desktop vs container bind, PORT parsing, data dirs, and CORS.
**Where**: `src-tauri/backend/main.py`
**Depends on**: None
**Reuses**: Existing helpers already on the PR branch
**Requirement**: DOCKER-05, DOCKER-06, DOCKER-07, DOCKER-08, DOCKER-17

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `resolve_bind_host()` returns `127.0.0.1` when HOST/ECHO_HOST unset
- [x] `resolve_bind_host()` returns `0.0.0.0` when HOST is `0.0.0.0`
- [x] Unset PORT scans 8000-8004; valid PORT is used as-is; invalid PORT returns None
- [x] `CORS_ALLOW_ORIGINS=*` returns `["*"]` and credentials False; unset includes `tauri://localhost` and credentials True
- [x] Gate check passes: `python -m pytest src-tauri/backend/tests/test_server_config.py -q`
- [x] Test count: 8 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### Phase 2: API contract

#### T2: Form field contract and health tests

**What**: Keep `/transcribe` model/language as Form fields and add tests for OpenAPI placement, health JSON, invalid model, invalid extension, and mocked tiny transcription.
**Where**: `src-tauri/backend/main.py`
**Depends on**: T1
**Reuses**: FastAPI TestClient; existing `AVAILABLE_MODELS` and HTTPException 400 paths
**Requirement**: DOCKER-09, DOCKER-10, DOCKER-11

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] OpenAPI lists `model` under requestBody (not query) for POST `/transcribe`
- [x] `GET /health` JSON `status` is `healthy`
- [x] Invalid model returns HTTP 400
- [x] Unsupported extension returns HTTP 400
- [x] Multipart `model=tiny` is the name passed into the (mocked) loader
- [x] Gate check passes: `python -m pytest src-tauri/backend/tests -q`
- [x] Test count: 13 tests pass (8 config + 5 API)

**Tests**: unit
**Gate**: quick

---

### Phase 3: Container and CI lint

#### T3: CPU Dockerfile

**What**: CPU image that installs torch from the CPU index, runs as uid 1000, exposes 8000, healthchecks `/health`.
**Where**: `src-tauri/backend/Dockerfile`
**Depends on**: None
**Reuses**: `requirements.txt`, `main.py`
**Requirement**: DOCKER-02, DOCKER-04

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Default `TORCH_INDEX_URL` is `https://download.pytorch.org/whl/cpu`
- [x] `ENV HOST=0.0.0.0` and `PORT=8000`
- [x] HEALTHCHECK curls `http://127.0.0.1:8000/health`
- [x] Gate check passes: `docker buildx build --check -f src-tauri/backend/Dockerfile src-tauri/backend`
- [x] Test count: 13 tests pass (unchanged)

**Tests**: none
**Gate**: build

---

#### T4: Compose CPU and GPU override

**What**: Root Compose file with volumes, healthcheck, host `ECHO_PORT` mapped to container 8000, image `paladini/echo-transcribe:cpu`, plus GPU override file.
**Where**: `docker-compose.yml`
**Depends on**: T3
**Reuses**: Dockerfile
**Requirement**: DOCKER-01, DOCKER-03, DOCKER-16

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `docker compose -f docker-compose.yml config --quiet` exits 0
- [x] `docker compose -f docker-compose.yml -f docker-compose.gpu.yml config --quiet` exits 0
- [x] Configured image is `paladini/echo-transcribe:cpu`
- [x] Volumes `echo-models`, `echo-hf-cache`, `echo-uploads` are present
- [x] Host mapping uses `${ECHO_PORT:-8000}:8000` and container `PORT=8000`
- [x] Gate check passes: full compose config commands
- [x] Test count: 13 tests pass (unchanged)

**Tests**: none
**Gate**: full

---

#### T5: Docker workflow lint and pytest

**What**: Keep PR lint (compose config, Dockerfile --check, py_compile) and add pytest on the backend tests.
**Where**: `.github/workflows/docker.yml`
**Depends on**: T4
**Reuses**: existing docker.yml job
**Requirement**: DOCKER-13

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] PR job runs compose config, `docker buildx build --check`, py_compile, and pytest
- [x] `.github/workflows/release.yml` is unchanged from origin/main
- [x] Gate check passes: build gate command
- [x] Test count: 13 tests pass (unchanged)

**Tests**: none
**Gate**: build

---

### Phase 4: Documentation

#### T6: README Docker sections

**What**: English README Self-hosted API section states desktop remains primary, includes curl with model, volumes, CPU vs GPU, Hub/GHCR pull names, and LAN warning. Mirror the same facts in README_PT.md. Changelog mentions Docker.
**Where**: `README.md`
**Depends on**: T4
**Reuses**: Issue #5 wording already on the PR branch
**Requirement**: DOCKER-12

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] README.md states the desktop app remains the primary product
- [x] README.md includes `curl` with `-F "model=` and `/transcribe`
- [x] README_PT.md includes `docker compose up` and `/health`
- [x] README warns that publishing port 8000 on a network-facing host exposes an unauthenticated API
- [x] Gate check passes: build gate command
- [x] Test count: 13 tests pass (unchanged)

**Tests**: none
**Gate**: build

---

### Phase 5: Registry publish

#### T7: GHCR and gated Docker Hub publish on tags

**What**: On git tags `v*`, build the CPU Dockerfile and push `ghcr.io/paladini/echo-transcribe` (`cpu` + version). Push `paladini/echo-transcribe` only when Docker Hub username and token are present. Do not add Docker steps to release.yml.
**Where**: `.github/workflows/docker.yml`
**Depends on**: T5
**Reuses**: docker/login-action, docker/build-push-action, docker/metadata-action
**Requirement**: DOCKER-14, DOCKER-15, DOCKER-16, DOCKER-13

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Tag trigger `v*` exists
- [x] GHCR login uses `GITHUB_TOKEN` and packages write permission
- [x] Docker Hub login is conditional on secrets/variables
- [x] `release.yml` still has no Docker publish steps
- [x] Gate check passes: build gate command
- [x] Test count: 13 tests pass (unchanged)

**Tests**: none
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1
Phase 2:  T2
Phase 3:  T3 -> T4 -> T5
Phase 4:  T6
Phase 5:  T7
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Bind helpers + unit tests | 1 module + tests | Granular |
| T2: Form contract + API tests | 1 endpoint contract | Granular |
| T3: Dockerfile | 1 file | Granular |
| T4: Compose | 1 file | Granular |
| T5: docker.yml lint | 1 file | Granular |
| T6: README | 1 file | Granular |
| T7: docker.yml publish | 1 file | Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | Match |
| T2 | T1 | cross-phase (no intra-phase arrow required) | Match |
| T3 | None | none | Match |
| T4 | T3 | T3 -> T4 | Match |
| T5 | T4 | T4 -> T5 | Match |
| T6 | T4 | cross-phase | Match |
| T7 | T5 | cross-phase | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Bind helpers (domain) | unit | unit | OK |
| T2 | FastAPI routes | unit | unit | OK |
| T3 | Dockerfile | none | none | OK |
| T4 | Compose | none | none | OK |
| T5 | workflow | none | none | OK |
| T6 | README | none | none | OK |
| T7 | workflow | none | none | OK |
