# AudioScribe 🎙️

Uma aplicação de desktop open-source para transcrição de áudio usando IA local. Privado, seguro e eficiente.

![AudioScribe Screenshot](docs/screenshot.png)

## ✨ Características

- 🔒 **Completamente Local**: Seus arquivos de áudio nunca saem do seu computador
- 🤖 **IA Avançada**: Usa modelos Whisper para transcrição de alta qualidade
- 🎨 **Interface Moderna**: Design clean e intuitivo com suporte a tema escuro
- 📁 **Múltiplos Formatos**: Suporte para MP3, WAV, FLAC, M4A, OGG e WebM
- 💾 **Exportação Flexível**: Exporte para TXT, SRT ou JSON
- ⚡ **Performance**: Otimizado para velocidade e eficiência
- 🌐 **Cross-Platform**: Funciona no Windows, macOS e Linux

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **Python** (versão 3.8 ou superior)
- **Rust** (para compilação do Tauri)

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libjavascriptcoregtk-4.0-dev
```

#### macOS
```bash
# Usando Homebrew
brew install --cask xcode-command-line-tools
```

#### Windows
No Windows, você precisará do Microsoft Visual Studio C++ Build Tools.

### Instalação para Desenvolvimento

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/audioscribe.git
cd audioscribe
```

2. **Instale as dependências do Node.js**
```bash
npm install
```

3. **Configure o ambiente Python**
```bash
python -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r src-tauri/backend/requirements.txt
```

4. **Execute em modo de desenvolvimento**
```bash
npm run tauri dev
```

### Instalação para Produção

Baixe a versão mais recente dos [Releases](https://github.com/seu-usuario/audioscribe/releases) para seu sistema operacional.

## 🎯 Como Usar

1. **Selecione um arquivo de áudio**
   - Arraste e solte um arquivo na área indicada
   - Ou clique para selecionar um arquivo

2. **Escolha o modelo de IA**
   - **Tiny/Base**: Rápido, ideal para testes
   - **Small**: Melhor qualidade, velocidade média
   - **Medium**: Alta qualidade, mais lento

3. **Inicie a transcrição**
   - Clique em "Iniciar Transcrição"
   - Acompanhe o progresso em tempo real

4. **Edite e exporte**
   - Edite o texto transcrito se necessário
   - Exporte para TXT, SRT ou JSON

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Tauri (Rust)
- **Backend**: FastAPI (Python)
- **IA**: faster-whisper (OpenAI Whisper)
- **UI Components**: Radix UI + shadcn/ui

## 📋 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor de desenvolvimento do frontend
npm run tauri dev    # Iniciar aplicação Tauri em modo de desenvolvimento

# Produção
npm run build        # Build do frontend
npm run tauri build  # Build da aplicação completa

# Backend (Python)
cd src-tauri/backend
python main.py       # Iniciar servidor backend standalone
```

## 🔧 Configuração

### Modelos de IA

O AudioScribe baixa automaticamente os modelos de IA conforme necessário. Os modelos ficam armazenados em:

- **Linux/macOS**: `~/.audioscribe/models/`
- **Windows**: `%USERPROFILE%\\.audioscribe\\models\\`

### Formatos Suportados

| Formato | Extensão | Tamanho Máximo |
|---------|----------|----------------|
| MP3     | .mp3     | 500MB          |
| WAV     | .wav     | 500MB          |
| FLAC    | .flac    | 500MB          |
| M4A     | .m4a     | 500MB          |
| OGG     | .ogg     | 500MB          |
| WebM    | .webm    | 500MB          |

## 🐛 Solução de Problemas

### Problemas Comuns

**Erro: "Modelo não encontrado"**
- O modelo será baixado automaticamente na primeira execução
- Verifique sua conexão com a internet

**Erro: "Formato de arquivo não suportado"**
- Verifique se o arquivo está em um dos formatos suportados
- Tente converter o arquivo para MP3 ou WAV

**Aplicação não abre no Linux**
- Verifique se todas as dependências do sistema estão instaladas
- Execute: `sudo apt install libwebkit2gtk-4.0-37`

### Logs de Debug

Os logs da aplicação ficam em:
- **Linux/macOS**: `~/.audioscribe/logs/`
- **Windows**: `%USERPROFILE%\\.audioscribe\\logs\\`

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md) para começar.

### Desenvolvimento Local

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📝 Roadmap

- [ ] **v0.2.0**
  - [ ] Suporte a transcrição em lote
  - [ ] Detecção automática de idioma
  - [ ] Timestamps precisos por palavra
  
- [ ] **v0.3.0**
  - [ ] Plugin system
  - [ ] Suporte a mais modelos de IA
  - [ ] Integração com serviços de nuvem (opcional)

- [ ] **v1.0.0**
  - [ ] Interface para treinamento de modelos personalizados
  - [ ] API REST completa
  - [ ] Suporte a streaming de áudio

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) pelo modelo Whisper
- [Tauri](https://tauri.app/) pela framework de desktop
- [FastAPI](https://fastapi.tiangolo.com/) pelo framework backend
- [shadcn/ui](https://ui.shadcn.com/) pelos componentes de UI

## 📞 Suporte

- 📧 Email: [seu-email@example.com](mailto:seu-email@example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/audioscribe/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/seu-usuario/audioscribe/discussions)

---

**AudioScribe** - Transformando áudio em texto com privacidade e qualidade. 🎙️✨


