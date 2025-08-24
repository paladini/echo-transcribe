import React, { useState, useCallback } from 'react';
import { Mic, Download, FileText, Settings, Moon, Sun } from 'lucide-react';
import { FileDropZone } from './components/FileDropZone';
import { ModelSelector } from './components/ModelSelector';
import { TranscriptionEditor } from './components/TranscriptionEditor';
import { ProgressBar } from './components/ProgressBar';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  available: boolean;
}

interface TranscriptionResult {
  text: string;
  confidence?: number;
  processing_time?: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('base');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [models] = useState<ModelInfo[]>([
    {
      name: 'tiny',
      size: '39 MB',
      description: 'Modelo pequeno e rápido, menor precisão',
      available: false
    },
    {
      name: 'base',
      size: '74 MB',
      description: 'Modelo balanceado entre velocidade e precisão',
      available: true
    },
    {
      name: 'small',
      size: '244 MB',
      description: 'Modelo com boa precisão, velocidade média',
      available: false
    },
    {
      name: 'medium',
      size: '769 MB',
      description: 'Modelo com alta precisão, mais lento',
      available: false
    }
  ]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newValue ? 'dark' : 'light');
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return newValue;
    });
  }, []);

  // Aplicar dark mode no carregamento
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setTranscription(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleModelSelect = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  const handleDownloadModel = useCallback(async (model: string) => {
    try {
      // Esta funcionalidade seria implementada para baixar modelos
      console.log(`Downloading model: ${model}`);
      // Por enquanto, apenas simular o download
      alert(`Funcionalidade de download do modelo ${model} será implementada em breve.`);
    } catch (error) {
      console.error('Error downloading model:', error);
      setError('Erro ao baixar modelo');
    }
  }, []);

  const startTranscription = useCallback(async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    setError(null);
    setProgress(0);
    setTranscription(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('model', selectedModel);

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result: TranscriptionResult = await response.json();
      setTranscription(result);
      
    } catch (error) {
      console.error('Transcription error:', error);
      setError(error instanceof Error ? error.message : 'Erro durante a transcrição');
    } finally {
      setIsTranscribing(false);
      setProgress(0);
    }
  }, [selectedFile, selectedModel]);

  const exportTranscription = useCallback((format: 'txt' | 'srt' | 'json') => {
    if (!transcription) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'txt':
        content = transcription.text;
        filename = `transcription_${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      case 'srt':
        // Implementação básica de SRT - seria melhor com timestamps
        content = `1\n00:00:00,000 --> 00:00:10,000\n${transcription.text}\n`;
        filename = `transcription_${Date.now()}.srt`;
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify(transcription, null, 2);
        filename = `transcription_${Date.now()}.json`;
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcription]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AudioScribe
                </h1>
                <p className="text-sm text-muted-foreground">
                  Transcrição de áudio com IA local
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="w-9 h-9"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="w-9 h-9">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - File Upload and Model Selection */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Upload de Arquivo
              </h2>
              <FileDropZone onFileSelect={handleFileSelect} />
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onModelSelect={handleModelSelect}
                onDownloadModel={handleDownloadModel}
                isLoading={isTranscribing}
              />
            </div>

            {selectedFile && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <Button
                  onClick={startTranscription}
                  disabled={isTranscribing || !models.find(m => m.name === selectedModel)?.available}
                  className="w-full"
                  size="lg"
                >
                  {isTranscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Iniciar Transcrição
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - Progress and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            {isTranscribing && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Progresso da Transcrição</h3>
                <ProgressBar 
                  progress={progress} 
                  status={progress < 10 ? 'Preparando...' : progress < 50 ? 'Processando áudio...' : 'Transcrevendo...'}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-destructive mb-2">Erro</h3>
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {/* Transcription Result */}
            {transcription && (
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Resultado da Transcrição</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportTranscription('txt')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        TXT
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportTranscription('srt')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        SRT
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportTranscription('json')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        JSON
                      </Button>
                    </div>
                  </div>
                  
                  {transcription.processing_time && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Processado em {transcription.processing_time.toFixed(2)} segundos
                    </p>
                  )}
                </div>
                
                <div className="p-6">
                  <TranscriptionEditor
                    transcription={transcription.text}
                    processingTime={transcription.processing_time}
                    onSave={(text: string) => setTranscription(prev => prev ? { ...prev, text } : null)}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isTranscribing && !transcription && !error && (
              <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pronto para transcrever</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Selecione um arquivo de áudio, escolha um modelo de IA e clique em "Iniciar Transcrição" 
                  para começar.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>AudioScribe v0.1.0 - Transcrição de áudio com IA local</p>
            <p>Feito com ❤️ usando Tauri e React</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
