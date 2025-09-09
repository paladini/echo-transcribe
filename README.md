# EchoTranscribe 🎙️

An open-source desktop application for audio transcription (Speech-To-Text) using local AI. Private, secure and efficient.

<img width="800" height="637" alt="image" style="text" src="https://github.com/user-attachments/assets/2c3db621-1bae-4cea-ad7b-870265e29b16" />
<img width="800" height="840" alt="image" src="https://github.com/user-attachments/assets/1b79aa45-43a2-403d-b3bd-0d7ecf973fad" />

## ✨ Features

- 🔒 **Completely Local**: Your audio files never leave your computer
- 🤖 **Advanced AI**: Uses Whisper models for high-quality transcription
- 🎨 **Modern Interface**: Clean and intuitive design with dark theme support
- 📁 **Multiple Formats**: Support for MP3, WAV, FLAC, M4A, OGG and WebM
- 🔄 **Batch Transcription**: Process multiple files simultaneously
- 🌍 **Automatic Detection**: Automatically identifies audio language
- ⏱️ **Precise Timestamps**: Word-level timestamps for detailed navigation
- 💾 **Flexible Export**: Export to TXT, SRT or JSON
- ⚙️ **Persistent Settings**: Dark/light theme and language saved between sessions
- 🌐 **Multilingual**: Interface in English, Portuguese and Spanish (expandable)
- ⚡ **Performance**: Optimized for speed and efficiency
- 🖥️ **Cross-Platform**: Works on Windows, macOS and Linux

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **Rust** (for Tauri compilation)

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libjavascriptcoregtk-4.0-dev
```

#### macOS
```bash
# Using Homebrew
brew install --cask xcode-command-line-tools
```

#### Windows
On Windows, you'll need Microsoft Visual Studio C++ Build Tools.

### Development Installation

1. **Clone the repository**
```bash
git clone https://github.com/paladini/echo-transcribe.git
cd echo-transcribe
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Setup Python environment and backend**
```bash
# The startup script will create venv and install dependencies automatically
chmod +x start-backend.sh  # Linux/macOS only
```

4. **Run in development mode**

**Option A: Quick Start (Recommended)**
```bash
# Terminal 1 - Start backend
./start-backend.sh        # Linux/macOS
# or
./start-backend.bat       # Windows

# Terminal 2 - Start frontend (Tauri v2)
npm run tauri dev
```

**Option B: Manual setup**
```bash
# Terminal 1 - Start backend
cd src-tauri/backend
python main.py

# Terminal 2 - Start frontend
npm run tauri dev
```

5. **Verify setup**
   - Backend API: http://localhost:8000/docs
   - Frontend: Opens automatically in Tauri window

> 📖 **For detailed development setup**, see [DEVELOPMENT.md](DEVELOPMENT.md)

### Production Installation

