# Development Setup Guide

## Architecture Overview

EchoTranscribe follows a **microservices architecture** with clear separation of concerns:

- **Frontend**: React + TypeScript + Tauri (Desktop wrapper)
- **Backend**: FastAPI Python service (Separate process)
- **AI Processing**: faster-whisper (Runs in backend service)

## Why This Architecture?

✅ **Separation of Concerns**: Frontend and backend are independent
✅ **Better Error Handling**: Backend failures don't crash the UI
✅ **Scalability**: Backend can be deployed separately or scaled
✅ **Development**: Frontend and backend can be developed independently
✅ **Testing**: Each component can be tested in isolation
✅ **Security**: Clear API boundaries and validation

## Development Workflow

### Option 1: Automatic Setup (Recommended)

```bash
# Start both frontend and backend automatically
npm run dev:full
```

### Option 2: Manual Setup (Better for debugging)

**Terminal 1 - Backend:**
```bash
# Linux/macOS
./start-backend.sh

# Windows
./start-backend.bat
```

**Terminal 2 - Frontend:**
```bash
npm run tauri:dev
```

### Option 3: Backend Only (API Development)

```bash
cd src-tauri/backend
source ../../.venv/bin/activate  # Linux/macOS
# or: ../../.venv/Scripts/activate  # Windows
python main.py
```

## Backend Health Check

The backend provides several endpoints for monitoring:

- `GET http://localhost:8000/` - Basic API info
- `GET http://localhost:8000/health` - Health check
- `GET http://localhost:8000/models` - Available AI models
- `GET http://localhost:8000/docs` - Interactive API documentation

## Frontend Backend Integration

The frontend automatically checks backend availability and provides user feedback:

```typescript
// Frontend can call these Tauri commands:
import { invoke } from '@tauri-apps/api'

// Check if backend is running
const isBackendRunning = await invoke('check_backend_status')

// Start backend manually if needed
await invoke('start_backend')

// Stop backend
await invoke('stop_backend')
```

## Error Handling

### Backend Not Available
- Frontend shows a friendly message with instructions
- User can manually start backend via UI button
- System provides clear error messages and troubleshooting steps

### Model Download Issues
- Backend automatically downloads AI models on first use
- Progress is reported through API
- Fallback to smaller models if download fails

### File Processing Errors
- Each file is processed independently
- Batch operations continue even if individual files fail
- Detailed error reporting for debugging

## Production Deployment

### Option 1: Bundled (Current)
- Backend is embedded in Tauri app
- Single executable distribution
- Automatic dependency management

### Option 2: Separate Services (Future)
- Backend deployed as independent service
- Frontend connects to remote backend
- Better for enterprise deployments

## Troubleshooting

### "Backend not found" error
1. Check if Python virtual environment exists: `ls .venv/`
2. Manually start backend: `./start-backend.sh`
3. Check logs: `tail -f ~/.echo-transcribe/logs/backend.log`

### "faster-whisper not found" error
1. Activate virtual environment: `source .venv/bin/activate`
2. Install dependencies: `pip install -r src-tauri/backend/requirements.txt`
3. Test import: `python -c "import faster_whisper; print('OK')"`

### Port conflicts
- Backend runs on port 8000
- Frontend dev server runs on port 1420
- Change ports in configuration if conflicts occur

## Best Practices

1. **Always start backend before frontend** in development
2. **Check backend health** before making API calls
3. **Use proper error boundaries** in React components
4. **Log backend errors** for debugging
5. **Test with different file formats** and sizes
6. **Monitor resource usage** during transcription

This architecture ensures maintainable, scalable, and robust application development.
