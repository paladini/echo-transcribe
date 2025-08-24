#!/usr/bin/env python3
"""
AudioScribe Backend - FastAPI server for audio transcription
"""

import os
import asyncio
import tempfile
import shutil
from pathlib import Path
from typing import List, Optional
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="AudioScribe API",
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

class ModelInfo(BaseModel):
    name: str
    size: str
    description: str
    available: bool

class ProgressUpdate(BaseModel):
    progress: float
    status: str
    message: Optional[str] = None

# Variáveis globais
MODELS_DIR = Path.home() / ".audioscribe" / "models"
TEMP_DIR = Path.home() / ".audioscribe" / "temp"

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
        
        if not model_path.exists():
            # Baixar modelo se não existir
            logger.info(f"Baixando modelo {model_name}...")
            current_model = WhisperModel(model_name, download_root=str(MODELS_DIR))
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
    return {"message": "AudioScribe API está funcionando!", "version": "0.1.0"}

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
    model: str = "base",
    language: Optional[str] = None
):
    """
    Transcreve um arquivo de áudio
    
    Args:
        file: Arquivo de áudio (MP3, WAV, FLAC, M4A)
        model: Nome do modelo a ser usado (tiny, base, small, medium)
        language: Código do idioma (opcional, auto-detecta se não especificado)
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
        
        segments, info = whisper_model.transcribe(
            temp_file.name,
            language=language,
            beam_size=5,
            best_of=5,
            temperature=0.0
        )
        
        # Concatenar segmentos
        transcription_text = ""
        for segment in segments:
            transcription_text += segment.text + " "
        
        end_time = asyncio.get_event_loop().time()
        processing_time = end_time - start_time
        
        logger.info(f"Transcrição concluída em {processing_time:.2f} segundos")
        
        # Agendar limpeza do arquivo temporário
        background_tasks.add_task(cleanup_temp_file, temp_file.name)
        
        return TranscriptionResponse(
            text=transcription_text.strip(),
            confidence=None,  # faster-whisper não fornece confidence score diretamente
            processing_time=processing_time
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
    logger.info("AudioScribe API iniciada")
    check_model_availability()

@app.on_event("shutdown")
async def shutdown_event():
    """Evento executado no encerramento da API"""
    logger.info("AudioScribe API encerrada")
    
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