Download the latest version from [Releases](https://github.com/paladini/echo-transcribe/releases) for your operating system.

## 🎯 How to Use

1. **Select audio file(s)**
   - Drag and drop one or multiple files to the designated area
   - Or click to select files (maximum 10 at once)

2. **Choose AI model**
   - **Tiny/Base**: Fast, ideal for testing
   - **Small**: Better quality, medium speed
   - **Medium**: High quality, slower

3. **Configure options**
   - Leave automatic language detection enabled (recommended)
   - Or manually specify the audio language

4. **Start transcription**
   - Click "Start Transcription"
   - Track progress in real-time
   - For batches, see progress for each file

5. **View and edit results**
   - See transcribed text for each file
   - Navigate through word timestamps
   - Edit text if necessary

6. **Export results**
   - Export individually or in batch
   - Available formats: TXT, SRT, JSON

7. **Configure application**
   - Access settings to customize theme and language
   - Your preferences are automatically saved for future sessions

## 🛠️ Technologies

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Tauri (Rust)
- **Backend**: FastAPI (Python)
- **AI**: faster-whisper (OpenAI Whisper)
- **UI Components**: Radix UI + shadcn/ui


## 🐳 Docker & Deploy

You can run EchoTranscribe as a web service (FastAPI backend + React frontend) using a **single Docker image**. The backend serves the frontend automatically, making deployment and DockerHub publishing easy.

### Build and run locally (single image)

```bash
# Build the single image (backend + frontend)
docker build -t paladini/echo-transcribe:latest -f src-tauri/backend/Dockerfile .

# Run the container
docker run -p 8000:8000 paladini/echo-transcribe:latest

# Access the frontend and API at http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Publishing to DockerHub

1. Log in to DockerHub:
   ```bash
   docker login
   ```
2. Build the image with the correct tag:
   ```bash
   docker build -t paladini/echo-transcribe:latest -f src-tauri/backend/Dockerfile .
   ```
3. Push to DockerHub:
   ```bash
   docker push paladini/echo-transcribe:latest
   ```

### Notes

- The frontend served via Docker is identical to the one used in the Tauri desktop app.
- The Tauri (desktop) app does not run in a web container, but the React frontend is the same.
- For production deployments, adjust environment variables and volumes as needed.

---

---

## 📋 Available Commands

```bash
# Development (Tauri v2)
npm run tauri dev        # Start Tauri v2 application in development mode
npm run dev             # Start frontend development server only (Vite)

# Production (Tauri v2)
npm run build           # Build frontend
npm run tauri build     # Build complete application (generates executable)

# Backend (Python)
cd src-tauri/backend
python main.py          # Start standalone backend server

# Other useful commands
npm run preview         # Preview built frontend
npm run tauri --version # Check Tauri CLI version
```

### 🏗️ **Building and Running Executable**

After running `npm run tauri build`, you can find and execute the generated files:

```bash
# Direct executable
./src-tauri/target/release/echo-transcribe

# AppImage (Recommended for distribution)
chmod +x src-tauri/target/release/bundle/appimage/EchoTranscribe_0.1.0_amd64.AppImage
./src-tauri/target/release/bundle/appimage/EchoTranscribe_0.1.0_amd64.AppImage

# Install .deb package (Ubuntu/Debian)
sudo dpkg -i src-tauri/target/release/bundle/deb/EchoTranscribe_0.1.0_amd64.deb
echo-transcribe  # Run from anywhere after installation

# Install .rpm package (Red Hat/Fedora)
sudo rpm -i src-tauri/target/release/bundle/rpm/EchoTranscribe-0.1.0-1.x86_64.rpm
```

## 🔧 Configuration

### AI Models

Echo-Transcribe automatically downloads AI models as needed. Models are stored in:

- **Linux/macOS**: `~/.echo-transcribe/models/`
- **Windows**: `%USERPROFILE%\\.echo-transcribe\\models\\`

### Supported Formats

| Format | Extension | Max Size |
|--------|-----------|----------|
| MP3    | .mp3      | 500MB    |
| WAV    | .wav      | 500MB    |
| FLAC   | .flac     | 500MB    |
| M4A    | .m4a      | 500MB    |
| OGG    | .ogg      | 500MB    |
| WebM   | .webm     | 500MB    |

## 🐛 Troubleshooting

### Common Issues

**Error: "Load Failed"**
- This usually means the Python backend isn't running
- Make sure Python 3.8+ is installed on your system
- The application will automatically install Python dependencies on first run
- If the problem persists, try:
  1. Close and reopen the application
  2. Check if port 8000 is available
  3. Install dependencies manually: `cd src-tauri/backend && pip install -r requirements.txt`

**Error: "Model not found"**
- The model will be downloaded automatically on first run
- Check your internet connection

**Error: "Unsupported file format"**
- Check if the file is in one of the supported formats
- Try converting the file to MP3 or WAV

**Application won't open on Linux**
- Check if all system dependencies are installed
- Run: `sudo apt install libwebkit2gtk-4.0-37`

### Debug Logs

Application logs are located at:
- **Linux/macOS**: `~/.echo-transcribe/logs/`
- **Windows**: `%USERPROFILE%\\.echo-transcribe\\logs\\`

## 🤝 Contributing

Contributions are very welcome! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Local Development

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Roadmap

- [x] **v0.1.0** ✅ **COMPLETED**
  - [x] Batch transcription support
  - [x] Automatic language detection
  - [x] Precise word-level timestamps
  - [x] Export to multiple formats (TXT, SRT, JSON)
  - [x] Settings screen with persistence
  - [x] Theme support (light/dark)
  - [x] Localization system (EN/PT/ES)
  
- [ ] **v0.2.0**
  - [ ] Support for more AI models
  - [ ] Timestamp interface improvements
  - [ ] Community language support

- [ ] **Future Versions**
  - [ ] Custom model training interface
  - [ ] Complete REST API
  - [ ] Audio streaming support
  - [ ] Plugin marketplace

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the Whisper model
- [Tauri](https://tauri.app/) for the desktop framework
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [shadcn/ui](https://ui.shadcn.com/) for UI components

## 📞 Support

-  Issues: [GitHub Issues](https://github.com/paladini/echo-transcribe/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/paladini/echo-transcribe/discussions)
- 👤 Author: [github.com/paladini](https://github.com/paladini)

---

**EchoTranscribe** - Transforming audio to text with privacy and quality. 🎙️✨
