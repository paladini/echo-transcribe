#!/usr/bin/env python3
"""
EchoTranscribe Backend - FastAPI server for audio transcription
Author: paladini (https://github.com/paladini)
Repository: https://github.com/paladini/echo-transcribe
"""

import os
import asyncio
import tempfile
import shutil
import socket
from pathlib import Path
from typing import List, Optional, Tuple
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _env_first(*names: str, default: Optional[str] = None) -> Optional[str]:
    for name in names:
        value = os.getenv(name)
        if value is not None and value != "":
            return value
    return default


def resolve_bind_host() -> str:
    """Desktop default is localhost; containers should set HOST=0.0.0.0."""
    return _env_first("ECHO_HOST", "HOST", default="127.0.0.1")


def resolve_data_paths() -> Tuple[Path, Path]:
    data_dir = Path(
        _env_first("ECHO_DATA_DIR", default=str(Path.home() / ".echo-transcribe"))
    )
    models_dir = Path(_env_first("ECHO_MODELS_DIR", default=str(data_dir / "models")))
    temp_dir = Path(_env_first("ECHO_TEMP_DIR", default=str(data_dir / "temp")))
    return models_dir, temp_dir


def cors_settings() -> Tuple[list, bool]:
    """Preserve Tauri origins by default; Docker may set CORS_ALLOW_ORIGINS=*."""
    defaults = [
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "tauri://localhost",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    extra = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if extra == "*":
        return ["*"], False
    origins = list(defaults)
    if extra:
        origins.extend(item.strip() for item in extra.split(",") if item.strip())
    return origins, True


def find_available_port(start_port=8000, max_attempts=10, host="127.0.0.1"):
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind((host, port))
                return port
        except OSError:
            continue
    return None


def resolve_listen_port(host: str) -> Optional[int]:
    """Honor PORT/ECHO_PORT when set (Docker). Otherwise scan 8000-8004 like the desktop app."""
    port_env = _env_first("ECHO_PORT", "PORT")
    if port_env is not None:
        try:
            return int(port_env)
        except ValueError:
            logger.error("Invalid PORT value: %s", port_env)
            return None
    return find_available_port(8000, 5, host=host)

# Inicializar FastAPI
app = FastAPI(
    title="EchoTranscribe API",
    description="API para transcrição de áudio usando modelos locais",
    version="0.1.0"
)

_cors_origins, _cors_credentials = cors_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de dados
class TranscriptionResponse(BaseModel):
    text: str
    confidence: Optional[float] = None
    processing_time: Optional[float] = None
    detected_language: Optional[str] = None
    word_timestamps: Optional[List[dict]] = None

class ModelInfo(BaseModel):
    name: str
    size: str
    description: str
    available: bool

class BatchTranscriptionResponse(BaseModel):
    results: List[dict]
    total_files: int
    successful: int
    failed: int

class BatchTranscriptionRequest(BaseModel):
    files: List[str]  # Lista de nomes de arquivos temporários
    model: str
    language: Optional[str] = None

# Variáveis globais (overridable via ECHO_DATA_DIR / ECHO_MODELS_DIR / ECHO_TEMP_DIR)
MODELS_DIR, TEMP_DIR = resolve_data_paths()

# Criar diretórios se não existirem
MODELS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Lista de modelos disponíveis
AVAILABLE_MODELS = [
    ModelInfo(
        name="tiny",
        size="39 MB",
        description="Modelo pequeno e rápido, menor precisão",
        available=False
    ),
    ModelInfo(
        name="base",
        size="74 MB", 
        description="Modelo balanceado entre velocidade e precisão",
        available=False
    ),
    ModelInfo(
        name="small",
        size="244 MB",
        description="Modelo com boa precisão, velocidade média",
        available=False
    ),
    ModelInfo(
        name="medium",
        size="769 MB",
        description="Modelo com alta precisão, mais lento",
        available=False
    )
]

def check_model_availability():
    """Verifica quais modelos estão disponíveis localmente"""
    for model in AVAILABLE_MODELS:
        model_path = MODELS_DIR / f"whisper-{model.name}"
        model.available = model_path.exists()

# Variável para armazenar o modelo carregado
current_model = None
current_model_name = None

def load_whisper_model(model_name: str):
    """Carrega o modelo Whisper especificado"""
    global current_model, current_model_name
    
    try:
        # Importar faster-whisper apenas quando necessário
        from faster_whisper import WhisperModel
        
        if current_model_name == model_name and current_model is not None:
            logger.info(f"Modelo {model_name} já carregado")
            return current_model
            
        logger.info(f"Carregando modelo {model_name}...")
        model_path = MODELS_DIR / f"whisper-{model_name}"
        model_kwargs = {"download_root": str(MODELS_DIR)}
        device = _env_first("WHISPER_DEVICE")
        compute_type = _env_first("WHISPER_COMPUTE_TYPE")
        if device:
            model_kwargs["device"] = device
        if compute_type:
            model_kwargs["compute_type"] = compute_type

        if not model_path.exists():
            # Baixar modelo se não existir
            logger.info(f"Baixando modelo {model_name}...")
            current_model = WhisperModel(model_name, **model_kwargs)
        else:
            current_model = WhisperModel(str(model_path), **{
                k: v for k, v in model_kwargs.items() if k != "download_root"
            })
            
        current_model_name = model_name
        logger.info(f"Modelo {model_name} carregado com sucesso")
        return current_model
        
    except ImportError:
        logger.error("faster-whisper não está instalado")
        raise HTTPException(
            status_code=500, 
            detail="Biblioteca de transcrição não encontrada. Instale faster-whisper."
        )
    except Exception as e:
        logger.error(f"Erro ao carregar modelo {model_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar modelo: {str(e)}"
        )

@app.get("/")
async def root():
    """Endpoint raiz para verificar se a API está funcionando"""
    return {"message": "EchoTranscribe API está funcionando!", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    """Endpoint de health check"""
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}

@app.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Lista todos os modelos disponíveis"""
    check_model_availability()
    return AVAILABLE_MODELS

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model: str = Form("base"),
    language: Optional[str] = Form(None),
    auto_detect_language: bool = Form(True),
):
    """
    Transcreve um arquivo de áudio
    
    Args:
        file: Arquivo de áudio (MP3, WAV, FLAC, M4A)
        model: Nome do modelo a ser usado (tiny, base, small, medium)
        language: Código do idioma (opcional, auto-detecta se não especificado)
        auto_detect_language: Se deve detectar automaticamente o idioma
    """
    
    # Validar formato do arquivo
    allowed_extensions = {'.mp3', '.wav', '.flac', '.m4a', '.ogg', '.webm'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de arquivo não suportado: {file_extension}. "
                   f"Formatos aceitos: {', '.join(allowed_extensions)}"
        )
    
    # Validar modelo
    valid_models = [m.name for m in AVAILABLE_MODELS]
    if model not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Modelo inválido: {model}. Modelos disponíveis: {', '.join(valid_models)}"
        )
    
    # Criar arquivo temporário
    temp_file = None
    try:
        # Salvar arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=file_extension,
            dir=str(TEMP_DIR)
        )
        
        # Copiar conteúdo do upload para o arquivo temporário
        shutil.copyfileobj(file.file, temp_file)
        temp_file.close()
        
        logger.info(f"Arquivo temporário criado: {temp_file.name}")
        
        # Carregar modelo
        whisper_model = load_whisper_model(model)
        
        # Realizar transcrição
        logger.info(f"Iniciando transcrição com modelo {model}")
        start_time = asyncio.get_event_loop().time()
        
        # Se auto_detect_language for True e language não foi especificado, detectar idioma
        detected_language = None
        if auto_detect_language and not language:
            logger.info("Detectando idioma automaticamente...")
            # Usar apenas os primeiros 30 segundos para detecção de idioma
            segments, info = whisper_model.transcribe(
                temp_file.name,
                language=None,  # Deixar o modelo detectar
                beam_size=1,    # Usar beam size menor para ser mais rápido
                best_of=1,
                temperature=0.0,
                condition_on_previous_text=False,
                word_timestamps=False
            )
            detected_language = info.language
            logger.info(f"Idioma detectado: {detected_language}")
        
        # Transcrição completa com idioma detectado ou especificado
        final_language = language or detected_language
        segments, info = whisper_model.transcribe(
            temp_file.name,
            language=final_language,
            beam_size=5,
            best_of=5,
            temperature=0.0,
            word_timestamps=True,  # Habilitar timestamps por palavra
            condition_on_previous_text=False
        )
        
        # Concatenar segmentos e coletar timestamps
        transcription_text = ""
        word_timestamps = []
        
        for segment in segments:
            transcription_text += segment.text + " "
            # Coletar timestamps de palavras se disponíveis
            if hasattr(segment, 'words') and segment.words:
                for word in segment.words:
                    word_timestamps.append({
                        "word": word.word,
                        "start": word.start,
                        "end": word.end,
                        "probability": getattr(word, 'probability', None)
                    })
        
        end_time = asyncio.get_event_loop().time()
        processing_time = end_time - start_time
        
        logger.info(f"Transcrição concluída em {processing_time:.2f} segundos")
        
        # Agendar limpeza do arquivo temporário
        background_tasks.add_task(cleanup_temp_file, temp_file.name)
        
        return TranscriptionResponse(
            text=transcription_text.strip(),
            confidence=None,  # faster-whisper não fornece confidence score diretamente
            processing_time=processing_time,
            detected_language=detected_language,
            word_timestamps=word_timestamps
        )
        
    except Exception as e:
        logger.error(f"Erro durante transcrição: {str(e)}")
        # Limpar arquivo temporário em caso de erro
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        
        raise HTTPException(
            status_code=500,
            detail=f"Erro durante transcrição: {str(e)}"
        )

@app.post("/transcribe-batch", response_model=BatchTranscriptionResponse)
async def transcribe_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    model: str = Form("base"),
    language: Optional[str] = Form(None),
    auto_detect_language: bool = Form(True),
):
    """
    Transcreve múltiplos arquivos de áudio em lote
    
    Args:
        files: Lista de arquivos de áudio
        model: Nome do modelo a ser usado
        language: Código do idioma (opcional)
        auto_detect_language: Se deve detectar automaticamente o idioma
    """
    
    if len(files) > 10:  # Limitar a 10 arquivos por vez
        raise HTTPException(
            status_code=400,
            detail="Máximo de 10 arquivos por requisição"
        )
    
    results = []
    successful = 0
    failed = 0
    
    for file in files:
        try:
            # Validar formato do arquivo
            allowed_extensions = {'.mp3', '.wav', '.flac', '.m4a', '.ogg', '.webm'}
            file_extension = Path(file.filename).suffix.lower()
            
            if file_extension not in allowed_extensions:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": f"Formato não suportado: {file_extension}",
                    "text": "",
                    "processing_time": 0
                })
                failed += 1
                continue
            
            # Criar arquivo temporário
            temp_file = tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=file_extension,
                dir=str(TEMP_DIR)
            )
            
            # Copiar conteúdo do upload
            shutil.copyfileobj(file.file, temp_file)
            temp_file.close()
            
            # Carregar modelo
            whisper_model = load_whisper_model(model)
            
            # Transcrever
            start_time = asyncio.get_event_loop().time()
            
            # Detectar idioma se necessário
            detected_language = None
            if auto_detect_language and not language:
                segments, info = whisper_model.transcribe(
                    temp_file.name,
                    language=None,
                    beam_size=1,
                    best_of=1,
                    temperature=0.0,
                    condition_on_previous_text=False,
                    word_timestamps=False
                )
                detected_language = info.language
            
            # Transcrição completa
            final_language = language or detected_language
            segments, info = whisper_model.transcribe(
                temp_file.name,
                language=final_language,
                beam_size=5,
                best_of=5,
                temperature=0.0,
                word_timestamps=True,
                condition_on_previous_text=False
            )
            
            # Processar resultado
            transcription_text = ""
            word_timestamps = []
            
            for segment in segments:
                transcription_text += segment.text + " "
                if hasattr(segment, 'words') and segment.words:
                    for word in segment.words:
                        word_timestamps.append({
                            "word": word.word,
                            "start": word.start,
                            "end": word.end,
                            "probability": getattr(word, 'probability', None)
                        })
            
            end_time = asyncio.get_event_loop().time()
            processing_time = end_time - start_time
            
            results.append({
                "filename": file.filename,
                "status": "completed",
                "text": transcription_text.strip(),
                "processing_time": processing_time,
                "detected_language": detected_language,
                "word_timestamps": word_timestamps
            })
            
            successful += 1
            
            # Agendar limpeza
            background_tasks.add_task(cleanup_temp_file, temp_file.name)
            
        except Exception as e:
            logger.error(f"Erro ao transcrever {file.filename}: {str(e)}")
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e),
                "text": "",
                "processing_time": 0
            })
            failed += 1
            
            # Limpar arquivo temporário em caso de erro
            if 'temp_file' in locals() and temp_file and os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
    
    return BatchTranscriptionResponse(
        results=results,
        total_files=len(files),
        successful=successful,
        failed=failed
    )

async def cleanup_temp_file(file_path: str):
    """Remove arquivo temporário"""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Arquivo temporário removido: {file_path}")
    except Exception as e:
        logger.warning(f"Erro ao remover arquivo temporário {file_path}: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Evento executado na inicialização da API"""
    logger.info("EchoTranscribe API iniciada")
    check_model_availability()

@app.on_event("shutdown")
async def shutdown_event():
    """Evento executado no encerramento da API"""
    logger.info("EchoTranscribe API encerrada")
    
    # Limpar arquivos temporários
    try:
        for temp_file in TEMP_DIR.glob("*"):
            if temp_file.is_file():
                temp_file.unlink()
        logger.info("Arquivos temporários limpos")
    except Exception as e:
        logger.warning(f"Erro ao limpar arquivos temporários: {str(e)}")

if __name__ == "__main__":
    # Verificar se todas as dependências estão instaladas
    try:
        import faster_whisper
        import torch
        logger.info("✅ All dependencies are installed")
    except ImportError as e:
        logger.error(f"❌ Missing dependency: {e}")
        logger.error("Please install dependencies with: pip install -r requirements.txt")
        exit(1)
    
    # Verificar disponibilidade do PyTorch
    try:
        if torch.cuda.is_available():
            logger.info("🚀 GPU (CUDA) available for acceleration")
        else:
            logger.info("⚠️ Using CPU only (no CUDA available)")
    except Exception as e:
        logger.warning(f"Could not check CUDA availability: {e}")
    
    # Criar diretório de modelos se não existir
    try:
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("📁 Directories created successfully")
    except Exception as e:
        logger.error(f"❌ Could not create directories: {e}")
        exit(1)
    
    logger.info("🎙️ Starting EchoTranscribe backend server...")
    
    host = resolve_bind_host()
    port = resolve_listen_port(host)
    if port is None:
        logger.error("❌ No available ports found in range 8000-8004")
        exit(1)
    
    if _env_first("ECHO_PORT", "PORT") is None and port != 8000:
        logger.warning(f"⚠️ Port 8000 is busy, using port {port} instead")
    
    # Salvar porta para o frontend
    try:
        port_file = Path(__file__).parent / "backend_port.txt"
        port_file.write_text(str(port))
        logger.info(f"📝 Port {port} saved to backend_port.txt")
    except Exception as e:
        logger.warning(f"Could not save port file: {e}")
    
    logger.info(f"🌐 Backend will be available at: http://{host}:{port}")
    logger.info(f"📚 API docs will be available at: http://{host}:{port}/docs")
    
    try:
        # Configuração para produção e desenvolvimento
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=False,  # Desabilitado para produção
            log_level="info",
            access_log=True
        )
    except OSError as e:
        if "Address already in use" in str(e) or "address already in use" in str(e):
            logger.error("❌ Port 8000 is already in use. Another instance may be running.")
            logger.error("💡 Try closing other instances or wait a few seconds and try again.")
            exit(2)  # Exit code 2 for port conflict
        else:
            logger.error(f"❌ Failed to start server (OSError): {e}")
            exit(1)
    except KeyboardInterrupt:
        logger.info("👋 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        exit(1)
