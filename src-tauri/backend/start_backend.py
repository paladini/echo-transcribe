#!/usr/bin/env python3
"""
EchoTranscribe Backend Startup Script
Este script verifica dependências e inicia o servidor backend
"""

import sys
import subprocess
import os
from pathlib import Path

def check_python():
    """Verifica se Python está disponível"""
    try:
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 8):
            print("❌ Python 3.8+ é necessário")
            return False
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} encontrado")
        return True
    except Exception as e:
        print(f"❌ Erro ao verificar Python: {e}")
        return False

def install_dependencies():
    """Instala dependências necessárias"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ Arquivo requirements.txt não encontrado")
        return False
    
    print("🔧 Instalando dependências...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "-r", str(requirements_file), "--quiet"
        ])
        print("✅ Dependências instaladas com sucesso")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        return False

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    required_packages = [
        "fastapi",
        "uvicorn",
        "faster_whisper",
        "torch"
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"📦 Pacotes em falta: {', '.join(missing)}")
        return install_dependencies()
    
    print("✅ Todas as dependências estão disponíveis")
    return True

def start_backend():
    """Inicia o servidor backend"""
    main_file = Path(__file__).parent / "main.py"
    
    if not main_file.exists():
        print("❌ Arquivo main.py não encontrado")
        return False
    
    print("🚀 Iniciando servidor backend...")
    try:
        # Executar o servidor
        subprocess.run([sys.executable, str(main_file)])
        return True
    except KeyboardInterrupt:
        print("\n⏹️  Servidor interrompido pelo usuário")
        return True
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        return False

def main():
    """Função principal"""
    print("🎙️  EchoTranscribe Backend Startup")
    print("=" * 40)
    
    # Verificar Python
    if not check_python():
        sys.exit(1)
    
    # Verificar/instalar dependências
    if not check_dependencies():
        sys.exit(1)
    
    # Iniciar backend
    if not start_backend():
        sys.exit(1)

if __name__ == "__main__":
    main()
