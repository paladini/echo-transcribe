import React, { useState, useCallback } from 'react';
import { Mic, Download, FileText, Settings, Moon, Sun, Copy, Check } from 'lucide-react';
import { FileDropZone } from './components/FileDropZone';
import { ModelSelector } from './components/ModelSelector';
import { ProgressBar } from './components/ProgressBar';
import { Button } from './components/ui/button';
import { DetailedAnalysis } from './components/DetailedAnalysis';
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

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState('base');
  const [batchResults, setBatchResults] = useState<BatchTranscriptionResult[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: 'downloading' | 'success' | 'error'}>({});
  const [copyWithTimestamps, setCopyWithTimestamps] = useState(false);
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
      alert(`Funcionalidade de download do modelo ${model} será implementada em breve.`);
    } catch (error) {
      console.error('Error downloading model:', error);
      setError('Erro ao baixar modelo');
    }
  }, []);

  const startBatchTranscription = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsTranscribing(true);
    setError(null);
    setProgress(0);
    setCurrentFileIndex(0);

    try {
      // Se apenas um arquivo, usar endpoint individual
      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', selectedModel);
        formData.append('auto_detect_language', 'true');

        const response = await fetch(`${API_BASE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

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
        
        setProgress(100);
      } else {
        // Múltiplos arquivos - usar endpoint de lote
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('model', selectedModel);
        formData.append('auto_detect_language', 'true');

        const response = await fetch(`${API_BASE_URL}/transcribe-batch`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Converter resultados do backend para o formato esperado
        const convertedResults = result.results.map((r: any) => ({
          filename: r.filename,
          text: r.text,
          confidence: r.confidence,
          processing_time: r.processing_time,
          detected_language: r.detected_language,
          word_timestamps: r.word_timestamps,
          status: r.status as 'completed' | 'error',
          error: r.error
        }));
        
        setBatchResults(convertedResults);
        setProgress(100);
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro durante a transcrição';
      setError(errorMessage);
    } finally {
      setIsTranscribing(false);
      setProgress(0);
      setCurrentFileIndex(0);
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
      alert('Erro ao copiar texto. Tente selecionar e copiar manualmente.');
    }
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
        alert('Erro: Conteúdo vazio para exportar. Verifique se a transcrição foi concluída.');
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
          alert(`Erro no download. O conteúdo foi copiado para a área de transferência.\n\nVocê pode colar em um editor de texto e salvar como "${filename}"`);
        } catch (clipboardError) {
          console.error('Erro no clipboard também:', clipboardError);
          alert(`Erro no download e na cópia. Copie o texto manualmente da interface e salve como "${filename}"`);
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
      alert('Erro ao exportar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      
      // Remover status de erro após 5 segundos
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[downloadKey];
          return newStatus;
        });
      }, 5000);
    }
  }, []);

  // Função para exportar todos os resultados em lote

  // Função helper para formatar tempo para SRT
  const formatTimeForSRT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millisecs = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millisecs.toString().padStart(3, '0')}`;
  };

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
                  EchoTranscribe
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
                      Transcrevendo arquivo {currentFileIndex + 1} de {selectedFiles.length}...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Iniciar Transcrição ({selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''})
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
                  status={progress === 100 ? 'completed' : 'processing'}
                  currentFile={selectedFiles[currentFileIndex]?.name}
                  totalFiles={selectedFiles.length}
                  completedFiles={currentFileIndex}
                  message={
                    currentFileIndex < selectedFiles.length 
                      ? `Processando arquivo ${currentFileIndex + 1} de ${selectedFiles.length}...`
                      : 'Finalizando...'
                  }
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

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold">Resultados da Transcrição</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {batchResults.filter(r => r.status === 'completed').length} de {batchResults.length} arquivo(s) processado(s)
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
                            {result.status === 'completed' && 'Concluído'}
                            {result.status === 'processing' && 'Processando...'}
                            {result.status === 'pending' && 'Pendente'}
                            {result.status === 'error' && 'Erro'}
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
            <p>EchoTranscribe v0.2.0 - Transcrição de áudio com IA local</p>
            <p>Feito com ❤️ usando Tauri e React</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
