import React, { useState, useCallback } from 'react';
import { Mic, Download, FileText, Settings as SettingsIcon, Copy, Check, FolderOpen } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { FileDropZone } from './components/FileDropZone';
import { ModelSelector } from './components/ModelSelector';
import { ProgressBar } from './components/ProgressBar';
import { Button } from './components/ui/button';
import { DetailedAnalysis } from './components/DetailedAnalysis';
import { Settings } from './components/Settings';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { cn } from './lib/utils';

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  available: boolean;
}

interface BatchTranscriptionResult {
  filename: string;
  text: string;
  confidence?: number;
  processing_time?: number;
  detected_language?: string;
  word_timestamps?: Array<{
    word: string;
    start: number;
    end: number;
    probability?: number;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

// Função para verificar se o backend está rodando
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    } as RequestInit);
    return response.ok;
  } catch (error) {
    console.log('Backend health check failed:', error);
    return false;
  }
};

// Função para aguardar o backend ficar disponível
const waitForBackend = async (maxRetries: number = 20, delay: number = 1000): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`Checking backend availability... Attempt ${i + 1}/${maxRetries}`);
    if (await checkBackendHealth()) {
      console.log('Backend is available!');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.log('Backend is not available after maximum retries');
  return false;
};

// Componente principal que usa as configurações
function AppContent() {
  // Usar try-catch para capturar erros do useSettings
  let t: (key: string) => string;
  try {
    const { t: translateFn } = useSettings();
    t = translateFn;
  } catch (error) {
    console.error('Error accessing settings context:', error);
    // Fallback para inglês
    t = (key: string) => key;
  }

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState('base');
  const [batchResults, setBatchResults] = useState<BatchTranscriptionResult[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: 'downloading' | 'success' | 'error'}>({});
  const [downloadNotifications, setDownloadNotifications] = useState<{
    id: string;
    filename: string;
    format: string;
    filePath?: string;
    timestamp: number;
  }[]>([]);
  const [copyWithTimestamps, setCopyWithTimestamps] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');

  const [models] = useState<ModelInfo[]>([
    {
      name: 'tiny',
      size: '39 MB',
      description: t('modelTiny'),
      available: false
    },
    {
      name: 'base',
      size: '74 MB',
      description: t('modelBase'),
      available: true
    },
    {
      name: 'small',
      size: '244 MB',
      description: t('modelSmall'),
      available: false
    },
    {
      name: 'medium',
      size: '769 MB',
      description: t('modelMedium'),
      available: false
    }
  ]);

  const handleFilesSelect = useCallback((files: File[]) => {
    setSelectedFiles(files);
    setBatchResults(files.map(file => ({
      filename: file.name,
      text: '',
      status: 'pending' as const
    })));
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
      alert(t('modelDownloadFeature'));
    } catch (error) {
      console.error('Error downloading model:', error);
      setError(t('modelDownloadError'));
    }
  }, [t]);

  const startBatchTranscription = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsTranscribing(true);
    setError(null);
    setProgress(0);
    setCurrentFileIndex(0);

    // Função auxiliar para simular progresso durante upload e processamento
    const simulateProgress = (targetProgress: number, duration: number) => {
      return new Promise<void>((resolve) => {
        const startTime = Date.now();
        let currentProgress = 0;
        
        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progressRatio = Math.min(elapsed / duration, 1);
          currentProgress = targetProgress * progressRatio;
          
          setProgress(Math.round(currentProgress));
          
          if (progressRatio < 1) {
            setTimeout(updateProgress, 100); // Atualizar a cada 100ms
          } else {
            setProgress(targetProgress);
            resolve();
          }
        };
        
        updateProgress();
      });
    };

    try {
      // Verificar se o backend está disponível
      setError(null);
      setProgress(5);
      
      console.log('Checking if backend is available...');
      const backendAvailable = await waitForBackend(10, 2000); // 10 tentativas, 2s cada
      
      if (!backendAvailable) {
        throw new Error(
          'Backend não está disponível. ' +
          'Certifique-se de que o Python está instalado e que as dependências foram instaladas corretamente. ' +
          'Tente fechar e abrir o aplicativo novamente.'
        );
      }
      
      console.log('Backend is available, starting transcription...');
      
      // Se apenas um arquivo, usar endpoint individual
      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        setCurrentFileIndex(0);
        
        // Simular progresso de upload (5-25%)
        await simulateProgress(25, 1000);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', selectedModel);
        formData.append('auto_detect_language', 'true');

        // Simular progresso de início do processamento (25-35%)
        await simulateProgress(35, 500);

        const response = await fetch(`${API_BASE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        });

        // Simular progresso durante a espera da resposta (35-90%)
        const progressPromise = simulateProgress(90, 3000);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        await progressPromise; // Aguardar o progresso simulado
        
        const result = await response.json();
        
        setBatchResults([{
          filename: file.name,
          text: result.text,
          confidence: result.confidence,
          processing_time: result.processing_time,
          detected_language: result.detected_language,
          word_timestamps: result.word_timestamps,
          status: 'completed' as const
        }]);
        
        // Finalizar progresso (90-100%)
        await simulateProgress(100, 500);
        
      } else {
        // Múltiplos arquivos - processar individualmente para mostrar progresso
        const results: BatchTranscriptionResult[] = [];
        const totalFiles = selectedFiles.length;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setCurrentFileIndex(i);
          
          const fileProgress = {
            start: ((i / totalFiles) * 95) + 5, // Começa depois da verificação do backend (5%)
            end: (((i + 1) / totalFiles) * 95) + 5
          };
          
          try {
            // Simular upload do arquivo atual
            await simulateProgress(fileProgress.start + 5, 300);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', selectedModel);
            formData.append('auto_detect_language', 'true');

            // Simular início do processamento
            await simulateProgress(fileProgress.start + 10, 200);

            const response = await fetch(`${API_BASE_URL}/transcribe`, {
              method: 'POST',
              body: formData,
            });

            // Simular progresso durante processamento
            const processingProgress = simulateProgress(fileProgress.end - 5, 2000);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
              throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            await processingProgress;
            
            const result = await response.json();
            
            results.push({
              filename: file.name,
              text: result.text,
              confidence: result.confidence,
              processing_time: result.processing_time,
              detected_language: result.detected_language,
              word_timestamps: result.word_timestamps,
              status: 'completed' as const
            });
            
            // Finalizar progresso do arquivo atual
            await simulateProgress(fileProgress.end, 200);
            
          } catch (error) {
            results.push({
              filename: file.name,
              text: '',
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
            
            // Mesmo com erro, avançar o progresso
            setProgress(fileProgress.end);
          }
          
          // Atualizar resultados incrementalmente
          setBatchResults([...results]);
        }
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro durante a transcrição';
      setError(errorMessage);
    } finally {
      setIsTranscribing(false);
      // Manter progresso em 100% por um momento antes de resetar
      setTimeout(() => {
        setProgress(0);
        setCurrentFileIndex(0);
      }, 2000);
    }
  }, [selectedFiles, selectedModel]);

  const copyToClipboard = useCallback(async (result: BatchTranscriptionResult, index: number, withTimestamps: boolean = false) => {
    try {
      let textToCopy = result.text;
      
      // Se solicitado timestamps e eles existem, formatar como SRT
      if (withTimestamps && result.word_timestamps && result.word_timestamps.length > 0) {
        let srtContent = '';
        let segmentIndex = 1;
        let currentSubtitle = '';
        let startTime = 0;
        let endTime = 0;
        const wordsPerSegment = 8; // Palavras por linha de legenda
        
        for (let i = 0; i < result.word_timestamps.length; i += wordsPerSegment) {
          const segment = result.word_timestamps.slice(i, i + wordsPerSegment);
          startTime = segment[0].start;
          endTime = segment[segment.length - 1].end;
          currentSubtitle = segment.map(w => w.word).join(' ');
          
          const startSRT = formatTimeForSRT(startTime);
          const endSRT = formatTimeForSRT(endTime);
          
          srtContent += `${segmentIndex}\n${startSRT} --> ${endSRT}\n${currentSubtitle}\n\n`;
          segmentIndex++;
        }
        
        textToCopy = srtContent.trim();
      }
      
      if (navigator.clipboard && window.isSecureContext) {
        // Usar a API moderna de clipboard
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      // Mostrar feedback visual
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      
      console.log('Texto copiado para a área de transferência', withTimestamps ? 'no formato SRT' : '');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      alert(t('copyError'));
    }
  }, [t]);

  const openDownloadsFolder = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('open_downloads_folder') as string;
      console.log(result); // Log de sucesso
    } catch (error) {
      console.error('Erro ao abrir pasta Downloads:', error);
      // Usar uma notificação mais elegante ao invés de alert
      // Criar um elemento de notificação temporário
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 300px;
        ">
          <strong>${t('error')}:</strong> ${t('errorOpeningFolder')}
        </div>
      `;
      document.body.appendChild(notification);
      
      // Remover a notificação após 5 segundos
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
  }, [t]);

  const showDownloadNotification = useCallback(async (filename: string, format: string) => {
    let downloadsPath = '';
    
    try {
      // Tentar obter o caminho da pasta Downloads via Tauri
      downloadsPath = await invoke('get_downloads_path') as string;
    } catch (error) {
      console.log('Could not get downloads path from Tauri:', error);
      // Fallback para caminho padrão
      if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Linux')) {
        downloadsPath = '/home/user/Downloads';
      } else if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Windows')) {
        downloadsPath = 'C:\\Users\\User\\Downloads';
      } else if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')) {
        downloadsPath = '/Users/user/Downloads';
      } else {
        downloadsPath = 'Downloads folder';
      }
    }
    
    const notification = {
      id: Date.now().toString(),
      filename,
      format,
      filePath: downloadsPath,
      timestamp: Date.now()
    };
    
    setDownloadNotifications(prev => [...prev, notification]);
    
    // Remove notification after 8 seconds (increased for better readability)
    setTimeout(() => {
      setDownloadNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 8000);
  }, []);

  const exportSingleResult = useCallback(async (result: BatchTranscriptionResult, format: 'txt' | 'srt' | 'json') => {
    const downloadKey = `${result.filename}-${format}`;
    
    try {
      setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'downloading' }));
      
      let content: string;
      let filename: string;
      let mimeType: string;
      const baseFilename = result.filename.replace(/\.[^/.]+$/, "");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      switch (format) {
        case 'txt':
          content = result.text;
          filename = `${baseFilename}_transcription_${timestamp}.txt`;
          mimeType = 'text/plain';
          break;
        case 'srt':
          // Implementação básica de SRT com timestamps se disponíveis
          if (result.word_timestamps && result.word_timestamps.length > 0) {
            let srtContent = '';
            let segmentIndex = 1;
            const wordsPerSegment = 10;
            
            for (let i = 0; i < result.word_timestamps.length; i += wordsPerSegment) {
              const segment = result.word_timestamps.slice(i, i + wordsPerSegment);
              const startTime = segment[0].start;
              const endTime = segment[segment.length - 1].end;
              const text = segment.map(w => w.word).join(' ');
              
              const startSRT = formatTimeForSRT(startTime);
              const endSRT = formatTimeForSRT(endTime);
              
              srtContent += `${segmentIndex}\n${startSRT} --> ${endSRT}\n${text}\n\n`;
              segmentIndex++;
            }
            content = srtContent;
          } else {
            content = `1\n00:00:00,000 --> 00:00:10,000\n${result.text}\n`;
          }
          filename = `${baseFilename}_transcription_${timestamp}.srt`;
          mimeType = 'text/plain';
          break;
        case 'json':
          content = JSON.stringify(result, null, 2);
          filename = `${baseFilename}_transcription_${timestamp}.json`;
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Formato não suportado');
      }

      // Verificar se o conteúdo não está vazio
      if (!content || content.trim().length === 0) {
        setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'error' }));
        alert(t('exportEmptyError'));
        return;
      }

      console.log('Iniciando download:', filename, 'Tamanho:', content.length, 'caracteres');

      // Criar e baixar o arquivo
      const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
      
      // Tentar download usando API moderna do navegador
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: format.toUpperCase() + ' files',
              accept: { [mimeType]: ['.' + format] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'success' }));
          console.log('Arquivo salvo com sucesso via File System Access API:', filename);
          
          // Mostrar notificação de sucesso
          showDownloadNotification(filename, format.toUpperCase());
          
          // Remover status após 3 segundos
          setTimeout(() => {
            setDownloadStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[downloadKey];
              return newStatus;
            });
          }, 3000);
          
          return;
        } catch (fsError: any) {
          if (fsError.name === 'AbortError') {
            setDownloadStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[downloadKey];
              return newStatus;
            });
            return; // Usuário cancelou
          }
          console.warn('File System Access API falhou, tentando método fallback:', fsError);
        }
      }
      
      // Método fallback para navegadores mais antigos ou Tauri
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // Limpar após delay
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('Erro na limpeza:', e);
          }
        }, 1000);
        
        setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'success' }));
        console.log('Download iniciado com sucesso via método fallback:', filename);
        
        // Mostrar notificação de sucesso
        showDownloadNotification(filename, format.toUpperCase());
        
        // Remover status após 3 segundos
        setTimeout(() => {
          setDownloadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[downloadKey];
            return newStatus;
          });
        }, 3000);
        
      } catch (downloadError) {
        console.error('Erro no download fallback:', downloadError);
        setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'error' }));
        
        // Tentar copiar para clipboard como último recurso
        try {
          await navigator.clipboard.writeText(content);
          alert(`${t('downloadErrorWithClipboard')} "${filename}"`);
        } catch (clipboardError) {
          console.error('Erro no clipboard também:', clipboardError);
          alert(`${t('downloadAndCopyError')} "${filename}"`);
        }
        
        // Remover status de erro após 5 segundos
        setTimeout(() => {
          setDownloadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[downloadKey];
            return newStatus;
          });
        }, 5000);
      }
      
    } catch (error) {
      console.error('Erro ao exportar arquivo:', error);
      setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'error' }));
      alert(t('exportError') + ': ' + (error instanceof Error ? error.message : t('unknownError')));
      
      // Remover status de erro após 5 segundos
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[downloadKey];
          return newStatus;
        });
      }, 5000);
    }
  }, [t]);

  // Função para exportar todos os resultados em lote

  // Função helper para formatar tempo para SRT
  const formatTimeForSRT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millisecs = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millisecs.toString().padStart(3, '0')}`;
  };

  // Renderizar tela de configurações (DEPOIS de todos os hooks)
  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('main')} />;
  }

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
                  {t('appTitle')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('appSubtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentView('settings')}
                className="w-9 h-9"
              >
                <SettingsIcon className="w-4 h-4" />
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
                {t('selectFiles')}
              </h2>
              <FileDropZone onFilesSelect={handleFilesSelect} />
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

            {selectedFiles.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <Button
                  onClick={startBatchTranscription}
                  disabled={isTranscribing || !models.find(m => m.name === selectedModel)?.available}
                  className="w-full"
                  size="lg"
                >
                  {isTranscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      {t('statusProcessing')}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      {t('startTranscription')} ({selectedFiles.length} {selectedFiles.length > 1 ? t('files') : t('file')})
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
                <h3 className="text-lg font-semibold mb-4">{t('transcriptionProgress')}</h3>
                <ProgressBar 
                  progress={progress} 
                  status={progress === 100 ? 'completed' : 'processing'}
                  currentFile={selectedFiles[currentFileIndex]?.name}
                  totalFiles={selectedFiles.length}
                  completedFiles={currentFileIndex}
                  message={
                    progress === 0 ? 'Iniciando transcrição...' :
                    progress < 30 ? 'Enviando arquivo...' :
                    progress < 90 ? `Processando com modelo ${selectedModel}...` :
                    progress === 100 ? 'Transcrição concluída!' :
                    `Processando arquivo ${currentFileIndex + 1} de ${selectedFiles.length}...`
                  }
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-destructive mb-2">{t('statusError')}</h3>
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold">{t('transcriptionResults')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {batchResults.filter(r => r.status === 'completed').length} {t('of')} {batchResults.length} {batchResults.length > 1 ? t('files') : t('file')} processado{batchResults.length > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="divide-y divide-border">
                  {batchResults.map((result, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm font-medium break-words leading-tight">{result.filename}</span>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full flex-shrink-0",
                            result.status === 'completed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            result.status === 'processing' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                            result.status === 'pending' && "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                            result.status === 'error' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          )}>
                            {result.status === 'completed' && t('statusCompleted')}
                            {result.status === 'processing' && t('statusProcessing')}
                            {result.status === 'pending' && t('statusPending')}
                            {result.status === 'error' && t('statusError')}
                          </span>
                        </div>
                        
                        {result.status === 'completed' && (
                          <div className="space-y-2">
                            {/* Checkbox para copiar como SRT */}
                            <div className="flex items-center space-x-2 text-xs">
                              <input
                                type="checkbox"
                                id={`timestamps-${index}`}
                                checked={copyWithTimestamps}
                                onChange={(e) => setCopyWithTimestamps(e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <label htmlFor={`timestamps-${index}`} className="text-muted-foreground">
                                Copiar como SRT (legendas com tempo)
                              </label>
                            </div>
                            
                            {/* Botões de ação */}
                            <div className="flex items-center flex-wrap gap-1 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(result, index, copyWithTimestamps)}
                                title={copyWithTimestamps ? "Copiar no formato SRT (legendas)" : "Copiar texto para área de transferência"}
                              >
                                {copiedIndex === index ? (
                                  <Check className="w-4 h-4 mr-1 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 mr-1" />
                                )}
                                {copiedIndex === index ? 'Copiado!' : (copyWithTimestamps ? 'Copiar SRT' : 'Copiar')}
                              </Button>
                              
                              {/* Botão TXT */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportSingleResult(result, 'txt')}
                                title="Baixar como TXT"
                                disabled={downloadStatus[`${result.filename}-txt`] === 'downloading'}
                              >
                                {downloadStatus[`${result.filename}-txt`] === 'downloading' && (
                                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                                )}
                                {downloadStatus[`${result.filename}-txt`] === 'success' && (
                                  <Check className="w-4 h-4 mr-1 text-green-600" />
                                )}
                                {!downloadStatus[`${result.filename}-txt`] && (
                                  <Download className="w-4 h-4 mr-1" />
                                )}
                                TXT
                              </Button>
                              
                              {/* Botão SRT */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportSingleResult(result, 'srt')}
                                title="Baixar como SRT (legendas)"
                                disabled={downloadStatus[`${result.filename}-srt`] === 'downloading'}
                              >
                                {downloadStatus[`${result.filename}-srt`] === 'downloading' && (
                                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                                )}
                                {downloadStatus[`${result.filename}-srt`] === 'success' && (
                                  <Check className="w-4 h-4 mr-1 text-green-600" />
                                )}
                                {!downloadStatus[`${result.filename}-srt`] && (
                                  <Download className="w-4 h-4 mr-1" />
                                )}
                                SRT
                              </Button>
                              
                              {/* Botão JSON */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportSingleResult(result, 'json')}
                                title="Baixar como JSON (dados completos)"
                                disabled={downloadStatus[`${result.filename}-json`] === 'downloading'}
                              >
                                {downloadStatus[`${result.filename}-json`] === 'downloading' && (
                                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                                )}
                                {downloadStatus[`${result.filename}-json`] === 'success' && (
                                  <Check className="w-4 h-4 mr-1 text-green-600" />
                                )}
                                {!downloadStatus[`${result.filename}-json`] && (
                                  <Download className="w-4 h-4 mr-1" />
                                )}
                                JSON
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {result.status === 'completed' && (
                        <div className="space-y-3">
                          <div className="bg-muted/50 rounded p-3 text-sm">
                            <p className="whitespace-pre-wrap leading-relaxed">{result.text}</p>
                            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                              {result.processing_time && (
                                <span>Tempo: {result.processing_time.toFixed(2)}s</span>
                              )}
                              {result.detected_language && (
                                <span>Idioma: {result.detected_language}</span>
                              )}
                            </div>
                          </div>
                          
                          {result.word_timestamps && result.word_timestamps.length > 0 && (
                            <DetailedAnalysis timestamps={result.word_timestamps} />
                          )}
                        </div>
                      )}
                      
                      {result.status === 'error' && result.error && (
                        <div className="bg-destructive/10 rounded p-3 text-sm text-destructive">
                          {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isTranscribing && batchResults.length === 0 && !error && (
              <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('readyToTranscribe')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('readyDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Download Notifications - Estilo Apple */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {downloadNotifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-background/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg min-w-[350px] max-w-[450px] animate-in slide-in-from-right-5"
          >
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t('fileSaved')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {notification.filename}
                  </p>
                  {notification.filePath && (
                    <p className="text-xs text-muted-foreground/80 truncate">
                      <span className="font-medium">{t('savedTo')}:</span> {notification.filePath}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openDownloadsFolder}
                  className="h-7 px-2 text-xs"
                  title={t('viewFolder')}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {t('viewFolder')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>EchoTranscribe v0.1.0 - {t('footerText')}</p>
            <p>{t('footerMade')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente App principal com Provider
const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
