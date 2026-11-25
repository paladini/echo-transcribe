"""Spec-derived tests for /health and multipart /transcribe contract."""

import io
import wave

from fastapi.testclient import TestClient

from main import app


def _wav_bytes() -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(b"\x00\x00" * 160)
    return buf.getvalue()


class _FakeWord:
    word = "hello"
    start = 0.0
    end = 0.4
    probability = 1.0


class _FakeSegment:
    text = "hello"
    words = [_FakeWord()]


class _FakeInfo:
    language = "en"


class _FakeModel:
    def transcribe(self, *_args, **_kwargs):
        return iter([_FakeSegment()]), _FakeInfo()


def test_health_status_is_healthy():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_transcribe_model_is_multipart_form_not_query():
    post = app.openapi()["paths"]["/transcribe"]["post"]
    query_names = [p["name"] for p in post.get("parameters", []) if p.get("in") == "query"]
    assert "model" not in query_names
    assert "language" not in query_names
    body = post["requestBody"]["content"]
    assert "multipart/form-data" in body


def test_transcribe_rejects_invalid_model_with_400():
    client = TestClient(app)
    response = client.post(
        "/transcribe",
        files={"file": ("clip.wav", _wav_bytes(), "audio/wav")},
        data={"model": "huge"},
    )
    assert response.status_code == 400
    assert "Modelo inválido" in response.json()["detail"]


def test_transcribe_rejects_unsupported_extension_with_400():
    client = TestClient(app)
    response = client.post(
        "/transcribe",
        files={"file": ("notes.txt", b"not audio", "text/plain")},
        data={"model": "tiny"},
    )
    assert response.status_code == 400
    assert "Formato de arquivo não suportado" in response.json()["detail"]


def test_transcribe_form_model_tiny_is_passed_to_loader(monkeypatch):
    seen = {}

    def fake_loader(model_name: str):
        seen["name"] = model_name
        return _FakeModel()

    monkeypatch.setattr("main.load_whisper_model", fake_loader)
    client = TestClient(app)
    response = client.post(
        "/transcribe",
        files={"file": ("clip.wav", _wav_bytes(), "audio/wav")},
        data={"model": "tiny", "auto_detect_language": "false"},
    )
    assert response.status_code == 200
    assert seen["name"] == "tiny"
    assert response.json()["text"] == "hello"
