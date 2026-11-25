# Self-hosted Docker Backend Validation

**Date**: 2026-11-24
**Spec**: `.specs/features/self-hosted-docker-backend/spec.md`
**Diff range**: `origin/main...HEAD` (includes original PR `e1df939` through `f77efc4`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Result**: PASS

---

## Task Completion

| Task | Status  | Notes |
| ---- | ------- | ----- |
| T1   | ✅ Done | Bind, PORT, CORS, data-path unit tests |
| T2   | ✅ Done | Health, OpenAPI form placement, invalid model/extension, mocked tiny |
| T3   | ✅ Done | CPU Dockerfile bind, torch index, healthcheck |
| T4   | ✅ Done | Compose volumes, `ECHO_PORT`, image name, GPU override config |
| T5   | ✅ Done | docker.yml PR lint includes pytest; `release.yml` untouched |
| T6   | ✅ Done | EN + PT Docker sections, curl example, LAN warning |
| T7   | ✅ Done | Tag `v*` GHCR publish; Hub gated on credentials |

---

## Spec-Anchored Acceptance Criteria

### P1: Start the API with Compose

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN a user runs `docker compose up` from the repository root THEN the system SHALL publish the API on host port `8000` unless `ECHO_PORT` overrides the host mapping | Host mapping `${ECHO_PORT:-8000}:8000` | `docker-compose.yml:18` - `ports: - "${ECHO_PORT:-8000}:8000"` | ✅ PASS |
| WHEN the container is healthy THEN `GET /health` SHALL return JSON whose `status` field is `healthy` | `status` == `healthy` | `src-tauri/backend/tests/test_transcribe_form.py:46` - `assert response.json()["status"] == "healthy"` | ✅ PASS |
| WHEN the container starts THEN the process SHALL listen on `0.0.0.0:8000` inside the container | Bind `0.0.0.0`, listen `8000` | `src-tauri/backend/Dockerfile:55-56` - `ENV HOST=0.0.0.0` / `PORT=8000`; `docker-compose.yml:20-21` - `HOST: "0.0.0.0"` / `PORT: "8000"`; `src-tauri/backend/main.py:579-604` - `host = resolve_bind_host()` then `uvicorn.run(..., host=host, port=port)` | ✅ PASS |
| The Compose file SHALL mount named volumes `echo-models` at `/data/models`, `echo-hf-cache` at `/data/hf-cache`, and `echo-uploads` at `/data/temp` | Three named volume mounts at those paths | `docker-compose.yml:32-34` - `echo-models:/data/models`, `echo-hf-cache:/data/hf-cache`, `echo-uploads:/data/temp`; `docker-compose.yml:43-45` volume declarations | ✅ PASS |
| The CPU image SHALL install PyTorch from `https://download.pytorch.org/whl/cpu` so the default image does not require CUDA | Default torch index is that CPU URL | `src-tauri/backend/Dockerfile:7` - `ARG TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu`; `docker-compose.yml:13` - `TORCH_INDEX_URL: https://download.pytorch.org/whl/cpu` | ✅ PASS |

### P1: Desktop bind stays localhost

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN `ECHO_HOST` and `HOST` are unset THEN `resolve_bind_host()` SHALL return `127.0.0.1` | `"127.0.0.1"` | `src-tauri/backend/tests/test_server_config.py:9` - `assert resolve_bind_host() == "127.0.0.1"` | ✅ PASS |
| WHEN `HOST` is `0.0.0.0` THEN `resolve_bind_host()` SHALL return `0.0.0.0` | `"0.0.0.0"` | `src-tauri/backend/tests/test_server_config.py:15` - `assert resolve_bind_host() == "0.0.0.0"` | ✅ PASS |
| WHEN `ECHO_PORT` and `PORT` are unset THEN `resolve_listen_port` SHALL scan ports 8000 through 8004 on the bind host | Returned port in `8000..8004` | `src-tauri/backend/tests/test_server_config.py:22-23` - `assert port is not None` / `assert 8000 <= port <= 8004`; impl `src-tauri/backend/main.py:93` - `find_available_port(8000, 5, host=host)` | ✅ PASS |
| WHEN `PORT` is a valid integer THEN `resolve_listen_port` SHALL return that integer and SHALL NOT port-scan | Returns `9000` (outside the scan window) | `src-tauri/backend/tests/test_server_config.py:29` - `assert resolve_listen_port("127.0.0.1") == 9000` | ✅ PASS |
| IF `PORT` is not a valid integer THEN `resolve_listen_port` SHALL return `None` | `None` | `src-tauri/backend/tests/test_server_config.py:35` - `assert resolve_listen_port("127.0.0.1") is None` | ✅ PASS |

### P1: Multipart model selection

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN `POST /transcribe` is declared THEN `model` and `language` SHALL be multipart form fields, not query parameters | Not in OpenAPI query; `Form(...)` on the handler | `src-tauri/backend/tests/test_transcribe_form.py:52-55` - `assert "model" not in query_names` / `assert "language" not in query_names` / `assert "multipart/form-data" in body`; `src-tauri/backend/main.py:249-250` - `model: str = Form("base")` / `language: Optional[str] = Form(None)` | ✅ PASS |
| WHEN `POST /transcribe` is sent with multipart `file` and `model=tiny` THEN the handler SHALL use model name `tiny` | Loader called with `"tiny"` | `src-tauri/backend/tests/test_transcribe_form.py:95` - `assert seen["name"] == "tiny"` | ✅ PASS |
| IF `model` is not one of `tiny`, `base`, `small`, `medium` THEN the API SHALL respond HTTP 400 | HTTP 400 | `src-tauri/backend/tests/test_transcribe_form.py:65` - `assert response.status_code == 400` (payload `model=huge`) | ✅ PASS |
| IF the upload extension is not one of `.mp3`, `.wav`, `.flac`, `.m4a`, `.ogg`, `.webm` THEN the API SHALL respond HTTP 400 | HTTP 400 | `src-tauri/backend/tests/test_transcribe_form.py:75` - `assert response.status_code == 400` (payload `notes.txt`) | ✅ PASS |

### P1: Docs treat Docker as optional

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN README.md documents Docker THEN it SHALL state that the desktop app remains the primary product | Desktop remains primary | `README.md:102` - `The **desktop app remains the primary product**.` | ✅ PASS |
| WHEN README.md documents Docker THEN it SHALL include a `curl` example that posts `file` and `model` to `/transcribe` | curl `-F file` and `-F model` to `/transcribe` | `README.md:133` - `curl -F "file=@recording.mp3" -F "model=tiny" http://localhost:8000/transcribe` | ✅ PASS |
| The Portuguese README SHALL document the same Docker start command, health URL, volumes, and CPU-vs-GPU split as README.md | `docker compose up`, `/health`, three volumes, CPU vs GPU override | `README_PT.md:100` - `docker compose up -d --build`; `README_PT.md:118` - `Health: http://localhost:8000/health`; `README_PT.md:139-141` - `echo-models` / `echo-hf-cache` / `echo-uploads`; `README_PT.md:160-167` - CPU vs GPU heading and override compose command | ✅ PASS |
| The Tauri publish workflow file `.github/workflows/release.yml` SHALL remain the mechanism for desktop releases | Unchanged desktop publish workflow | `.github/workflows/release.yml:9` - `publish-tauri`; `git diff origin/main...HEAD -- .github/workflows/release.yml` is empty | ✅ PASS |

### P2: Publish the CPU image

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN a git tag matching `v*` is pushed THEN CI SHALL build the CPU Dockerfile and push `ghcr.io/paladini/echo-transcribe` with tags `cpu` and the version | Tag trigger `v*`; GHCR image; tags `cpu` + semver | `.github/workflows/docker.yml:8-9` - `tags: - "v*"`; `docker.yml:102-108` - `ghcr.io/${{ github.repository }}` with `type=raw,value=cpu` and `type=semver,pattern={{version}}`; `docker.yml:114-115` - `file: src-tauri/backend/Dockerfile` | ✅ PASS |
| WHERE `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are configured, WHEN that same tag job runs THEN CI SHALL also push `paladini/echo-transcribe` with tags `cpu` and the version | Hub image added when both credentials are present | `.github/workflows/docker.yml:78-85` - Hub publish when `HUB_USER` and `HUB_TOKEN` nonempty, `images=${HUB_USER}/echo-transcribe`; Hub login `docker.yml:91-96`; same metadata tags `cpu` + version | ✅ PASS |
| IF Docker Hub credentials are missing THEN the tag job SHALL still succeed after GHCR publish | Hub login skipped; GHCR still pushed | `.github/workflows/docker.yml:86-89` - empty `images=` and message `publishing GHCR only.`; Hub login `if: steps.hub.outputs.images != ''`; GHCR login is unconditional at `docker.yml:71-76` | ✅ PASS |
| The default Compose `image:` SHALL be `paladini/echo-transcribe:cpu` so `docker compose pull` can use Hub after the first published tag | `paladini/echo-transcribe:cpu` | `docker-compose.yml:14` - `image: paladini/echo-transcribe:cpu` | ✅ PASS |
| The Tauri workflow `.github/workflows/release.yml` SHALL NOT gain Docker publish steps | No docker/ghcr/hub steps | `.github/workflows/release.yml` has no docker/ghcr/DOCKERHUB matches; diff vs `origin/main` is empty | ✅ PASS |

**Status**: ✅ All ACs covered

---

## Discrimination Sensor

Scratch: git worktree at HEAD under `%TEMP%\echo-transcribe-sensor-scratch`. Real tree was not mutated. `git stash` was not used. Restored the scratch file between mutants. Worktree removed with `--force`. Porcelain after cleanup matched the pre-sensor baseline (`?? .agents/` and `?? harness-report.json` only). Real `main.py` still has `127.0.0.1`, CORS `False`, and `status: "healthy"`.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1        | `src-tauri/backend/main.py:43` | `resolve_bind_host` default `"127.0.0.1"` → `"0.0.0.0"` | ✅ Killed (`test_bind_host_defaults_to_localhost`, pytest exit 1) |
| 2        | `src-tauri/backend/main.py:66` | `cors_settings` `*` returns credentials `True` instead of `False` | ✅ Killed (`test_cors_star_disables_credentials`, pytest exit 1) |
| 3        | `src-tauri/backend/main.py:237` | `GET /health` `status` `'healthy'` → `'ok'` | ✅ Killed (`test_health_status_is_healthy`, pytest exit 1) |

**Sensor depth**: lightweight
**Result**: 3/3 killed - PASS

---

## Interactive UAT Results (if performed)

Skipped. Backend and infrastructure feature; automated checks are sufficient per validate.md.

---

## Code Quality

| Principle        | Status |
| ---------------- | ------ |
| Minimum code     | ✅     |
| Surgical changes | ✅     |
| No scope creep   | ✅     |
| Matches patterns | ✅     |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ |
| Every test maps to a spec requirement - no unclaimed tests | ✅ `test_data_paths_use_echo_data_dir` maps to T1 data-dir helpers used by Compose volumes, not a numbered AC |
| Documented guidelines followed: none - strong defaults applied (`tasks.md` Test Coverage Matrix) | ✅ |

---

## Edge Cases

- [x] IF `PORT` is the string `abc` THEN `resolve_listen_port` SHALL return `None` - `src-tauri/backend/tests/test_server_config.py:32-35` - `setenv("PORT", "abc")` / `assert ... is None`
- [x] IF `CORS_ALLOW_ORIGINS` is `*` THEN `cors_settings()` SHALL return origins `["*"]` and credentials `False` - `src-tauri/backend/tests/test_server_config.py:41-42` - `assert origins == ["*"]` / `assert credentials is False`
- [x] IF `CORS_ALLOW_ORIGINS` is unset THEN `cors_settings()` SHALL include `http://localhost:1420` and `tauri://localhost` and credentials `True` - `src-tauri/backend/tests/test_server_config.py:48-50`
- [x] WHEN host `ECHO_PORT` is `9000` THEN Compose SHALL map `9000:8000` and the process inside the container SHALL still listen on `8000` - `docker-compose.yml:18` host mapping `${ECHO_PORT:-8000}:8000`; `docker-compose.yml:21` container `PORT: "8000"` (host `ECHO_PORT` is not passed into the container env)
- [x] IF the API is published on a network-facing interface THEN the README SHALL warn that the service is unauthenticated - `README.md:186`; `README_PT.md:177`

---

## Gate Check

- **Gate command**: `python -m pytest src-tauri/backend/tests -q` && `docker compose -f docker-compose.yml config --quiet` && `docker compose -f docker-compose.yml -f docker-compose.gpu.yml config --quiet` && `docker buildx build --check -f src-tauri/backend/Dockerfile src-tauri/backend` && `python -m py_compile src-tauri/backend/main.py src-tauri/backend/start_backend.py`
- **Result**: 13 passed, 0 failed, 0 skipped (pytest); compose CPU exit 0; compose CPU+GPU exit 0; `docker buildx build --check` complete, no warnings; py_compile exit 0
- **Test count before feature**: 0 (`origin/main` has no `src-tauri/backend/tests` files)
- **Test count after feature**: 13
- **Delta**: +13 new tests
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans (if issues found)

None.

---

## Requirement Traceability Update

Spec.md already lists these as Verified. This report confirms that status. spec.md was not edited (verifier writes validation.md only).

| Requirement | Previous Status | New Status  |
| ----------- | --------------- | ----------- |
| DOCKER-01   | Verified        | ✅ Verified |
| DOCKER-02   | Verified        | ✅ Verified |
| DOCKER-03   | Verified        | ✅ Verified |
| DOCKER-04   | Verified        | ✅ Verified |
| DOCKER-05   | Verified        | ✅ Verified |
| DOCKER-06   | Verified        | ✅ Verified |
| DOCKER-07   | Verified        | ✅ Verified |
| DOCKER-08   | Verified        | ✅ Verified |
| DOCKER-09   | Verified        | ✅ Verified |
| DOCKER-10   | Verified        | ✅ Verified |
| DOCKER-11   | Verified        | ✅ Verified |
| DOCKER-12   | Verified        | ✅ Verified |
| DOCKER-13   | Verified        | ✅ Verified |
| DOCKER-14   | Verified        | ✅ Verified |
| DOCKER-15   | Verified        | ✅ Verified |
| DOCKER-16   | Verified        | ✅ Verified |
| DOCKER-17   | Verified        | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 23/23 ACs matched spec outcome, 0 spec-precision gaps, 5/5 edge cases evidenced
**Sensor**: 3/3 mutations killed
**Gate**: 13 passed, 0 failed

**What works**: Desktop bind stays `127.0.0.1`; container env binds `0.0.0.0:8000`; Compose publishes `${ECHO_PORT:-8000}:8000` with the three named volumes; `/transcribe` model/language are form fields; invalid model and extension return 400; CORS `*` disables credentials; READMEs treat Docker as optional and warn about an unauthenticated API; tag workflow publishes GHCR and gates Docker Hub; `release.yml` is unchanged.

**Issues found**: none

**Next steps**: none from this verifier
