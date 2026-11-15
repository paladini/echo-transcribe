# CPU image for the EchoTranscribe FastAPI/faster-whisper backend.
# Desktop (Tauri) is unchanged; this is the self-hosted path.
# Override TORCH_INDEX_URL at build time for CUDA wheels (see docker-compose.gpu.yml).

FROM python:3.11-slim-bookworm

ARG TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# ffmpeg runtime + headers so PyAV (av==10.*, pulled by faster-whisper 0.9.0)
# can build: current PyPI has no manylinux wheel for this Python/platform pair.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        curl \
        ca-certificates \
        pkg-config \
        gcc \
        g++ \
        libavformat-dev \
        libavcodec-dev \
        libavdevice-dev \
        libavutil-dev \
        libavfilter-dev \
        libswscale-dev \
        libswresample-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU (or CUDA, via build-arg) PyTorch first so `requirements.txt` does not
# pull a default GPU wheel from PyPI.
RUN pip install --upgrade pip \
    && pip install torch torchaudio --index-url "${TORCH_INDEX_URL}"

COPY requirements.txt .
# av==10.0.0 (faster-whisper 0.9.0) is sdist-only on PyPI and does not
# Cythonize with Cython 3. Build it against Cython 0.29 in this env.
RUN pip install "setuptools<70" "wheel" "cython<3" \
    && pip install --no-build-isolation "av==10.0.0" \
    && pip install -r requirements.txt

COPY main.py start_backend.py ./

RUN useradd --create-home --uid 1000 --shell /usr/sbin/nologin appuser \
    && mkdir -p /data/models /data/temp /data/hf-cache \
    && chown -R appuser:appuser /app /data

USER appuser

ENV HOST=0.0.0.0 \
    PORT=8000 \
    ECHO_DATA_DIR=/data \
    ECHO_MODELS_DIR=/data/models \
    ECHO_TEMP_DIR=/data/temp \
    HF_HOME=/data/hf-cache \
    HUGGINGFACE_HUB_CACHE=/data/hf-cache \
    TRANSFORMERS_CACHE=/data/hf-cache \
    WHISPER_DEVICE=cpu \
    WHISPER_COMPUTE_TYPE=int8

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=8s --start-period=45s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["python", "main.py"]
