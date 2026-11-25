"""Spec-derived tests for desktop vs container bind, PORT, and CORS."""

from main import cors_settings, resolve_bind_host, resolve_listen_port


def test_bind_host_defaults_to_localhost(monkeypatch):
    monkeypatch.delenv("ECHO_HOST", raising=False)
    monkeypatch.delenv("HOST", raising=False)
    assert resolve_bind_host() == "127.0.0.1"


def test_bind_host_uses_host_env(monkeypatch):
    monkeypatch.delenv("ECHO_HOST", raising=False)
    monkeypatch.setenv("HOST", "0.0.0.0")
    assert resolve_bind_host() == "0.0.0.0"


def test_listen_port_scans_8000_through_8004_when_unset(monkeypatch):
    monkeypatch.delenv("ECHO_PORT", raising=False)
    monkeypatch.delenv("PORT", raising=False)
    port = resolve_listen_port("127.0.0.1")
    assert port is not None
    assert 8000 <= port <= 8004


def test_listen_port_uses_port_env_without_scan(monkeypatch):
    monkeypatch.delenv("ECHO_PORT", raising=False)
    monkeypatch.setenv("PORT", "9000")
    assert resolve_listen_port("127.0.0.1") == 9000


def test_listen_port_returns_none_for_invalid_port(monkeypatch):
    monkeypatch.delenv("ECHO_PORT", raising=False)
    monkeypatch.setenv("PORT", "abc")
    assert resolve_listen_port("127.0.0.1") is None


def test_cors_star_disables_credentials(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "*")
    origins, credentials = cors_settings()
    assert origins == ["*"]
    assert credentials is False


def test_cors_default_includes_tauri_and_allows_credentials(monkeypatch):
    monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    origins, credentials = cors_settings()
    assert "http://localhost:1420" in origins
    assert "tauri://localhost" in origins
    assert credentials is True


def test_data_paths_use_echo_data_dir(monkeypatch, tmp_path):
    monkeypatch.setenv("ECHO_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("ECHO_MODELS_DIR", raising=False)
    monkeypatch.delenv("ECHO_TEMP_DIR", raising=False)
    from main import resolve_data_paths

    models_dir, temp_dir = resolve_data_paths()
    assert models_dir == tmp_path / "models"
    assert temp_dir == tmp_path / "temp"
