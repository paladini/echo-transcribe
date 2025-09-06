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
            print(f"✅ {package} encontrado")
        except ImportError:
            missing.append(package)
            print(f"❌ {package} não encontrado")
    
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
    print("⏳ Aguarde, carregando bibliotecas pesadas (torch, faster-whisper)...")
    
    try:
        # Executar o servidor
        result = subprocess.run([sys.executable, str(main_file)])
        
        if result.returncode == 0:
            print("✅ Servidor encerrado normalmente")
            return True
        elif result.returncode == 2:
            print("❌ Porta 8000 já está em uso!")
            print("💡 Aguarde alguns segundos ou feche outras instâncias do EchoTranscribe")
            return False
        else:
            print(f"❌ Servidor encerrou com erro (código {result.returncode})")
            return False
            
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
