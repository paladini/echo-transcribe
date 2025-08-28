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
import json
import aiofiles
from pathlib import Path
from typing import List, Optional, Dict, Any
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import logging
import hashlib
import urllib.request
from urllib.parse import urlparse
import threading
from concurrent.futures import ThreadPoolExecutor

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="EchoTranscribe API",
    description="API para transcrição de áudio usando modelos locais",
    version="0.1.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
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
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    sha256: Optional[str] = None

class ModelDownloadStatus(BaseModel):
    model_name: str
    status: str  # 'downloading', 'completed', 'error', 'idle'
    progress: float = 0.0
    download_speed: Optional[str] = None
    eta: Optional[str] = None
    error_message: Optional[str] = None

class BatchTranscriptionResponse(BaseModel):
    results: List[dict]
    total_files: int
    successful: int
    failed: int

class BatchTranscriptionRequest(BaseModel):
    files: List[str]  # Lista de nomes de arquivos temporários
    model: str
    language: Optional[str] = None

# Variáveis globais
MODELS_DIR = Path.home() / ".echo-transcribe" / "models"
TEMP_DIR = Path.home() / ".echo-transcribe" / "temp"
DOWNLOADS_DIR = Path.home() / ".echo-transcribe" / "downloads"

# Criar diretórios se não existirem
MODELS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# URLs dos modelos Whisper (Hugging Face)
MODEL_URLS = {
    "tiny": {
        "repo": "openai/whisper-tiny",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "tiny.en": {
        "repo": "openai/whisper-tiny.en", 
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "base": {
        "repo": "openai/whisper-base",
        "files": [
            "config.json",
            "model.bin", 
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "base.en": {
        "repo": "openai/whisper-base.en",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json", 
            "vocab.json"
        ]
    },
    "small": {
        "repo": "openai/whisper-small",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "small.en": {
        "repo": "openai/whisper-small.en",
        "files": [
            "config.json", 
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "medium": {
        "repo": "openai/whisper-medium",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "medium.en": {
        "repo": "openai/whisper-medium.en",
        "files": [
            "config.json",
            "model.bin", 
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "large": {
        "repo": "openai/whisper-large",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    },
    "large-v2": {
        "repo": "openai/whisper-large-v2",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json", 
            "vocab.json"
        ]
    },
    "large-v3": {
        "repo": "openai/whisper-large-v3",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocab.json"
        ]
    }
}

# Lista de modelos disponíveis (expandida)
AVAILABLE_MODELS = [
    ModelInfo(
        name="tiny",
        size="39 MB",
        description="Modelo pequeno e rápido, menor precisão. Multilíngue.",
        available=False,
        file_size=39 * 1024 * 1024
    ),
    ModelInfo(
        name="tiny.en",
        size="39 MB", 
        description="Modelo pequeno e rápido, apenas inglês.",
        available=False,
        file_size=39 * 1024 * 1024
    ),
    ModelInfo(
        name="base",
        size="74 MB", 
        description="Modelo balanceado entre velocidade e precisão. Multilíngue.",
        available=False,
        file_size=74 * 1024 * 1024
    ),
    ModelInfo(
        name="base.en",
        size="74 MB",
        description="Modelo balanceado, apenas inglês.",
        available=False,
        file_size=74 * 1024 * 1024
    ),
    ModelInfo(
        name="small",
        size="244 MB",
        description="Modelo com boa precisão, velocidade média. Multilíngue.",
        available=False,
        file_size=244 * 1024 * 1024
    ),
    ModelInfo(
        name="small.en",
        size="244 MB",
        description="Modelo com boa precisão, apenas inglês.",
        available=False,
        file_size=244 * 1024 * 1024
    ),
    ModelInfo(
        name="medium",
        size="769 MB",
        description="Modelo com alta precisão, mais lento. Multilíngue.",
        available=False,
        file_size=769 * 1024 * 1024
    ),
    ModelInfo(
        name="medium.en",
        size="769 MB",
        description="Modelo com alta precisão, apenas inglês.",
        available=False,
        file_size=769 * 1024 * 1024
    ),
    ModelInfo(
        name="large",
        size="1550 MB",
        description="Modelo grande com excelente precisão. Multilíngue.",
        available=False,
        file_size=1550 * 1024 * 1024
    ),
    ModelInfo(
        name="large-v2",
        size="1550 MB",
        description="Versão 2 do modelo grande, melhor qualidade. Multilíngue.",
        available=False,
        file_size=1550 * 1024 * 1024
    ),
    ModelInfo(
        name="large-v3",
        size="1550 MB",
        description="Versão mais recente, melhor qualidade e suporte a idiomas. Multilíngue.",
        available=False,
        file_size=1550 * 1024 * 1024
    )
]

# Status de downloads dos modelos
download_status: Dict[str, ModelDownloadStatus] = {}
executor = ThreadPoolExecutor(max_workers=2)  # Máximo 2 downloads simultâneos

def check_model_availability():
    """Verifica quais modelos estão disponíveis localmente"""
    for model in AVAILABLE_MODELS:
        model_path = MODELS_DIR / model.name
        # Verificar se o diretório do modelo existe e tem arquivos
        if model_path.exists() and model_path.is_dir():
            # Verificar se tem pelo menos config.json e model files
            config_file = model_path / "config.json"
            model_files = list(model_path.glob("*.bin")) + list(model_path.glob("*.pt"))
            model.available = config_file.exists() and len(model_files) > 0
        else:
            model.available = False

def format_bytes(bytes_count: int) -> str:
    """Formata bytes em formato legível"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_count < 1024.0:
            return f"{bytes_count:.1f} {unit}"
        bytes_count /= 1024.0
    return f"{bytes_count:.1f} TB"

def format_time(seconds: float) -> str:
    """Formata tempo em formato legível"""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"

async def download_model_file(url: str, dest_path: Path, model_name: str, file_index: int, total_files: int):
    """Download de um arquivo específico do modelo"""
    try:
        response = urllib.request.urlopen(url)
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(dest_path, 'wb') as f:
            while True:
                chunk = response.read(8192)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                
                # Atualizar progresso
                if model_name in download_status:
                    file_progress = (downloaded / total_size) if total_size > 0 else 0
                    overall_progress = ((file_index + file_progress) / total_files) * 100
                    download_status[model_name].progress = overall_progress
                    
                    if total_size > 0:
                        speed = downloaded / (1 if downloaded == 0 else 1)  # Simplificado
                        download_status[model_name].download_speed = format_bytes(speed) + "/s"
        
        return True
    except Exception as e:
        logger.error(f"Erro ao baixar {url}: {str(e)}")
        return False

def download_model_worker(model_name: str):
    """Worker para download de modelo em thread separada"""
    try:
        logger.info(f"Iniciando download do modelo {model_name}")
        
        # Atualizar status
        download_status[model_name] = ModelDownloadStatus(
            model_name=model_name,
            status="downloading",
            progress=0.0
        )
        
        if model_name not in MODEL_URLS:
            raise ValueError(f"Modelo {model_name} não encontrado")
        
        model_info = MODEL_URLS[model_name]
        model_dir = MODELS_DIR / model_name
        model_dir.mkdir(exist_ok=True)
        
        # Download dos arquivos usando faster-whisper que baixa automaticamente
        try:
            from faster_whisper import WhisperModel
            
            # Usar faster-whisper para baixar automaticamente
            logger.info(f"Baixando modelo {model_name} via faster-whisper...")
            model = WhisperModel(model_name, download_root=str(MODELS_DIR))
            
            download_status[model_name].status = "completed"
            download_status[model_name].progress = 100.0
            
            # Atualizar disponibilidade
            check_model_availability()
            
            logger.info(f"Download do modelo {model_name} concluído com sucesso")
            
        except Exception as e:
            logger.error(f"Erro no download via faster-whisper: {str(e)}")
            raise e
            
    except Exception as e:
        logger.error(f"Erro no download do modelo {model_name}: {str(e)}")
        download_status[model_name] = ModelDownloadStatus(
            model_name=model_name,
            status="error",
            progress=0.0,
            error_message=str(e)
        )

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
        
        # Verificar se o modelo está disponível localmente
        model_path = MODELS_DIR / f"models--openai--whisper-{model_name.replace('.', '-')}"
        
        if not model_path.exists():
            # Tentar encontrar o modelo com naming alternativo
            possible_paths = [
                MODELS_DIR / f"whisper-{model_name}",
                MODELS_DIR / model_name,
                MODELS_DIR / f"models--openai--whisper-{model_name}"
            ]
            
            model_path = None
            for path in possible_paths:
                if path.exists():
                    model_path = path
                    break
            
            if model_path is None:
                # Baixar modelo se não existir
                logger.info(f"Modelo {model_name} não encontrado localmente, baixando...")
                current_model = WhisperModel(model_name, download_root=str(MODELS_DIR))
            else:
                current_model = WhisperModel(str(model_path))
        else:
            current_model = WhisperModel(str(model_path))
            
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

@app.post("/models/{model_name}/download")
async def download_model(model_name: str):
    """Inicia o download de um modelo específico"""
    
    # Verificar se o modelo é válido
    valid_models = [m.name for m in AVAILABLE_MODELS]
    if model_name not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Modelo inválido: {model_name}. Modelos disponíveis: {', '.join(valid_models)}"
        )
    
    # Verificar se já está sendo baixado
    if model_name in download_status and download_status[model_name].status == "downloading":
        raise HTTPException(
            status_code=409,
            detail=f"Modelo {model_name} já está sendo baixado"
        )
    
    # Verificar se já está disponível
    model_info = next((m for m in AVAILABLE_MODELS if m.name == model_name), None)
    if model_info and model_info.available:
        return {"message": f"Modelo {model_name} já está disponível", "status": "already_available"}
    
    try:
        # Iniciar download em thread separada
        executor.submit(download_model_worker, model_name)
        
        return {
            "message": f"Download do modelo {model_name} iniciado",
            "status": "download_started"
        }
        
    except Exception as e:
        logger.error(f"Erro ao iniciar download do modelo {model_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao iniciar download: {str(e)}"
        )

@app.get("/models/{model_name}/download/status")
async def get_download_status(model_name: str):
    """Obtém o status do download de um modelo"""
    
    if model_name not in download_status:
        # Verificar se o modelo já está disponível
        check_model_availability()
        model_info = next((m for m in AVAILABLE_MODELS if m.name == model_name), None)
        if model_info and model_info.available:
            return ModelDownloadStatus(
                model_name=model_name,
                status="completed",
                progress=100.0
            )
        else:
            return ModelDownloadStatus(
                model_name=model_name,
                status="idle",
                progress=0.0
            )
    
    return download_status[model_name]

@app.delete("/models/{model_name}")
async def delete_model(model_name: str):
    """Remove um modelo baixado"""
    
    # Verificar se o modelo é válido
    valid_models = [m.name for m in AVAILABLE_MODELS]
    if model_name not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Modelo inválido: {model_name}"
        )
    
    try:
        # Parar download se estiver em andamento
        if model_name in download_status and download_status[model_name].status == "downloading":
            download_status[model_name].status = "cancelled"
        
        # Remover arquivos do modelo
        possible_paths = [
            MODELS_DIR / f"models--openai--whisper-{model_name.replace('.', '-')}",
            MODELS_DIR / f"whisper-{model_name}",
            MODELS_DIR / model_name
        ]
        
        removed_any = False
        for model_path in possible_paths:
            if model_path.exists():
                if model_path.is_dir():
                    shutil.rmtree(model_path)
                else:
                    model_path.unlink()
                removed_any = True
                logger.info(f"Removido: {model_path}")
        
        if not removed_any:
            raise HTTPException(
                status_code=404,
                detail=f"Modelo {model_name} não foi encontrado para remoção"
            )
        
        # Limpar status de download
        if model_name in download_status:
            del download_status[model_name]
        
        # Atualizar disponibilidade
        check_model_availability()
        
        # Limpar modelo carregado se for o mesmo
        global current_model, current_model_name
        if current_model_name == model_name:
            current_model = None
            current_model_name = None
        
        return {
            "message": f"Modelo {model_name} removido com sucesso",
            "status": "removed"
        }
        
    except Exception as e:
        logger.error(f"Erro ao remover modelo {model_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover modelo: {str(e)}"
        )

@app.get("/models/downloads/status")
async def get_all_download_status():
    """Obtém o status de todos os downloads"""
    return download_status

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model: str = "base",
    language: Optional[str] = None,
    auto_detect_language: bool = True
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
    model: str = "base",
    language: Optional[str] = None,
    auto_detect_language: bool = True
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
    # Configuração para desenvolvimento
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
